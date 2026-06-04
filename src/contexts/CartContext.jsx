import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { getSessionId } from '../utils/sessionId'

export const CartContext = createContext()

function formatCartItem(item) {
  const isKitBundle = item.isKitDisplayLine
    || item.cartAddMode === 'bundle'
  return {
    id: item.productId,
    productId: item.productId,
    name: item.productName || '',
    brand: item.productBrand,
    size: isKitBundle ? null : item.productSize,
    color: isKitBundle ? null : item.productColor,
    images: item.productImages || [],
    price: item.productPrice ?? 0,
    quantity: item.quantity ?? 1,
    cartItemId: item.id,
    createdAt: item.createdAt ?? null,
    kitId: item.kitId ?? null,
    cartAddMode: item.cartAddMode ?? null,
    kitPartName: item.kitPartName ?? null,
    isKitDisplayLine: !!item.isKitDisplayLine,
    kitDisplayProductId: item.kitDisplayProductId ?? null,
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [sessionId] = useState(() => getSessionId())
  const emitToast = (message, type = 'error') => {
    if (!message || typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('bebochka-toast', { detail: { type, message } }))
  }
  const isAdminPath = () => {
    if (typeof window === 'undefined') return false
    const path = window.location.pathname || ''
    return path.startsWith('/admin')
  }

  // Загружаем корзину с сервера при монтировании и после входа
  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = useCallback(async () => {
    try {
      if (isAdminPath()) {
        setCartItems([])
        setLoading(false)
        return
      }
      const token = localStorage.getItem('authToken')
      if (!token && !sessionId) {
        console.warn('[CartContext] No session for guest cart')
        setCartItems([])
        return
      }
      
      setLoading(true)
      console.log('[CartContext] Loading cart for session:', sessionId)
      const items = await api.getCartItems(sessionId)
      console.log('[CartContext] Received cart items:', items)
      
      const formattedItems = items.map(formatCartItem)
      console.log('[CartContext] Formatted cart items:', formattedItems)
      setCartItems(formattedItems)
    } catch (error) {
      console.error('[CartContext] Error loading cart from server:', error)
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    const h = () => loadCart()
    window.addEventListener('bebochka-auth', h)
    return () => window.removeEventListener('bebochka-auth', h)
  }, [loadCart])

  const mergeCartLineFromAddResponse = useCallback((result, product) => {
    const normalized = formatCartItem({
      id: result?.Id ?? result?.id,
      productId: result?.ProductId ?? result?.productId ?? product?.id,
      productName: result?.ProductName ?? result?.productName ?? product?.name ?? '',
      productBrand: result?.ProductBrand ?? result?.productBrand ?? product?.brand,
      productSize: result?.ProductSize ?? result?.productSize ?? product?.size,
      productColor: result?.ProductColor ?? result?.productColor ?? product?.color,
      productImages: result?.ProductImages ?? result?.productImages ?? product?.images ?? [],
      productPrice: result?.ProductPrice ?? result?.productPrice ?? product?.price ?? 0,
      quantity: result?.Quantity ?? result?.quantity ?? 1,
      createdAt: result?.CreatedAt ?? result?.createdAt ?? new Date().toISOString(),
      kitId: result?.KitId ?? result?.kitId ?? null,
      cartAddMode: result?.CartAddMode ?? result?.cartAddMode ?? null,
      kitPartName: result?.KitPartName ?? result?.kitPartName ?? null,
      isKitDisplayLine: result?.IsKitDisplayLine ?? result?.isKitDisplayLine ?? false,
      kitDisplayProductId: result?.KitDisplayProductId ?? result?.kitDisplayProductId ?? null,
    })
    if (normalized.productId == null) return

    setCartItems((prev) => {
      const kitId = normalized.kitId
      const becameFullKit = normalized.isKitDisplayLine || normalized.cartAddMode === 'bundle'
      let next = prev

      if (kitId != null && becameFullKit) {
        next = prev.filter((i) => i.kitId !== kitId)
      } else {
        const idx = prev.findIndex((i) => i.productId === normalized.productId)
        if (idx >= 0) {
          next = [...prev]
          next[idx] = { ...next[idx], ...normalized, createdAt: next[idx].createdAt ?? normalized.createdAt }
          return next
        }
      }

      const idx = next.findIndex((i) => i.productId === normalized.productId)
      if (idx >= 0) {
        const updated = [...next]
        updated[idx] = { ...updated[idx], ...normalized, createdAt: updated[idx].createdAt ?? normalized.createdAt }
        return updated
      }
      return [...next, normalized]
    })
  }, [])

  const addToCart = useCallback(async (product) => {
    try {
      if (!product || !product.id) {
        console.error('Invalid product:', product)
        throw new Error('Invalid product')
      }
      
      console.log('[CartContext] Adding to cart:', { productId: product.id, sessionId })
      
      const result = await api.addToCart(sessionId, product.id, 1)
      console.log('[CartContext] Add to cart result:', result)
      mergeCartLineFromAddResponse(result, product)
    } catch (error) {
      console.error('[CartContext] Error adding to cart:', error)
      const errorMessage = error?.message || error?.response?.data?.message || 'Не удалось добавить товар в корзину'
      throw new Error(errorMessage) // Пробрасываем ошибку, чтобы обработать её в компоненте
    }
  }, [sessionId, mergeCartLineFromAddResponse])

  const removeFromCart = useCallback(async (productId) => {
    try {
      // Получаем актуальное состояние корзины с сервера
      const currentItems = await api.getCartItems(sessionId)
      const item = currentItems.find(item => item.productId === productId)
      if (item && item.id) {
        await api.removeFromCart(item.id)
        await loadCart() // Перезагружаем корзину
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      emitToast(error?.message || 'Не удалось удалить товар из корзины')
    }
  }, [sessionId, loadCart])

  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId)
        return
      }
      
      // Получаем актуальное состояние корзины с сервера
      const currentItems = await api.getCartItems(sessionId)
      const item = currentItems.find(item => item.productId === productId)
      if (item && item.id) {
        await api.updateCartItem(item.id, quantity)
        await loadCart() // Перезагружаем корзину
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      emitToast(error?.message || 'Не удалось изменить количество')
    }
  }, [sessionId, loadCart, removeFromCart])

  const clearCart = useCallback(async () => {
    try {
      await api.clearCart(sessionId)
      await loadCart() // Перезагружаем корзину
    } catch (error) {
      console.error('Error clearing cart:', error)
      emitToast(error?.message || 'Не удалось очистить корзину')
    }
  }, [sessionId, loadCart])

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price || 0) * item.quantity, 0)
  }, [cartItems])

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }, [cartItems])

  const contextValue = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    loadCart,
    sessionId
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
