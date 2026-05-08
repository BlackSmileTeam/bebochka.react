/**
 * Публичный origin бэкенда (без суффикса /api).
 * Если VITE_API_URL не задан в production-сборке — тот же origin, что у SPA (Nginx проксирует /api).
 */
export function getApiPublicOrigin() {
  const v = import.meta.env.VITE_API_URL
  if (v != null && String(v).trim() !== '') {
    return String(v).trim().replace(/\/$/, '').replace(/\/api\/?$/i, '')
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5000'
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

export function getApiBaseUrl() {
  return `${getApiPublicOrigin()}/api`
}
