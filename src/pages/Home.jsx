import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useCart } from '../contexts/CartContext'
import ProductDetail from '../components/ProductDetail'
import './Home.css'

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [addingToCart, setAddingToCart] = useState(new Set()) // Track which products are being added
  const { addToCart, sessionId, cartItems } = useCart()
  
  // Используем availableQuantity из сервера (уже учитывает резервы всех пользователей)
  const getAvailableQuantity = (product) => {
    return product.availableQuantity !== undefined ? product.availableQuantity : (product.quantityInStock || 0)
  }
  
  // Получаем количество товара в корзине
  const getCartQuantity = (productId) => {
    const cartItem = cartItems.find(item => item.productId === productId)
    return cartItem ? cartItem.quantity : 0
  }

  useEffect(() => {
    loadProducts()
  }, [sessionId])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getProducts(sessionId)
      // Фильтруем товары с нулевым количеством
      const availableProducts = data.filter(product => {
        const available = getAvailableQuantity(product)
        return available > 0
      })
      setProducts(availableProducts)
      setError(null)
    } catch (err) {
      setError('Не удалось загрузить товары')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (product) => {
    // Проверяем доступное количество перед добавлением
    const available = getAvailableQuantity(product)
    const inCart = getCartQuantity(product.id)
    
    if (available <= 0 || inCart >= available) {
      return // Не добавляем, если товар закончился или уже в корзине в максимальном количестве
    }
    
    // Блокируем кнопку для этого товара
    setAddingToCart(prev => new Set(prev).add(product.id))
    
    try {
      await addToCart(product)
      // Перезагружаем товары после добавления, чтобы обновить availableQuantity
      await loadProducts()
    } catch (error) {
      // Показываем ошибку пользователю
      alert(error.message || 'Не удалось добавить товар в корзину')
      console.error('Error in handleAddToCart:', error)
    } finally {
      // Разблокируем кнопку
      setAddingToCart(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="home-header">
        <h1>Каталог товаров</h1>
        <p className="subtitle">
          Недорогая и качественная одежда для мальчиков и девочек от 62 до 152 размера 🧸
        </p>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>Товары пока не добавлены</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="product-card"
            >
              <div 
                className="product-image-container"
                onClick={() => setSelectedProduct(product)}
              >
                {product.images && product.images.length > 0 ? (
                  <>
                    <img
                      src={product.images[0].startsWith('http') 
                        ? product.images[0] 
                            : `${import.meta.env.VITE_API_URL || 'http://89.104.67.36:55501'}${product.images[0]}`}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = '/logo.jpg'
                      }}
                    />
                    {product.images.length > 1 && (
                      <div className="product-images-badge">
                        +{product.images.length - 1}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="product-image-placeholder">
                    <span>Нет фото</span>
                  </div>
                )}
              </div>
              <div className="product-info">
                <h3 
                  className="product-name"
                  onClick={() => setSelectedProduct(product)}
                  style={{ cursor: 'pointer' }}
                >
                  {product.name}
                </h3>
                {product.brand && (
                  <p className="product-brand">🏷️ {product.brand}</p>
                )}
                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}
                {(() => {
                  const available = getAvailableQuantity(product)
                  return (
                    <div className="product-stock" style={{
                      fontSize: '0.85rem',
                      color: available > 0 ? '#48bb78' : '#e53e3e',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      {available > 0 ? `✓ ${available} шт.` : '❌ Нет в наличии'}
                    </div>
                  )
                })()}
                <div className="product-details">
                  {product.size && (
                    <span className="product-size">📏 {product.size}</span>
                  )}
                  {product.color && (
                    <span className="product-color">🎨 {product.color}</span>
                  )}
                  {product.gender && (
                    <span className="product-gender">👤 {product.gender}</span>
                  )}
                  {product.condition && (
                    <span className="product-condition">✨ {product.condition === 'новая' ? 'Новая вещь' : product.condition}</span>
                  )}
                </div>
                <div className="product-footer">
                  <div className="product-price">
                    {(product.price ?? 0).toLocaleString('ru-RU')} ₽
                  </div>
                {(() => {
                  const available = getAvailableQuantity(product)
                  const inCart = getCartQuantity(product.id)
                  const canAdd = available > 0 && inCart < available
                  const isAdding = addingToCart.has(product.id)
                  
                  return (
                    <button
                      className="btn-buy"
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (canAdd && !isAdding) {
                          await handleAddToCart(product)
                        }
                      }}
                      disabled={!canAdd || isAdding}
                      title={
                        !canAdd 
                          ? (available <= 0 ? 'Товар закончился' : 'Достигнуто максимальное количество')
                          : (isAdding ? 'Добавление...' : 'Добавить в корзину')
                      }
                    >
                      {isAdding 
                        ? 'Добавление...' 
                        : (!canAdd 
                          ? (available <= 0 ? 'Нет в наличии' : 'В корзине')
                          : 'В корзину')
                      }
                    </button>
                  )
                })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedProduct && (
        <ProductDetail 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)}
          getAvailableQuantity={getAvailableQuantity}
        />
      )}
    </div>
  )
}

export default Home

