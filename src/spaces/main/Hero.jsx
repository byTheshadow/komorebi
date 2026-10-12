import { useMemo } from 'react'
import { CalendarCheck, ChevronRight, Hourglass } from 'lucide-react'
import { useApp } from '../../core/store.jsx'
import { useNow, useScheduleData } from '../../core/hooks.js'
import { dayStats, fmtShort, nextCountdown, nextUpcoming, ymd } from '../../core/schedule.js'

function relLabel(at, now, t, lang) {
  const mins = Math.round((at - now) / 60000)
  if (mins < 1) return t('time.now')
  if (mins < 60) return t('time.inMin', { n: mins })
  if (ymd(at) === ymd(now)) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m ? t('time.inHM', { h, m }) : t('time.inH', { h })
  }
  return fmtShort(ymd(at), lang)
}

const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** 中心视觉焦点 + 轻提醒：下一个 todo / 日程 / 提醒 / 倒数日 */
export default function Hero({ compact, goto }) {
  const { settings, t } = useApp()
  const now = useNow(30000)
  const data = useScheduleData()

  const next = useMemo(() => nextUpcoming(now, data), [now, data.tasks, data.classes, data.checkins])
  const cd = useMemo(() => nextCountdown(now, data.tasks), [now, data.tasks])
  const stats = useMemo(() => dayStats(ymd(now), data), [now, data.tasks, data.classes, data.checkins])

  const h = now.getHours()
  const greet = t(h < 5 ? 'greet.night' : h < 12 ? 'greet.morning' : h < 18 ? 'greet.afternoon' : 'greet.evening')
  const greeting = settings.profileName ? t('greet.withName', { greet, name: settings.profileName }) : greet
  const tag = next ? `${hhmm(next.at)} · ${relLabel(next.at, now, t, settings.lang)}` : ''
  const go = () => goto('calendar')

  if (compact) {
    return (
      <button type="button" onClick={go} className="glass mb-4 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left active:scale-[0.99]">
        <span className="h-2 w-2 shrink-0 rounded-full bg-accent" style={{ boxShadow: '0 0 10px rgb(var(--accent))' }} />
        <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
          {next ? `${t(`kind.${next.kind}`)} · ${next.title}` : t('hero.calm')}
        </span>
        {next && <span className="pill-tag shrink-0">{tag}</span>}
        <ChevronRight size={14} strokeWidth={1.5} className="shrink-0 text-faint" />
      </button>
    )
  }

  return (
    <section className="px-1 pb-8 pt-6 text-center">
      <div className="text-[15px] font-normal tracking-[0.04em] text-muted">{greeting}</div>

      <button type="button" onClick={go} className="mt-4 inline-flex max-w-full flex-col items-center gap-3 active:opacity-70">
        {next ? (
          <>
            <span className="text-[13px] text-faint">{t('hero.next', { kind: t(`kind.${next.kind}`) })}</span>
            <span className="text-[26px] font-medium leading-[1.35] tracking-[-0.02em] text-ink">{next.title}</span>
            <span className="pill-tag !px-3 !py-1 !text-[13px] !font-semibold">{tag}</span>
          </>
        ) : (
          <>
            <span className="text-[26px] font-medium leading-[1.35] tracking-[-0.02em] text-ink">{t('hero.calm')}</span>
            <span className="text-[13px] text-faint">{t('hero.calmSub')}</span>
          </>
        )}
      </button>

      {(stats.total > 0 || cd) && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {stats.total > 0 && (
            <span className="chip" onClick={go}>
              <CalendarCheck size={14} strokeWidth={1.5} />
              {t('hero.todayStat', { done: stats.done, total: stats.total })}
            </span>
          )}
          {cd && (
            <span className="chip" onClick={go}>
              <Hourglass size={14} strokeWidth={1.5} />
              {cd.days === 0 ? t('hero.countdownToday', { title: cd.task.title }) : t('hero.countdown', { title: cd.task.title, n: cd.days })}
            </span>
          )}
        </div>
      )}
    </section>
  )
}
