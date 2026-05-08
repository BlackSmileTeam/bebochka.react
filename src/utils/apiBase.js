/**
 * Публичный origin бэкенда (без суффикса /api).
 * В production при HTTPS не используем http:// или «голый» IP из VITE_API_URL — иначе Mixed Content.
 * Если VITE_API_URL не задан — тот же origin, что у SPA (Nginx проксирует /api на backend).
 */
function normalizeOrigin(raw) {
  return String(raw).trim().replace(/\/$/, '').replace(/\/api\/?$/i, '')
}

function looksLikeInsecureOrRawIp(origin) {
  if (!origin) return true
  const lower = origin.toLowerCase()
  if (lower.startsWith('http://')) return true
  try {
    const u = new URL(origin.startsWith('http') ? origin : `https://${origin}`)
    const host = u.hostname
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true
  } catch {
    return true
  }
  return false
}

export function getApiPublicOrigin() {
  const v = import.meta.env.VITE_API_URL
  const fromEnv = v != null && String(v).trim() !== '' ? normalizeOrigin(v) : ''

  if (import.meta.env.DEV) {
    return fromEnv || 'http://localhost:5000'
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const pageHttps = window.location.protocol === 'https:'
    if (pageHttps && looksLikeInsecureOrRawIp(fromEnv)) {
      return window.location.origin
    }
    if (fromEnv) return fromEnv
    return window.location.origin
  }

  return fromEnv || ''
}

export function getApiBaseUrl() {
  return `${getApiPublicOrigin()}/api`
}
