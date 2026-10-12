import { motion } from 'framer-motion'
import { useApp } from '../../core/store.jsx'
import { addDays, fmtShort, ymd } from '../../core/schedule.js'

/** AI 动作确认卡：每次 AI 真的改动了日程，就在对话里留下一张可见的“已记下”回执 */
export default function ActionCard({ a }) {
  const { t, settings } = useApp()
  const today = ymd()
  const dateLabel = !a.date ? null : a.date === today ? t('common.today') : a.date === addDays(today, 1) ? t('common.tomorrow') : fmtShort(a.date, settings.lang)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="mt-2 flex items-start gap-3 rounded-[18px] border border-accent/20 bg-white/85 p-3.5"
    >
      <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-accent" style={{ boxShadow: '0 0 10px rgb(var(--accent))' }} />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-ink">{t(`action.${a.op}`, { kind: t(`kind.${a.kind}`) })}</div>
        <div className="mt-1 break-words text-[13px] text-muted">{a.title}</div>
        {(dateLabel || a.time || a.everyHours) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {a.kind !== 'interval' && dateLabel && <span className="pill-tag">{dateLabel}</span>}
            {a.time && a.kind !== 'interval' && <span className="pill-tag">{a.time}</span>}
            {a.everyHours && <span className="pill-tag">{t('cal.everyN', { n: a.everyHours })}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}
