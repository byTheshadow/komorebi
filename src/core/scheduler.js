// 本地提醒调度器：应用存活（前台或被系统短暂保留）时，每 15 秒检查一次到点的提醒。
// 已触发的 key 记在 IndexedDB(fired) 里去重；通知 tag = key，所以和云端推送不会重复弹。
import { db } from './db.js'
import { fireTimes } from './schedule.js'
import { notify, readAll } from './pushManager.js'

const CATCH_UP_MS = 15 * 60 * 1000 // 切回前台时，补发 15 分钟内错过的

export function startScheduler(getCtx) {
  let busy = false

  const tick = async () => {
    if (busy) return
    const { settings, t } = getCtx()
    if (!settings.notifyEnabled || !('Notification' in window) || Notification.permission !== 'granted') return
    busy = true
    try {
      const now = Date.now()
      const from = new Date(now - CATCH_UP_MS)
      const to = new Date(now + 20000)
        const due = fireTimes(from, to, await readAll(), t, {
        classRemindMin: settings.classRemindMin,
        nagStart: settings.nagWindowStart,
        nagEnd: settings.nagWindowEnd,
      })
      // 切回前台补发时，同一个待办的多条催促只弹最新的一条，避免连环轰炸
      const latestByTag = new Map()
      for (const f of due) if (f.tag) latestByTag.set(f.tag, f.key)
            for (const f of due) {
        if (await db.fired.get(f.key)) continue
        await db.fired.put({ key: f.key, at: f.at.getTime() })
        if (f.tag && latestByTag.get(f.tag) !== f.key) continue // 旧的催促只记账，不弹
        await notify({ title: f.title, body: f.body, tag: f.tag || f.key })
      }
      await db.fired.where('at').below(now - 3 * 86400000).delete()
    } catch (e) {
      console.warn('[komorebi] scheduler tick failed', e)
    } finally {
      busy = false
    }
  }

  const onVisible = () => document.visibilityState === 'visible' && tick()
  tick()
  const iv = setInterval(tick, 15000)
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    clearInterval(iv)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
