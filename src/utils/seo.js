export function getProductStockCount(product) {
  if (!product) return 0
  const available = product.availableQuantity ?? product.AvailableQuantity
  if (available != null) return Number(available) || 0
  const stock = product.quantityInStock ?? product.QuantityInStock
  return Number(stock) || 0
}

export function slugifyProductName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildProductPath(product) {
  const id = product?.id ?? product?.Id
  const slug = slugifyProductName(product?.name ?? product?.Name)
  return `/product/${id}${slug ? `-${slug}` : ''}`
}
