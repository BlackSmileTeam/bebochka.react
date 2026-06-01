export function getProductPriceInfo(product) {
  const price = Number(product?.price ?? product?.Price ?? 0)
  const pctRaw = product?.discountPercent ?? product?.DiscountPercent
  const pct = pctRaw != null ? Number(pctRaw) : null
  const finalFromApi = product?.finalPrice ?? product?.FinalPrice

  if (pct > 0 && pct < 100) {
    const finalPrice = finalFromApi != null
      ? Number(finalFromApi)
      : Math.round(price * (100 - pct)) / 100
    return {
      price,
      finalPrice,
      hasDiscount: true,
      discountPercent: pct,
    }
  }

  return {
    price,
    finalPrice: price,
    hasDiscount: false,
    discountPercent: null,
  }
}

export function formatRub(amount) {
  return `${Number(amount || 0).toLocaleString('ru-RU')} ₽`
}
