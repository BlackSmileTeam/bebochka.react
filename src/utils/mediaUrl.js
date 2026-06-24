import { getApiPublicOrigin } from './apiBase'

function normalizeUploadPath(path) {
  if (!path || typeof path !== 'string') return null

  let uploadPath = path.trim().replace(/\\/g, '/')
  if (!uploadPath) return null

  const origin = getApiPublicOrigin()
  if (/^https?:\/\//i.test(uploadPath)) {
    const uploadsMatch = uploadPath.match(/\/uploads\/[^?#]+/i)
    if (uploadsMatch) {
      uploadPath = uploadsMatch[0]
    } else if (origin && uploadPath.startsWith(origin)) {
      uploadPath = uploadPath.slice(origin.length)
    } else {
      return null
    }
  }

  if (!uploadPath.startsWith('/')) uploadPath = `/${uploadPath}`
  if (!uploadPath.startsWith('/uploads/')) return null
  return uploadPath
}

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

/** Уменьшенная копия для каталога и превью — грузится быстрее на мобильном. */
export function toThumbnailMediaUrl(path, width = 480) {
  const uploadPath = normalizeUploadPath(path)
  if (!uploadPath) return toAbsoluteMediaUrl(path)

  const origin = getApiPublicOrigin()
  const safeWidth = Math.min(Math.max(Number(width) || 480, 64), 1600)
  return `${origin}/api/media/thumb?path=${encodeURIComponent(uploadPath)}&w=${safeWidth}`
}
