import { getPublicSiteUrl } from '../constants/siteUrl'

function isLocalhostUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
  } catch {
    return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])([:/]|$)/i.test(url)
  }
}

/**
 * Публичный origin бэкенда (без суффикса /api).
 * Production: same origin (nginx /api) или VITE_API_URL=https://bebochka.ru.
 * localhost в VITE_API_URL игнорируется — берётся адрес сайта.
 */
export function getApiPublicOrigin() {
  const v = import.meta.env.VITE_API_URL
  if (v != null && String(v).trim() !== '') {
    const trimmed = String(v).trim().replace(/\/$/, '').replace(/\/api\/?$/i, '')
    if (!isLocalhostUrl(trimmed)) {
      return trimmed
    }
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin
    if (!isLocalhostUrl(origin)) {
      return origin
    }
  }
  return getPublicSiteUrl()
}

export function getApiBaseUrl() {
  return `${getApiPublicOrigin()}/api`
}
