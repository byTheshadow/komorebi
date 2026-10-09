# Komorebi · 木漏

温柔的日程陪伴 PWA：用对话安排日程，本地优先，数据只存在你自己的设备上。

- **主界面**：AI 对话（Function Calling 管理待办 / 提醒 / 每 X 小时任务 / 倒数日 / 打卡）、情绪支持、Hero 轻提醒、100 条聊天记录
- **日历**：月 / 周视图、课表导入（CSV · TSV · JSON · ICS · AI 识别）、倒数日、打卡、周期提醒
- **成就墙**：完成的待办按分类归档进文件夹，可写备注，只能手动清理
- **设置**：中英文、OpenAI 兼容 API（模型只能从 `/models` 下拉里选）、连通性测试、AI 性格、通知、云端推送（备用）、备份导入导出

技术栈：Vite + React（仅 `.jsx`）· Tailwind 3 · Dexie（IndexedDB）· Lucide · Framer Motion · vite-plugin-pwa（自定义 Service Worker）

---

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173/komorebi/
npm run build      # 产物在 dist/
npm run preview    # 预览生产版本（Service Worker 只在生产版本里生效）
```

> 站点路径默认是 `/komorebi/`（对应仓库名 `komorebi`）。部署到根域名或改了仓库名时：
> `VITE_BASE=/ npm run build`，同时把 `index.html` 里图标的路径检查一遍（Vite 会自动补前缀）。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库，名字就叫 `komorebi`
2. 推送代码到 `main` 分支
   ```bash
   git init && git add . && git commit -m "init komorebi"
   git branch -M main
   git remote add origin git@github.com:<你的用户名>/komorebi.git
   git push -u origin main
   ```
3. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**
4. 之后每次推送到 `main` 都会自动构建并发布（`.github/workflows/deploy.yml`）
5. 访问 `https://<你的用户名>.github.io/komorebi/`

## 在 iPhone 上安装（通知的前提）

iOS 的通知只在“已添加到主屏幕”的网页应用里可用：

1. 用 **Safari** 打开站点
2. 点底部 **分享** → **添加到主屏幕**
3. 从**主屏幕图标**打开
4. 进入 设置 → 通知提醒 → 打开开关并允许权限

要求 iOS 16.4 及以上。

## 接入 AI

设置 → AI 接入：

1. 填 **API 地址**（OpenAI 兼容，通常以 `/v1` 结尾，如 `https://api.openai.com/v1`）和 **API 密钥**
2. 点 **获取模型**，从下拉框里选一个（不能手填）
3. 点 **测试连通性**：先请求 `/models`，再发一条极短的对话确认模型可用

注意：

- 请求由**浏览器直接**发给你填的地址，密钥只存在本机 IndexedDB。
- 该服务必须允许浏览器跨域访问（CORS）。OpenAI 官方可以；部分第三方中转不行，会提示“可能是 CORS”。如遇到，请用支持 CORS 的中转地址。
- 模型需要支持 `tools`（函数调用）才能自动建任务；不支持时会自动降级为文本指令协议。

## 通知的工作方式（请先读这一节）

| 场景 | 是否能提醒 | 由谁负责 |
| --- | --- | --- |
| 应用在前台 / 刚切到后台、仍被系统保留 | 可以 | 本机 `scheduler.js`，每 15 秒检查一次 |
| 应用被完全关闭（划掉 / 被系统回收） | **需要云端推送** | 你自己的 Web Push 服务器 |

**iOS 没有“本地定时通知”API。** 应用被关闭后要准时提醒，只能由服务器用 VAPID 发 Web Push 去唤醒 Service Worker。本项目的客户端已经就绪，**服务器端不包含在本仓库里**。

### 云端推送协议（备用，设置 → 云端推送）

客户端订阅后，会在数据变化时（防抖 1.5 秒）及每 10 分钟，把**未来 7 天**的提醒点整体推给你的服务器：

