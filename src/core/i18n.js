// 轻量 i18n：中 / 英，扁平 key。插值用 {name}；英文单复数用 "单数|复数"（取决于 params.n）。
// 这个文件被 ai.js 复用，所以不依赖 React。

export const PERSONA_IDS = ['gentle', 'energetic', 'coach', 'concise', 'custom']

const zh = {
  'common.add': '添加', 'common.cancel': '取消', 'common.confirm': '确定', 'common.delete': '删除',
  'common.retry': '重试', 'common.save': '保存', 'common.send': '发送', 'common.today': '今天', 'common.tomorrow': '明天',

  'nav.main': '对话', 'nav.calendar': '日历', 'nav.achievements': '成就墙', 'nav.settings': '设置',
  'nav.menu': '打开菜单', 'nav.theme': '切换主题色',

  'splash.db': '正在打开本地数据库', 'splash.fonts': '正在准备字体', 'splash.spaces': '正在加载各个空间',
  'splash.offline': '正在准备离线与通知', 'splash.ready': '准备好了',

  'greet.night': '夜深了', 'greet.morning': '早上好', 'greet.afternoon': '下午好', 'greet.evening': '晚上好',
  'greet.withName': '{greet}，{name}',

  'hero.next': '下一个{kind}', 'hero.calm': '此刻没有待办', 'hero.calmSub': '好好休息，或者告诉我你想做什么。',
  'hero.todayStat': '今日 {done} / {total}', 'hero.countdown': '距{title}还有 {n} 天', 'hero.countdownToday': '今天是{title}',

  'time.now': '现在', 'time.inMin': '还有 {n} 分钟', 'time.inHM': '还有 {h} 小时 {m} 分', 'time.inH': '还有 {h} 小时',

  'kind.todo': '待办', 'kind.reminder': '提醒', 'kind.interval': '周期提醒', 'kind.countdown': '倒数日',
  'kind.habit': '打卡', 'kind.class': '课程',

  'cat.daily': '日常', 'cat.english': '英语', 'cat.study': '学习', 'cat.work': '工作', 'cat.health': '健康',

  'action.create': '已记下{kind}', 'action.update': '已更新{kind}', 'action.complete': '已完成{kind}', 'action.delete': '已删除{kind}',

  'main.placeholder': '记下灵感、待办，或与木漏聊聊',
  'main.s1': '确认今天的待办', 'main.s2': '明天有什么安排', 'main.s3': '每 2 小时提醒我喝水', 'main.s4': '今天有点焦虑，陪我聊聊',
  'main.needAi': '先在设置里配置 AI', 'main.noText': '好的。',
  'main.setupTitle': '先接上你的 AI', 'main.setupBody': '填入 API 地址和密钥，选一个模型，就可以直接用对话安排日程了。', 'main.setupBtn': '前往设置',

  'hist.title': '聊天记录', 'hist.new': '新建聊天', 'hist.untitled': '新的聊天', 'hist.count': '{n} 条',
  'hist.usage': '已保存 {n} / {max} 条消息，超出后自动丢弃最早的。',
  'hist.empty': '还没有聊天记录。发出第一句话后，它会出现在这里。',
  'hist.deleteTitle': '删除这段聊天？', 'hist.deleteMsg': '删除后无法恢复。',
  'hist.clearTitle': '清空所有聊天记录？', 'hist.clearMsg': '所有对话都会被删除，无法恢复。日程和成就不受影响。',
  'hist.clearBtn': '清空聊天记录', 'hist.cleared': '聊天记录已清空',

  'cal.add': '添加', 'cal.month': '月', 'cal.week': '周', 'cal.monthStat': '本月待办与提醒：已完成 {done} / {total}',
  'cal.dayEmpty': '这天还没有安排', 'cal.everyN': '每 {n} 小时', 'cal.daysLeft': '还有 {n} 天', 'cal.dayOf': '就是今天',
  'cal.daysAgo': '已过 {n} 天', 'cal.complete': '标记完成', 'cal.undo': '撤销完成',
  'cal.archived': '已归档到成就墙', 'cal.archivedTag': '已归档',

  'form.newTitle': '新建事项', 'form.editTitle': '编辑事项',
  'form.hint.todo': '要在某天完成的事。完成后会归档到成就墙。',
  'form.hint.reminder': '在指定的时间点提醒你一次。',
  'form.hint.interval': '从开始日期起，每天在时间窗内每隔 N 小时提醒一次。',
  'form.hint.countdown': '记录一个重要日期，显示还剩几天。',
  'form.hint.habit': '每天打卡一次，也可以只在指定的星期几重复。',
  'form.ph.todo': '例如：背 50 个单词', 'form.ph.reminder': '例如：取干洗的外套', 'form.ph.interval': '例如：喝水、起来活动',
  'form.ph.countdown': '例如：期末考试', 'form.ph.habit': '例如：晨跑',
  'form.title': '标题', 'form.date': '日期', 'form.time': '时间', 'form.timeOpt': '时间（可选）',
  'form.startDate': '开始日期', 'form.targetDate': '目标日期', 'form.endDate': '结束日期（可选）', 'form.endDateHint': '留空表示一直重复',
  'form.every': '间隔', 'form.everyOpt': '每 {n} 小时', 'form.windowStart': '每天从', 'form.windowEnd': '每天到',
  'form.weekdays': '重复日', 'form.weekdaysHint': '不选表示每天',
  'form.remind': '提前提醒', 'form.noRemind': '不提前', 'form.beforeMin': '提前 {n} 分钟', 'form.before1h': '提前 1 小时',
  'form.before1d': '提前 1 天', 'form.remindNeedsTime': '先设置时间，才能提前提醒',
  'form.category': '归档到成就墙文件夹', 'form.categoryHint': '完成后会放进这个文件夹', 'form.notes': '备注',
  'form.needTitle': '请填写标题', 'form.needDate': '请选择日期', 'form.needTime': '提醒需要设置具体时间',
  'form.badWindow': '结束时间要晚于开始时间', 'form.saved': '已保存',
  'form.deleteTitle': '删除这个事项？', 'form.deleteMsg': '已归档到成就墙的记录会保留。',

  'tt.title': '课表', 'tt.tabList': '课程', 'tt.tabImport': '导入',
  'tt.empty': '还没有课程。可以手动添加，或在“导入”里粘贴、上传课表。',
  'tt.add': '添加课程', 'tt.clearBtn': '清空课表', 'tt.clearTitle': '清空整个课表？', 'tt.clearMsg': '所有课程都会被删除。',
  'tt.name': '课程名', 'tt.weekday': '星期', 'tt.start': '开始', 'tt.end': '结束', 'tt.location': '地点',
  'tt.invalid': '请填写课程名、星期和起止时间',
  'tt.importHint': '支持 CSV / TSV、JSON、ICS 日历文件。格式对不上时，用“AI 识别”整理任意文本。',
  'tt.placeholder': '课程,星期,开始,结束,地点\n高等数学,周一,08:00,09:40,教学楼 A101',
  'tt.pickFile': '选择文件', 'tt.template': '下载 CSV 模板', 'tt.parse': '解析', 'tt.parseAi': 'AI 识别', 'tt.aiBusy': '识别中…',
  'tt.parseEmpty': '没有识别出课程，请检查格式', 'tt.pasteFirst': '请先粘贴课表内容',
  'tt.previewTitle': '识别到 {n} 门课程', 'tt.replace': '导入前清空现有课表', 'tt.confirmImport': '导入 {n} 门课程', 'tt.imported': '已导入 {n} 门课程',

  'ach.headline': '已归档 {n} 项成就', 'ach.sub': '完成的任务会按分类收进文件夹。这里不会自动清理，留下什么由你决定。',
  'ach.emptyFolder': '还没有内容', 'ach.newFolder': '新建文件夹', 'ach.folderName': '文件夹名称', 'ach.folderPh': '例如：读书',
  'ach.folderColor': '颜色', 'ach.needName': '请填写文件夹名称', 'ach.quickPh': '手动记录一项成就',
  'ach.folderEmpty': '这个文件夹还是空的。完成任务后会自动归档到这里。', 'ach.notePh': '添加备注…',
  'ach.clearFolderBtn': '清空此文件夹', 'ach.clearFolderTitle': '清空「{name}」？', 'ach.clearFolderMsg': '文件夹里的所有记录和备注都会被删除，无法恢复。',
  'ach.clearBtn': '清空', 'ach.deleteFolderBtn': '删除文件夹', 'ach.deleteFolderTitle': '删除「{name}」？', 'ach.deleteFolderMsg': '文件夹和里面的所有记录都会被删除。',
  'ach.clearAllBtn': '清空整面成就墙', 'ach.clearAllTitle': '清空整面成就墙？', 'ach.clearAllMsg': '所有文件夹中的记录和备注都会被删除，无法恢复。',
  'ach.cleared': '已清空',

  'set.general': '通用', 'set.language': '语言', 'set.theme': '主题色', 'set.themeIce': '冰川白蓝', 'set.themePeach': '珍珠白粉',
  'set.nickname': '昵称', 'set.nicknameHint': '用于首页问候', 'set.nicknamePh': '怎么称呼你',

  'ai.title': 'AI 接入', 'ai.ready': '已就绪', 'ai.baseUrl': 'API 地址', 'ai.baseUrlHint': 'OpenAI 兼容接口，通常以 /v1 结尾。',
  'ai.apiKey': 'API 密钥', 'ai.apiKeyHint': '只保存在这台设备上。请求从浏览器直接发往你填的地址。',
  'ai.model': '模型', 'ai.modelHint': '模型只能从接口返回的列表中选择。', 'ai.modelEmpty': '请先获取模型列表',
  'ai.fetchModels': '获取模型', 'ai.test': '测试连通性', 'ai.needBase': '请先填写 API 地址和密钥',
  'ai.modelsOk': '已连通：获取到 {n} 个模型，用时 {ms} ms', 'ai.testOk': '已连通：{n} 个模型（{ms} ms）；对话测试通过（{chat} ms）',

  'persona.title': '助手性格', 'persona.gentle': '温柔陪伴', 'persona.energetic': '元气鼓励', 'persona.coach': '理性教练',
  'persona.concise': '简洁高效', 'persona.custom': '自定义',
  'persona.hint': '选一个预设，或直接修改文字；修改后会变成“自定义”。', 'persona.placeholder': '描述你希望它怎么说话…',
  'persona.gentle.text': '温柔、耐心，像一位安静的朋友。先接住情绪，再给出一个很小的下一步；语气柔和，从不说教。',
  'persona.energetic.text': '元气、积极、爱鼓励人。用轻快的语气给用户打气，把任务说得简单、可完成。',
  'persona.coach.text': '冷静理性的效率教练。直接指出重点和优先级，给出清晰的下一步，少寒暄。',
  'persona.concise.text': '极简高效。每次回复不超过两句话，只说结果和必要的确认。',

  'notif.title': '通知提醒', 'notif.enable': '开启浏览器通知', 'notif.status': '状态', 'notif.permGranted': '已允许',
  'notif.permDenied': '已被拒绝（需在系统设置中开启）', 'notif.permDefault': '未设置', 'notif.permUnsupported': '当前环境不支持',
  'notif.classRemind': '课前提醒', 'notif.off': '关闭', 'notif.test': '发送测试', 'notif.testBody': '这是一条测试通知。',
  'notif.testSent': '已发送', 'notif.testFail': '发送失败',
  'notif.limit': '应用在前台或后台存活时，由本机准时提醒；应用被完全关闭后，需要配置下方的云端推送。',
  'notif.denied': '通知权限未开启', 'notif.enabled': '通知已开启', 'notif.unsupported': '这个浏览器不支持通知',
  'notif.needInstall': 'iPhone 上需要先把网页添加到主屏幕',
  'notif.iosInstall': '在 iPhone 上，请先用 Safari 打开本页，点底部的“分享”按钮，选择“添加到主屏幕”，再从主屏幕图标打开，才能开启通知。',

  'cloud.title': '云端推送', 'cloud.standby': '备用', 'cloud.subscribed': '已订阅',
  'cloud.desc': '应用被完全关闭后，要靠你自己的推送服务器按时唤醒 iPhone。服务器只会收到提醒的时间和标题。暂时用不到可以留空。',
  'cloud.url': '服务器地址', 'cloud.vapid': 'VAPID 公钥', 'cloud.vapidHint': '与服务器上的私钥配对的那一把公钥',
  'cloud.token': '访问令牌（可选）', 'cloud.tokenPh': 'Bearer 令牌', 'cloud.subscribe': '订阅并同步', 'cloud.resync': '重新同步',
  'cloud.unsubscribe': '取消订阅', 'cloud.unsubscribed': '已取消订阅', 'cloud.needFields': '请填写服务器地址和 VAPID 公钥',
  'cloud.noPush': '当前环境不支持 Web Push（需要部署后的版本）', 'cloud.synced': '已同步未来 7 天的 {n} 条提醒',

  'data.title': '数据', 'data.desc': '所有数据只存在这台设备上。导出的备份文件不含 API 密钥。',
  'data.export': '导出备份', 'data.import': '导入备份', 'data.wipe': '清空日程数据',
  'data.wipeTitle': '清空所有日程数据？', 'data.wipeMsg': '待办、课表、聊天记录和成就墙都会被删除，设置会保留。无法恢复。',
  'data.wipeBtn': '清空', 'data.wiped': '已清空', 'data.importTitle': '导入备份？', 'data.importMsg': '导入会覆盖当前的日程、聊天和成就数据。',
  'data.importBtn': '导入', 'data.imported': '已导入', 'data.importFail': '无法读取这个备份文件',

  'err.auth': '密钥无效或没有权限，请检查 API 密钥。', 'err.notFound': '找不到接口，请检查 API 地址（通常以 /v1 结尾）。',
  'err.rate': '请求太频繁或额度用完了，请稍后再试。', 'err.timeout': '等了太久没有响应，请检查网络后重试。',
  'err.network': '无法连接到服务器。请检查地址和网络；如果地址没错，可能是该服务不允许浏览器直接访问（CORS）。',
  'err.server': '服务器出错了，请稍后再试。', 'err.generic': '请求失败',

  'notify.now': '现在', 'notify.inMin': '{n} 分钟后', 'notify.interval': '每 {n} 小时提醒一次', 'notify.habit': '今天的打卡还没完成',
  'notify.class': '{n} 分钟后上课', 'notify.countdownToday': '就是今天',
}

