export function isTestProduct(product) {
  return !!(product?.isTestProduct ?? product?.IsTestProduct)
}

export function isAdminViewer() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return false
    return !!JSON.parse(raw)?.isAdmin
  } catch {
    return false
  }
}

/** Тестовые товары — только для админов (каталог, карточка). Welcome — всегда без тестовых. */
export function isProductVisibleToViewer(product, { requireStock = false } = {}) {
  if (!isAdminViewer() && isTestProduct(product)) return false
  if (requireStock && (product.quantityInStock ?? product.QuantityInStock ?? 0) <= 0) {
    return false
  }
  return true
}
