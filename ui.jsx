import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useApp } from './store.jsx'

/* 统一线框图标按钮（lucide，strokeWidth 1.5） */
export function IconBtn({ icon: Icon, label, onClick, active = false, size = 18, className = '' }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={`icon-btn ${active ? '!text-accent' : ''} ${className}`}>
      <Icon size={size} strokeWidth={1.5} />
    </button>
  )
}

export function Switch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors duration-300 ${
        checked ? 'bg-accent' : 'bg-slate-300/70'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <span
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-all duration-300 ${
          checked ? 'left-[23px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}

/* 分段控件。注意：不要在这里用 framer-motion 的 layoutId ——
   它放进 AnimatePresence 的退出子树（弹层）里，会让弹层的退出动画卡住、遮罩一直不卸载。 */
export function Segmented({ value, options, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-white/70 bg-white/50 p-1">
      {options.map((o) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-300 ${
              on ? 'bg-white text-ink shadow-sm' : 'text-muted'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block px-1 text-[12px] font-medium text-muted">{label}</span>}
      {children}
      {hint && <span className="mt-1.5 block px-1 text-[12px] leading-relaxed text-faint">{hint}</span>}
    </label>
  )
}

/* 底部弹层 */
export function Sheet({ open, onClose, title, children, footer, tall = false }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="overlay-root z-50">
          <motion.div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="glass-sheet absolute bottom-0 left-0 right-0 mx-auto flex w-full max-w-[680px] flex-col rounded-t-[28px]"
            style={{ maxHeight: tall ? '94%' : '88%' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 340 }}
          >
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <h2 className="text-[17px] font-medium tracking-tight text-ink">{title}</h2>
              <button type="button" onClick={onClose} aria-label="close" className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-muted active:scale-95">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="scroll-y no-scrollbar min-h-0 flex-1 px-6 pb-4">{children}</div>
            {footer && <div className="safe-bottom border-t border-white/70 px-6 pt-3">{footer}</div>}
            {!footer && <div className="safe-bottom" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* 侧边抽屉 */
export function Drawer({ open, onClose, side = 'left', title, children, footer }) {
  const x = side === 'left' ? '-100%' : '100%'
  return (
    <AnimatePresence>
      {open && (
        <div className="overlay-root z-50">
          <motion.div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`glass-sheet absolute top-0 flex h-full w-[84%] max-w-[340px] flex-col ${
              side === 'left' ? 'left-0 rounded-r-[28px]' : 'right-0 rounded-l-[28px]'
            }`}
            initial={{ x }} animate={{ x: 0 }} exit={{ x }}
            transition={{ type: 'spring', damping: 36, stiffness: 340 }}
          >
            <div className="safe-top flex items-center justify-between px-6 pb-3">
              <h2 className="text-[17px] font-medium tracking-tight text-ink">{title}</h2>
              <button type="button" onClick={onClose} aria-label="close" className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-muted active:scale-95">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="scroll-y no-scrollbar min-h-0 flex-1 px-4">{children}</div>
            {footer && <div className="safe-bottom px-4 pt-3">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

/* 确认框：const ok = await confirm({ title, message, danger }) */
const ConfirmCtx = createContext(null)
export const useConfirm = () => useContext(ConfirmCtx)

export function ConfirmProvider({ children }) {
  const { t } = useApp()
  const [state, setState] = useState(null)
  const confirm = useCallback((opts) => new Promise((resolve) => setState({ ...opts, resolve })), [])
  const close = (v) => { state?.resolve(v); setState(null) }

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state && (
          <div className="overlay-root z-[70] flex items-center justify-center px-8">
            <motion.div
              className="absolute inset-0 bg-slate-900/25 backdrop-blur-[3px]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => close(false)}
            />
            <motion.div
              role="alertdialog"
              className="glass-sheet relative w-full max-w-[340px] rounded-3xl p-6"
              initial={{ opacity: 0, scale: 0.94, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            >
              <div className="text-[16px] font-medium text-ink">{state.title}</div>
              {state.message && <p className="mt-2 text-[13px] leading-relaxed text-muted">{state.message}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button className="btn-soft" onClick={() => close(false)}>{t('common.cancel')}</button>
                <button className={state.danger ? 'btn-danger' : 'btn-primary'} onClick={() => close(true)}>
                  {state.confirmText || t('common.confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmCtx.Provider>
  )
}
