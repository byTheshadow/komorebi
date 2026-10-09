// AI 助手：OpenAI 兼容接口（/models、/chat/completions）+ Function Calling 管理日程。
// 全部在浏览器本地发起请求；API Key 只存在本机 IndexedDB。
import {
  db, addTask, updateTask, deleteTask, setTaskDone, toggleCheckin,
} from './db.js'
import {
  TASK_KINDS, addDays, fmtDay, isValidDate, isValidTime, itemsForDate, normTime, weekdayOf, ymd,
} from './schedule.js'
import { getPersonaText } from './i18n.js'

/* ───────────────────────── 基础请求 ───────────────────────── */

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status // 0 = 超时, -1 = 网络/CORS
  }
}

export function normalizeBase(url) {
  let u = (url || '').trim().replace(/\/+$/, '')
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`
  return u
}

const authHeaders = (key) => (key ? { Authorization: `Bearer ${key.trim()}` } : {})

async function fetchWithTimeout(url, opts = {}, ms = 60000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } catch (e) {
    if (e?.name === 'AbortError') throw new ApiError(0, 'timeout')
    throw new ApiError(-1, e?.message || 'network')
  } finally {
    clearTimeout(timer)
  }
}

async function toApiError(res) {
  let msg = ''
  try {
    const txt = await res.text()
    try {
      const j = JSON.parse(txt)
      msg = j?.error?.message || j?.message || (typeof j?.error === 'string' ? j.error : '') || txt
    } catch {
      msg = txt
    }
  } catch { /* ignore */ }
  return new ApiError(res.status, String(msg).slice(0, 300) || `HTTP ${res.status}`)
}

export function describeError(e, t) {
  const s = e?.status
  if (s === 401 || s === 403) return t('err.auth')
  if (s === 404) return t('err.notFound')
  if (s === 429) return t('err.rate')
  if (s === 0) return t('err.timeout')
  if (s === -1) return t('err.network')
  if (s >= 500) return t('err.server')
  return `${t('err.generic')}${e?.message ? `: ${e.message}` : ''}`
}

export const isAiReady = (s) => !!(s.aiBaseUrl && s.aiKey && s.aiModel)

/* ───────────────────────── 模型列表 / 连通性 ───────────────────────── */

const NON_CHAT = /embed|whisper|tts|dall-e|moderation|rerank|transcribe|image|audio|realtime/i

export async function fetchModels(settings) {
  const url = `${normalizeBase(settings.aiBaseUrl)}/models`
  const t0 = performance.now()
  const res = await fetchWithTimeout(url, { headers: authHeaders(settings.aiKey) }, 15000)
  if (!res.ok) throw await toApiError(res)
  const json = await res.json()
  const raw = Array.isArray(json) ? json : json.data || json.models || []
  const all = [...new Set(raw.map((m) => (typeof m === 'string' ? m : m?.id || m?.name)).filter(Boolean))].sort()
  const chatOnly = all.filter((id) => !NON_CHAT.test(id))
  return { models: chatOnly.length ? chatOnly : all, ms: Math.round(performance.now() - t0) }
}

export async function testConnection(settings) {
  const { models, ms } = await fetchModels(settings)
  let chatMs = null
  if (settings.aiModel) {
    const t0 = performance.now()
    await chat({ settings, messages: [{ role: 'user', content: 'Reply with the single word: ok' }] }, 30000)
    chatMs = Math.round(performance.now() - t0)
  }
  return { models, ms, chatMs }
}

async function chat({ settings, messages, tools }, timeout = 60000) {
  const body = { model: settings.aiModel, messages }
  if (tools) {
    body.tools = tools
    body.tool_choice = 'auto'
  }
  const res = await fetchWithTimeout(
    `${normalizeBase(settings.aiBaseUrl)}/chat/completions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(settings.aiKey) },
      body: JSON.stringify(body),
    },
    timeout,
  )
  if (!res.ok) throw await toApiError(res)
  return res.json()
}

/* ───────────────────────── 工具定义 ───────────────────────── */

