import { getApiPublicOrigin } from './apiBase'

export function toAbsoluteMediaUrl(path) {
  if (!path || typeof path !== 'string') return null

  const trimmed = path.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) return trimmed

  // Support old values that may contain Windows-style separators.
  const normalized = trimmed.replace(/\\/g, '/')
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`
  return `${getApiPublicOrigin()}${withLeadingSlash}`
}
