// 日程引擎：把 tasks / classes / checkins 展开成“某一天的事项”，
// 同时给 Hero 轻提醒、日历视图、本地通知、云端推送共用，保证各处口径一致。

const pad = (n) => String(n).padStart(2, '0')

/* ───────── 日期工具（全部按本地时区，日期用 YYYY-MM-DD 字符串） ───────── */
export const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseYmd = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s, n) => {
  const d = parseYmd(s)
  d.setDate(d.getDate() + n)
  return ymd(d)
}
export const weekdayOf = (s) => {
  const w = parseYmd(s).getDay()
  return w === 0 ? 7 : w // 周一=1 … 周日=7
}
export const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
export const atDate = (dateStr, hhmm = '00:00') => {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [h, mi] = hhmm.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi, 0, 0)
}
export const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000)
export const startOfWeek = (s) => addDays(s, -(weekdayOf(s) - 1))
export const startOfMonth = (s) => `${s.slice(0, 7)}-01`
export const shiftMonth = (s, n) => {
  const d = parseYmd(startOfMonth(s))
  d.setMonth(d.getMonth() + n)
  return ymd(d)
}
export const isValidDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseYmd(s).getTime())
export const isValidTime = (s) => typeof s === 'string' && /^([01]?\d|2[0-3]):[0-5]\d$/.test(s)
export const normTime = (s) => {
  const [h, m] = s.split(':')
  return `${pad(Number(h))}:${m}`
}

