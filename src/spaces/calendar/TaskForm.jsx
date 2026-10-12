import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { addTask, deleteTask, updateTask } from '../../core/db.js'
import { TASK_KINDS, weekdayName } from '../../core/schedule.js'
import { useApp } from '../../core/store.jsx'
import { Field, Sheet, useConfirm } from '../../core/ui.jsx'

const REMIND_OPTS = [0, 5, 10, 30, 60, 1440]
const EVERY_OPTS = [0.5, 1, 2, 3, 4, 6, 8, 12]

const initState = (task, date) => ({
  kind: task?.kind || 'todo',
  title: task?.title || '',
  date: task?.date || date,
  time: task?.time || '',
  remindBefore: task?.remindBefore || 0,
  everyHours: task?.everyHours || 2,
  windowStart: task?.windowStart || '09:00',
  windowEnd: task?.windowEnd || '21:00',
  endDate: task?.endDate || '',
  weekdays: task?.weekdays || [],
  categoryId: task?.categoryId || 'daily',
  notes: task?.notes || '',
})

export default function TaskForm({ open, onClose, task, defaultDate, categories, catLabel }) {
  const { t, settings, toast } = useApp()
  const confirm = useConfirm()
  const [s, setS] = useState(() => initState(task, defaultDate))
  useEffect(() => { if (open) setS(initState(task, defaultDate)) }, [open, task, defaultDate])
  const set = (patch) => setS((p) => ({ ...p, ...patch }))
  const k = s.kind

  const remindLabel = (n) => (n === 0 ? t('form.noRemind') : n === 60 ? t('form.before1h') : n === 1440 ? t('form.before1d') : t('form.beforeMin', { n }))

  const save = async () => {
    const title = s.title.trim()
    if (!title) return toast(t('form.needTitle'), 'error')
    if (!s.date) return toast(t('form.needDate'), 'error')
    if (k === 'reminder' && !s.time) return toast(t('form.needTime'), 'error')
    if (k === 'interval' && s.windowEnd < s.windowStart) return toast(t('form.badWindow'), 'error')

    const base = { kind: k, title, notes: s.notes.trim(), categoryId: s.categoryId, date: s.date }
    const byKind = {
      todo: { time: s.time || null, remindBefore: Number(s.remindBefore) || null },
      reminder: { time: s.time || null, remindBefore: Number(s.remindBefore) || null },
      countdown: { time: null },
      interval: { everyHours: Number(s.everyHours), windowStart: s.windowStart, windowEnd: s.windowEnd, endDate: s.endDate || null },
      habit: { time: s.time || null, weekdays: s.weekdays, endDate: s.endDate || null },
    }
    const payload = { ...base, ...byKind[k] }
    if (task) await updateTask(task.id, payload)
    else await addTask(payload)
    toast(t('form.saved'))
    onClose()
  }

  const remove = async () => {
    if (!(await confirm({ title: t('form.deleteTitle'), message: t('form.deleteMsg'), danger: true, confirmText: t('common.delete') }))) return
    await deleteTask(task.id)
    onClose()
  }

  const toggleDay = (d) => set({ weekdays: s.weekdays.includes(d) ? s.weekdays.filter((x) => x !== d) : [...s.weekdays, d].sort() })

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={task ? t('form.editTitle') : t('form.newTitle')}
      tall
      footer={
        <div className="flex items-center gap-2 pb-1">
          {task && (
            <button className="btn-danger" onClick={remove}>
              <Trash2 size={15} strokeWidth={1.5} />
              {t('common.delete')}
            </button>
          )}
          <button className="btn-primary ml-auto min-w-[120px]" onClick={save}>{t('common.save')}</button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2 pt-1">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {TASK_KINDS.map((x) => (
            <button key={x} type="button" className="chip shrink-0" data-on={k === x} onClick={() => set({ kind: x })}>
              {t(`kind.${x}`)}
            </button>
          ))}
        </div>
        <p className="-mt-1 px-1 text-[12px] leading-relaxed text-faint">{t(`form.hint.${k}`)}</p>

        <Field label={t('form.title')}>
          <input className="field" value={s.title} onChange={(e) => set({ title: e.target.value })} placeholder={t(`form.ph.${k}`)} />
        </Field>

        {k === 'interval' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('form.every')}>
                <select className="field" value={s.everyHours} onChange={(e) => set({ everyHours: e.target.value })}>
                  {EVERY_OPTS.map((n) => <option key={n} value={n}>{t('form.everyOpt', { n })}</option>)}
                </select>
              </Field>
              <Field label={t('form.startDate')}>
                <input type="date" className="field" value={s.date} onChange={(e) => set({ date: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('form.windowStart')}>
                <input type="time" className="field" value={s.windowStart} onChange={(e) => set({ windowStart: e.target.value })} />
              </Field>
              <Field label={t('form.windowEnd')}>
                <input type="time" className="field" value={s.windowEnd} onChange={(e) => set({ windowEnd: e.target.value })} />
              </Field>
            </div>
            <Field label={t('form.endDate')} hint={t('form.endDateHint')}>
              <input type="date" className="field" value={s.endDate} onChange={(e) => set({ endDate: e.target.value })} />
            </Field>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label={k === 'countdown' ? t('form.targetDate') : k === 'habit' ? t('form.startDate') : t('form.date')}>
              <input type="date" className="field" value={s.date} onChange={(e) => set({ date: e.target.value })} />
            </Field>
            {k !== 'countdown' && (
              <Field label={k === 'reminder' ? t('form.time') : t('form.timeOpt')}>
                <input type="time" className="field" value={s.time} onChange={(e) => set({ time: e.target.value })} />
              </Field>
            )}
          </div>
        )}

        {(k === 'todo' || k === 'reminder') && (
          <Field label={t('form.remind')} hint={!s.time ? t('form.remindNeedsTime') : undefined}>
            <select className="field" value={s.remindBefore} disabled={!s.time} onChange={(e) => set({ remindBefore: e.target.value })}>
              {REMIND_OPTS.map((n) => <option key={n} value={n}>{remindLabel(n)}</option>)}
            </select>
          </Field>
        )}

        {k === 'habit' && (
          <>
            <div>
              <span className="mb-1.5 block px-1 text-[12px] font-medium text-muted">{t('form.weekdays')}</span>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button key={d} type="button" className="chip !px-3" data-on={s.weekdays.includes(d)} onClick={() => toggleDay(d)}>
                    {weekdayName(d, settings.lang)}
                  </button>
                ))}
              </div>
              <span className="mt-1.5 block px-1 text-[12px] text-faint">{t('form.weekdaysHint')}</span>
            </div>
            <Field label={t('form.endDate')} hint={t('form.endDateHint')}>
              <input type="date" className="field" value={s.endDate} onChange={(e) => set({ endDate: e.target.value })} />
            </Field>
          </>
        )}

        {(k === 'todo' || k === 'reminder') && (
          <Field label={t('form.category')} hint={t('form.categoryHint')}>
            <select className="field" value={s.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{catLabel(c)}</option>)}
            </select>
          </Field>
        )}

        <Field label={t('form.notes')}>
          <textarea className="field min-h-[72px] resize-none" rows={2} value={s.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Field>
      </div>
    </Sheet>
  )
}
