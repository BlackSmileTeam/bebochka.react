import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { getSessionId } from '../utils/sessionId'

export const CartContext = createContext()

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
      
      // Преобразуем формат для совместимости
      const formattedItems = items.map(item => ({
        id: item.productId || item.productId,
        productId: item.productId,
        name: item.productName || item.productName,
        brand: item.productBrand,
        size: item.productSize,
        color: item.productColor,
        images: item.productImages || [],
        price: item.productPrice || item.productPrice,
        quantity: item.quantity || item.quantity,
        cartItemId: item.id // ID элемента корзины на сервере
      }))
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
    const id = result?.Id ?? result?.id
    const productId = result?.ProductId ?? result?.productId ?? product?.id
    const qty = result?.Quantity ?? result?.quantity ?? 1
    if (productId == null) return

    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === productId)
      const line = {
        id: productId,
        productId,
        name: result?.ProductName ?? result?.productName ?? product?.name ?? '',
        brand: result?.ProductBrand ?? result?.productBrand ?? product?.brand,
        size: result?.ProductSize ?? result?.productSize ?? product?.size,
        color: result?.ProductColor ?? result?.productColor ?? product?.color,
        images: result?.ProductImages ?? result?.productImages ?? product?.images ?? [],
        price: result?.ProductPrice ?? result?.productPrice ?? product?.price ?? 0,
        quantity: qty,
        cartItemId: id
      }
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], ...line }
        return next
      }
      return [...prev, line]
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
