import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider, useApp } from './core/store.jsx'
import { ConfirmProvider } from './core/ui.jsx'
import ErrorBoundary from './core/ErrorBoundary.jsx'
import { Ambient, NavDrawer } from './core/Shell.jsx'
import { useViewportHeight } from './core/hooks.js'
import { startScheduler } from './core/scheduler.js'
import { startCloudSync } from './core/pushManager.js'
import Splash from './spaces/splash/Splash.jsx'

// 每个空间是独立的代码块 + 独立的错误沙盒：某个界面坏了，只影响它自己
const SPACES = {
  main: lazy(() => import('./spaces/main/Main.jsx')),
  calendar: lazy(() => import('./spaces/calendar/Calendar.jsx')),
  achievements: lazy(() => import('./spaces/achievements/Achievements.jsx')),
  settings: lazy(() => import('./spaces/settings/Settings.jsx')),
}

function Shell() {
  const { getCtx } = useApp()
  const [space, setSpace] = useState('main')
  const [navOpen, setNavOpen] = useState(false)

  // 本地提醒调度 + 云端推送同步，生命周期跟随整个外壳
  useEffect(() => {
    const stopLocal = startScheduler(getCtx)
    const stopCloud = startCloudSync(getCtx)
    return () => { stopLocal(); stopCloud() }
  }, [getCtx])

  const Space = SPACES[space]
  return (
    <motion.div className="app-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={space}
            className="absolute inset-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorBoundary name={space} onHome={() => setSpace('main')}>
              <Suspense fallback={null}>
                <Space openNav={() => setNavOpen(true)} goto={setSpace} />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>
      <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} space={space} goto={setSpace} />
    </motion.div>
  )
}

function Root() {
  const [ready, setReady] = useState(false)
  useViewportHeight()
  const done = useCallback(() => setReady(true), [])
  return (
    <>
      <Ambient />
      {ready && <Shell />}
      <AnimatePresence>{!ready && <Splash key="splash" onDone={done} />}</AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ConfirmProvider>
        <Root />
      </ConfirmProvider>
    </AppProvider>
  )
}
