import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

/** Shared shop modules — must load before admin-only chunks (see Rollup manualChunks order). */
function isShopCoreModule(id) {
  return (
    id.includes('/src/contexts/') ||
    id.includes('/src/services/') ||
    id.includes('/src/components/Toast') ||
    id.includes('/src/components/CookieNotice') ||
    id.includes('/src/utils/')
  )
}

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br', deleteOriginFile: false }),
    viteCompression({ algorithm: 'gzip', ext: '.gz', deleteOriginFile: false }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
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
