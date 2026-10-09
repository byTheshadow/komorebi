// 浏览器原生通知 + iOS Web Push 注册器。
//
// 现实约束（iOS 16.4+）：
//  1. 必须在 Safari 里“添加到主屏幕”，并从主屏幕图标打开，Notification / PushManager 才存在；
//  2. 应用被关闭后要能收到提醒，必须有一台服务器用 VAPID 发 Web Push（见 README 的“云端推送协议”）；
//  3. 没有服务器时，应用在前台/后台存活期间由 scheduler.js 在本地弹通知。
import { liveQuery } from 'dexie'
import { db } from './db.js'
import { fireTimes } from './schedule.js'

const BASE = import.meta.env.BASE_URL

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

export function getSupport() {
  const notification = 'Notification' in window
  const serviceWorker = 'serviceWorker' in navigator
  const push = serviceWorker && 'PushManager' in window
  return {
    notification,
    serviceWorker,
    push,
    ios: isIOS(),
    standalone: isStandalone(),
    // iOS 上没装到主屏幕时，Notification 不存在
    needsInstall: isIOS() && !isStandalone(),
    permission: notification ? Notification.permission : 'unsupported',
  }
}

/* ───────── Service Worker 注册（仅生产环境） ───────── */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return null
  try {
    const { registerSW } = await import('virtual:pwa-register')
    registerSW({ immediate: true })
    // ready 在注册失败/被禁用时永远不会 resolve，这里限时等待，绝不拖住开屏
    return await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 2500))])
  } catch (e) {
    console.warn('[komorebi] service worker registration failed', e)
    return null
  }
}

/* ───────── 权限 ───────── */
export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/* ───────── 弹一条通知（优先走 SW：iOS 上只有 SW 的 showNotification 可用） ───────── */
export async function notify({ title, body = '', tag }) {
  const opts = {
    body,
    tag,
    icon: `${BASE}pwa-192.png`,
    badge: `${BASE}pwa-192.png`,
    data: { url: BASE },
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, opts)
      return true
    }
  } catch { /* 退回 Notification 构造函数 */ }
  try {
    // eslint-disable-next-line no-new
    new Notification(title, opts)
    return true
  } catch {
    return false
  }
}

/* ───────── Web Push 订阅（需要自建后端的 VAPID 公钥） ───────── */
function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}
const sameKey = (a, b) => a && b && a.byteLength === b.byteLength && new Uint8Array(a).every((v, i) => v === new Uint8Array(b)[i])

export async function subscribePush(vapidPublicKey) {
  const reg = await navigator.serviceWorker?.getRegistration()
  if (!reg) throw new Error('service worker not registered (production build only)')
  const key = urlBase64ToUint8Array(vapidPublicKey.trim())
  let sub = await reg.pushManager.getSubscription()
  if (sub && !sameKey(sub.options?.applicationServerKey, key.buffer)) {
    await sub.unsubscribe() // VAPID 公钥换了，旧订阅作废
    sub = null
  }
  return sub || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
}

export async function unsubscribePush() {
  const reg = await navigator.serviceWorker?.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()
}

/* ───────── 云端同步：把未来 7 天的触发点整体推给后端 ─────────
   POST {cloudUrl}/api/schedule
   Authorization: Bearer <token>（可选）
   { subscription: PushSubscriptionJSON, items: [{ id, at: ISO, title, body }] }
   语义：以该 subscription 为键，整体替换其待发送队列。 */
export async function readAll() {
  const [tasks, classes, checkins] = await Promise.all([db.tasks.toArray(), db.classes.toArray(), db.checkins.toArray()])
  return { tasks, classes, checkins }
}

let lastSig = ''

export async function syncNow(settings, t, { force = false } = {}) {
  if (!settings.cloudEnabled || !settings.cloudUrl) return { ok: false, reason: 'disabled' }
  const reg = await navigator.serviceWorker?.getRegistration()
  const sub = await reg?.pushManager?.getSubscription()
  if (!sub) return { ok: false, reason: 'no-subscription' }

  const now = new Date()
  const horizon = new Date(now.getTime() + 7 * 86400000)
  const items = fireTimes(now, horizon, await readAll(), t, { classRemindMin: settings.classRemindMin })
    .slice(0, 300)
    .map((f) => ({ id: f.key, at: f.at.toISOString(), title: f.title, body: f.body }))

  const sig = JSON.stringify([settings.cloudUrl, sub.endpoint, items])
  if (!force && sig === lastSig) return { ok: true, reason: 'unchanged', count: items.length }

  const res = await fetch(`${settings.cloudUrl.replace(/\/+$/, '')}/api/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(settings.cloudToken ? { Authorization: `Bearer ${settings.cloudToken}` } : {}),
    },
    body: JSON.stringify({ subscription: sub.toJSON(), items }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  lastSig = sig
  return { ok: true, count: items.length }
}

// 数据一变就（防抖）同步一次；另外每 10 分钟兜底
export function startCloudSync(getCtx) {
  let timer = null
  const run = async () => {
    const { settings, t } = getCtx()
    if (!settings.cloudEnabled || !settings.cloudSubscribed) return
    try { await syncNow(settings, t) } catch (e) { console.warn('[komorebi] cloud sync failed', e) }
  }
  const sub = liveQuery(async () => (await db.tasks.count()) + ':' + (await db.classes.count()) + ':' + (await db.checkins.count()) + ':' + JSON.stringify(await db.tasks.toArray()))
    .subscribe({ next: () => { clearTimeout(timer); timer = setTimeout(run, 1500) }, error: () => {} })
  const iv = setInterval(run, 10 * 60 * 1000)
  return () => { sub.unsubscribe(); clearInterval(iv); clearTimeout(timer) }
}