const en = {
  'common.add': 'Add', 'common.cancel': 'Cancel', 'common.confirm': 'Confirm', 'common.delete': 'Delete',
  'common.retry': 'Retry', 'common.save': 'Save', 'common.send': 'Send', 'common.today': 'Today', 'common.tomorrow': 'Tomorrow',

  'nav.main': 'Chat', 'nav.calendar': 'Calendar', 'nav.achievements': 'Achievements', 'nav.settings': 'Settings',
  'nav.menu': 'Open menu', 'nav.theme': 'Switch theme',

  'splash.db': 'Opening local database', 'splash.fonts': 'Preparing fonts', 'splash.spaces': 'Loading spaces',
  'splash.offline': 'Preparing offline and notifications', 'splash.ready': 'Ready',

  'greet.night': "It's late", 'greet.morning': 'Good morning', 'greet.afternoon': 'Good afternoon', 'greet.evening': 'Good evening',
  'greet.withName': '{greet}, {name}',

  'hero.next': 'Next {kind}', 'hero.calm': 'Nothing on right now', 'hero.calmSub': 'Rest, or tell me what you would like to do.',
  'hero.todayStat': 'Today {done} / {total}', 'hero.countdown': '{n} day to {title}|{n} days to {title}', 'hero.countdownToday': '{title} is today',

  'time.now': 'now', 'time.inMin': 'in {n} min', 'time.inHM': 'in {h}h {m}m', 'time.inH': 'in {h}h',

  'kind.todo': 'To-do', 'kind.reminder': 'Reminder', 'kind.interval': 'Repeating', 'kind.countdown': 'Countdown',
  'kind.habit': 'Habit', 'kind.class': 'Class',

  'cat.daily': 'Daily', 'cat.english': 'English', 'cat.study': 'Study', 'cat.work': 'Work', 'cat.health': 'Health',

  'action.create': '{kind} saved', 'action.update': '{kind} updated', 'action.complete': '{kind} completed', 'action.delete': '{kind} deleted',

  'main.placeholder': 'Add a task, jot a thought, or chat',
  'main.s1': "Check today's to-dos", 'main.s2': "What's on tomorrow?", 'main.s3': 'Remind me to drink water every 2 hours', 'main.s4': "I'm feeling anxious today, can we talk?",
  'main.needAi': 'Set up the AI in Settings first', 'main.noText': 'Done.',
  'main.setupTitle': 'Connect your AI first', 'main.setupBody': 'Add an API address and key, pick a model, and you can plan your schedule just by chatting.', 'main.setupBtn': 'Open Settings',

  'hist.title': 'Chat history', 'hist.new': 'New chat', 'hist.untitled': 'New chat', 'hist.count': '{n} messages',
  'hist.usage': '{n} / {max} messages saved. The oldest are dropped past the limit.',
  'hist.empty': 'No chats yet. Send your first message and it will show up here.',
  'hist.deleteTitle': 'Delete this chat?', 'hist.deleteMsg': 'This cannot be undone.',
  'hist.clearTitle': 'Clear all chat history?', 'hist.clearMsg': 'Every conversation will be deleted. Your schedule and achievements are not affected.',
  'hist.clearBtn': 'Clear chat history', 'hist.cleared': 'Chat history cleared',

  'cal.add': 'Add', 'cal.month': 'Month', 'cal.week': 'Week', 'cal.monthStat': 'This month: {done} / {total} to-dos and reminders done',
  'cal.dayEmpty': 'Nothing planned for this day', 'cal.everyN': 'every {n} h', 'cal.daysLeft': '{n} day left|{n} days left', 'cal.dayOf': 'today',
  'cal.daysAgo': '{n} day ago|{n} days ago', 'cal.complete': 'Mark done', 'cal.undo': 'Undo',
  'cal.archived': 'Archived to your wall', 'cal.archivedTag': 'archived',

  'form.newTitle': 'New item', 'form.editTitle': 'Edit item',
  'form.hint.todo': 'Something to finish on a day. Once done, it is archived to your wall.',
  'form.hint.reminder': 'One alert at an exact time.',
  'form.hint.interval': 'From the start date, alerts every N hours inside a daily window.',
  'form.hint.countdown': 'Track an important date and see the days left.',
  'form.hint.habit': 'Check in once a day, or only on chosen weekdays.',
  'form.ph.todo': 'e.g. Learn 50 words', 'form.ph.reminder': 'e.g. Pick up the dry cleaning', 'form.ph.interval': 'e.g. Drink water, stretch',
  'form.ph.countdown': 'e.g. Final exam', 'form.ph.habit': 'e.g. Morning run',
  'form.title': 'Title', 'form.date': 'Date', 'form.time': 'Time', 'form.timeOpt': 'Time (optional)',
  'form.startDate': 'Start date', 'form.targetDate': 'Target date', 'form.endDate': 'End date (optional)', 'form.endDateHint': 'Leave empty to repeat forever',
  'form.every': 'Every', 'form.everyOpt': 'Every {n} h', 'form.windowStart': 'Daily from', 'form.windowEnd': 'Daily until',
  'form.weekdays': 'Repeat on', 'form.weekdaysHint': 'None selected means every day',
  'form.remind': 'Early alert', 'form.noRemind': 'None', 'form.beforeMin': '{n} min before', 'form.before1h': '1 hour before',
  'form.before1d': '1 day before', 'form.remindNeedsTime': 'Set a time first to get an early alert',
  'form.category': 'Wall folder', 'form.categoryHint': 'Where it goes once completed', 'form.notes': 'Notes',
  'form.needTitle': 'Add a title', 'form.needDate': 'Pick a date', 'form.needTime': 'A reminder needs an exact time',
  'form.badWindow': 'End time must be after start time', 'form.saved': 'Saved',
  'form.deleteTitle': 'Delete this item?', 'form.deleteMsg': 'Entries already archived on your wall are kept.',

  'tt.title': 'Timetable', 'tt.tabList': 'Classes', 'tt.tabImport': 'Import',
  'tt.empty': 'No classes yet. Add one by hand, or paste or upload a timetable under Import.',
  'tt.add': 'Add class', 'tt.clearBtn': 'Clear timetable', 'tt.clearTitle': 'Clear the whole timetable?', 'tt.clearMsg': 'Every class will be deleted.',
  'tt.name': 'Class name', 'tt.weekday': 'Day', 'tt.start': 'Start', 'tt.end': 'End', 'tt.location': 'Location',
  'tt.invalid': 'Enter a class name, a weekday and start and end times',
  'tt.importHint': 'Supports CSV / TSV, JSON and ICS calendar files. If the format does not match, use AI to tidy up any text.',
  'tt.placeholder': 'name,weekday,start,end,location\nCalculus,Mon,08:00,09:40,Building A101',
  'tt.pickFile': 'Choose file', 'tt.template': 'Download CSV template', 'tt.parse': 'Parse', 'tt.parseAi': 'Parse with AI', 'tt.aiBusy': 'Parsing…',
  'tt.parseEmpty': 'No classes found. Check the format.', 'tt.pasteFirst': 'Paste your timetable first',
  'tt.previewTitle': 'Found {n} classes', 'tt.replace': 'Replace existing timetable', 'tt.confirmImport': 'Import {n} classes', 'tt.imported': 'Imported {n} classes',

  'ach.headline': '{n} achievements archived', 'ach.sub': 'Finished tasks are filed into folders by category. Nothing is cleaned up automatically; you decide what stays.',
  'ach.emptyFolder': 'Empty', 'ach.newFolder': 'New folder', 'ach.folderName': 'Folder name', 'ach.folderPh': 'e.g. Reading',
  'ach.folderColor': 'Color', 'ach.needName': 'Enter a folder name', 'ach.quickPh': 'Record an achievement by hand',
  'ach.folderEmpty': 'This folder is empty. Completed tasks are filed here automatically.', 'ach.notePh': 'Add a note…',
  'ach.clearFolderBtn': 'Clear this folder', 'ach.clearFolderTitle': 'Clear "{name}"?', 'ach.clearFolderMsg': 'Every entry and note in this folder will be deleted. This cannot be undone.',
  'ach.clearBtn': 'Clear', 'ach.deleteFolderBtn': 'Delete folder', 'ach.deleteFolderTitle': 'Delete "{name}"?', 'ach.deleteFolderMsg': 'The folder and everything in it will be deleted.',
  'ach.clearAllBtn': 'Clear the whole wall', 'ach.clearAllTitle': 'Clear the whole wall?', 'ach.clearAllMsg': 'Every entry and note in every folder will be deleted. This cannot be undone.',
  'ach.cleared': 'Cleared',

  'set.general': 'General', 'set.language': 'Language', 'set.theme': 'Theme', 'set.themeIce': 'Ice Mist', 'set.themePeach': 'Peach Glow',
  'set.nickname': 'Nickname', 'set.nicknameHint': 'Used in the home greeting', 'set.nicknamePh': 'What should I call you',

  'ai.title': 'AI connection', 'ai.ready': 'Ready', 'ai.baseUrl': 'API address', 'ai.baseUrlHint': 'An OpenAI-compatible endpoint, usually ending in /v1.',
  'ai.apiKey': 'API key', 'ai.apiKeyHint': 'Stored only on this device. Requests go from your browser straight to the address above.',
  'ai.model': 'Model', 'ai.modelHint': 'You can only pick from the list the API returns.', 'ai.modelEmpty': 'Fetch the model list first',
  'ai.fetchModels': 'Fetch models', 'ai.test': 'Test connection', 'ai.needBase': 'Enter the API address and key first',
  'ai.modelsOk': 'Connected: {n} models found in {ms} ms', 'ai.testOk': 'Connected: {n} models ({ms} ms); chat test passed ({chat} ms)',

  'persona.title': 'Assistant personality', 'persona.gentle': 'Gentle', 'persona.energetic': 'Upbeat', 'persona.coach': 'Coach',
  'persona.concise': 'Concise', 'persona.custom': 'Custom',
  'persona.hint': 'Pick a preset or edit the text directly; editing switches to Custom.', 'persona.placeholder': 'Describe how you want it to talk…',
  'persona.gentle.text': 'Gentle and patient, like a quiet friend. Acknowledge feelings first, then offer one very small next step. Soft tone, never preachy.',
  'persona.energetic.text': 'Upbeat, positive and encouraging. Cheer the user on in a light tone and make tasks sound simple and doable.',
  'persona.coach.text': 'A calm, rational productivity coach. Point out priorities directly, give a clear next step, skip the small talk.',
  'persona.concise.text': 'Minimal and efficient. Never more than two sentences per reply; state the result and any needed confirmation only.',

  'notif.title': 'Notifications', 'notif.enable': 'Enable browser notifications', 'notif.status': 'Status', 'notif.permGranted': 'Allowed',
  'notif.permDenied': 'Blocked (enable it in system settings)', 'notif.permDefault': 'Not set', 'notif.permUnsupported': 'Not supported here',
  'notif.classRemind': 'Class reminder', 'notif.off': 'Off', 'notif.test': 'Send test', 'notif.testBody': 'This is a test notification.',
  'notif.testSent': 'Sent', 'notif.testFail': 'Could not send',
  'notif.limit': 'While the app is open or kept alive in the background, this device alerts you on time. Once it is fully closed you need the cloud push below.',
  'notif.denied': 'Notification permission is off', 'notif.enabled': 'Notifications on', 'notif.unsupported': 'This browser does not support notifications',
  'notif.needInstall': 'On iPhone, add this page to the Home Screen first',
  'notif.iosInstall': 'On iPhone, open this page in Safari, tap Share, choose Add to Home Screen, then launch it from the Home Screen icon. Notifications only work from there.',

  'cloud.title': 'Cloud push', 'cloud.standby': 'Standby', 'cloud.subscribed': 'Subscribed',
  'cloud.desc': 'When the app is fully closed, your own push server has to wake the iPhone on time. It only receives alert times and titles. Leave empty if you do not need it yet.',
  'cloud.url': 'Server address', 'cloud.vapid': 'VAPID public key', 'cloud.vapidHint': 'The public half of the key pair stored on your server',
  'cloud.token': 'Access token (optional)', 'cloud.tokenPh': 'Bearer token', 'cloud.subscribe': 'Subscribe and sync', 'cloud.resync': 'Sync again',
  'cloud.unsubscribe': 'Unsubscribe', 'cloud.unsubscribed': 'Unsubscribed', 'cloud.needFields': 'Enter the server address and VAPID public key',
  'cloud.noPush': 'Web Push is not available here (use the deployed build)', 'cloud.synced': 'Synced {n} alerts for the next 7 days',

  'data.title': 'Data', 'data.desc': 'All data lives only on this device. Exported backups do not include API keys.',
  'data.export': 'Export backup', 'data.import': 'Import backup', 'data.wipe': 'Erase schedule data',
  'data.wipeTitle': 'Erase all schedule data?', 'data.wipeMsg': 'To-dos, timetable, chats and your wall will be deleted. Settings are kept. This cannot be undone.',
  'data.wipeBtn': 'Erase', 'data.wiped': 'Erased', 'data.importTitle': 'Import this backup?', 'data.importMsg': 'This replaces your current schedule, chats and achievements.',
  'data.importBtn': 'Import', 'data.imported': 'Imported', 'data.importFail': 'Could not read this backup file',

  'err.auth': 'The key is invalid or lacks permission. Check your API key.', 'err.notFound': 'Endpoint not found. Check the API address (usually ends in /v1).',
  'err.rate': 'Too many requests, or the quota is used up. Try again later.', 'err.timeout': 'No response for too long. Check your network and retry.',
  'err.network': 'Could not reach the server. Check the address and your network; if the address is right, the service may not allow direct browser access (CORS).',
  'err.server': 'The server ran into a problem. Try again later.', 'err.generic': 'Request failed',

  'notify.now': 'Now', 'notify.inMin': 'In {n} min', 'notify.interval': 'Repeats every {n} h', 'notify.habit': "Today's check-in is still open",
  'notify.class': 'Class starts in {n} min', 'notify.countdownToday': "It's today",
}

const DICT = { zh, en }

export const detectLang = () => {
  try {
    return (navigator.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  } catch {
    return 'zh'
  }
}

export function makeT(lang) {
  const d = DICT[lang] || DICT.zh
  return (key, params) => {
    let s = d[key] ?? DICT.en[key] ?? key
    if (params) {
      if (s.includes('|') && typeof params.n === 'number') s = s.split('|')[params.n === 1 ? 0 : 1]
      s = s.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''))
    } else if (s.includes('|')) {
      s = s.split('|')[0]
    }
    return s
  }
}

// 当前生效的人设文本：预设按界面语言取文案；“自定义”取用户自己写的
export function getPersonaText(settings, lang) {
  const id = PERSONA_IDS.includes(settings.aiPresetId) ? settings.aiPresetId : 'gentle'
  if (id === 'custom') return settings.aiPersona || ''
  return (DICT[lang] || DICT.zh)[`persona.${id}.text`]
}
