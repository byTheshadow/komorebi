import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db.js'

const EMPTY = []

/** 每隔 ms 刷新一次“现在”，用于倒计时文案 */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    const onVis = () => document.visibilityState === 'visible' && setNow(new Date())
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [ms])
  return now
}

/** 日程相关的全部实时数据（IndexedDB 一变，界面自动刷新） */
export function useScheduleData() {
  const tasks = useLiveQuery(() => db.tasks.toArray(), [])
  const classes = useLiveQuery(() => db.classes.toArray(), [])
  const checkins = useLiveQuery(() => db.checkins.toArray(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  return useMemo(
    () => ({
      tasks: tasks ?? EMPTY,
      classes: classes ?? EMPTY,
      checkins: checkins ?? EMPTY,
      categories: categories ?? EMPTY,
    }),
    [tasks, classes, checkins, categories],
  )
}

/** 让外壳高度跟随 visualViewport：iOS 键盘弹起时，底部输入栏会被顶到键盘上方 */
export function useViewportHeight() {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport
    const apply = () => {
      const h = vv ? vv.height : window.innerHeight
      root.style.setProperty('--app-h', `${Math.round(h)}px`)
      root.classList.toggle('kb-open', window.innerHeight - h > 120)
      if (vv && vv.offsetTop > 0) window.scrollTo(0, 0) // 抵消 iOS 为露出输入框而做的页面上推
    }
    apply()
    vv?.addEventListener('resize', apply)
    vv?.addEventListener('scroll', apply)
    window.addEventListener('orientationchange', apply)
    return () => {
      vv?.removeEventListener('resize', apply)
      vv?.removeEventListener('scroll', apply)
      window.removeEventListener('orientationchange', apply)
    }
  }, [])
}
