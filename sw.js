// Service Worker：离线预缓存 + Web Push + 点击通知回到应用
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { db } from './core/db.js'

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// SPA 离线兜底
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// Google Fonts：样式表 stale-while-revalidate，字体文件长期缓存
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'gf-styles' }),
)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gf-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
)

const iconUrl = () => new URL('pwa-192.png', self.registration.scope).href

// 云端 Web Push：payload 可以是 { title, body, tag }，
// 也可以只带 { taskId }，由 SW 从本机 IndexedDB 取出标题（服务器不必知道日程明细）。
self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let data = {}
      try {
        data = event.data ? event.data.json() : {}
      } catch {
        try { data = { body: event.data.text() } } catch { /* 空 payload */ }
      }
      let { title, body, tag, taskId } = data
      if (!title && taskId) {
        try {
          const task = await db.tasks.get(Number(taskId))
          if (task) title = task.title
        } catch { /* 取不到就用默认标题 */ }
      }
      // iOS 要求每条 push 都必须可见地展示一条通知，否则订阅会被系统撤销
      await self.registration.showNotification(title || 'Komorebi', {
        body: body || '',
        tag,
        icon: iconUrl(),
        badge: iconUrl(),
        data: { url: self.registration.scope },
      })
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const c of all) {
        if ('focus' in c) return c.focus()
      }
      return self.clients.openWindow(event.notification.data?.url || self.registration.scope)
    })(),
  )
})
