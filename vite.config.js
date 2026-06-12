import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: remoteApiProxy,
  },
  preview: {
    port: 4173,
    proxy: remoteApiProxy,
  },
})
