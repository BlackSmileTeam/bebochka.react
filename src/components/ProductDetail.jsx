import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { api } from '../services/api'
import { formatCondition } from '../utils/formatCondition'
import Toast from './Toast'
import './ProductDetail.css'

function ProductDetail({ product, onClose, getAvailableQuantity }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const [queueLoading, setQueueLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const { addToCart, cartItems } = useCart()
  const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null
  let user = {}
  if (typeof localStorage !== 'undefined') {
    try {
      user = JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      user = {}
    }
  }
  const isAdminUser = !!user?.isAdmin
  
  // Используем availableQuantity из сервера (уже учитывает резервы всех пользователей)
  const getAvailable = () => {
    if (getAvailableQuantity) {
      return getAvailableQuantity(product)
    }
    return product.availableQuantity !== undefined ? product.availableQuantity : (product.quantityInStock || 0)
  }
  
  const available = getAvailable()
  
  const productId = product.id ?? product.Id ?? product.productId ?? product.ProductId

  // Получаем количество товара в корзине
  const getCartQuantity = () => {
    const cartItem = cartItems.find((item) => {
      const itemProductId = item.productId ?? item.ProductId ?? item.id ?? item.Id
      return String(itemProductId) === String(productId)
    })
    return cartItem ? cartItem.quantity : 0
  }
  
  const inCart = getCartQuantity()
  const quantityInStock = product.quantityInStock ?? product.QuantityInStock ?? 0
  const isInMyCart = inCart > 0
  const isReservedByAnotherUser = available <= 0 && quantityInStock > 0 && !isInMyCart
  const isReserved = isReservedByAnotherUser || isInMyCart
  const cartUnlocked = product.cartUnlocked !== false && product.CartUnlocked !== false
  const canAdd = available > 0 && !isInMyCart && cartUnlocked

  const cartAvailableRaw = product.cartAvailableAt ?? product.CartAvailableAt
  const cartAvailableAt = cartAvailableRaw ? new Date(cartAvailableRaw) : null

  const handleJoinQueue = async () => {
    if (!authToken) {
      setToast({ type: 'warning', message: 'Войдите в аккаунт, чтобы встать в очередь' })
      return
    }
    setQueueLoading(true)
    try {
      await api.joinCartQueue(productId)
      setToast({ type: 'success', message: 'Вы в очереди: когда товар освободится, он попадет в вашу корзину.' })
    } catch (e) {
      setToast({ type: 'error', message: e.message || 'Не удалось добавить в очередь' })
    } finally {
      setQueueLoading(false)
    }
  }
  
  const handleAddToCart = async () => {
    if (!canAdd || isAdding) return
    
    setIsAdding(true)
    try {
      await addToCart(product)
      onClose()
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Не удалось добавить товар в корзину' })
      console.error('Error adding to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  if (!product) return null

  const images = product.images || []
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const publishedAtRaw = product.publishedAt ?? product.PublishedAt
  const createdAtRaw = product.createdAt ?? product.CreatedAt
  const updatedAtRaw = product.updatedAt ?? product.UpdatedAt

  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : null
  const createdAt = createdAtRaw ? new Date(createdAtRaw) : null
  const updatedAt = updatedAtRaw ? new Date(updatedAtRaw) : null

  const formatDateTime = (d) =>
    d instanceof Date && !Number.isNaN(d.getTime())
      ? d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
      : '—'

  const formatGender = (gender) => {
    if (!gender) return ''
    return gender.charAt(0).toUpperCase() + gender.slice(1)
  }

  const isScheduled = publishedAt ? publishedAt.getTime() > Date.now() : false

  const getImageUrl = (imagePath) => {
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    return `${apiUrl}${imagePath}`
  }

  const openOriginalImage = () => {
    if (!images.length) return
    const imageUrl = getImageUrl(images[currentImageIndex])
    window.open(imageUrl, '_blank', 'noopener,noreferrer')
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="product-detail-overlay" onClick={onClose}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="product-detail-close" onClick={onClose}>×</button>
        
        <div className="product-detail-content">
          {/* Галерея изображений */}
          {images.length > 0 ? (
            <div className="product-detail-gallery">
              <div className="product-detail-main-image">
                {images.length > 1 && (
                  <button 
                    className="gallery-nav gallery-nav-prev" 
                    onClick={prevImage}
                    aria-label="Предыдущее фото"
                  >
                    ‹
                  </button>
                )}
                <img
                  src={getImageUrl(images[currentImageIndex])}
                  alt={`${product.name} - фото ${currentImageIndex + 1}`}
                  className="product-detail-image"
                  title="Открыть оригинал"
                  onClick={openOriginalImage}
                  onError={(e) => {
                    e.target.src = '/logo.jpg'
                  }}
                />
                {images.length > 1 && (
                  <button 
                    className="gallery-nav gallery-nav-next" 
                    onClick={nextImage}
                    aria-label="Следующее фото"
                  >
                    ›
                  </button>
                )}
                {images.length > 1 && (
                  <div className="gallery-counter">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
              
              {/* Миниатюры */}
              {images.length > 1 && (
                <div className="product-detail-thumbnails">
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={getImageUrl(image)}
                      alt={`${product.name} - миниатюра ${index + 1}`}
                      className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                      onError={(e) => {
                        e.target.src = '/logo.jpg'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="product-detail-no-image">
              <span>Нет фотографий</span>
            </div>
          )}

          {/* Информация о товаре */}
          <div className="product-detail-info">
            {isAdminUser && (
              <>
                <div className="product-detail-top">
                  <div className={`publish-badge ${isScheduled ? 'scheduled' : 'published'}`}>
                    {isScheduled ? 'Запланировано' : 'Опубликовано'}
                    {publishedAt ? ` · ${formatDateTime(publishedAt)}` : ''}
                  </div>
                </div>
              </>
            )}

            <h2 className="product-detail-name">{product.name}</h2>
            <div className={`product-detail-stock ${isReserved ? 'reserved' : (available > 0 ? 'in-stock' : 'out-of-stock')}`}>
              {isInMyCart ? 'В корзине' : (isReservedByAnotherUser ? 'Забронирован' : (available > 0 ? 'В наличии' : 'Нет в наличии'))}
            </div>
            
            {product.brand && (
              <p className="product-detail-brand">
                <strong>Бренд:</strong> {product.brand}
              </p>
            )}
            
            {product.description && (
              <p className="product-detail-description">{product.description}</p>
            )}
            
            <div className="product-detail-specs">
              {product.size && (
                <div className="product-detail-spec">
                  <strong>Размер:</strong> {product.size}
                </div>
              )}
              {product.color && (
                <div className="product-detail-spec">
                  <strong>Цвет:</strong> {product.color}
                </div>
              )}
              {product.gender && (
                <div className="product-detail-spec">
                  <strong>Пол:</strong> {formatGender(product.gender)}
                </div>
              )}
              {product.condition && (
                <div className="product-detail-spec">
                  <strong>Состояние:</strong> {formatCondition(product.condition)}
                </div>
              )}
            </div>

            {isAdminUser && (
              <div className="product-detail-dates product-detail-dates--below">
                <div className="product-detail-date-line product-detail-date-line--left">
                  Номер коробки: {product.boxNumber || '—'} · Посылка: {product.incomingShipmentName || '—'}
                </div>
                <div className="product-detail-date-line product-detail-date-line--left">
                  Создан: {formatDateTime(createdAt)}
                </div>
                <div className="product-detail-date-line product-detail-date-line--left">
                  Обновлён: {formatDateTime(updatedAt)}
                </div>
              </div>
            )}
            
            <div className="product-detail-footer">
              <div className="product-detail-price">
                <span className="product-detail-price-value">{(product.price ?? 0).toLocaleString('ru-RU')}</span>
                <span className="product-detail-price-currency">&nbsp;₽</span>
              </div>
              {!cartUnlocked && cartAvailableAt && !Number.isNaN(cartAvailableAt.getTime()) && (
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 8 }}>
                  «В корзину» с {cartAvailableAt.toLocaleString('ru-RU')}
                </p>
              )}
              <button
                className="btn-buy-detail"
                onClick={handleAddToCart}
                disabled={!canAdd || isAdding}
                title={
                  !cartUnlocked
                    ? 'Корзина откроется позже'
                    : !canAdd 
                    ? (isInMyCart
                      ? 'Товар уже в вашей корзине'
                      : (isReservedByAnotherUser ? 'Товар зарезервирован другим пользователем' : 'Товар закончился'))
                    : (isAdding ? 'Добавление...' : 'Добавить в корзину')
                }
              >
                {isAdding 
                  ? 'Добавление...' 
                  : (!cartUnlocked
                    ? 'Скоро в продаже'
                    : (!canAdd 
                    ? (isInMyCart ? 'В корзине' : (isReservedByAnotherUser ? 'Забронирован' : 'Нет в наличии'))
                    : 'В корзину'))
                }
              </button>
              {cartUnlocked && isReservedByAnotherUser && !isInMyCart && (
                <button
                  type="button"
                  className="btn-buy-detail"
                  style={{ marginTop: 8, background: '#4a5568' }}
                  onClick={handleJoinQueue}
                  disabled={queueLoading}
                >
                  {queueLoading ? '…' : 'В очередь'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default ProductDetail

