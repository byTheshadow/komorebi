import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowUp, History, Loader2, Settings as Cog, SquarePen } from 'lucide-react'
import { addMessage, createChat, db } from '../../core/db.js'
import { describeError, isAiReady, runAssistant } from '../../core/ai.js'
import { useApp } from '../../core/store.jsx'
import { TopBar } from '../../core/Shell.jsx'
import { IconBtn } from '../../core/ui.jsx'
import Hero from './Hero.jsx'
import ActionCard from './ActionCard.jsx'
import HistoryDrawer from './HistoryDrawer.jsx'

function Bubble({ m }) {
  const user = m.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${user ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[88%] flex-col ${user ? 'items-end' : 'items-start'}`}>
        {m.content && (
          <div
            className={`selectable whitespace-pre-wrap break-words px-4 py-3 text-[15px] leading-relaxed ${
              user ? 'rounded-[22px] rounded-br-md bg-ink text-white' : 'glass rounded-[22px] rounded-bl-md text-ink'
            }`}
          >
            {m.content}
          </div>
        )}
        {m.actions?.map((a, i) => <ActionCard key={i} a={a} />)}
      </div>
    </motion.div>
  )
}

function Typing() {
  return (
    <div className="glass flex w-fit items-center gap-1.5 rounded-[22px] rounded-bl-md px-4 py-3.5" aria-label="typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-dots rounded-full bg-faint" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  )
}

export default function Main({ openNav, goto }) {
  const { settings, update, t, toast } = useApp()
  const chatId = settings.activeChatId
  const ready = isAiReady(settings)

  const messages = useLiveQuery(
    () => (chatId ? db.messages.where('chatId').equals(chatId).sortBy('createdAt') : []),
    [chatId],
  )
  const list = messages ?? []

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null) // { text, retry }
  const [histOpen, setHistOpen] = useState(false)
  const scroller = useRef(null)
  const area = useRef(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [list.length, sending, error])

  const autosize = () => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const send = useCallback(
    async (raw, { retry = false } = {}) => {
      const text = raw.trim()
      if (!text || sending) return
      if (!ready) {
        toast(t('main.needAi'), 'error')
        return
      }
      setError(null)
      setSending(true)
      if (!retry) {
        setInput('')
        requestAnimationFrame(autosize)
      }
      try {
        let id = chatId
        if (id && !(await db.chats.get(id))) id = null
        if (!id) {
          id = await createChat(text.slice(0, 28))
          await update({ activeChatId: id })
        }
        const all = await db.messages.where('chatId').equals(id).sortBy('createdAt')
        // 重试时最后一条就是刚才那句用户消息，不要重复写入，也不要放进历史里
        const history = retry && all.at(-1)?.role === 'user' ? all.slice(0, -1) : all
        if (!retry) await addMessage(id, { role: 'user', content: text })

        const res = await runAssistant({ settings, history, userText: text })
        await addMessage(id, { role: 'assistant', content: res.text || t('main.noText'), actions: res.actions })
      } catch (e) {
        console.warn('[komorebi] assistant failed', e)
        setError({ text: describeError(e, t), retry: text })
      } finally {
        setSending(false)
      }
    },
    [chatId, ready, sending, settings, t, toast, update],
  )

  const newChat = () => {
    update({ activeChatId: null })
    setError(null)
    setInput('')
    requestAnimationFrame(() => area.current?.focus())
  }

  const onKeyDown = (e) => {
    // 输入法组词中（拼音选字）按回车不能当作发送
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      send(input)
    }
  }

  const suggestions = [t('main.s1'), t('main.s2'), t('main.s3'), t('main.s4')]

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Komorebi · 木漏" onMenu={openNav}>
        <IconBtn icon={History} label={t('hist.title')} onClick={() => setHistOpen(true)} />
        <IconBtn icon={SquarePen} label={t('hist.new')} onClick={newChat} />
      </TopBar>

      <div ref={scroller} className="scroll-y no-scrollbar min-h-0 flex-1 px-5">
        <div className="mx-auto w-full max-w-[680px] pb-4">
          <Hero compact={list.length > 0} goto={goto} />

          {list.length === 0 && (
            <div className="flex flex-col items-center gap-5 pt-2">
              {!ready && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass w-full rounded-3xl p-5 text-center">
                  <div className="text-[15px] font-medium text-ink">{t('main.setupTitle')}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{t('main.setupBody')}</p>
                  <button className="btn-primary mt-4" onClick={() => goto('settings')}>
                    <Cog size={15} strokeWidth={1.5} />
                    {t('main.setupBtn')}
                  </button>
                </motion.div>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button key={s} type="button" className="chip !px-3.5 !py-2" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {list.map((m) => <Bubble key={m.id} m={m} />)}
            {sending && <Typing />}
            {error && (
              <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-3.5 text-[13px] leading-relaxed text-rose-700">
                {error.text}
                <button className="ml-2 font-medium underline underline-offset-2" onClick={() => send(error.retry, { retry: true })}>
                  {t('common.retry')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 常驻吸底胶囊输入条：快捷记事 + AI 对话二合一 */}
      <div className="safe-bottom shrink-0 px-5 pt-2">
        <div
          className="mx-auto flex w-full max-w-[680px] items-end gap-2 rounded-[32px] border border-white/90 py-1.5 pl-5 pr-1.5 backdrop-blur-[28px] transition focus-within:bg-white/95"
          style={{ background: 'var(--pill-bg)', boxShadow: '0 20px 45px -10px rgba(71,85,105,0.18), inset 0 0 1px 1px rgba(255,255,255,0.8)' }}
        >
          <textarea
            ref={area}
            rows={1}
            value={input}
            onChange={(e) => { setInput(e.target.value); autosize() }}
            onKeyDown={onKeyDown}
            enterKeyHint="send"
            placeholder={t('main.placeholder')}
            aria-label={t('main.placeholder')}
            className="max-h-[120px] min-h-[44px] flex-1 resize-none bg-transparent py-[11px] text-[16px] leading-[22px] text-ink outline-none placeholder:font-light placeholder:text-faint"
          />
          <button
            type="button"
            aria-label={t('common.send')}
            disabled={!input.trim() || sending}
            onClick={() => send(input)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition active:scale-95 disabled:opacity-30"
          >
            {sending ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <HistoryDrawer
        open={histOpen}
        onClose={() => setHistOpen(false)}
        activeId={chatId}
        onOpenChat={(id) => update({ activeChatId: id })}
        onNewChat={newChat}
      />
    </div>
  )
}
