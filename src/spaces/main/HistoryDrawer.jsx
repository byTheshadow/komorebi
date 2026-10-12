import { MessageSquarePlus, Trash2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { clearAllChats, db, deleteChat, MAX_MESSAGES } from '../../core/db.js'
import { fmtDateTime } from '../../core/schedule.js'
import { useApp } from '../../core/store.jsx'
import { Drawer, useConfirm } from '../../core/ui.jsx'

export default function HistoryDrawer({ open, onClose, activeId, onOpenChat, onNewChat }) {
  const { t, settings, update, toast } = useApp()
  const confirm = useConfirm()

  const rows = useLiveQuery(async () => {
    const chats = await db.chats.orderBy('updatedAt').reverse().toArray()
    return Promise.all(chats.map(async (c) => ({ ...c, count: await db.messages.where('chatId').equals(c.id).count() })))
  }, [])
  const total = useLiveQuery(() => db.messages.count(), [], 0)

  const remove = async (c) => {
    if (!(await confirm({ title: t('hist.deleteTitle'), message: t('hist.deleteMsg'), danger: true, confirmText: t('common.delete') }))) return
    await deleteChat(c.id)
    if (c.id === activeId) await update({ activeChatId: null })
  }

  const clearAll = async () => {
    if (!(await confirm({ title: t('hist.clearTitle'), message: t('hist.clearMsg'), danger: true, confirmText: t('hist.clearBtn') }))) return
    await clearAllChats()
    await update({ activeChatId: null })
    toast(t('hist.cleared'))
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={t('hist.title')}
      footer={
        <div className="flex flex-col gap-2 px-1">
          <button className="btn-primary w-full" onClick={() => { onNewChat(); onClose() }}>
            <MessageSquarePlus size={16} strokeWidth={1.5} />
            {t('hist.new')}
          </button>
          <button className="btn-danger w-full" onClick={clearAll} disabled={!rows?.length}>
            <Trash2 size={15} strokeWidth={1.5} />
            {t('hist.clearBtn')}
          </button>
        </div>
      }
    >
      <p className="px-3 pb-3 text-[12px] text-faint">{t('hist.usage', { n: total, max: MAX_MESSAGES })}</p>

      {rows?.length === 0 && <p className="px-3 py-10 text-center text-[13px] leading-relaxed text-faint">{t('hist.empty')}</p>}

      <ul className="flex flex-col gap-1.5 pb-2">
        {rows?.map((c) => {
          const on = c.id === activeId
          return (
            <li key={c.id} className={`group flex items-center gap-2 rounded-2xl pr-1 transition ${on ? 'bg-accent/10' : 'hover:bg-white/60'}`}>
              <button type="button" onClick={() => { onOpenChat(c.id); onClose() }} className="min-w-0 flex-1 px-4 py-3 text-left">
                <div className={`truncate text-[14px] ${on ? 'font-medium text-accent' : 'text-ink'}`}>{c.title || t('hist.untitled')}</div>
                <div className="mt-0.5 text-[12px] text-faint">
                  {fmtDateTime(c.updatedAt, settings.lang)} · {t('hist.count', { n: c.count })}
                </div>
              </button>
              <button type="button" aria-label={t('common.delete')} onClick={() => remove(c)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-faint active:scale-95">
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
            </li>
          )
        })}
      </ul>
    </Drawer>
  )
}
