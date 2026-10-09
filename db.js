// 本地数据库沙盒：所有数据都只存在这台设备的 IndexedDB 里（Dexie 封装）
// 注意：这个文件会被 Service Worker 复用，所以不要在这里碰 window / localStorage。
import Dexie from 'dexie'

export const MAX_MESSAGES = 100 // 聊天记录上限（跨所有对话合计，超出后从最旧的开始丢弃）

export const db = new Dexie('komorebi')

db.version(1).stores({
  settings: 'key',
  chats: '++id, updatedAt',
  messages: '++id, chatId, createdAt',
  // kind: todo | reminder | interval | countdown | habit
  tasks: '++id, kind, date, done, createdAt',
  checkins: '++id, taskId, date, [taskId+date]',
  classes: '++id, weekday',
  categories: 'id',
  achievements: '++id, categoryId, completedAt, taskId',
  fired: 'key, at', // 已触发的本地通知（去重）
})

/* ───────────────────────── 设置 ───────────────────────── */

export const DEFAULT_SETTINGS = {
  lang: 'zh',
  theme: 'ice', // ice | peach
  profileName: '',
  activeChatId: null,
  // AI（OpenAI 兼容）
  aiBaseUrl: '',
  aiKey: '',
  aiModel: '',
  aiModels: [],
  aiPresetId: 'gentle',
  aiPersona: '', // 仅当 aiPresetId === 'custom' 时生效
  // 通知
  notifyEnabled: false,
  classRemindMin: 10,
  // 云端推送（备用）
  cloudEnabled: false,
  cloudUrl: '',
  cloudToken: '',
  cloudVapid: '',
  cloudSubscribed: false,
}

export async function loadSettings() {
  const rows = await db.settings.toArray()
  const out = { ...DEFAULT_SETTINGS }
  for (const r of rows) out[r.key] = r.value
  return out
}

export async function saveSettings(patch) {
  await db.settings.bulkPut(Object.entries(patch).map(([key, value]) => ({ key, value })))
}

/* ───────────────────────── 分类（成就墙文件夹） ───────────────────────── */

export const DEFAULT_CATEGORIES = [
  { id: 'daily', color: '#0ea5e9', builtin: true },
  { id: 'english', color: '#6366f1', builtin: true },
  { id: 'study', color: '#14b8a6', builtin: true },
  { id: 'work', color: '#f59e0b', builtin: true },
  { id: 'health', color: '#f43f5e', builtin: true },
]

export async function seedDefaults() {
  const have = new Set(await db.categories.toCollection().primaryKeys())
  const missing = DEFAULT_CATEGORIES.filter((c) => !have.has(c.id))
  if (missing.length) await db.categories.bulkAdd(missing)
}

export async function addCategory(name, color) {
  const id = `c_${Date.now().toString(36)}`
  await db.categories.add({ id, name: name.trim(), color, builtin: false })
  return id
}

export async function deleteCategory(id) {
  await db.transaction('rw', db.categories, db.achievements, async () => {
    await db.achievements.where('categoryId').equals(id).delete()
    await db.categories.delete(id)
  })
}

/* ───────────────────────── 聊天（最多 100 条） ───────────────────────── */

export async function createChat(title = '') {
  const now = Date.now()
  return db.chats.add({ title, createdAt: now, updatedAt: now })
}

export async function addMessage(chatId, { role, content, actions = [] }) {
  const now = Date.now()
  const id = await db.messages.add({ chatId, role, content, actions, createdAt: now })
  await db.chats.update(chatId, { updatedAt: now })
  await enforceMessageLimit()
  return id
}

export async function enforceMessageLimit() {
  const total = await db.messages.count()
  if (total <= MAX_MESSAGES) return
  const stale = await db.messages.orderBy('createdAt').limit(total - MAX_MESSAGES).toArray()
  await db.messages.bulkDelete(stale.map((m) => m.id))
  // 只清理“被裁剪后变空”的对话，不动刚新建的空对话
  for (const chatId of new Set(stale.map((m) => m.chatId))) {
    if ((await db.messages.where('chatId').equals(chatId).count()) === 0) await db.chats.delete(chatId)
  }
}

export async function deleteChat(chatId) {
  await db.transaction('rw', db.chats, db.messages, async () => {
    await db.messages.where('chatId').equals(chatId).delete()
    await db.chats.delete(chatId)
  })
}

export async function clearAllChats() {
  await db.transaction('rw', db.chats, db.messages, async () => {
    await db.messages.clear()
    await db.chats.clear()
  })
}

/* ───────────────────────── 任务 / 日程 ───────────────────────── */

