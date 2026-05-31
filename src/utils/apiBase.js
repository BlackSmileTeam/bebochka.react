/**
 * Публичный origin бэкенда (без суффикса /api).
 * Production на bebochka.ru: VITE_API_URL=https://bebochka.ru (или тот же origin + nginx /api).
 * Локально: origin Vite (5173/4173) + proxy на bebochka.ru в vite.config.js.
 * Локальный API: задайте VITE_API_URL=http://localhost:5000 в .env.local
 */
export function getApiPublicOrigin() {
  const v = import.meta.env.VITE_API_URL
  if (v != null && String(v).trim() !== '') {
    return String(v).trim().replace(/\/$/, '').replace(/\/api\/?$/i, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

export function getApiBaseUrl() {
  return `${getApiPublicOrigin()}/api`
}
