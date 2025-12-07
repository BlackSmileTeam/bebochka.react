import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: []
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://89.104.67.36:55501',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    force: true
  }
})

