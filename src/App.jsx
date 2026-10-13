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
import FirstLaunchModal from './spaces/splash/FirstLaunchModal.jsx'
import GuideSheet from './spaces/settings/GuideSheet.jsx'

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

  // 首次启用弹窗 & 说明书弹窗状态
  const [showFirstLaunch, setShowFirstLaunch] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    try {
      const hasLaunched = localStorage.getItem('komorebi_launched')
      if (!hasLaunched) {
        setShowFirstLaunch(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const handleDismissFirstLaunch = useCallback(() => {
    try {
      localStorage.setItem('komorebi_launched', 'true')
    } catch {
      /* ignore */
    }
    setShowFirstLaunch(false)
  }, [])

  const handleOpenGuideFromModal = useCallback(() => {
    handleDismissFirstLaunch()
    setShowGuide(true)
  }, [handleDismissFirstLaunch])

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
            className="absolute inset-0 flex flex-col"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorBoundary name={space} onHome={() => setSpace('main')}>
              <Suspense fallback={null}>
                <div className="h-full w-full">
                  <Space openNav={() => setNavOpen(true)} goto={setSpace} />
                </div>
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>

      <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} space={space} goto={setSpace} />

      {/* 首次启用弹窗 */}
      <FirstLaunchModal
        open={showFirstLaunch}
        onConfirm={handleDismissFirstLaunch}
        onOpenGuide={handleOpenGuideFromModal}
      />

      {/* 全局说明书弹层 */}
      <GuideSheet open={showGuide} onClose={() => setShowGuide(false)} />
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
