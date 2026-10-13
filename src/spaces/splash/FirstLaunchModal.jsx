import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Calendar, Shield, BookOpen } from 'lucide-react'
import { useApp } from '../../core/store.jsx'

export default function FirstLaunchModal({ open, onConfirm, onOpenGuide }) {
  const { settings } = useApp()
  const isZh = settings.lang === 'zh'

  return (
    <AnimatePresence>
      {open && (
        <div className="overlay-root z-[75] flex items-center justify-center px-6">
          <motion.div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className="glass-sheet relative w-full max-w-[460px] max-h-[90vh] overflow-hidden rounded-[30px] p-6 shadow-2xl flex flex-col"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 30, stiffness: 360 }}
          >
            {/* 头部标题区 */}
            <div className="text-center pt-2 pb-4">
              <h2 className="text-[19px] font-medium tracking-tight text-ink">
                {isZh ? '欢迎来到木漏 · Komorebi' : 'Welcome to Komorebi'}
              </h2>
              <p className="mt-1 text-[13px] tracking-wide text-faint">
                {isZh ? '如林间光影般，安静记录生活与点滴' : 'Quietly recording life and moments'}
              </p>
            </div>

            {/* 核心特性速览 */}
            <div className="scroll-y no-scrollbar flex-1 flex flex-col gap-3 py-1">
              <div className="glass rounded-[20px] p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={15} strokeWidth={1.5} className="text-accent" />
                  <span className="text-[13px] font-medium text-ink">
                    {isZh ? '轻声对话' : 'Conversational AI'}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-muted">
                  {isZh
                    ? '几乎所有的操作都可以通过和主界面的 AI 对话来完成，AI 助手会为你打理好一切；也可以只当它是一个安静倾听的树洞。本网站提供轻量框架，不自带 API 本身，需自备兼容的 API 地址与密钥。'
                    : 'Manage schedules directly through chat. Komorebi is a local interface and does not include API quotas.'}
                </p>
              </div>

              <div className="glass rounded-[20px] p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={15} strokeWidth={1.5} className="text-accent" />
                  <span className="text-[13px] font-medium text-ink">
                    {isZh ? '丰富日程' : 'Comprehensive Schedule'}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-muted">
                  {isZh
                    ? '支持待办、定时提醒、定时周期提醒、习惯打卡与课表导入；完成事项会自动沉淀在成就墙。对话每累积 100 条会滚动归档一次，重要记录请注意留存。'
                    : 'Supports to-dos, alerts, interval reminders, habit check-ins and timetable imports. Messages roll over past 100 entries.'}
                </p>
              </div>

              <div className="glass rounded-[20px] p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={15} strokeWidth={1.5} className="text-accent" />
                  <span className="text-[13px] font-medium text-ink">
                    {isZh ? '纯粹私密' : 'Strictly Private'}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-muted">
                  {isZh
                    ? '所有数据、日历和 API 密钥都保存在这台设备的本地数据库，无第三方服务收集，纯粹属于你自己。'
                    : 'All schedule data, chats, and API keys are stored on this local device only.'}
                </p>
              </div>
            </div>

            {/* 底部操作区 */}
            <div className="mt-5 pt-3 border-t border-white/60 flex flex-col items-center gap-2.5">
              <div className="flex w-full gap-2.5">
                <button
                  type="button"
                  className="btn-soft flex-1"
                  onClick={onOpenGuide}
                >
                  <BookOpen size={15} strokeWidth={1.5} />
                  <span>{isZh ? '阅读说明书' : 'Read Guide'}</span>
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1"
                  onClick={onConfirm}
                >
                  {isZh ? '开始使用' : 'Get Started'}
                </button>
              </div>
              <span className="text-[11px] text-faint tracking-wide">
                {isZh ? '随时可在「设置 → 使用指南」中翻阅详细说明书' : 'You can read this anytime under Settings → User Guide'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
