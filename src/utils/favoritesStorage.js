const FAVORITES_KEY = 'bebochka-favorites'

function normalizeProductId(id) {
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function readFavoriteProductIds() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.map(normalizeProductId).filter(Boolean))]
  } catch {
    return []
  }
}

export function writeFavoriteProductIds(ids) {
  const normalized = [...new Set((Array.isArray(ids) ? ids : []).map(normalizeProductId).filter(Boolean))]
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(normalized))
  return normalized
}

export function toggleFavoriteProductId(productId) {
  const id = normalizeProductId(productId)
  if (!id) return { ids: readFavoriteProductIds(), isFavorite: false }
  const current = readFavoriteProductIds()
  const has = current.includes(id)
  const next = has ? current.filter((x) => x !== id) : [...current, id]
  writeFavoriteProductIds(next)
  return { ids: next, isFavorite: !has }
}
