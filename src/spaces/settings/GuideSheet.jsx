import { useState } from 'react'
import {
  MessageSquare,
  Calendar,
  Trophy,
  Shield,
  HelpCircle,
  Terminal,
  KeyRound,
  Heart,
  Clock,
  Sparkles,
  FileSpreadsheet,
  AlertTriangle,
  FolderLock,
  ArrowRight
} from 'lucide-react'
import { Sheet } from '../../core/ui.jsx'
import { useApp } from '../../core/store.jsx'

export default function GuideSheet({ open, onClose }) {
  const { settings } = useApp()
  const isZh = settings.lang === 'zh'
  const [tab, setTab] = useState('chat')

  const tabs = [
    { id: 'chat', label: isZh ? '对话与 AI' : 'Chat & AI', icon: MessageSquare },
    { id: 'calendar', label: isZh ? '日历与课表' : 'Calendar', icon: Calendar },
    { id: 'achieve', label: isZh ? '成就墙' : 'Achievements', icon: Trophy },
    { id: 'privacy', label: isZh ? '数据安全' : 'Privacy', icon: Shield },
    { id: 'faq', label: isZh ? '常见报错' : 'FAQ', icon: HelpCircle },
  ]

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isZh ? '使用指南 · 说明书' : 'User Guide & Manual'}
      tall
    >
      <div className="flex flex-col gap-5 pt-1 pb-8">
        {/* 顶部胶囊导航 */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const on = tab === id
            return (
              <button
                key={id}
                type="button"
                data-on={on}
                onClick={() => setTab(id)}
                className={`chip shrink-0 !py-2 !px-4 flex items-center gap-2 transition-all duration-300 ${
                  on ? 'shadow-sm font-medium' : 'text-muted'
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                <span className="text-[13px]">{label}</span>
              </button>
            )
          })}
        </div>

        {/* ───── 模块 1：对话与 AI 助手 ───── */}
        {tab === 'chat' && (
          <div className="flex flex-col gap-4">
            {/* 自然语言卡片 */}
            <div className="glass rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Terminal size={15} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-ink">
                  {isZh ? '自然记录日程' : 'Natural Scheduling'}
                </h3>
              </div>
              <p className="text-[13px] leading-relaxed text-muted mb-4">
                {isZh
                  ? '在主页直接以日常对话的口吻输入，AI 会智能提取时间与事项，并在设定的时刻触发通知：'
                  : 'Chat naturally on the home screen. The AI extracts dates and actions automatically:'}
              </p>
              
              {/* 精致的对话气泡示例列表 */}
              <div className="flex flex-col gap-2">
                {[
                  { text: '明天下午 3 点提醒我取快递', tag: '定时提醒' },
                  { text: '每 2 小时提醒我站起来活动', tag: '周期提醒' },
                  { text: '距期末考试还有多长时间', tag: '倒数日' },
                  { text: '每天早晨 7 点打卡背单词', tag: '习惯打卡' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/50 px-3.5 py-2.5 shadow-sm transition hover:bg-white/70"
                  >
                    <span className="text-[13px] text-ink font-light tracking-wide truncate">“{item.text}”</span>
                    <span className="pill-tag shrink-0 !text-[11px] !px-2.5 !py-0.5">{item.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 配置 AI 模型卡片 */}
            <div className="glass rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <KeyRound size={15} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-ink">
                  {isZh ? '配置 AI 模型' : 'Configure AI Models'}
                </h3>
              </div>
              <p className="text-[13px] leading-relaxed text-muted mb-3">
                {isZh
                  ? '前往「设置 → AI 接入」，填入兼容 OpenAI 格式的 API 接口地址与密钥。请求由浏览器直接发起，密钥完全本地加密存储。'
                  : 'Enter OpenAI-compatible API credentials in Settings. Requests go straight from your browser.'}
              </p>
              <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3.5 text-[12px] leading-relaxed text-accent">
                {isZh
                  ? '提示：木漏仅提供本地运行框架，不内置 API 额度。如未配置 AI，依然可以前往「日历」空间手动添加与管理所有日程。'
                  : 'Notice: Komorebi is local-first and does not provide API keys. You can still manage all schedules manually in Calendar.'}
              </div>
            </div>

            {/* 个性陪伴卡片 */}
            <div className="glass rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Heart size={15} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-ink">
                  {isZh ? '个性与陪伴' : 'Persona & Conversation'}
                </h3>
              </div>
              <p className="text-[13px] leading-relaxed text-muted">
                {isZh
                  ? '在设置中可按心情切换“温柔陪伴”、“元气鼓励”或自定义说话语气。不止是打理日程，也可以随时向它倾诉当下的所思所想。'
                  : 'Choose between Gentle, Upbeat, Coach or Custom personas. Feel free to talk about your thoughts anytime.'}
              </p>
            </div>
          </div>
        )}

        {/* ───── 模块 2：日历与课表 ───── */}
        {tab === 'calendar' && (
          <div className="flex flex-col gap-4">
            <div className="glass rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Clock size={15} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-ink">
                  {isZh ? '5 种事项类型' : '5 Schedule Types'}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { name: '待办', desc: '某天需完成的任务，完成后自动归档至成就墙。' },
                  { name: '提醒', desc: '在指定的时间点准时弹出通知。' },
                  { name: '周期提醒', desc: '在设定的每天时间窗内，按固定小时重复提醒（如喝水）。' },
                  { name: '倒数日', desc: '记录重要纪念日、考试或发薪日，直观展示天数。' },
                  { name: '习惯打卡', desc: '按固定规律或周几重复打卡，沉淀自律习惯。' },
                ].map((k, i) => (
                  <div key={i} className="rounded-2xl border border-white/70 bg-white/40 p-3">
                    <div className="text-[13px] font-medium text-ink mb-0.5">{k.name}</div>
                    <div className="text-[12px] leading-relaxed text-muted">{k.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <FileSpreadsheet size={15} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-ink">
                  {isZh ? '课表导入' : 'Timetable Import'}
                </h3>
              </div>
              <p className="text-[13px] leading-relaxed text-muted mb-3">
                {isZh
                  ? '支持导入 CSV、TSV、JSON、ICS 文件。建议通过其他 AI 先将课表整理为标准格式后再导入，解析成功率更高。'
                  : 'Supports CSV, TSV, JSON, and ICS calendar files. Pre-formatting via AI increases accuracy.'}
              </p>
              <div className="rounded-2xl border border-white/70 bg-white/40 p-3 text-[12px] leading-relaxed text-muted">
                {isZh
                  ? '若教务系统的原始文字排版杂乱，可直接在课表导入中点击“AI 识别”，系统将自动提取课程、教室与起止时间。'
                  : 'For messy unstructured text, use "Parse with AI" to automatically detect classes.'}
              </div>
            </div>
          </div>
        )}

        {/* ───── 模块 3：成就墙 ───── */}
        {tab === 'achieve' && (
          <div className="flex flex-col gap-4">
            <div className="glass rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Sparkles size={15} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-ink">
                  {isZh ? '足迹与归档' : 'Archiving Your Journey'}
                </h3>
              </div>
              <p className="text-[13px] leading-relaxed text-muted mb-3">
                {isZh
                  ? '完成的待办事项不会直接消失，而是会自动按分类收纳进成就墙的各个文件夹中，为你留下真实的努力轨迹。'
                  : 'Completed tasks are never lost. They are filed into category folders on your Wall.'}
              </p>
              <p className="text-[13px] leading-relaxed text-muted mb-3">
                {isZh
                  ? '你可以随时清空单个文件夹，或一键重置整面成就墙，留下什么始终由你掌控。'
                  : 'You can clear folders or reset the wall anytime. You decide what stays.'}
              </p>
              <div className="rounded-2xl border border-amber-200/60 bg-amber-50/70 p-3.5 text-[12px] leading-relaxed text-amber-900">
                {isZh
                  ? '注意：对话记录每累积 100 条会自动滚动归档一次，超出部分将自动清理。重要备忘与安排请及时转记为日程。'
                  : 'Note: Chat logs roll over at 100 messages. Save critical notes as schedule items.'}
              </div>
            </div>
          </div>
        )}

        {/* ───── 模块 4：数据与隐私 ───── */}
        {tab === 'privacy' && (
          <div className="flex flex-col gap-4">
            <div className="glass rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <FolderLock size={15} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-ink">
                  {isZh ? '纯粹私密与离线' : 'Local-First Privacy'}
                </h3>
              </div>
              <p className="text-[13px] leading-relaxed text-muted mb-3">
                {isZh
                  ? '你的日程、待办、聊天记录和 API 密钥全部存储在当前设备的浏览器本地数据库（IndexedDB）中。'
                  : 'All schedule data, chats, and API keys are stored on this local device only.'}
              </p>
              <p className="text-[13px] leading-relaxed text-muted mb-3">
                {isZh
                  ? '木漏不设任何收集用户数据的后端服务器，纯粹属于你自己。'
                  : 'No tracking or central servers. Your data belongs entirely to you.'}
              </p>
              <div className="rounded-2xl border border-white/70 bg-white/40 p-3.5 text-[12px] leading-relaxed text-muted">
                {isZh
                  ? '建议定期在「设置 → 数据」中导出 JSON 备份文件，以防浏览器意外清理缓存导致数据丢失。'
                  : 'Export JSON backups regularly under Settings → Data to protect against accidental browser cache clears.'}
              </div>
            </div>
          </div>
        )}

        {/* ───── 模块 5：常见 API 报错 ───── */}
        {tab === 'faq' && (
          <div className="flex flex-col gap-3">
            {[
              {
                code: '401 Unauthorized',
                title: '无效密钥',
                desc: 'API 密钥错误、拼写有误或额度用尽。请检查密钥前后是否有不小心复制的多余空格。'
              },
              {
                code: '404 Not Found',
                title: '接口路径错误',
                desc: 'API 地址通常只需以 /v1 结尾（如 https://api.openai.com/v1）。请不要在末尾加上 /chat/completions。'
              },
              {
                code: 'Failed to fetch',
                title: '跨域拦截 (CORS) / 网络中断',
                desc: '由于请求直接从手机浏览器发起，所用的 API 代理服务器必须允许跨域（包含 CORS 响应头）。'
              },
              {
                code: '429 Rate Limit',
                title: '超出请求频率或余额不足',
                desc: '超出提供商的每分钟并发频率限制，或免费试用账户额度已耗尽。'
              }
            ].map((item, idx) => (
              <div key={idx} className="glass rounded-[22px] p-4.5 border border-white/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-ink">{item.title}</span>
                  <span className="font-mono text-[11px] text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
                    {item.code}
                  </span>
                </div>
                <div className="text-[12px] leading-relaxed text-muted mt-1.5">{item.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  )
}
