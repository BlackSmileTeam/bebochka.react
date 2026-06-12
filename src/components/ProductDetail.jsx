import { useState, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import { api } from '../services/api'
import { toAbsoluteMediaUrl } from '../utils/mediaUrl'
import { readFavoriteProductIds, toggleFavoriteProductId } from '../utils/favoritesStorage'
import CartCountdown, { useCartCountdown } from './CartCountdown'
import { CartButtonIcon } from './CatalogBuyButton'
import ProductImage from './ProductImage'
import ProductPriceDisplay from './ProductPriceDisplay'
import ProductMetaFilter from './ProductMetaFilter'
import Toast from './Toast'
import ProductKitCartControl from './ProductKitCartControl'
import ImageLightbox from './ImageLightbox'
import { isKitProduct, formatKitPartPrice } from '../utils/productKit'
import { getSessionId } from '../utils/sessionId'
import './ProductDetail.css'

function ProductDetail({
  product,
  onClose,
  getAvailableQuantity,
  onFilterSelect,
  onAddedToCart,
  variant = 'modal',
}) {
  const isPageLayout = variant === 'page'
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [queueLoading, setQueueLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [favoriteProductIds, setFavoriteProductIds] = useState(() => new Set(readFavoriteProductIds()))
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
  const kit = isKitProduct(product)
  const [kitParts, setKitParts] = useState(() => product.kitParts ?? product.KitParts ?? [])

  useEffect(() => {
    if (!kit) {
      setKitParts([])
      return undefined
    }
    const fromProduct = product.kitParts ?? product.KitParts
    if (Array.isArray(fromProduct) && fromProduct.length > 0) {
      setKitParts(fromProduct)
      return undefined
    }
    let active = true
    api.getProductKitOptions(productId, getSessionId())
      .then((data) => {
        if (active && data?.parts) setKitParts(data.parts)
      })
      .catch(() => {
        if (active) setKitParts([])
      })
    return () => { active = false }
  }, [kit, productId, product.kitParts, product.KitParts])

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
  const cartUnlockedApi = product.cartUnlocked !== false && product.CartUnlocked !== false
  const cartAvailableRaw = product.cartAvailableAt ?? product.CartAvailableAt
  const { isExpired } = useCartCountdown(cartAvailableRaw)
  const cartUnlocked = cartUnlockedApi || isExpired
  const canAdd = available > 0 && !isInMyCart && cartUnlocked

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
      if (onAddedToCart) onAddedToCart()
      else onClose()
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Не удалось добавить товар в корзину' })
      console.error('Error adding to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleFavorite = (event) => {
    event.stopPropagation()
    if (!productId) return

    if (!authToken) {
      const { ids, isFavorite } = toggleFavoriteProductId(productId)
      setFavoriteProductIds(new Set(ids))
      setToast({
        type: 'success',
        message: isFavorite ? 'Товар добавлен в избранное' : 'Товар убран из избранного'
      })
      return
    }

    const isFavoriteNow = favoriteProductIds.has(productId)
    ;(async () => {
      try {
        if (isFavoriteNow) {
          await api.removeProductFromFavorites(productId)
          setFavoriteProductIds((prev) => {
            const next = new Set(prev)
            next.delete(productId)
            return next
          })
          setToast({ type: 'success', message: 'Товар убран из избранного' })
        } else {
          await api.addProductToFavorites(productId)
          setFavoriteProductIds((prev) => new Set([...prev, productId]))
          setToast({ type: 'success', message: 'Товар добавлен в избранное' })
        }
      } catch (error) {
        setToast({ type: 'error', message: error.message || 'Не удалось обновить избранное' })
      }
    })()
  }

  useEffect(() => {
    if (!authToken) {
      setFavoriteProductIds(new Set(readFavoriteProductIds()))
      return
    }
    ;(async () => {
      try {
        const ids = await api.getMyFavoriteProductIds()
        setFavoriteProductIds(new Set(ids))
      } catch {
        setFavoriteProductIds(new Set())
      }
    })()
  }, [authToken])

  const isFavorite = favoriteProductIds.has(productId)

  if (!product) return null

  const images = product.images || []

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

  const handleFilterSelect = (field, value) => {
    if (!onFilterSelect) return
    onFilterSelect(field, value)
    onClose()
  }

  const isScheduled = publishedAt ? publishedAt.getTime() > Date.now() : false

  let stockClass = 'available'
  let stockLabel = '✓ В наличии'
  if (isInMyCart) {
    stockClass = 'cart'
    stockLabel = '🛒 В корзине'
  } else if (isReservedByAnotherUser) {
    stockClass = 'reserved'
    stockLabel = '⏳ Забронирован'
  } else if (available <= 0) {
    stockClass = 'out'
    stockLabel = '❌ Нет в наличии'
  }

  const showPrimaryCartButton =
    !cartUnlocked ||
    isInMyCart ||
    isReservedByAnotherUser ||
    canAdd ||
    isAdding

  const getImageUrl = (imagePath) => {
    return toAbsoluteMediaUrl(imagePath) || '/logo.jpg'
  }

  const openOriginalImage = () => {
    if (!images.length) return
    setLightboxSrc(getImageUrl(images[currentImageIndex]))
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const panel = (
    <div
      className={`product-detail-modal${isPageLayout ? ' product-detail-modal--page' : ''}`}
      onClick={isPageLayout ? undefined : (e) => e.stopPropagation()}
    >
      {!isPageLayout ? (
        <button type="button" className="product-detail-close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      ) : null}

      <div className="product-detail-content">
          {/* Галерея изображений */}
          {images.length > 0 ? (
            <div className="product-detail-gallery">
              <div className="product-detail-main-image">
                <button
                  type="button"
                  className={`product-detail-favorite-btn${isFavorite ? ' product-detail-favorite-btn--active' : ''}`}
                  onClick={handleToggleFavorite}
                  aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                  title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                >
                  {isFavorite ? '♥' : '♡'}
                </button>
                {images.length > 1 && (
                  <button 
                    className="gallery-nav gallery-nav-prev" 
                    onClick={prevImage}
                    aria-label="Предыдущее фото"
                  >
                    ‹
                  </button>
                )}
                <ProductImage
                  src={getImageUrl(images[currentImageIndex])}
                  alt={`${product.name} — фото ${currentImageIndex + 1}`}
                  className="product-detail-image"
                  priority
                  title="Открыть фото"
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
                    <ProductImage
                      key={index}
                      src={getImageUrl(image)}
                      alt={`${product.name} — миниатюра ${index + 1}`}
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
              <button
                type="button"
                className={`product-detail-favorite-btn${isFavorite ? ' product-detail-favorite-btn--active' : ''}`}
                onClick={handleToggleFavorite}
                aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
              >
                {isFavorite ? '♥' : '♡'}
              </button>
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

            <div className="product-detail-title-row">
              {isPageLayout ? (
                <h1 className="product-detail-name">{product.name}</h1>
              ) : (
                <h2 className="product-detail-name">{product.name}</h2>
              )}
              <span className={`product-detail-stock-badge product-detail-stock-badge--${stockClass}`}>
                {stockLabel}
              </span>
            </div>

            {product.brand && String(product.brand).trim() !== '' && String(product.brand).trim() !== '-' && (
              <ProductMetaFilter
                field="brand"
                value={product.brand}
                onFilter={onFilterSelect ? handleFilterSelect : undefined}
                className="product-detail-brand-line product-meta-brand"
              />
            )}
            
            {product.description && (
              <p className="product-detail-description">{product.description}</p>
            )}
            
            <div className="product-detail-specs">
              <ProductMetaFilter
                field="size"
                value={product.size}
                onFilter={onFilterSelect ? handleFilterSelect : undefined}
              />
              <ProductMetaFilter
                field="color"
                value={product.color}
                onFilter={onFilterSelect ? handleFilterSelect : undefined}
              />
              <ProductMetaFilter
                field="gender"
                value={product.gender}
                onFilter={onFilterSelect ? handleFilterSelect : undefined}
              />
              <ProductMetaFilter
                field="condition"
                value={product.condition}
                onFilter={onFilterSelect ? handleFilterSelect : undefined}
              />
            </div>

            {kit && kitParts.length > 0 && (
              <div className="product-detail-kit">
                <h3 className="product-detail-kit__title">Состав комплекта</h3>
                <ul className="product-detail-kit__list">
                  {kitParts.map((part) => {
                    const partId = part.productId ?? part.ProductId ?? part.id ?? part.Id
                    const partName = part.partName ?? part.PartName ?? part.name ?? part.Name ?? '—'
                    const partPrice = part.price ?? part.Price
                    return (
                      <li key={partId ?? partName} className="product-detail-kit__item">
                        <span className="product-detail-kit__name">{partName}</span>
                        <span className="product-detail-kit__price">{formatKitPartPrice(partPrice)}</span>
                      </li>
                    )
                  })}
                </ul>
                {(product.kitPrice ?? product.KitPrice ?? product.price) != null && (
                  <p className="product-detail-kit__bundle-price">
                    Цена за комплект: {formatKitPartPrice(product.kitPrice ?? product.KitPrice ?? product.price)}
                  </p>
                )}
              </div>
            )}

            {isAdminUser && (
              <div className="product-detail-dates product-detail-dates--below">
                {product.boxNumber && (
                  <div className="product-detail-date-line product-detail-date-line--left">
                    Номер коробки: {product.boxNumber}
                  </div>
                )}
                {product.owner && (
                  <div className="product-detail-date-line product-detail-date-line--left">
                    Владелец: {product.owner}
                  </div>
                )}
                {product.incomingShipmentName && (
                  <div className="product-detail-date-line product-detail-date-line--left">
                    Посылка: {product.incomingShipmentName}
                  </div>
                )}
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
                <ProductPriceDisplay product={product} className="product-detail-price-display" />
              </div>
              {showPrimaryCartButton && kit && (
                <ProductKitCartControl
                  product={product}
                  cartItems={cartItems}
                  cartUnlocked={cartUnlocked}
                  cartAvailableRaw={cartAvailableRaw}
                  onAddedToCart={onAddedToCart}
                  onClose={onClose}
                />
              )}
              {showPrimaryCartButton && !kit && (
                <button
                  className={`btn-buy-detail${!cartUnlocked ? ' btn-buy--locked' : ''}`}
                  onClick={handleAddToCart}
                  disabled={!canAdd || isAdding}
                  title={
                    !cartUnlocked
                      ? (cartAvailableAt && !Number.isNaN(cartAvailableAt.getTime())
                        ? `В корзину с ${cartAvailableAt.toLocaleString('ru-RU')}`
                        : 'Корзина откроется позже')
                      : !canAdd
                        ? (isInMyCart
                          ? 'Товар уже в вашей корзине'
                          : (isReservedByAnotherUser ? 'Товар зарезервирован другим пользователем' : 'Добавить в корзину'))
                        : (isAdding ? 'Добавление...' : 'Добавить в корзину')
                  }
                >
                  {isAdding
                    ? 'Добавление...'
                    : (!cartUnlocked
                      ? <CartCountdown cartAvailableRaw={cartAvailableRaw} />
                      : (!canAdd
                        ? (isInMyCart ? 'В корзине' : 'Забронирован')
                        : (
                          <>
                            <CartButtonIcon />
                            В корзину
                          </>
                        )))
                  }
                </button>
              )}
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <ImageLightbox
        src={lightboxSrc}
        alt={`${product.name} — фото ${currentImageIndex + 1}`}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  )

  if (isPageLayout) {
    return (
      <div className="product-detail-page">
        {panel}
      </div>
    )
  }

  return (
    <div className="product-detail-overlay" onClick={onClose}>
      {panel}
    </div>
  )
}

export default ProductDetail