// 6 行 × 7 列的月历网格（周一开头）
export function monthGrid(anyDateInMonth) {
  const first = startOfMonth(anyDateInMonth)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

/* ───────── 本地化格式 ───────── */
const locale = (lang) => (lang === 'zh' ? 'zh-CN' : 'en-US')
export const fmtMonth = (s, lang) =>
  parseYmd(s).toLocaleDateString(locale(lang), { year: 'numeric', month: 'long' })
export const fmtDay = (s, lang) =>
  parseYmd(s).toLocaleDateString(locale(lang), { month: 'long', day: 'numeric', weekday: 'short' })
export const fmtShort = (s, lang) => parseYmd(s).toLocaleDateString(locale(lang), { month: 'short', day: 'numeric' })
export const fmtDateTime = (ms, lang) =>
  new Date(ms).toLocaleString(locale(lang), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
export const weekdayName = (wd, lang, style = 'short') => {
  // 2024-01-01 是周一
  return new Date(2024, 0, wd).toLocaleDateString(locale(lang), { weekday: style })
}

/* ───────── 事项种类 ───────── */
export const KIND_COLOR = {
  todo: '#0ea5e9',
  reminder: '#f59e0b',
  interval: '#14b8a6',
  countdown: '#f43f5e',
  habit: '#8b5cf6',
  class: '#6366f1',
}
export const TASK_KINDS = ['todo', 'reminder', 'interval', 'countdown', 'habit']

// interval 的当日提醒点：从 windowStart 起，每 everyHours 小时一次，直到 windowEnd
export function intervalSlots(task) {
  const start = toMin(task.windowStart || '09:00')
  const end = toMin(task.windowEnd || '21:00')
  const step = Math.max(10, Math.round((Number(task.everyHours) || 1) * 60))
  const out = []
  for (let m = start; m <= end; m += step) out.push(fromMin(m))
  return out.length ? out : [fromMin(start)]
}

const byTime = (a, b) => {
  if (a.time && b.time) return toMin(a.time) - toMin(b.time)
  if (a.time) return -1
  if (b.time) return 1
  return 0
}

/* ───────── 展开某一天 ───────── */
export function itemsForDate(date, { tasks = [], classes = [], checkins = [] }) {
  const wd = weekdayOf(date)
  const checked = new Set(checkins.filter((c) => c.date === date).map((c) => c.taskId))
  const out = []

  for (const t of tasks) {
    const base = { key: `t${t.id}`, source: 'task', ref: t, kind: t.kind, title: t.title, categoryId: t.categoryId }
    if (t.kind === 'todo' || t.kind === 'reminder') {
      if (t.date === date) out.push({ ...base, time: t.time || null, done: !!t.done })
    } else if (t.kind === 'countdown') {
      if (t.date === date) out.push({ ...base, time: null, done: false })
    } else if (t.kind === 'interval') {
      if (t.date && date >= t.date && (!t.endDate || date <= t.endDate)) {
        const slots = intervalSlots(t)
        out.push({ ...base, time: slots[0], slots, done: false })
      }
    } else if (t.kind === 'habit') {
      const start = t.date || ymd(new Date(t.createdAt))
      const dayOk = !t.weekdays?.length || t.weekdays.includes(wd)
      if (date >= start && (!t.endDate || date <= t.endDate) && dayOk) {
        out.push({ ...base, time: t.time || null, done: checked.has(t.id) })
      }
    }
  }

  for (const c of classes) {
    if (c.weekday === wd && (!c.fromDate || date >= c.fromDate) && (!c.toDate || date <= c.toDate)) {
      out.push({
        key: `c${c.id}`, source: 'class', ref: c, kind: 'class', title: c.name,
        time: c.start, endTime: c.end, location: c.location, done: false, categoryId: 'study',
      })
    }
  }

  return out.sort(byTime)
}

/* ───────── Hero 轻提醒：下一个事项 / 倒数日 / 今日进度 ───────── */
export function nextUpcoming(now, data, lookaheadDays = 7) {
  const today = ymd(now)
  let best = null
  for (let i = 0; i <= lookaheadDays; i++) {
    const d = addDays(today, i)
    for (const it of itemsForDate(d, data)) {
      if (it.done || it.kind === 'countdown') continue
      const times = it.kind === 'interval' ? it.slots : it.time ? [it.time] : []
      for (const tm of times) {
        const at = atDate(d, tm)
        if (at >= now && (!best || at < best.at)) best = { ...it, at }
      }
    }
    if (best) break // 今天/最近一天里最早的，无需继续往后
  }
  return best
}

export function nextCountdown(now, tasks) {
  const today = ymd(now)
  const list = tasks
    .filter((t) => t.kind === 'countdown' && t.date && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  return list[0] ? { task: list[0], days: daysBetween(today, list[0].date) } : null
}

export function dayStats(date, data) {
  const items = itemsForDate(date, data).filter((i) => ['todo', 'reminder', 'habit'].includes(i.kind))
  return { total: items.length, done: items.filter((i) => i.done).length }
}

/* ───────── 通知触发点（本地调度 & 云端同步共用） ─────────
   返回 [{ key, at: Date, title, body }]，key 同时用作通知 tag，
   所以“应用开着时的本地通知”和“云端推送”不会重复弹两次。 */
export function fireTimes(from, to, data, t, { classRemindMin = 10 } = {}) {
  const out = []
  const first = ymd(from)
  const last = ymd(to)
  const push = (key, at, title, body) => {
    if (at >= from && at <= to) out.push({ key, at, title, body })
  }
  for (let d = first; d <= last; d = addDays(d, 1)) {
    for (const it of itemsForDate(d, data)) {
      const k = `${it.key}:${d}`
      if (it.kind === 'todo' || it.kind === 'reminder') {
        if (it.done || !it.time) continue
        const at = atDate(d, it.time)
        const pre = it.ref.remindBefore
        if (pre > 0) push(`${k}:pre`, new Date(at.getTime() - pre * 60000), it.title, t('notify.inMin', { n: pre }))
        push(`${k}:at`, at, it.title, t('notify.now'))
      } else if (it.kind === 'countdown') {
        push(`${k}:at`, atDate(d, '09:00'), it.title, t('notify.countdownToday'))
      } else if (it.kind === 'interval') {
        for (const s of it.slots) push(`${k}:${s}`, atDate(d, s), it.title, t('notify.interval', { n: it.ref.everyHours }))
      } else if (it.kind === 'habit') {
        if (!it.done && it.time) push(`${k}:at`, atDate(d, it.time), it.title, t('notify.habit'))
      } else if (it.kind === 'class' && classRemindMin > 0) {
        const at = new Date(atDate(d, it.time).getTime() - classRemindMin * 60000)
        const body = t('notify.class', { n: classRemindMin }) + (it.location ? ` · ${it.location}` : '')
        push(`${k}:pre`, at, it.title, body)
      }
    }
  }
  return out.sort((a, b) => a.at - b.at)
}
