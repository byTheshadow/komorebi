import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { FolderPlus, Plus, Trash2 } from 'lucide-react'
import {
  addAchievement, addCategory, clearAchievements, db, deleteAchievement, deleteCategory, updateAchievementNote,
} from '../../core/db.js'
import { fmtDateTime } from '../../core/schedule.js'
import { useApp } from '../../core/store.jsx'
import { TopBar } from '../../core/Shell.jsx'
import { Field, IconBtn, Sheet, useConfirm } from '../../core/ui.jsx'

const SWATCHES = ['#0ea5e9', '#6366f1', '#14b8a6', '#f59e0b', '#f43f5e', '#8b5cf6', '#84cc16', '#64748b']

/* 文件夹：悬停 / 按下时前盖掀开，露出里面的纸页 */
function FolderTile({ color, name, count, latest, onOpen }) {
  const [lift, setLift] = useState(false)
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      onPointerEnter={() => setLift(true)}
      onPointerLeave={() => setLift(false)}
      onPointerCancel={() => setLift(false)}
      whileTap={{ scale: 0.97 }}
      aria-label={`${name} ${count}`}
      className="relative block w-full text-left"
      style={{ perspective: 800, aspectRatio: '1.08' }}
    >
      {/* 背板 + 标签耳 */}
      <div className="absolute left-0 top-[5%] h-[14%] w-[44%] rounded-t-[14px]" style={{ background: `${color}b3` }} />
      <div className="absolute inset-x-0 bottom-0 top-[13%] rounded-[20px] rounded-tl-[8px]" style={{ background: `linear-gradient(160deg, ${color}c0, ${color}80)` }} />

      {/* 纸页：有成就才露出，数量多露出两张 */}
      {count > 0 && (
        <motion.div
          className="absolute left-[9%] right-[9%] top-[19%] h-[56%] rounded-[12px] bg-white/90 shadow-sm"
          animate={{ y: lift ? -16 : -2, rotate: lift ? -2.2 : 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 260 }}
        />
      )}
      {count > 1 && (
        <motion.div
          className="absolute left-[12%] right-[12%] top-[19%] h-[56%] rounded-[12px] bg-white shadow-sm"
          animate={{ y: lift ? -8 : 2, rotate: lift ? 2.2 : 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 260 }}
        />
      )}

      {/* 前盖 */}
      <motion.div
        className="absolute inset-x-0 bottom-0 top-[38%] flex flex-col justify-end rounded-[20px] p-4"
        style={{
          transformOrigin: 'bottom center',
          background: `linear-gradient(180deg, ${color}70, ${color}c8)`,
          border: '1px solid rgba(255,255,255,0.6)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        animate={{ rotateX: lift ? -24 : 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 240 }}
      >
        <div className="truncate text-[15px] font-medium text-white drop-shadow-sm">{name}</div>
        <div className="mt-0.5 text-[12px] text-white/85">{latest || '—'}</div>
      </motion.div>

      <span className="absolute right-3 top-[44%] z-10 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white/90 px-1.5 text-[12px] font-semibold" style={{ color }}>
        {count}
      </span>
    </motion.button>
  )
}

function NoteEditor({ a, placeholder }) {
  const [v, setV] = useState(a.note || '')
  return (
    <textarea
      rows={2}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== (a.note || '') && updateAchievementNote(a.id, v.trim())}
      placeholder={placeholder}
      className="field mt-2 min-h-[56px] resize-none !rounded-xl !py-2 text-[14px]"
    />
  )
}

