import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, GraduationCap, Hourglass, Plus } from 'lucide-react'
import { setTaskDone, toggleCheckin } from '../../core/db.js'
import { useScheduleData } from '../../core/hooks.js'
import {
  KIND_COLOR, addDays, daysBetween, fmtDay, fmtMonth, fmtShort, itemsForDate, monthGrid, shiftMonth,
  startOfMonth, startOfWeek, weekdayName, ymd,
} from '../../core/schedule.js'
import { useApp } from '../../core/store.jsx'
import { TopBar } from '../../core/Shell.jsx'
import { IconBtn, Segmented } from '../../core/ui.jsx'
import ItemRow from './ItemRow.jsx'
import TaskForm from './TaskForm.jsx'
import Timetable from './Timetable.jsx'

export default function Calendar({ openNav }) {
  const { t, settings, toast } = useApp()
  const data = useScheduleData()
  const today = ymd()

  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState(today)
  const [selected, setSelected] = useState(today)
  const [form, setForm] = useState({ open: false, task: null, date: today })
  const [ttOpen, setTtOpen] = useState(false)

  const catLabel = (c) => (c.builtin ? t(`cat.${c.id}`) : c.name)
  const catMap = useMemo(() => Object.fromEntries(data.categories.map((c) => [c.id, catLabel(c)])), [data.categories, settings.lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const grid = useMemo(() => monthGrid(cursor), [cursor])
  const weekStart = startOfWeek(cursor)
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const days = view === 'month' ? grid : weekDays

  const byDate = useMemo(() => {
    const out = {}
    for (const d of days) out[d] = itemsForDate(d, data)
    return out
  }, [days, data.tasks, data.classes, data.checkins]) // eslint-disable-line react-hooks/exhaustive-deps

  const monthStats = useMemo(() => {
    if (view !== 'month') return null
    const m = startOfMonth(cursor).slice(0, 7)
    let total = 0
    let done = 0
    for (const d of grid) {
      if (!d.startsWith(m)) continue
      for (const it of byDate[d] || []) {
        if (it.kind === 'todo' || it.kind === 'reminder') { total++; if (it.done) done++ }
      }
    }
    return { total, done }
  }, [view, cursor, grid, byDate])

  const countdowns = useMemo(
    () => data.tasks.filter((x) => x.kind === 'countdown' && x.date).sort((a, b) => a.date.localeCompare(b.date)),
    [data.tasks],
  )

  const go = (n) => setCursor((c) => (view === 'month' ? shiftMonth(c, n) : addDays(c, 7 * n)))
  const goToday = () => { setCursor(today); setSelected(today) }
  const switchView = (v) => { setView(v); setCursor(selected) }

  const openNew = (date = selected) => setForm({ open: true, task: null, date })
  const openEdit = (item) => setForm({ open: true, task: item.ref, date: item.ref.date || selected })

  const toggle = async (item, date) => {
    if (item.kind === 'habit') return toggleCheckin(item.ref.id, date)
    const done = !item.done
    await setTaskDone(item.ref.id, done)
    if (done) toast(t('cal.archived'))
    return undefined
  }

  const title = view === 'month' ? fmtMonth(cursor, settings.lang) : `${fmtShort(weekDays[0], settings.lang)} – ${fmtShort(weekDays[6], settings.lang)}`
  const selItems = byDate[selected] || itemsForDate(selected, data)

  const dayList = (date, items) =>
    items.length === 0 ? (
      <p className="py-5 text-center text-[13px] text-faint">{t('cal.dayEmpty')}</p>
    ) : (
      <div className="divide-y divide-white/70">
        {items.map((it) => (
          <ItemRow key={it.key} item={it} date={date} catName={catMap[it.categoryId]} onToggle={toggle} onOpen={openEdit} />
        ))}
      </div>
    )

  return (
    <div className="flex h-full flex-col">
      <TopBar title={t('nav.calendar')} onMenu={openNav}>
        <IconBtn icon={GraduationCap} label={t('tt.title')} onClick={() => setTtOpen(true)} />
        <IconBtn icon={Plus} label={t('form.newTitle')} onClick={() => openNew()} />
      </TopBar>

      <div className="scroll-y no-scrollbar min-h-0 flex-1 px-5 pb-8">
        <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4 pt-2">
          {/* 视图切换 + 翻页 */}
          <div className="flex items-center justify-between gap-3">
            <Segmented value={view} onChange={switchView} options={[{ value: 'month', label: t('cal.month') }, { value: 'week', label: t('cal.week') }]} />
            <button className="btn-soft !py-1.5" onClick={goToday}>{t('common.today')}</button>
          </div>

          <div className="flex items-center justify-between px-1">
            <div>
              <div className="text-[20px] font-medium tracking-tight text-ink">{title}</div>
              {monthStats && monthStats.total > 0 && (
                <div className="mt-0.5 text-[12px] text-faint">{t('cal.monthStat', { done: monthStats.done, total: monthStats.total })}</div>
              )}
            </div>
            <div className="flex gap-1.5">
              <button className="flex h-9 w-9 items-center justify-center rounded-full text-muted active:scale-90" aria-label="prev" onClick={() => go(-1)}>
                <ChevronLeft size={19} strokeWidth={1.5} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full text-muted active:scale-90" aria-label="next" onClick={() => go(1)}>
                <ChevronRight size={19} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* 倒数日 */}
          {countdowns.length > 0 && (
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
              {countdowns.map((c) => {
                const n = daysBetween(today, c.date)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm({ open: true, task: c, date: c.date })}
                    className="glass flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left active:scale-[0.98]"
                  >
                    <Hourglass size={15} strokeWidth={1.5} style={{ color: KIND_COLOR.countdown }} />
                    <span className="max-w-[140px] truncate text-[13px] text-ink">{c.title}</span>
                    <span className={`text-[13px] font-semibold ${n < 0 ? 'text-faint' : 'text-accent'}`}>
                      {n > 0 ? t('cal.daysLeft', { n }) : n === 0 ? t('cal.dayOf') : t('cal.daysAgo', { n: -n })}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {view === 'month' ? (
            <>
              <div className="glass rounded-[26px] p-3">
                <div className="mb-1 grid grid-cols-7 text-center text-[12px] text-faint">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => <div key={d} className="py-1.5">{weekdayName(d, settings.lang)}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {grid.map((d) => {
                    const inMonth = d.slice(0, 7) === cursor.slice(0, 7)
                    const sel = d === selected
                    const kinds = [...new Set((byDate[d] || []).map((i) => i.kind))].slice(0, 3)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => { setSelected(d); if (!inMonth) setCursor(d) }}
                        aria-label={d}
                        aria-pressed={sel}
                        className={`relative mx-auto flex h-[50px] w-[46px] flex-col items-center justify-center rounded-2xl transition active:scale-95 ${
                          sel ? 'bg-ink text-white shadow-md' : inMonth ? 'text-ink' : 'text-faint/60'
                        } ${d === today && !sel ? 'ring-[1.5px] ring-accent/60' : ''}`}
                      >
                        <span className="text-[15px] font-medium leading-none">{Number(d.slice(8))}</span>
                        <span className="mt-1.5 flex h-[5px] items-center gap-[3px]">
                          {kinds.map((k) => (
                            <i key={k} className="block h-[5px] w-[5px] rounded-full" style={{ background: sel ? '#fff' : KIND_COLOR[k] }} />
                          ))}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <section className="glass rounded-[26px] px-5 pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-[15px] font-medium text-ink">{fmtDay(selected, settings.lang)}</div>
                  <button className="btn-soft !py-1.5" onClick={() => openNew(selected)}>
                    <Plus size={14} strokeWidth={1.5} />
                    {t('cal.add')}
                  </button>
                </div>
                {dayList(selected, selItems)}
              </section>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              {weekDays.map((d) => (
                <section key={d} className={`glass rounded-[24px] px-5 pb-1.5 pt-3.5 ${d === today ? 'ring-[1.5px] ring-accent/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-[14px] font-medium ${d === today ? 'text-accent' : 'text-ink'}`}>
                      {fmtDay(d, settings.lang)}
                      {d === today && <span className="pill-tag ml-2">{t('common.today')}</span>}
                    </div>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full text-faint active:scale-90" aria-label={t('cal.add')} onClick={() => openNew(d)}>
                      <Plus size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                  {dayList(d, byDate[d] || [])}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <TaskForm
        open={form.open}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
        task={form.task}
        defaultDate={form.date}
        categories={data.categories}
        catLabel={catLabel}
      />
      <Timetable open={ttOpen} onClose={() => setTtOpen(false)} />
    </div>
  )
}
