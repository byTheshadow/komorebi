import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../../core/store.jsx'
import { registerServiceWorker } from '../../core/pushManager.js'

// 文字慢慢浮现的同时，后方真实地在加载：数据库 → 字体 → 各空间代码 → 离线缓存。
// 文字至少展示 MIN_MS，给缓冲时间；加载慢时则等加载完成再进入。
const MIN_MS = 3600
const STEP_TIMEOUT = { 'splash.db': 10000, 'splash.fonts': 2500, 'splash.spaces': 12000, 'splash.offline': 4000 }

const COPY = {
  zh: { title: '木漏れ日', sub: '阳光穿过树叶，落在你身上。' },
  en: { title: 'Komorebi', sub: 'Sunlight, filtered through the leaves.' },
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// 任何一步卡住都不能让开屏停不下来
const withTimeout = (p, ms, label) =>
  Promise.race([Promise.resolve(p), new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out`)), ms))])
const EASE = [0.16, 1, 0.3, 1]

function Reveal({ text, delay, step, className }) {
  return (
    <span className={className} aria-label={text}>
      {[...text].map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: delay + i * step, duration: 1.2, ease: EASE }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

export default function Splash({ onDone }) {
  const { settings, load, t } = useApp()
  const copy = COPY[settings.lang] || COPY.zh
  const [progress, setProgress] = useState(0)
  const [stepKey, setStepKey] = useState('splash.db')
  const started = useRef(false)

  useEffect(() => {
    // React 版的呼吸环已经就位，移除 index.html 里那个先行出现的环
    const id = requestAnimationFrame(() => document.getElementById('boot')?.remove())
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (started.current) return
    started.current = true
    const t0 = performance.now()

    const steps = [
      ['splash.db', () => load()],
      ['splash.fonts', () => Promise.race([document.fonts?.ready, sleep(1600)])],
      [
        'splash.spaces',
        () =>
          Promise.all([
            import('../main/Main.jsx'),
            import('../calendar/Calendar.jsx'),
            import('../achievements/Achievements.jsx'),
            import('../settings/Settings.jsx'),
          ]),
      ],
      ['splash.offline', () => registerServiceWorker()],
    ]

    ;(async () => {
      for (let i = 0; i < steps.length; i++) {
        setStepKey(steps[i][0])
        try {
          await withTimeout(steps[i][1](), STEP_TIMEOUT[steps[i][0]] || 8000, steps[i][0])
        } catch (e) {
          console.error(`[komorebi] boot step "${steps[i][0]}" failed`, e)
        }
        setProgress((i + 1) / steps.length)
      }
      setStepKey('splash.ready')
      const left = MIN_MS - (performance.now() - t0)
      if (left > 0) await sleep(left)
      onDone()
    })()
  }, [load, onDone])

  const isZh = settings.lang === 'zh'
  return (
    <motion.div
      className="fixed inset-0 z-[80]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03, filter: 'blur(10px)' }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      {/* 与 index.html 里的 #boot .ring 同位置同尺寸，视觉上是同一个环 */}
      <motion.div
        className="absolute left-1/2 top-[40%] -ml-[46px] -mt-[46px] h-[92px] w-[92px] rounded-full border-[1.5px] border-accent/55"
        animate={{ scale: [0.92, 1.06, 0.92], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-accent" />
      </motion.div>

      <div className="absolute left-0 right-0 top-[calc(40%+88px)] flex flex-col items-center px-8 text-center">
        <Reveal
          text={copy.title}
          delay={0.5}
          step={isZh ? 0.22 : 0.1}
          className={`text-ink ${isZh ? 'text-[32px] font-light tracking-[0.28em]' : 'text-[30px] font-light tracking-[0.2em]'}`}
        />
        <Reveal
          text={copy.sub}
          delay={isZh ? 2.1 : 1.9}
          step={isZh ? 0.09 : 0.04}
          className="mt-4 text-[14px] font-light tracking-[0.12em] text-muted"
        />
      </div>

      <div className="safe-bottom absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 px-12">
        <motion.div
          className="text-[12px] tracking-wide text-faint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          {t(stepKey)}
        </motion.div>
        <div className="h-[2px] w-full max-w-[180px] overflow-hidden rounded-full bg-accent/10">
          <motion.div
            className="h-full rounded-full bg-accent/70"
            animate={{ width: `${Math.max(6, progress * 100)}%` }}
            transition={{ duration: 0.8, ease: EASE }}
          />
        </div>
      </div>
    </motion.div>
  )
}