export default function Achievements({ openNav }) {
  const { t, settings, toast } = useApp()
  const confirm = useConfirm()
  const cats = useLiveQuery(() => db.categories.toArray(), [], [])
  const items = useLiveQuery(() => db.achievements.orderBy('completedAt').reverse().toArray(), [], [])

  const [openId, setOpenId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(SWATCHES[0])
  const [quick, setQuick] = useState('')

  const label = (c) => (c.builtin ? t(`cat.${c.id}`) : c.name)
  const grouped = useMemo(() => {
    const g = {}
    for (const a of items) (g[a.categoryId] ||= []).push(a)
    return g
  }, [items])

  const current = cats.find((c) => c.id === openId)
  const list = grouped[openId] || []

  const createFolder = async () => {
    if (!newName.trim()) return toast(t('ach.needName'), 'error')
    await addCategory(newName, newColor)
    setNewName('')
    setAdding(false)
    toast(t('form.saved'))
  }

  const addQuick = async () => {
    if (!quick.trim() || !current) return
    await addAchievement({ title: quick.trim(), categoryId: current.id })
    setQuick('')
  }

  const clearFolder = async () => {
    if (!(await confirm({ title: t('ach.clearFolderTitle', { name: label(current) }), message: t('ach.clearFolderMsg'), danger: true, confirmText: t('ach.clearBtn') }))) return
    await clearAchievements(current.id)
    toast(t('ach.cleared'))
  }

  const removeFolder = async () => {
    if (!(await confirm({ title: t('ach.deleteFolderTitle', { name: label(current) }), message: t('ach.deleteFolderMsg'), danger: true, confirmText: t('common.delete') }))) return
    await deleteCategory(current.id)
    setOpenId(null)
  }

  const clearAll = async () => {
    if (!(await confirm({ title: t('ach.clearAllTitle'), message: t('ach.clearAllMsg'), danger: true, confirmText: t('ach.clearBtn') }))) return
    await clearAchievements()
    toast(t('ach.cleared'))
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title={t('nav.achievements')} onMenu={openNav}>
        <IconBtn icon={FolderPlus} label={t('ach.newFolder')} onClick={() => setAdding(true)} />
      </TopBar>

      <div className="scroll-y no-scrollbar min-h-0 flex-1 px-5 pb-10">
        <div className="mx-auto w-full max-w-[680px]">
          <div className="px-1 pb-5 pt-3">
            <div className="text-[22px] font-medium tracking-tight text-ink">{t('ach.headline', { n: items.length })}</div>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{t('ach.sub')}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {cats.map((c) => {
              const g = grouped[c.id] || []
              return (
                <FolderTile
                  key={c.id}
                  color={c.color}
                  name={label(c)}
                  count={g.length}
                  latest={g[0] ? fmtDateTime(g[0].completedAt, settings.lang) : t('ach.emptyFolder')}
                  onOpen={() => setOpenId(c.id)}
                />
              )
            })}
          </div>

          {items.length > 0 && (
            <div className="mt-10 flex justify-center">
              <button className="btn-danger" onClick={clearAll}>
                <Trash2 size={15} strokeWidth={1.5} />
                {t('ach.clearAllBtn')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 文件夹内容 */}
      <Sheet
        open={!!current}
        onClose={() => setOpenId(null)}
        title={current ? label(current) : ''}
        tall
        footer={
          current && (
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <button className="btn-danger" onClick={clearFolder} disabled={!list.length}>
                <Trash2 size={15} strokeWidth={1.5} />
                {t('ach.clearFolderBtn')}
              </button>
              {!current.builtin && (
                <button className="btn-soft ml-auto" onClick={removeFolder}>{t('ach.deleteFolderBtn')}</button>
              )}
            </div>
          )
        }
      >
        {current && (
          <div className="flex flex-col gap-3 pb-2 pt-1">
            <div className="flex gap-2">
              <input
                className="field !min-h-[44px] !py-2"
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && addQuick()}
                placeholder={t('ach.quickPh')}
                enterKeyHint="done"
              />
              <button className="btn-primary shrink-0 !px-4" onClick={addQuick} disabled={!quick.trim()} aria-label={t('common.add')}>
                <Plus size={16} strokeWidth={1.5} />
              </button>
            </div>

            {list.length === 0 && <p className="py-8 text-center text-[13px] leading-relaxed text-faint">{t('ach.folderEmpty')}</p>}

            {list.map((a) => (
              <motion.article
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-soft rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full" style={{ background: current.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="selectable break-words text-[14px] font-medium text-ink">{a.title}</div>
                    <div className="mt-0.5 text-[12px] text-faint">{fmtDateTime(a.completedAt, settings.lang)}</div>
                  </div>
                  <button type="button" aria-label={t('common.delete')} onClick={() => deleteAchievement(a.id)} className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-faint active:scale-90">
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
                <NoteEditor a={a} placeholder={t('ach.notePh')} />
              </motion.article>
            ))}
          </div>
        )}
      </Sheet>

      {/* 新建文件夹 */}
      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title={t('ach.newFolder')}
        footer={<div className="flex justify-end pb-1"><button className="btn-primary min-w-[120px]" onClick={createFolder}>{t('common.save')}</button></div>}
      >
        <div className="flex flex-col gap-4 pb-2 pt-1">
          <Field label={t('ach.folderName')}>
            <input className="field" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('ach.folderPh')} maxLength={20} />
          </Field>
          <div>
            <span className="mb-2 block px-1 text-[12px] font-medium text-muted">{t('ach.folderColor')}</span>
            <div className="flex flex-wrap gap-3">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  aria-pressed={newColor === c}
                  onClick={() => setNewColor(c)}
                  className="h-9 w-9 rounded-full transition active:scale-90"
                  style={{ background: c, boxShadow: newColor === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none' }}
                />
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