```
POST {服务器地址}/api/schedule
Authorization: Bearer <访问令牌>        # 可选
Content-Type: application/json

{
  "subscription": { /* PushSubscription.toJSON() */ },
  "items": [
    { "id": "t3:2026-10-09:14:30:at", "at": "2026-10-09T14:30:00.000Z", "title": "团队周会", "body": "现在" }
  ]
}
```

- 语义：以 `subscription.endpoint` 为键，**整体替换**该订阅的待发送队列
- 到点后，服务器用 `web-push` 向该订阅发一条 JSON：`{ "title", "body", "tag" }`（`tag` 直接用 `id`，应用在前台时本地通知和云端推送会因同 tag 自动合并，不会弹两次）
- 也可以只发 `{ "taskId": 3 }`，Service Worker 会从本机 IndexedDB 取出标题
- iOS 要求**每条 push 都必须弹出一条可见通知**，否则系统会撤销订阅

服务器需要：一对 VAPID 密钥（公钥填进应用设置）、一个能到点发送的调度器（Node `web-push` / Go 均可）。

## 数据与隐私

- 全部数据（任务、课表、聊天、成就、设置）只存在设备的 IndexedDB 中
- 设置 → 数据 可导出 JSON 备份；备份文件**不含** API 密钥与云端令牌
- 聊天记录上限 `MAX_MESSAGES = 100`（所有对话合计，超出后丢弃最旧的）。要改成别的口径，见 `src/core/db.js` 的 `MAX_MESSAGES` 与 `enforceMessageLimit`

## 目录结构

```
komorebi/
├── index.html                 入口（iOS PWA meta + 先行出现的 CSS 呼吸环）
├── vite.config.js             Vite + PWA（injectManifest）
├── tailwind.config.js         颜色全部走 CSS 变量，切 data-theme 即换主题
├── public/                    图标（PWA / 苹果触摸图标 / favicon）
├── .github/workflows/deploy.yml
└── src/
    ├── main.jsx               入口 + 最外层错误沙盒
    ├── App.jsx                外壳：开屏 → 各空间（懒加载 + 各自独立错误沙盒）
    ├── index.css              主题 token、弥散光斑、毛玻璃
    ├── sw.js                  Service Worker：预缓存、Web Push、点击通知
    ├── core/
    │   ├── db.js              Dexie 数据库（100 条聊天限制、任务、课表、成就、备份）
    │   ├── schedule.js        日程引擎：展开某一天、下一项、通知触发点
    │   ├── ai.js              OpenAI 兼容请求 + Function Calling + 课表 AI 识别
    │   ├── i18n.js            中 / 英
    │   ├── store.jsx          设置与主题上下文、Toast
    │   ├── ui.jsx             弹层 / 抽屉 / 确认框 / 开关 等公共组件
    │   ├── Shell.jsx          顶栏、导航抽屉、背景光斑
    │   ├── hooks.js           实时数据、visualViewport（键盘弹起适配）
    │   ├── pushManager.js     通知权限、iOS Web Push 订阅、云端同步
    │   ├── scheduler.js       本地提醒调度
    │   ├── timetable.js       课表解析（CSV / TSV / JSON / ICS）
    │   └── ErrorBoundary.jsx  沙盒隔离舱
    └── spaces/
        ├── splash/            开屏
        ├── main/              对话 · Hero · 历史抽屉
        ├── calendar/          月/周视图 · 事项表单 · 课表
        ├── achievements/      成就墙
        └── settings/          设置
```

## 已知限制

- 没有在真机 iOS 上完整验证过 Web Push；本地提醒与云端推送的实际到点行为请在你的设备上试一遍
- 字体来自 Google Fonts；离线 / 被墙时回退到系统字体（PingFang SC 等），不影响使用
- AI 回复暂未做流式输出，工具调用链路会多一两次请求，所以会有短暂的“输入中”

---

by shadow
