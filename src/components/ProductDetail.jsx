import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import './ProductDetail.css'

function ProductDetail({ product, onClose, getAvailableQuantity }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const { addToCart, cartItems } = useCart()
  
  // Используем availableQuantity из сервера (уже учитывает резервы всех пользователей)
  const getAvailable = () => {
    if (getAvailableQuantity) {
      return getAvailableQuantity(product)
    }
    return product.availableQuantity !== undefined ? product.availableQuantity : (product.quantityInStock || 0)
  }
  
  const available = getAvailable()
  
  // Получаем количество товара в корзине
  const getCartQuantity = () => {
    const cartItem = cartItems.find(item => item.productId === product.id)
    return cartItem ? cartItem.quantity : 0
  }
  
  const inCart = getCartQuantity()
  const canAdd = available > 0 && inCart < available
  
  const handleAddToCart = async () => {
    if (!canAdd || isAdding) return
    
    setIsAdding(true)
    try {
      await addToCart(product)
      onClose()
    } catch (error) {
      alert(error.message || 'Не удалось добавить товар в корзину')
      console.error('Error adding to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  if (!product) return null

  const images = product.images || []
  const apiUrl = import.meta.env.VITE_API_URL || 'http://89.104.67.36:55501'

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

  const isScheduled = publishedAt ? publishedAt.getTime() > Date.now() : false

  const getImageUrl = (imagePath) => {
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    return `${apiUrl}${imagePath}`
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
            <div className="product-detail-top">
              <div className={`publish-badge ${isScheduled ? 'scheduled' : 'published'}`}>
                {isScheduled ? 'Запланировано' : 'Опубликовано'}
                {publishedAt ? ` · ${formatDateTime(publishedAt)}` : ''}
              </div>
              <div className="product-detail-dates">
                <div className="product-detail-date-line">Создан: {formatDateTime(createdAt)}</div>
                <div className="product-detail-date-line">Обновлён: {formatDateTime(updatedAt)}</div>
              </div>
            </div>

            <h2 className="product-detail-name">{product.name}</h2>
            <div className={`product-detail-stock ${available > 0 ? 'in-stock' : 'out-of-stock'}`}>
              {available > 0 ? `В наличии: ${available} шт.` : 'Нет в наличии'}
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
                  <strong>Пол:</strong> {product.gender}
                </div>
              )}
              {product.condition && (
                <div className="product-detail-spec">
                  <strong>Состояние:</strong> {product.condition}
                </div>
              )}
            </div>
            
            <div className="product-detail-footer">
              <div className="product-detail-price">
                {(product.price ?? 0).toLocaleString('ru-RU')} ₽
              </div>
              <button
                className="btn-buy-detail"
                onClick={handleAddToCart}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail

