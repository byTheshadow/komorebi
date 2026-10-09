// 课表导入：纯本地解析 CSV / TSV / JSON / ICS；解析不了的文本再交给 AI（见 ai.js）
import { isValidTime, normTime, ymd } from './schedule.js'

const pad = (n) => String(n).padStart(2, '0')
const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7, 七: 7 }
const EN_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const ICS_DAYS = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 }

export function parseWeekday(v) {
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return null
  if (/^[1-7]$/.test(s)) return Number(s)
  if (s === '0') return 7
  const cn = s.match(/(?:周|星期|礼拜)\s*([一二三四五六日天七1-7])/) || s.match(/^([一二三四五六日天])$/)
  if (cn) return CN_NUM[cn[1]] || Number(cn[1])
  const en = EN_DAYS.findIndex((d) => s.startsWith(d))
  return en >= 0 ? en + 1 : null
}

export function parseTimes(v) {
  return [...String(v ?? '').matchAll(/(\d{1,2})[:：](\d{2})/g)].map((m) => `${pad(Number(m[1]))}:${m[2]}`)
}

// 统一校验并规范化一条课程；不合法返回 null
export function normalizeCourse(o) {
  if (!o) return null
  const name = String(o.name ?? '').trim()
  const weekday = typeof o.weekday === 'number' ? o.weekday : parseWeekday(o.weekday)
  const start = o.start && isValidTime(String(o.start)) ? normTime(String(o.start)) : null
  const end = o.end && isValidTime(String(o.end)) ? normTime(String(o.end)) : null
  if (!name || !weekday || weekday < 1 || weekday > 7 || !start || !end) return null
  return {
    name,
    weekday,
    start,
    end,
    location: String(o.location ?? '').trim(),
    fromDate: o.fromDate || null,
    toDate: o.toDate || null,
  }
}

/* ───────── CSV / TSV ───────── */
function splitLine(line, delim) {
  const out = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++ } else q = !q
    } else if (ch === delim && !q) { out.push(cur.trim()); cur = '' } else cur += ch
  }
  out.push(cur.trim())
  return out
}

const HEAD_KEYS = {
  name: /^(name|title|course|class|subject|课程|课程名|课程名称|名称|科目)$/i,
  weekday: /^(weekday|day|dow|星期|周|周几|星期几)$/i,
  start: /^(start|begin|from|开始|开始时间|上课|起)$/i,
  end: /^(end|to|finish|结束|结束时间|下课|止)$/i,
  time: /^(time|时间|节次时间)$/i,
  location: /^(location|room|place|地点|教室|上课地点)$/i,
}

export function parseCSV(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return []
  const delim = lines[0].includes('\t') ? '\t' : lines[0].includes(',') ? ',' : lines[0].includes(';') ? ';' : ','
  const rows = lines.map((l) => splitLine(l, delim))

  // 表头检测：第一行没有任何时间格式、且命中表头关键词
  let map = { name: 0, weekday: 1, start: 2, end: 3, location: 4 }
  const head = rows[0]
  const looksHead = !head.some((c) => parseTimes(c).length) && head.some((c) => Object.values(HEAD_KEYS).some((re) => re.test(c)))
  if (looksHead) {
    map = {}
    head.forEach((c, i) => {
      for (const [k, re] of Object.entries(HEAD_KEYS)) if (re.test(c) && map[k] === undefined) map[k] = i
    })
    rows.shift()
  }

  const out = []
  for (const r of rows) {
    const get = (k) => (map[k] !== undefined ? r[map[k]] : '')
    let times = parseTimes(`${get('start')} ${get('end')}`)
    if (times.length < 2 && map.time !== undefined) times = parseTimes(get('time'))
    if (times.length < 2) times = parseTimes(r.join(' '))
    const c = normalizeCourse({
      name: get('name'),
      weekday: get('weekday'),
      start: times[0],
      end: times[1],
      location: get('location'),
    })
    if (c) out.push(c)
  }
  return out
}

/* ───────── JSON ───────── */
export function parseJSON(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  const arr = Array.isArray(data) ? data : Array.isArray(data?.courses) ? data.courses : null
  if (!arr) return null
  const pick = (o, keys) => keys.map((k) => o[k]).find((v) => v !== undefined && v !== null)
  return arr
    .map((o) =>
      normalizeCourse({
        name: pick(o, ['name', 'title', 'course', '课程', '名称']),
        weekday: pick(o, ['weekday', 'day', 'dow', '星期']),
        start: pick(o, ['start', 'begin', '开始']),
        end: pick(o, ['end', 'finish', '结束']),
        location: pick(o, ['location', 'room', 'place', '地点', '教室']),
        fromDate: pick(o, ['fromDate', 'from']),
        toDate: pick(o, ['toDate', 'to', 'until']),
      }),
    )
    .filter(Boolean)
}

/* ───────── ICS ───────── */
export function parseICS(text) {
  const unfolded = text.replace(/\r?\n[ \t]/g, '')
  const out = []
  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const body = block.split('END:VEVENT')[0]
    const field = (name) => {
      const m = body.match(new RegExp(`^${name}[^:\\n]*:(.*)$`, 'm'))
      return m ? m[1].trim().replace(/\\,/g, ',').replace(/\\n/g, ' ') : ''
    }
    const dt = (v) => {
      const m = v.match(/(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/)
      return m ? { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4] || '00'}:${m[5] || '00'}` } : null
    }
    const s = dt(field('DTSTART'))
    const e = dt(field('DTEND'))
    if (!s || !e) continue
    const rrule = field('RRULE')
    const byday = (rrule.match(/BYDAY=([A-Z,]+)/) || [])[1]
    const until = (rrule.match(/UNTIL=(\d{8})/) || [])[1]
    const weekly = /FREQ=WEEKLY/.test(rrule)
    const d0 = new Date(Number(s.date.slice(0, 4)), Number(s.date.slice(5, 7)) - 1, Number(s.date.slice(8, 10)))
    const dow = d0.getDay() === 0 ? 7 : d0.getDay()
    const days = weekly && byday ? byday.split(',').map((x) => ICS_DAYS[x.replace(/[^A-Z]/g, '')]).filter(Boolean) : [dow]
    const toDate = weekly ? (until ? `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}` : null) : s.date
    for (const weekday of days) {
      const c = normalizeCourse({
        name: field('SUMMARY'), weekday, start: s.time, end: e.time,
        location: field('LOCATION'), fromDate: s.date, toDate,
      })
      if (c) out.push(c)
    }
  }
  return out
}

/* ───────── 入口：自动识别格式 ───────── */
export function parseTimetable(text) {
  const src = (text || '').trim()
  if (!src) return []
  if (src.includes('BEGIN:VCALENDAR') || src.includes('BEGIN:VEVENT')) return parseICS(src)
  if (src.startsWith('[') || src.startsWith('{')) {
    const j = parseJSON(src)
    if (j) return j
  }
  return parseCSV(src)
}

export function templateCSV(lang) {
  if (lang === 'zh') {
    return '\uFEFF课程,星期,开始,结束,地点\n高等数学,周一,08:00,09:40,教学楼 A101\n大学英语,周三,10:00,11:40,外语楼 203\n'
  }
  return '\uFEFFname,weekday,start,end,location\nCalculus,Mon,08:00,09:40,Building A101\nEnglish,Wed,10:00,11:40,Hall 203\n'
}

export const todayStr = () => ymd(new Date())