function buildTools(categoryIds) {
  const taskProps = {
    title: { type: 'string', description: 'Short task title' },
    date: { type: 'string', description: 'YYYY-MM-DD. For interval/habit this is the start date.' },
    time: { type: 'string', description: 'HH:mm, 24-hour' },
    remind_before_minutes: { type: 'integer', description: 'Extra early alert N minutes before time (todo/reminder)' },
    every_hours: { type: 'number', description: 'interval only: repeat every N hours (0.5 – 24)' },
    window_start: { type: 'string', description: 'interval only: first alert of each day, HH:mm (default 09:00)' },
    window_end: { type: 'string', description: 'interval only: last alert of each day, HH:mm (default 21:00)' },
    end_date: { type: 'string', description: 'interval/habit only: YYYY-MM-DD last day (omit = forever)' },
    weekdays: { type: 'array', items: { type: 'integer' }, description: 'habit only: 1=Mon … 7=Sun (omit = every day)' },
    category: { type: 'string', enum: categoryIds, description: 'Folder this belongs to on the achievement wall' },
    notes: { type: 'string' },
  }
  return [
    {
      type: 'function',
      function: {
        name: 'create_task',
        description:
          'Create an item in the user schedule. kind: todo (to-do on a date), reminder (one-time alert, needs date+time), interval (repeat every N hours inside a daily window), countdown (days until a date, needs date), habit (daily check-in).',
        parameters: {
          type: 'object',
          properties: { kind: { type: 'string', enum: TASK_KINDS }, ...taskProps },
          required: ['kind', 'title'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'query_tasks',
        description: 'List schedule items (with ids). Use before completing/changing/deleting something you cannot see in the snapshot.',
        parameters: {
          type: 'object',
          properties: { range: { type: 'string', enum: ['today', 'tomorrow', 'week', 'open_all'] } },
          required: ['range'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_task',
        description: 'Change fields of an existing task by id (reschedule, rename, change interval…).',
        parameters: { type: 'object', properties: { id: { type: 'integer' }, ...taskProps }, required: ['id'] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'complete_task',
        description: 'Mark a todo/reminder done (it is archived to the achievement wall) or check in a habit for today.',
        parameters: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'delete_task',
        description: 'Delete a task by id.',
        parameters: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
      },
    },
  ]
}

/* ───────────────────────── 工具执行 ───────────────────────── */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

function fieldsFromArgs(a, ctx, existing) {
  const out = {}
  if (a.kind && TASK_KINDS.includes(a.kind)) out.kind = a.kind
  if (a.title !== undefined) out.title = String(a.title).trim()
  if (a.date !== undefined) out.date = isValidDate(a.date) ? a.date : null
  if (a.time !== undefined) out.time = isValidTime(a.time) ? normTime(a.time) : null
  if (a.remind_before_minutes !== undefined) {
    const n = Math.round(Number(a.remind_before_minutes))
    out.remindBefore = n > 0 ? n : null
  }
  if (a.every_hours !== undefined && Number(a.every_hours) > 0) out.everyHours = clamp(Number(a.every_hours), 0.5, 24)
  if (a.window_start !== undefined && isValidTime(a.window_start)) out.windowStart = normTime(a.window_start)
  if (a.window_end !== undefined && isValidTime(a.window_end)) out.windowEnd = normTime(a.window_end)
  if (a.end_date !== undefined) out.endDate = isValidDate(a.end_date) ? a.end_date : null
  if (Array.isArray(a.weekdays)) out.weekdays = a.weekdays.map(Number).filter((n) => n >= 1 && n <= 7)
  if (a.category) out.categoryId = ctx.categoryIds.includes(a.category) ? a.category : existing?.categoryId || 'daily'
  if (a.notes !== undefined) out.notes = String(a.notes)
  return out
}

const summarize = (t) => ({
  id: t.id, kind: t.kind, title: t.title, date: t.date, time: t.time,
  every_hours: t.everyHours || undefined, done: t.done || undefined,
})

async function loadData() {
  const [tasks, classes, checkins] = await Promise.all([db.tasks.toArray(), db.classes.toArray(), db.checkins.toArray()])
  return { tasks, classes, checkins }
}

async function runTool(name, args, ctx) {
  try {
    switch (name) {
      case 'create_task': {
        const f = fieldsFromArgs(args, ctx, null)
        const kind = f.kind || 'todo'
        if (!f.title) return { ok: false, error: 'title is required' }
        if (['reminder', 'countdown'].includes(kind) && !f.date) return { ok: false, error: `date is required for ${kind}` }
        if (kind === 'reminder' && !f.time) return { ok: false, error: 'time is required for reminder' }
        if (kind === 'interval' && !f.everyHours) return { ok: false, error: 'every_hours is required for interval' }
        if (!f.date && kind !== 'countdown') f.date = ymd()
        const id = await addTask({ ...f, kind, source: 'ai' })
        ctx.actions.push({ op: 'create', id, kind, title: f.title, date: f.date, time: f.time || null, everyHours: f.everyHours || null })
        return { ok: true, id }
      }
      case 'update_task': {
        const task = await db.tasks.get(Number(args.id))
        if (!task) return { ok: false, error: 'task not found' }
        const patch = fieldsFromArgs(args, ctx, task)
        delete patch.kind
        await updateTask(task.id, patch)
        const next = { ...task, ...patch }
        ctx.actions.push({ op: 'update', id: task.id, kind: next.kind, title: next.title, date: next.date, time: next.time || null, everyHours: next.everyHours || null })
        return { ok: true, task: summarize(next) }
      }
      case 'complete_task': {
        const task = await db.tasks.get(Number(args.id))
        if (!task) return { ok: false, error: 'task not found' }
        if (task.kind === 'habit') await toggleCheckin(task.id, ymd())
        else if (task.kind === 'todo' || task.kind === 'reminder') await setTaskDone(task.id, true)
        else return { ok: false, error: `${task.kind} cannot be completed` }
        ctx.actions.push({ op: 'complete', id: task.id, kind: task.kind, title: task.title })
        return { ok: true }
      }
      case 'delete_task': {
        const task = await db.tasks.get(Number(args.id))
        if (!task) return { ok: false, error: 'task not found' }
        await deleteTask(task.id)
        ctx.actions.push({ op: 'delete', id: task.id, kind: task.kind, title: task.title })
        return { ok: true }
      }
      case 'query_tasks': {
        const data = await loadData()
        const today = ymd()
        if (args.range === 'open_all') {
          return { ok: true, items: data.tasks.filter((t) => !t.done).slice(0, 60).map(summarize) }
        }
        const days = args.range === 'tomorrow' ? [addDays(today, 1)] : args.range === 'week'
          ? Array.from({ length: 7 }, (_, i) => addDays(today, i)) : [today]
        const items = []
        for (const d of days) {
          for (const it of itemsForDate(d, data)) {
            items.push({
              id: it.source === 'task' ? it.ref.id : undefined, kind: it.kind, title: it.title, date: d,
              time: it.time || null, end_time: it.endTime || undefined, done: it.done || undefined,
            })
          }
        }
        return { ok: true, items: items.slice(0, 80) }
      }
      default:
        return { ok: false, error: `unknown tool ${name}` }
    }
  } catch (e) {
    return { ok: false, error: String(e?.message || e) }
  }
}

/* ───────────────────────── 系统提示词 ───────────────────────── */

async function snapshot(lang) {
  const data = await loadData()
  const today = ymd()
  const lines = []
  const fmt = (it) => {
    const ref = it.source === 'task' ? `id:${it.ref.id}` : 'class'
    const when = it.time ? `${it.time}${it.endTime ? `-${it.endTime}` : ''}` : 'no time'
    const extra = it.kind === 'interval' ? ` every ${it.ref.everyHours}h ${it.ref.windowStart}-${it.ref.windowEnd}` : ''
    return `- [${ref}] ${it.kind}${it.done ? ' (done)' : ''} ${when} ${it.title}${extra}`
  }
  for (const [label, d] of [['Today', today], ['Tomorrow', addDays(today, 1)]]) {
    const items = itemsForDate(d, data)
    lines.push(`${label} (${d}, ${fmtDay(d, lang)}):${items.length ? '' : ' nothing scheduled'}`)
    items.slice(0, 25).forEach((it) => lines.push(fmt(it)))
  }
  const cds = data.tasks.filter((t) => t.kind === 'countdown' && t.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  if (cds.length) lines.push(`Countdowns: ${cds.slice(0, 6).map((c) => `${c.title} on ${c.date}`).join('; ')}`)
  return lines.join('\n')
}

async function buildSystemPrompt(settings, lang, useTools) {
  const now = new Date()
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const cats = await db.categories.toArray()
  const persona = getPersonaText(settings, lang)
  const parts = [
    'You are "Komorebi" (木漏), a warm, calm assistant living inside the user\'s personal schedule app.',
    settings.profileName ? `The user\'s nickname is "${settings.profileName}".` : '',
    `Always reply in ${lang === 'zh' ? 'Simplified Chinese' : 'English'}.`,
    `Personality: ${persona}`,
    '',
    `Current local time: ${ymd(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}, weekday ${weekdayOf(ymd(now))} (1=Mon…7=Sun), timezone ${tz}.`,
    'Rules:',
    '- Convert relative dates ("tomorrow", "next Wednesday", "in 2 hours") to absolute YYYY-MM-DD and 24-hour HH:mm using the current time above.',
    '- Item kinds: todo (to-do on a date), reminder (one-time alert at a date+time), interval (repeat every N hours inside a daily window), countdown (days until a date), habit (daily check-in).',
    '- Never claim something was saved, changed or deleted unless the tool result says ok. If a tool returns an error, fix the arguments or ask the user.',
    '- If essential information is missing (e.g. a reminder with no time), ask ONE short question instead of guessing.',
    '- When asked about today / tomorrow, answer from the snapshot below (or call query_tasks for other ranges), briefly and kindly; confirm what is done and what remains.',
    '- If the user sounds stressed, sad or overwhelmed, respond with empathy first and offer at most one small, concrete next step. Do not lecture.',
    '- Keep replies short (usually 2-5 sentences). Plain text only: no markdown, no headings, never any emoji.',
    `- Achievement-wall folder ids you may use as category: ${cats.map((c) => c.id).join(', ')}. Use "english" for English study, "daily" otherwise unless clearly something else.`,
    '',
    'Snapshot of the schedule:',
    await snapshot(lang),
  ]
  if (!useTools) {
    parts.push(
      '',
      'Tool calling is unavailable. To change the schedule, append one line per change at the very END of your reply, exactly in this format and nothing else on that line:',
      '<action>{"name":"create_task","args":{"kind":"reminder","title":"...","date":"YYYY-MM-DD","time":"HH:mm"}}</action>',
      'Allowed names: create_task, update_task (needs id), complete_task (needs id), delete_task (needs id). Use ids from the snapshot.',
    )
  }
  return parts.filter((p) => p !== null).join('\n')
}

/* ───────────────────────── 对话主循环 ───────────────────────── */

const noToolsFor = new Set() // 记住不支持 tools 的 (地址|模型)，下次直接走文本协议

export async function runAssistant({ settings, history, userText }) {
  const lang = settings.lang
  const cats = await db.categories.toArray()
  const ctx = { actions: [], categoryIds: cats.map((c) => c.id) }
  const modelKey = `${normalizeBase(settings.aiBaseUrl)}|${settings.aiModel}`
  let useTools = !noToolsFor.has(modelKey)

  const base = history.slice(-20).map((m) => ({ role: m.role, content: m.content }))
  let messages = null
  const rebuild = async () => {
    messages = [
      { role: 'system', content: await buildSystemPrompt(settings, lang, useTools) },
      ...base,
      { role: 'user', content: userText },
    ]
  }
  await rebuild()

  for (let round = 0; round < 6; round++) {
    let res
    try {
      res = await chat({ settings, messages, tools: useTools ? buildTools(ctx.categoryIds) : undefined })
    } catch (e) {
      const unsupported = useTools && [400, 404, 422, 501].includes(e.status) && /tool|function|unsupported|not support/i.test(e.message)
      if (!unsupported) throw e
      noToolsFor.add(modelKey)
      useTools = false
      ctx.actions.length = 0
      await rebuild()
      continue
    }

    const msg = res?.choices?.[0]?.message
    if (!msg) throw new ApiError(500, 'empty response')

    if (useTools && msg.tool_calls?.length) {
      messages.push({ role: 'assistant', content: msg.content || null, tool_calls: msg.tool_calls })
      for (const call of msg.tool_calls) {
        let args = {}
        try { args = JSON.parse(call.function?.arguments || '{}') } catch { /* 模型给了坏 JSON，当作空参数，工具会返回错误让它重试 */ }
        const out = await runTool(call.function?.name, args, ctx)
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(out) })
      }
      continue
    }

    let text = (msg.content || '').trim()
    if (!useTools) {
      const tags = [...text.matchAll(/<action>([\s\S]*?)<\/action>/g)]
      for (const m of tags) {
        try {
          const a = JSON.parse(m[1])
          await runTool(a.name, a.args || {}, ctx)
        } catch { /* 忽略无法解析的行 */ }
      }
      text = text.replace(/<action>[\s\S]*?<\/action>/g, '').trim()
    }
    return { text, actions: ctx.actions }
  }
  return { text: '', actions: ctx.actions, truncated: true }
}

/* ───────────────────────── 课表：AI 智能识别 ───────────────────────── */

export async function aiParseTimetable(settings, text) {
  const messages = [
    {
      role: 'system',
      content:
        'You convert a pasted class timetable (any language, any layout) into JSON. Output ONLY a JSON array, no prose, no code fences. ' +
        'Each element: {"name": string, "weekday": 1-7 (1=Monday … 7=Sunday), "start": "HH:mm", "end": "HH:mm", "location": string}. ' +
        'If a period number is given without clock times, skip that entry. If a course repeats on several weekdays, output one element per weekday.',
    },
    { role: 'user', content: text.slice(0, 12000) },
  ]
  const res = await chat({ settings, messages }, 90000)
  const raw = (res?.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim()
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start < 0 || end < 0) throw new ApiError(500, 'no JSON in response')
  return JSON.parse(raw.slice(start, end + 1))
}
