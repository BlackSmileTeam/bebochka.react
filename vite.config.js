import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

/** After build: stylesheet preload + onload swap (fixes Lighthouse render-blocking). */
function nonBlockingCss() {
  return {
    name: 'non-blocking-css',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        (_, href) =>
          `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">` +
          `<noscript><link rel="stylesheet" href="${href}"></noscript>`,
      )
    },
  }
}

/** Локальный dev/preview: запросы /api и /uploads проксируются на production. */
const REMOTE_API = 'https://bebochka.ru'

const remoteApiProxy = {
  '/api': {
    target: REMOTE_API,
    changeOrigin: true,
    secure: true,
  },
  '/uploads': {
    target: REMOTE_API,
    changeOrigin: true,
    secure: true,
  },
}

/** Shared shop modules — must load before admin-only chunks (see Rollup manualChunks order). */
function isShopCoreModule(id) {
  return (
    id.includes('/src/contexts/') ||
    id.includes('/src/services/') ||
    id.includes('/src/components/Toast') ||
    id.includes('/src/utils/')
  )
}

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br', deleteOriginFile: false }),
    viteCompression({ algorithm: 'gzip', ext: '.gz', deleteOriginFile: false }),
    nonBlockingCss(),
  ],
  server: {
    port: 5173,
    proxy: remoteApiProxy,
  },
  preview: {
    port: 4173,
    proxy: remoteApiProxy,
  },
  build: {
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'router'
            if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
            if (id.includes('axios')) return 'axios'
            return 'vendor'
          }
          if (isShopCoreModule(id)) return 'shop-core'
          if (id.includes('/src/pages/Admin')) return 'admin-pages'
          return undefined
        }
      }
    }
  }
})
