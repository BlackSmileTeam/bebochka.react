export function isKitProduct(product) {
  if (!product) return false
  return !!(product.isKit ?? product.IsKit ?? product.kitId ?? product.KitId)
}

export function normalizeKitParts(parts) {
  if (!Array.isArray(parts)) return []
  return parts
    .map((part) => ({
      productId: part.productId ?? part.ProductId ?? part.id ?? part.Id,
      partName: part.partName ?? part.PartName ?? part.name ?? part.Name ?? '',
      price: part.price ?? part.Price,
      sortOrder: part.sortOrder ?? part.SortOrder ?? 0,
      isReservedByOthers: part.isReservedByOthers ?? part.IsReservedByOthers ?? false,
      inMyCart: part.inMyCart ?? part.InMyCart ?? false,
      quantityInMyCart: part.quantityInMyCart ?? part.QuantityInMyCart ?? 0,
    }))
    .filter((part) => part.productId != null)
}

export function isKitPartInCart(part, inCartPartIds) {
  const partId = Number(part.productId)
  if (!Number.isFinite(partId)) return false
  return !!(part.inMyCart || inCartPartIds?.has(partId))
}

/** Доступные вещи первыми; уже в корзине — в конце списка. */
export function sortKitPartsForCartMenu(parts, inCartPartIds) {
  return [...parts].sort((a, b) => {
    const aInCart = isKitPartInCart(a, inCartPartIds)
    const bInCart = isKitPartInCart(b, inCartPartIds)
    if (aInCart !== bInCart) return aInCart ? 1 : -1
    const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    if (orderDiff !== 0) return orderDiff
    return Number(a.productId) - Number(b.productId)
  })
}

export function formatKitPartPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n.toLocaleString('ru-RU')} ₽`
}
