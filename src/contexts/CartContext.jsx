import { createContext, useContext, useState, useEffect } from 'react'
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

  const loadCart = async () => {
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
  }

  const addToCart = async (product) => {
    try {
      const existingItem = cartItems.find(item => item.productId === product.id || item.id === product.id)
      
      if (existingItem && existingItem.cartItemId) {
        // Обновляем существующий элемент
        const newQuantity = existingItem.quantity + 1
        const updatedItem = await api.updateCartItem(existingItem.cartItemId, newQuantity)
        await loadCart() // Перезагружаем корзину
      } else {
        // Добавляем новый элемент
        await api.addToCart(sessionId, product.id, 1)
        await loadCart() // Перезагружаем корзину
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert(error.message || 'Не удалось добавить товар в корзину')
    }
  }

  const removeFromCart = async (productId) => {
    try {
      const item = cartItems.find(item => (item.productId === productId || item.id === productId) && item.cartItemId)
      if (item && item.cartItemId) {
        await api.removeFromCart(item.cartItemId)
        await loadCart() // Перезагружаем корзину
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      alert(error.message || 'Не удалось удалить товар из корзины')
    }
  }

  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId)
        return
      }
      
      const item = cartItems.find(item => (item.productId === productId || item.id === productId) && item.cartItemId)
      if (item && item.cartItemId) {
        await api.updateCartItem(item.cartItemId, quantity)
        await loadCart() // Перезагружаем корзину
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert(error.message || 'Не удалось изменить количество')
    }
  }

  const clearCart = async () => {
    try {
      await api.clearCart(sessionId)
      await loadCart() // Перезагружаем корзину
    } catch (error) {
      console.error('Error clearing cart:', error)
      alert(error.message || 'Не удалось очистить корзину')
    }
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0) * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
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
      }}
    >
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

