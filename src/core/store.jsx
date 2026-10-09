import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { db, DEFAULT_SETTINGS, loadSettings, saveSettings, seedDefaults } from './db.js'
import { detectLang, makeT } from './i18n.js'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

// 语言/主题在 localStorage 里留一份镜像：开屏时数据库还没打开，也能立刻用对语言和颜色
const mget = (k) => { try { return localStorage.getItem(`komorebi_${k}`) } catch { return null } }
const mset = (k, v) => { try { localStorage.setItem(`komorebi_${k}`, v) } catch { /* 隐私模式 */ } }

const THEME_COLOR = { ice: '#e0f2fe', peach: '#ffe4e6' }

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    lang: mget('lang') || detectLang(),
    theme: mget('theme') || 'ice',
  }))
  const [toasts, setToasts] = useState([])
  const t = useMemo(() => makeT(settings.lang), [settings.lang])

  // 给调度器等“非 React 代码”读取最新值
  const ref = useRef({ settings, t })
  ref.current = { settings, t }
  const getCtx = useCallback(() => ref.current, [])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', settings.theme)
    root.lang = settings.lang === 'zh' ? 'zh-CN' : 'en'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[settings.theme] || THEME_COLOR.ice)
  }, [settings.theme, settings.lang])

  // 开屏阶段调用：打开数据库、写入默认分类、读取设置
  const load = useCallback(async () => {
    await db.open()
    await seedDefaults()
    const s = await loadSettings()
    setSettings(s)
    mset('lang', s.lang)
    mset('theme', s.theme)
    return s
  }, [])

  const update = useCallback(async (patch) => {
    setSettings((p) => ({ ...p, ...patch }))
    if ('lang' in patch) mset('lang', patch.lang)
    if ('theme' in patch) mset('theme', patch.theme)
    await saveSettings(patch)
  }, [])

  const toggleTheme = useCallback(
    () => update({ theme: ref.current.settings.theme === 'ice' ? 'peach' : 'ice' }),
    [update],
  )

  const toast = useCallback((msg, tone = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((l) => [...l.slice(-2), { id, msg, tone }])
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), 2800)
  }, [])

  const value = useMemo(
    () => ({ settings, update, t, load, toast, toggleTheme, getCtx }),
    [settings, update, t, load, toast, toggleTheme, getCtx],
  )

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-[90] flex flex-col items-center gap-2 px-6 safe-top">
        <AnimatePresence>
          {toasts.map((x) => (
            <motion.div
              key={x.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className={`glass max-w-[420px] rounded-full px-4 py-2 text-[13px] shadow-lg ${
                x.tone === 'error' ? 'text-rose-600' : 'text-ink'
              }`}
            >
              {x.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AppCtx.Provider>
  )
}
