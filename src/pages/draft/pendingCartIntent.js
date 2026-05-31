/** Session key: after auth, add this product to cart (used by draft Landing page). */
export const PENDING_CART_STORAGE_KEY = 'bebochka_pending_cart'

export function setPendingCartProduct(productId, returnPath = '/welcome') {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(
    PENDING_CART_STORAGE_KEY,
    JSON.stringify({ productId, returnPath, createdAt: Date.now() })
  )
}

export function readPendingCartProduct() {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PENDING_CART_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.productId) return null
    return data
  } catch {
    return null
  }
}

export function clearPendingCartProduct() {
  try {
    sessionStorage.removeItem(PENDING_CART_STORAGE_KEY)
  } catch (_) {}
}

/**
 * Call from ShopAuth after successful login/register (before navigate/reload):
 *   await consumePendingCartAfterAuth(api.getProductById, api.addToCartItem, sessionId)
 */
export async function consumePendingCartAfterAuth(getProductById, addToCartItem, sessionId) {
  const pending = readPendingCartProduct()
  if (!pending?.productId) return null
  clearPendingCartProduct()
  try {
    const product = await getProductById(pending.productId, sessionId)
    if (!product) return null
    await addToCartItem(product, sessionId)
    return { product, returnPath: pending.returnPath || '/' }
  } catch {
    return null
  }
}
