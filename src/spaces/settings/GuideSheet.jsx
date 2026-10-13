import { useState } from 'react'
import { BookOpen, Calendar, HelpCircle, MessageSquare, Shield, Trophy } from 'lucide-react'
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
      <div className="flex flex-col gap-5 pt-1 pb-6">
        {/* 分组切换栏 */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              data-on={tab === id}
              onClick={() => setTab(id)}
              className="chip shrink-0 !py-2 !px-3.5 flex items-center gap-1.5"
            >
              <Icon size={14} strokeWidth={1.5} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* 模块 1：对话与 AI 助手 */}
        {tab === 'chat' && (
          <div className="flex flex-col gap-4 text-[13px] leading-relaxed">
            <div className="glass rounded-[22px] p-4.5">
              <h3 className="text-[14px] font-medium text-ink mb-2">
                {isZh ? '自然记录日程' : 'Natural Scheduling'}
              </h3>
              <p className="text-muted mb-3">
                {isZh
                  ? '在主页输入框中直接像与朋友交谈一样输入，AI 助手会自动解析意图并为你创建日程，在指定提醒时间主动触发通知：'
                  : 'Type naturally on the home screen. The AI helper will parse your intent and schedule it, sending notifications on time:'}
              </p>
              <div className="flex flex-col gap-2 rounded-2xl bg-white/40 p-3 text-[12px] text-ink">
                <div>· “明天下午 3 点提醒我取快递” <span className="text-faint">(定时提醒)</span></div>
                <div>· “每 2 小时提醒我站起来活动” <span className="text-faint">(周期提醒)</span></div>
                <div>· “距期末考试还有多长时间” <span className="text-faint">(倒数日)</span></div>
                <div>· “每天早晨 7 点打卡背单词” <span className="text-faint">(习惯打卡)</span></div>
              </div>
            </div>

            <div className="glass rounded-[22px] p-4.5">
              <h3 className="text-[14px] font-medium text-ink mb-2">
                {isZh ? '配置 AI 模型' : 'Configure AI Models'}
              </h3>
              <p className="text-muted mb-2">
                {isZh
                  ? '前往「设置 → AI 接入」，填入兼容 OpenAI 格式的 API 接口地址与密钥。'
                  : 'Go to Settings → AI Connection, enter an OpenAI-compatible API base URL and key.'}
              </p>
              <p className="text-muted mb-2">
                {isZh
                  ? '请求直接从你的浏览器发出，密钥完全保存在本机，绝不经由任何第三方中转。'
                  : 'Requests are sent directly from your browser. Keys stay strictly on your device.'}
              </p>
              <div className="rounded-xl bg-accent/8 px-3 py-2 text-[12px] text-accent">
                {isZh
                  ? '注意：木漏仅提供前端框架，不自带 API 额度，需要自备有效 API。即使未配置 AI，依然可以在日历空间手动添加并管理所有日程。'
                  : 'Notice: Komorebi is a local-first interface and does not include API quotas. You can still manage calendars manually without AI.'}
              </div>
            </div>

            <div className="glass rounded-[22px] p-4.5">
              <h3 className="text-[14px] font-medium text-ink mb-2">
                {isZh ? '个性与陪伴' : 'Persona & Conversation'}
              </h3>
              <p className="text-muted">
                {isZh
                  ? '在设置中可选择“温柔陪伴”、“元气鼓励”、“理性教练”或自定义人设，改变回复语气。不止是日程管理，也可以随时和它说说心情和想法。'
                  : 'Customize assistant persona in Settings to match your preference. Feel free to talk about your thoughts anytime.'}
              </p>
            </div>
          </div>
        )}

        {/* 模块 2：日历与课表 */}
        {tab === 'calendar' && (
          <div className="flex flex-col gap-4 text-[13px] leading-relaxed">
            <div className="glass rounded-[22px] p-4.5">
              <h3 className="text-[14px] font-medium text-ink mb-2">
                {isZh ? '5 种事项类型' : '5 Schedule Types'}
              </h3>
              <div className="flex flex-col gap-2.5 text-muted">
                <div>
                  <span className="font-medium text-ink">{isZh ? '待办：' : 'To-do: '}</span>
                  {isZh ? '某天需完成的任务，完成后自动归档至成就墙。' : 'Tasks to complete on a day, archived to Wall when done.'}
                </div>
                <div>
                  <span className="font-medium text-ink">{isZh ? '提醒：' : 'Reminder: '}</span>
                  {isZh ? '在指定的时间点准时弹出提醒。' : 'Alerts triggered at a specific time.'}
                </div>
                <div>
                  <span className="font-medium text-ink">{isZh ? '周期提醒：' : 'Repeating: '}</span>
                  {isZh ? '在每天设定的时间窗内，按固定间隔提醒（如喝水、护眼）。' : 'Repeats every N hours inside a daily window.'}
                </div>
                <div>
                  <span className="font-medium text-ink">{isZh ? '倒数日：' : 'Countdown: '}</span>
                  {isZh ? '记录重要纪念日、考试或发薪日，清晰呈现距今剩余天数。' : 'Tracks important dates and days remaining.'}
                </div>
                <div>
                  <span className="font-medium text-ink">{isZh ? '习惯打卡：' : 'Habit: '}</span>
                  {isZh ? '支持按周规律重复打卡，建立长久习惯。' : 'Daily or weekday repeating check-in.'}
                </div>
              </div>
            </div>

            <div className="glass rounded-[22px] p-4.5">
              <h3 className="text-[14px] font-medium text-ink mb-2">
                {isZh ? '课表导入' : 'Timetable Import'}
              </h3>
              <p className="text-muted mb-2">
                {isZh
                  ? '支持导入 CSV、TSV、JSON、ICS 文件。建议通过其他 AI 先将课表排版为标准格式后再导入，可大幅提高导入成功率。'
                  : 'Supports CSV, TSV, JSON, and ICS calendar files. Pre-formatting via AI increases accuracy.'}
              </p>
              <p className="text-muted">
                {isZh
                  ? '若教务系统导出的文字杂乱，也可直接粘贴到“AI 识别”中，让系统自动提取课程、教室与时间段。'
                  : 'For messy unstructured text, use "Parse with AI" to automatically detect classes.'}
              </p>
            </div>
          </div>
        )}

        {/* 模块 3：成就墙 */}
        {tab === 'achieve' && (
          <div className="flex flex-col gap-4 text-[13px] leading-relaxed">
            <div className="glass rounded-[22px] p-4.5">
              <h3 className="text-[14px] font-medium text-ink mb-2">
                {isZh ? '足迹与归档' : 'Archiving Your Journey'}
              </h3>
              <p className="text-muted mb-2">
                {isZh
                  ? '完成的待办任务不会凭空消失，而是自动按分类收纳进成就墙的文件夹中。'
                  : 'Completed tasks are automatically archived into Wall folders by category.'}
              </p>
              <p className="text-muted mb-2">
                {isZh
                  ? '你可以随时清空单个文件夹，或一键重置整面成就墙，留下什么始终由你掌控。'
                  : 'You can clear folders or reset the wall anytime. You decide what stays.'}
              </p>
              <div className="rounded-xl bg-white/40 p-3 text-[12px] text-faint">
                {isZh
                  ? '关于对话记录：聊天记录每累积 100 条会滚动归档一次，超出部分会自动清理，重要信息请及时存为日程或外部留存。'
                  : 'Chat notice: Messages roll over past 100 entries. Save critical notes to schedule or external files.'}
              </div>
            </div>
          </div>
        )}

        {/* 模块 4：数据与隐私 */}
        {tab === 'privacy' && (
          <div className="flex flex-col gap-4 text-[13px] leading-relaxed">
            <div className="glass rounded-[22px] p-4.5">
              <h3 className="text-[14px] font-medium text-ink mb-2">
                {isZh ? '纯粹私密与离线' : 'Local-First Privacy'}
              </h3>
              <p className="text-muted mb-2">
                {isZh
                  ? '你的日程、待办、聊天记录和 API 密钥全部存储在当前设备的浏览器本地数据库（IndexedDB）中。'
                  : 'All schedules, chats, and keys remain strictly in your browser local database (IndexedDB).'}
              </p>
              <p className="text-muted mb-2">
                {isZh
                  ? '木漏不设任何收集用户数据的后端服务器，请放心使用。'
                  : 'No tracking or central servers. Your data belongs entirely to you.'}
              </p>
              <p className="text-muted">
                {isZh
                  ? '建议定期在「设置 → 数据」中导出 JSON 备份文件，便于迁移或防范浏览器意外清理缓存。'
                  : 'Export JSON backups regularly in Settings → Data to prevent accidental browser cache clearing.'}
              </p>
            </div>
          </div>
        )}

        {/* 模块 5：常见 API 报错速查 */}
        {tab === 'faq' && (
          <div className="flex flex-col gap-3 text-[13px] leading-relaxed">
            <div className="glass rounded-[22px] p-4">
              <div className="font-medium text-rose-600 mb-1">401 Unauthorized / 无效密钥</div>
              <div className="text-muted text-[12px]">
                {isZh ? 'API 密钥错误、拼写有误或额度用尽。请检查密钥前后是否有空格。' : 'Invalid API key or balance exhausted. Check for stray spaces.'}
              </div>
            </div>

            <div className="glass rounded-[22px] p-4">
              <div className="font-medium text-rose-600 mb-1">404 Not Found / 接口不存在</div>
              <div className="text-muted text-[12px]">
                {isZh ? 'API 地址通常需以 /v1 结尾（如 https://api.openai.com/v1）。请勿填写完整聊天路径。' : 'API address usually ends with /v1. Do not append /chat/completions.'}
              </div>
            </div>

            <div className="glass rounded-[22px] p-4">
              <div className="font-medium text-rose-600 mb-1">Failed to fetch / 跨域或网络中断 (CORS)</div>
              <div className="text-muted text-[12px]">
                {isZh ? '由于请求直接从浏览器发起，所用的 API 代理服务器必须支持浏览器跨域（CORS 标头）。' : 'Direct browser calls require the API server/proxy to allow CORS.'}
              </div>
            </div>

            <div className="glass rounded-[22px] p-4">
              <div className="font-medium text-rose-600 mb-1">429 Rate Limit / 请求过频</div>
              <div className="text-muted text-[12px]">
                {isZh ? '超出提供商的每分钟并发限制或免费账户额度已耗尽。' : 'Too many requests or provider quota reached.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  )
}
