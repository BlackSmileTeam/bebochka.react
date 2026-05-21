/** Товар уже виден в каталоге (время публикации в прошлом). */
export function isProductPublishedToCatalog(product) {
  if (!product) return false
  const raw = product.publishedAt ?? product.PublishedAt
  if (!raw) return false
  const at = new Date(raw)
  return !Number.isNaN(at.getTime()) && at.getTime() <= Date.now()
}