export async function addTask(data) {
  return db.tasks.add({
    kind: 'todo',
    title: '',
    notes: '',
    categoryId: 'daily',
    date: null, // YYYY-MM-DD
    time: null, // HH:mm
    remindBefore: null, // 提前多少分钟（todo / reminder）
    everyHours: null, // interval：每 X 小时
    windowStart: '09:00', // interval：每天的提醒时间窗
    windowEnd: '21:00',
    endDate: null, // interval / habit：结束日期（空 = 一直）
    weekdays: [], // habit：星期几（空 = 每天）
    done: false,
    doneAt: null,
    source: 'manual', // manual | ai
    createdAt: Date.now(),
    ...data,
  })
}

export async function updateTask(id, patch) {
  await db.tasks.update(id, patch)
}

export async function deleteTask(id) {
  await db.transaction('rw', db.tasks, db.checkins, async () => {
    await db.tasks.delete(id)
    await db.checkins.where('taskId').equals(id).delete()
  })
  // 成就墙上的归档记录会保留（成就墙只允许用户手动清理）
}

// 完成任务 = 归档到成就墙；取消完成 = 撤回（有备注的记录会保留）
export async function setTaskDone(id, done) {
  const task = await db.tasks.get(id)
  if (!task) return
  await db.transaction('rw', db.tasks, db.achievements, async () => {
    await db.tasks.update(id, { done, doneAt: done ? Date.now() : null })
    const existing = await db.achievements.where('taskId').equals(id).first()
    if (done && !existing) {
      await db.achievements.add({
        taskId: id,
        title: task.title,
        categoryId: task.categoryId || 'daily',
        kind: task.kind,
        completedAt: Date.now(),
        note: '',
      })
    } else if (!done && existing && !existing.note) {
      await db.achievements.delete(existing.id)
    }
  })
}

export async function toggleCheckin(taskId, date) {
  const hit = await db.checkins.where('[taskId+date]').equals([taskId, date]).first()
  if (hit) await db.checkins.delete(hit.id)
  else await db.checkins.add({ taskId, date, at: Date.now() })
}

/* ───────────────────────── 课表 ───────────────────────── */

export async function addClasses(list, { replace = false } = {}) {
  await db.transaction('rw', db.classes, async () => {
    if (replace) await db.classes.clear()
    await db.classes.bulkAdd(list.map((c) => ({ location: '', fromDate: null, toDate: null, ...c })))
  })
}

/* ───────────────────────── 成就墙 ───────────────────────── */

export async function addAchievement({ title, categoryId, note = '' }) {
  return db.achievements.add({ taskId: null, title, categoryId, kind: 'manual', completedAt: Date.now(), note })
}
export const updateAchievementNote = (id, note) => db.achievements.update(id, { note })
export const deleteAchievement = (id) => db.achievements.delete(id)
export async function clearAchievements(categoryId) {
  if (categoryId) await db.achievements.where('categoryId').equals(categoryId).delete()
  else await db.achievements.clear()
}

/* ───────────────────────── 备份 ───────────────────────── */

const SECRET_KEYS = ['aiKey', 'cloudToken']

export async function exportAll() {
  const settings = await loadSettings()
  for (const k of SECRET_KEYS) delete settings[k] // 导出文件里不带密钥
  return {
    app: 'komorebi',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    chats: await db.chats.toArray(),
    messages: await db.messages.toArray(),
    tasks: await db.tasks.toArray(),
    checkins: await db.checkins.toArray(),
    classes: await db.classes.toArray(),
    categories: await db.categories.toArray(),
    achievements: await db.achievements.toArray(),
  }
}

export async function importAll(data) {
  if (!data || data.app !== 'komorebi') throw new Error('not a komorebi backup')
  const keep = await loadSettings()
  await db.transaction(
    'rw',
    [db.settings, db.chats, db.messages, db.tasks, db.checkins, db.classes, db.categories, db.achievements, db.fired],
    async () => {
      await Promise.all([
        db.chats.clear(), db.messages.clear(), db.tasks.clear(), db.checkins.clear(),
        db.classes.clear(), db.categories.clear(), db.achievements.clear(), db.fired.clear(),
      ])
      await db.chats.bulkAdd(data.chats || [])
      await db.messages.bulkAdd(data.messages || [])
      await db.tasks.bulkAdd(data.tasks || [])
      await db.checkins.bulkAdd(data.checkins || [])
      await db.classes.bulkAdd(data.classes || [])
      await db.categories.bulkAdd(data.categories || [])
      await db.achievements.bulkAdd(data.achievements || [])
      const merged = { ...keep, ...(data.settings || {}) }
      for (const k of SECRET_KEYS) merged[k] = keep[k] // 保留本机原有密钥
      await saveSettings(merged)
    },
  )
  await seedDefaults()
}

export async function wipeAll() {
  await db.transaction(
    'rw',
    [db.chats, db.messages, db.tasks, db.checkins, db.classes, db.achievements, db.fired],
    async () => {
      await Promise.all([
        db.chats.clear(), db.messages.clear(), db.tasks.clear(), db.checkins.clear(),
        db.classes.clear(), db.achievements.clear(), db.fired.clear(),
      ])
    },
  )
}
