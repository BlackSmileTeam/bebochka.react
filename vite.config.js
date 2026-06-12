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

/** Public routes must not pull admin CSS/JS in the initial HTML (welcome, catalog guests). */
function stripAdminFromEntryHtml() {
  return {
    name: 'strip-admin-from-entry-html',
    apply: 'build',
    transformIndexHtml(html) {
      return html
        .replace(/<link[^>]*admin-pages[^>]*>\s*/gi, '')
        .replace(/<link rel="modulepreload"[^>]*admin-pages[^>]*>\s*/gi, '')
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
    id.includes('/src/constants/') ||
    id.includes('/src/components/PageShell') ||
    id.includes('/src/components/RouteFallback') ||
    id.includes('/src/components/ProductDetail') ||
    id.includes('/src/components/ProductImage') ||
    id.includes('/src/components/ProductPriceDisplay') ||
    id.includes('/src/components/ProductMetaFilter') ||
    id.includes('/src/components/CatalogBuyButton') ||
    id.includes('/src/components/CartCountdown') ||
    id.includes('/src/components/Toast') ||
    id.includes('/src/pages/ServerError') ||
    id.includes('/src/utils/')
  )
}

/** Admin chunk only for /admin/* pages — not AdminReviews (/reviews) or Landing. */
function isAdminPageModule(id) {
  if (!id.includes('/src/pages/')) return false
  if (id.includes('/src/pages/draft/')) return false
  if (id.includes('/src/pages/AdminReviews')) return false
  return /\/src\/pages\/Admin/.test(id)
}

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br', deleteOriginFile: false }),
    viteCompression({ algorithm: 'gzip', ext: '.gz', deleteOriginFile: false }),
    nonBlockingCss(),
    stripAdminFromEntryHtml(),
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
    modulePreload: {
      polyfill: false,
      resolveDependencies: (_filename, deps) =>
        deps.filter((dep) => !dep.includes('admin-pages')),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'router'
            if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
            if (id.includes('axios')) return 'axios'
            return 'vendor'
          }
          if (id.includes('/src/pages/draft/Landing')) return 'landing-page'
          if (isShopCoreModule(id)) return 'shop-core'
          if (isAdminPageModule(id)) return 'admin-pages'
          return undefined
        }
      }
    }
  }
})
