import { BookOpen, Bell, Check, Hourglass, Repeat } from 'lucide-react'
import { useApp } from '../../core/store.jsx'
import { KIND_COLOR, atDate, daysBetween, ymd } from '../../core/schedule.js'

const KIND_ICON = { interval: Repeat, countdown: Hourglass, class: BookOpen }

export default function ItemRow({ item, date, catName, onToggle, onOpen }) {
  const { t } = useApp()
  const color = KIND_COLOR[item.kind]
  const toggleable = ['todo', 'reminder', 'habit'].includes(item.kind)
  const editable = item.source === 'task'
  const Icon = KIND_ICON[item.kind]
  // 反复提醒：开启了 nag 的 todo / reminder；已到期且没完成 = 逾期（用强调色）
  const nagging = !!item.ref?.nag && (item.kind === 'todo' || item.kind === 'reminder')
  const overdue = nagging && !item.done && !!item.time && new Date() >= atDate(date, item.time)

  const meta = []
  if (item.kind === 'interval') {
    meta.push(t('cal.everyN', { n: item.ref.everyHours }), `${item.ref.windowStart}–${item.ref.windowEnd}`)
  } else if (item.kind === 'countdown') {
    const n = daysBetween(ymd(), item.ref.date)
    meta.push(n > 0 ? t('cal.daysLeft', { n }) : n === 0 ? t('cal.dayOf') : t('cal.daysAgo', { n: -n }))
  } else if (item.time) {
    meta.push(item.endTime ? `${item.time}–${item.endTime}` : item.time)
  }
  if (item.kind === 'class' && item.location) meta.push(item.location)
  if (item.kind === 'habit') meta.push(t('kind.habit'))
  if (nagging) meta.push(t('cal.nagEvery', { n: item.ref.nagEveryMin }))
  if ((item.kind === 'todo' || item.kind === 'reminder') && catName && item.categoryId !== 'daily') meta.push(catName)

  return (
    <div className="flex items-center gap-3.5 py-3">
      {toggleable ? (
        <button
          type="button"
          aria-label={item.done ? t('cal.undo') : t('cal.complete')}
          aria-pressed={item.done}
          onClick={() => onToggle(item, date)}
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center transition active:scale-90 ${
            item.kind === 'habit' ? 'rounded-full' : 'rounded-[7px]'
          } border-[1.5px] ${item.done ? 'border-accent bg-accent text-white' : 'border-faint bg-white/40 text-transparent hover:border-accent'}`}
        >
          <Check size={13} strokeWidth={2} />
        </button>
      ) : (
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px]" style={{ background: `${color}1f`, color }}>
          <Icon size={13} strokeWidth={1.75} />
        </span>
      )}

      <button
        type="button"
        disabled={!editable}
        onClick={() => editable && onOpen(item)}
        className="min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <div className="flex items-center gap-1.5">
          <span className={`truncate text-[14px] ${item.done ? 'text-faint line-through' : overdue ? 'text-accent' : 'text-ink'}`}>
            {item.title}
          </span>
          {nagging && !item.done && (
            <Bell size={12} strokeWidth={1.75} className={`shrink-0 ${overdue ? 'text-accent' : 'text-faint'}`} />
          )}
        </div>
        {(meta.length > 0 || (item.done && item.kind !== 'habit')) && (
          <div className="mt-0.5 flex flex-wrap gap-x-2.5 text-[12px] text-faint">
            {meta.map((m, i) => <span key={i}>{m}</span>)}
            {item.done && item.kind !== 'habit' && <span className="text-accent/80">{t('cal.archivedTag')}</span>}
          </div>
        )}
      </button>
    </div>
  )
}