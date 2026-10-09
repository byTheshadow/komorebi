import { CalendarDays, Droplet, Folder, MessageCircle, Menu, Settings as Cog } from 'lucide-react'
import { useApp } from './store.jsx'
import { Drawer, IconBtn } from './ui.jsx'

export const SPACES = [
  { id: 'main', icon: MessageCircle, label: 'nav.main' },
  { id: 'calendar', icon: CalendarDays, label: 'nav.calendar' },
  { id: 'achievements', icon: Folder, label: 'nav.achievements' },
  { id: 'settings', icon: Cog, label: 'nav.settings' },
]

/* 背景：弥散柔光斑，随主题渐变换色 */
export function Ambient() {
  return (
    <div className="ambient-canvas" aria-hidden="true">
      <div className="light-orb orb-a" />
      <div className="light-orb orb-b" />
    </div>
  )
}

/* 顶栏：左 = 导航抽屉，中 = 标题，右 = 各空间自己的操作（默认带主题切换） */
export function TopBar({ title, onMenu, children, withTheme = true }) {
  const { t, toggleTheme } = useApp()
  return (
    <header className="safe-top flex shrink-0 items-center justify-between gap-3 px-5 pb-2">
      <IconBtn icon={Menu} label={t('nav.menu')} onClick={onMenu} />
      <span className="min-w-0 truncate text-[13px] font-medium tracking-[0.1em] text-faint">{title}</span>
      <div className="flex gap-2">
        {children}
        {withTheme && <IconBtn icon={Droplet} label={t('nav.theme')} onClick={toggleTheme} />}
      </div>
    </header>
  )
}

export function NavDrawer({ open, onClose, space, goto }) {
  const { t } = useApp()
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="left"
      title="Komorebi · 木漏"
      footer={<div className="px-3 pb-1 text-[12px] tracking-wide text-faint">by shadow</div>}
    >
      <nav className="flex flex-col gap-1.5 pt-2">
        {SPACES.map(({ id, icon: Icon, label }) => {
          const on = space === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => { goto(id); onClose() }}
              className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left text-[15px] transition active:scale-[0.98] ${
                on ? 'bg-accent/10 font-medium text-accent' : 'text-ink hover:bg-white/60'
              }`}
            >
              <Icon size={19} strokeWidth={1.5} />
              {t(label)}
            </button>
          )
        })}
      </nav>
    </Drawer>
  )
}
