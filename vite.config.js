import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 项目站点路径 = /<仓库名>/ ；仓库名为 komorebi
// 如需部署到根域名或改仓库名：VITE_BASE=/ npm run build
const base = process.env.VITE_BASE || '/komorebi/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // 自定义 Service Worker（src/sw.js）：预缓存 + Web Push 事件 + 点击通知回到应用
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        id: base,
        name: 'Komorebi · 木漏',
        short_name: 'Komorebi',
        description: 'A gentle schedule companion · 温柔的日程陪伴',
        lang: 'zh-CN',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#eef6fb',
        theme_color: '#e0f2fe',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { host: true },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          motion: ['framer-motion'],
          data: ['dexie', 'dexie-react-hooks'],
        },
      },
    },
  },
})
