import { useState, useEffect, useMemo } from 'react'
import { api } from '../services/api'
import { useCart } from '../contexts/CartContext'
import ProductDetail from '../components/ProductDetail'
import Toast from '../components/Toast'
import PageShell from '../components/PageShell'
import { formatCondition } from '../utils/formatCondition'
import './Home.css'

const CATALOG_SUBTITLE = 'Недорогая и качественная одежда для мальчиков и девочек от 62 до 152 размера \u{1F9F8}'

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [addingToCart, setAddingToCart] = useState(new Set()) // Track which products are being added
  const [joiningQueue, setJoiningQueue] = useState(new Set())
  const [myQueueProductIds, setMyQueueProductIds] = useState(new Set())
  const [toast, setToast] = useState(null)
  const [filters, setFilters] = useState({
    brand: '',
    size: '',
    color: '',
    gender: '',
    condition: ''
  })
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

  useEffect(() => {
    loadMyQueue()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getProducts(sessionId)
      // Показываем товары, которые еще есть на складе (даже если временно зарезервированы в чужой корзине)
      const visibleProducts = data.filter(product => {
        const quantityInStock = product.quantityInStock ?? product.QuantityInStock ?? 0
        return quantityInStock > 0
      })
      setProducts(visibleProducts)
      setError(null)
    } catch (err) {
      setError('Не удалось загрузить товары')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMyQueue = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setMyQueueProductIds(new Set())
      return
    }
    try {
      const data = await api.getMyCartQueue()
      const ids = new Set(data.map((x) => x.productId ?? x.ProductId))
      setMyQueueProductIds(ids)
    } catch {
      setMyQueueProductIds(new Set())
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

  const handleJoinQueue = async (productId) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setToast({ type: 'warning', message: 'Войдите в аккаунт, чтобы встать в очередь' })
      return
    }

    setJoiningQueue(prev => new Set(prev).add(productId))
    try {
      await api.joinCartQueue(productId)
      setMyQueueProductIds(prev => {
        const next = new Set(prev)
        next.add(productId)
        return next
      })
      setToast({
        type: 'success',
        message: 'Вы в очереди. Как только товар освободится, он автоматически попадет в вашу корзину.'
      })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Не удалось встать в очередь' })
    } finally {
      setJoiningQueue(prev => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const filterOptions = useMemo(() => {
    const collect = (key) =>
      [...new Set(products.map((p) => p[key]).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), 'ru')
      )

    return {
      brands: collect('brand'),
      sizes: collect('size'),
      colors: collect('color'),
      genders: collect('gender'),
      conditions: collect('condition')
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.brand && product.brand !== filters.brand) return false
      if (filters.size && product.size !== filters.size) return false
      if (filters.color && product.color !== filters.color) return false
      if (filters.gender && product.gender !== filters.gender) return false
      if (filters.condition && product.condition !== filters.condition) return false
      return true
    })
  }, [products, filters])

  const formatGender = (gender) => {
    if (!gender) return ''
    return gender.charAt(0).toUpperCase() + gender.slice(1)
  }

  if (loading) {
    return (
      <PageShell className="page-shell--catalog" title="Каталог товаров" subtitle={CATALOG_SUBTITLE}>
        <div className="loading">Загрузка...</div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell className="page-shell--catalog" title="Каталог товаров" subtitle={CATALOG_SUBTITLE}>
        <div className="error">{error}</div>
      </PageShell>
    )
  }

  return (
    <PageShell className="page-shell--catalog" title="Каталог товаров" subtitle={CATALOG_SUBTITLE}>
      <div className="catalog-filters">
        <select value={filters.brand} onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))}>
          <option value="">Все бренды</option>
          {filterOptions.brands.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
        <select value={filters.size} onChange={(e) => setFilters((prev) => ({ ...prev, size: e.target.value }))}>
          <option value="">Все размеры</option>
          {filterOptions.sizes.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <select value={filters.color} onChange={(e) => setFilters((prev) => ({ ...prev, color: e.target.value }))}>
          <option value="">Все цвета</option>
          {filterOptions.colors.map((color) => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
        <select value={filters.gender} onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}>
          <option value="">Любой пол</option>
          {filterOptions.genders.map((gender) => (
            <option key={gender} value={gender}>{formatGender(gender)}</option>
          ))}
        </select>
        <select value={filters.condition} onChange={(e) => setFilters((prev) => ({ ...prev, condition: e.target.value }))}>
          <option value="">Любое состояние</option>
          {filterOptions.conditions.map((condition) => (
            <option key={condition} value={condition}>
              {formatCondition(condition)}
            </option>
          ))}
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p>{products.length === 0 ? 'Товары пока не добавлены' : 'По фильтрам ничего не найдено'}</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
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
                            : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.images[0]}`}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = '/logo.jpg'
                      }}
                    />
                    {product.images.length > 1 && (
                      <div className="product-images-badge">
                        +{product.images.length - 1} фото
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
                  const quantityInStock = product.quantityInStock ?? product.QuantityInStock ?? 0
                  const inCart = getCartQuantity(product.id)
                  const isInMyCart = inCart > 0
                  const isReservedByAnotherUser = available <= 0 && quantityInStock > 0 && !isInMyCart
                  return (
                    <div className="product-stock" style={{
                      fontSize: '0.85rem',
                      color: (isReservedByAnotherUser || isInMyCart) ? '#dd6b20' : (available > 0 ? '#48bb78' : '#e53e3e'),
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      {isInMyCart ? '🛒 В корзине' : (isReservedByAnotherUser ? '⏳ Забронирован' : (available > 0 ? '✓ В наличии' : '❌ Нет в наличии'))}
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
                    <span className="product-gender">👤 {formatGender(product.gender)}</span>
                  )}
                  {product.condition && (
                    <span className="product-condition">✨ {formatCondition(product.condition)}</span>
                  )}
                </div>
                <div className="product-footer">
                  <div className="product-price">
                    {(product.price ?? 0).toLocaleString('ru-RU')} ₽
                  </div>
                {(() => {
                  const available = getAvailableQuantity(product)
                  const inCart = getCartQuantity(product.id)
                  const isInMyCart = inCart > 0
                  const cartUnlocked = product.cartUnlocked !== false && product.CartUnlocked !== false
                  const cartAvailableRaw = product.cartAvailableAt ?? product.CartAvailableAt
                  const cartAvailableAt = cartAvailableRaw ? new Date(cartAvailableRaw) : null
                  const cartAvailableLabel =
                    cartAvailableAt && !Number.isNaN(cartAvailableAt.getTime())
                      ? cartAvailableAt.toLocaleString('ru-RU')
                      : null
                  const canAdd = available > 0 && !isInMyCart && cartUnlocked
                  const isAdding = addingToCart.has(product.id)
                  const isJoiningQueue = joiningQueue.has(product.id)
                  const isInQueue = myQueueProductIds.has(product.id)
                  const quantityInStock = product.quantityInStock ?? product.QuantityInStock ?? 0
                  const isReservedByAnotherUser = available <= 0 && quantityInStock > 0 && !isInMyCart
                  
                  return (
                    isReservedByAnotherUser ? (
                      <button
                        className="btn-buy"
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (!isJoiningQueue && !isInQueue) {
                            await handleJoinQueue(product.id)
                          }
                        }}
                        disabled={isJoiningQueue || isInQueue}
                        title={isInQueue ? 'Вы уже стоите в очереди за этим товаром' : 'Встать в очередь за этим товаром'}
                        style={isInQueue ? { background: '#a0aec0' } : undefined}
                      >
                        {isInQueue ? 'В очереди' : (isJoiningQueue ? '...' : 'В очередь')}
                      </button>
                    ) : (
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
                          !cartUnlocked
                            ? (cartAvailableLabel
                              ? `В корзину с ${cartAvailableLabel}`
                              : 'Корзина откроется позже')
                            : !canAdd 
                            ? (isInMyCart
                              ? 'Товар уже в вашей корзине'
                              : (available <= 0 ? 'Товар закончился' : 'Достигнуто максимальное количество'))
                            : (isAdding ? 'Добавление...' : 'Добавить в корзину')
                        }
                      >
                        {isAdding 
                          ? 'Добавление...' 
                          : (!cartUnlocked
                            ? 'Скоро'
                            : (!canAdd 
                            ? (isInMyCart ? 'В корзине' : (available <= 0 ? 'Нет в наличии' : 'В корзине'))
                            : 'В корзину'))
                        }
                      </button>
                    )
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </PageShell>
  )
}

export default Home

