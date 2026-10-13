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

/** 让外壳高度跟随 visualViewport：仅在真实输入且键盘弹起时收缩高度，平时坚决占满物理屏幕 */
export function useViewportHeight() {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport

    const apply = () => {
      // 必须同时满足：1. 正在输入（焦点在 input/textarea）；2. visualViewport 高度严重缩减 (> 150px)
      // 彻底杜绝移动端浏览器因工具栏、地址栏显示/收起而误触发键盘缩容
      const activeEl = document.activeElement
      const isInputFocused =
        activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)

      const isKbOpen = Boolean(isInputFocused && vv && window.innerHeight - vv.height > 150)
      root.classList.toggle('kb-open', isKbOpen)

      if (isKbOpen && vv) {
        root.style.setProperty('--app-h', `${Math.round(vv.height)}px`)
        if (vv.offsetTop > 0) window.scrollTo(0, 0)
      } else {
        // 平常状态：彻底清除 --app-h，完全交给 CSS 的 inset: 0 贴底铺满
        root.style.removeProperty('--app-h')
      }
    }

    apply()
    vv?.addEventListener('resize', apply)
    vv?.addEventListener('scroll', apply)
    window.addEventListener('orientationchange', apply)
    window.addEventListener('focusin', apply)
    window.addEventListener('focusout', () => setTimeout(apply, 100))

    return () => {
      vv?.removeEventListener('resize', apply)
      vv?.removeEventListener('scroll', apply)
      window.removeEventListener('orientationchange', apply)
      window.removeEventListener('focusin', apply)
      window.removeEventListener('focusout', apply)
      root.style.removeProperty('--app-h')
      root.classList.remove('kb-open')
    }
  }, [])
}
