import { useMemo, useState } from 'react'
import { BellRing, CalendarCheck, Check, ChevronRight, Hourglass } from 'lucide-react'
import { useApp } from '../../core/store.jsx'
import { useNow, useScheduleData } from '../../core/hooks.js'
import { muteNagToday, setTaskDone, snoozeNag } from '../../core/db.js'
import { atDate, dayStats, fmtShort, nextCountdown, nextUpcoming, ymd } from '../../core/schedule.js'

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

/* ───────── 反复提醒：找出“今天已到期、没完成、开了催促、没被暂停/静音”的待办 ───────── */
function findOverdue(now, tasks) {
  const today = ymd(now)
  const nowMs = now.getTime()
  return tasks
    .filter(
      (x) =>
        (x.kind === 'todo' || x.kind === 'reminder') &&
        x.nag &&
        !x.done &&
        x.time &&
        x.date === today &&
        x.nagMuteDate !== today &&
        !(x.nagSnoozeUntil && x.nagSnoozeUntil > nowMs) &&
        atDate(x.date, x.time) <= now,
    )
    .map((x) => ({ task: x, due: atDate(x.date, x.time) }))
    .sort((a, b) => a.due - b.due) // 逾期最久的排最前
}

function overdueLabel(due, now, t) {
  const mins = Math.max(1, Math.round((now - due) / 60000))
  if (mins < 60) return t('hero.overdueMin', { n: mins })
  return t('hero.overdueHM', { h: Math.floor(mins / 60), m: mins % 60 })
}

/** 逾期待办卡片：只显示最紧急的一条，其余折叠成“还有 N 项” */
function OverdueCard({ list, now, t, toast, onMore, className = '' }) {
  const [busy, setBusy] = useState(false)
  const top = list[0]
  const id = top.task.id

  const run = async (fn, msg) => {
    if (busy) return
    setBusy(true)
    try {
      await fn()
      toast(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`glass rounded-[22px] p-4 text-left ring-[1.5px] ring-accent/40 ${className}`}>
      <div className="flex items-center gap-2">
        <BellRing size={15} strokeWidth={1.75} className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1 truncate text-[12px] text-faint">{t('hero.nagTitle')}</span>
        <span className="pill-tag shrink-0">{overdueLabel(top.due, now, t)}</span>
      </div>

      <div className="mt-2 break-words text-[16px] font-medium leading-snug text-ink">{top.task.title}</div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary !py-1.5"
          disabled={busy}
          onClick={() => run(() => setTaskDone(id, true), t('cal.archived'))}
        >
          <Check size={14} strokeWidth={2} />
          {t('hero.nagDone')}
        </button>
        <button
          type="button"
          className="btn-soft !py-1.5"
          disabled={busy}
          onClick={() => run(() => snoozeNag(id, 10), t('hero.nagSnoozed'))}
        >
          {t('hero.nagLater')}
        </button>
        <button
          type="button"
          className="btn-soft !py-1.5"
          disabled={busy}
          onClick={() => run(() => muteNagToday(id), t('hero.nagMuted'))}
        >
          {t('hero.nagMute')}
        </button>
      </div>

      {list.length > 1 && (
        <button type="button" onClick={onMore} className="mt-3 flex items-center gap-1 text-[12px] text-muted active:opacity-70">
          {t('hero.nagMore', { n: list.length - 1 })}
          <ChevronRight size={13} strokeWidth={1.5} />
        </button>
      )}
    </div>
  )
}

/** 中心视觉焦点 + 轻提醒：下一个 todo / 日程 / 提醒 / 倒数日；有逾期且在催的待办时，附一张逾期卡片 */
export default function Hero({ compact, goto }) {
  const { settings, t, toast } = useApp()
  const now = useNow(30000)
  const data = useScheduleData()

  const next = useMemo(() => nextUpcoming(now, data), [now, data.tasks, data.classes, data.checkins])
  const cd = useMemo(() => nextCountdown(now, data.tasks), [now, data.tasks])
  const stats = useMemo(() => dayStats(ymd(now), data), [now, data.tasks, data.classes, data.checkins])
  const overdue = useMemo(() => findOverdue(now, data.tasks), [now, data.tasks])

  const h = now.getHours()
  const greet = t(h < 5 ? 'greet.night' : h < 12 ? 'greet.morning' : h < 18 ? 'greet.afternoon' : 'greet.evening')
  const greeting = settings.profileName ? t('greet.withName', { greet, name: settings.profileName }) : greet
  const tag = next ? `${hhmm(next.at)} · ${relLabel(next.at, now, t, settings.lang)}` : ''
  const go = () => goto('calendar')

  const card = (className) =>
    overdue.length > 0 ? (
      <OverdueCard list={overdue} now={now} t={t} toast={toast} onMore={go} className={className} />
    ) : null

  if (compact) {
    return (
      <>
        {card('mb-3')}
        <button type="button" onClick={go} className="glass mb-4 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left active:scale-[0.99]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-accent" style={{ boxShadow: '0 0 10px rgb(var(--accent))' }} />
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
            {next ? `${t(`kind.${next.kind}`)} · ${next.title}` : t('hero.calm')}
          </span>
          {next && <span className="pill-tag shrink-0">{tag}</span>}
          <ChevronRight size={14} strokeWidth={1.5} className="shrink-0 text-faint" />
        </button>
      </>
    )
  }

  return (
    <>
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

      {overdue.length > 0 && <div className="mx-auto mb-6 w-full max-w-[520px] px-1">{card('')}</div>}
    </>
  )
}