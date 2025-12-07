import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { getSessionId } from '../utils/sessionId'

export const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [sessionId] = useState(() => getSessionId())

  // Загружаем корзину с сервера при монтировании
  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = useCallback(async () => {
    try {
      setLoading(true)
      const items = await api.getCartItems(sessionId)
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
      setCartItems(formattedItems)
    } catch (error) {
      console.error('Error loading cart from server:', error)
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const addToCart = useCallback(async (product) => {
    try {
      if (!product || !product.id) {
        console.error('Invalid product:', product)
        return
      }
      
      // Получаем актуальное состояние корзины с сервера
      const currentItems = await api.getCartItems(sessionId)
      const existingItem = currentItems.find(item => item.productId === product.id)
      
      if (existingItem && existingItem.id) {
        // Обновляем существующий элемент
        const newQuantity = existingItem.quantity + 1
        await api.updateCartItem(existingItem.id, newQuantity)
        await loadCart() // Перезагружаем корзину
      } else {
        // Добавляем новый элемент
        await api.addToCart(sessionId, product.id, 1)
        await loadCart() // Перезагружаем корзину
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      const errorMessage = error?.message || error?.response?.data?.message || 'Не удалось добавить товар в корзину'
      alert(errorMessage)
    }
  }, [sessionId, loadCart])

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
      alert(error?.message || 'Не удалось удалить товар из корзины')
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
      alert(error?.message || 'Не удалось изменить количество')
    }
  }, [sessionId, loadCart, removeFromCart])

  const clearCart = useCallback(async () => {
    try {
      await api.clearCart(sessionId)
      await loadCart() // Перезагружаем корзину
    } catch (error) {
      console.error('Error clearing cart:', error)
      alert(error?.message || 'Не удалось очистить корзину')
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
