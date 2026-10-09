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
      const due = fireTimes(from, to, await readAll(), t, { classRemindMin: settings.classRemindMin })
      for (const f of due) {
        if (await db.fired.get(f.key)) continue
        await db.fired.put({ key: f.key, at: f.at.getTime() })
        await notify({ title: f.title, body: f.body, tag: f.key })
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
