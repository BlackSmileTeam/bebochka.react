import { useEffect, useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { api } from '../services/api'
import { Link } from 'react-router-dom'
import ProductDetail from '../components/ProductDetail'
import './Cart.css'

function Cart() {
  const { cartItems, removeFromCart, getTotalPrice, clearCart, sessionId } = useCart()
  const [queueItems, setQueueItems] = useState([])
  const [queueLoading, setQueueLoading] = useState(false)
  const [queueCancellingId, setQueueCancellingId] = useState(null)
  const [detailProduct, setDetailProduct] = useState(null)
  const [detailLoadingId, setDetailLoadingId] = useState(null)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const getAvailableQuantity = (product) =>
    product.availableQuantity !== undefined
      ? product.availableQuantity
      : (product.quantityInStock || 0)

  const openProductDetail = async (productId) => {
    if (productId == null) return
    setDetailLoadingId(productId)
    try {
      const p = await api.getProduct(productId, sessionId)
      setDetailProduct(p)
    } catch (e) {
      alert(e?.message || 'Не удалось загрузить карточку товара')
    } finally {
      setDetailLoadingId(null)
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/logo.jpg'
    if (imagePath.startsWith('http')) return imagePath
    return `${apiUrl}${imagePath}`
  }

  const loadQueue = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setQueueItems([])
      return
    }
    try {
      setQueueLoading(true)
      const data = await api.getMyCartQueue()
      setQueueItems(data)
    } catch (e) {
      console.error('Queue load error:', e)
    } finally {
      setQueueLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [])

  const cancelQueue = async (queueItemId) => {
    try {
      setQueueCancellingId(queueItemId)
      await api.cancelMyCartQueueItem(queueItemId)
      await loadQueue()
    } catch (e) {
      alert(e.message || 'Не удалось отменить очередь')
    } finally {
      setQueueCancellingId(null)
    }
  }

  if (cartItems.length === 0 && queueItems.length === 0) {
    return (
      <div className="container">
        <div className="cart-empty">
          <h2>Корзина пуста</h2>
          <p>Добавьте товары из каталога</p>
          <Link to="/" className="btn btn-primary">
            Перейти в каталог
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="cart-header">
        <h1>Корзина</h1>
        <button className="btn-clear-cart" onClick={clearCart} title="Очистить корзину">
          Очистить
        </button>
      </div>

      <div
        className={
          cartItems.length > 0
            ? 'cart-content'
            : 'cart-content cart-content--no-summary'
        }
      >
        <div className="cart-main">
          <div className="cart-items">
            {cartItems.length > 0 ? cartItems.map((item) => (
              <div key={`cart-${item.id}`} className="cart-item">
                <button
                  type="button"
                  className="cart-item-image cart-item-image--open"
                  onClick={() => openProductDetail(item.productId)}
                  disabled={detailLoadingId === item.productId}
                  title="Открыть карточку товара"
                  aria-label={`Открыть карточку: ${item.name}`}
                >
                  <img
                    src={getImageUrl(item.images?.[0])}
                    alt=""
                    onError={(e) => {
                      e.target.src = '/logo.jpg'
                    }}
                  />
                </button>

                <div className="cart-item-info">
                  <button
                    type="button"
                    className="cart-item-name cart-item-name--open"
                    onClick={() => openProductDetail(item.productId)}
                    disabled={detailLoadingId === item.productId}
                    title="Открыть карточку товара"
                  >
                    {item.name}
                  </button>
                  {item.brand && (
                    <p className="cart-item-brand">Бренд: {item.brand}</p>
                  )}
                  {item.size && (
                    <p className="cart-item-detail">Размер: {item.size}</p>
                  )}
                  {item.color && (
                    <p className="cart-item-detail">Цвет: {item.color}</p>
                  )}
                </div>

                <div className="cart-item-price">
                  <div className="item-total-price">
                    {((item.price || 0) * (item.quantity || 1)).toLocaleString('ru-RU')} ₽
                  </div>
                </div>

                <button
                  className="cart-item-remove"
                  onClick={() => removeFromCart(item.productId || item.id)}
                  aria-label="Удалить из корзины"
                >
                  ×
                </button>
              </div>
            )) : (
              <div className="cart-empty-inline">В корзине пока нет товаров</div>
            )}
          </div>

          {queueItems.length > 0 && (
            <div className="queue-section">
              <div className="queue-section-header">
                <h2>Товары в очереди</h2>
                <button
                  type="button"
                  className="btn-queue-refresh"
                  onClick={loadQueue}
                  disabled={queueLoading}
                  title="Обновить"
                  aria-label="Обновить список очереди"
                >
                  <svg
                    className={queueLoading ? 'queue-refresh-icon queue-refresh-icon--spin' : 'queue-refresh-icon'}
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>
              <div className="queue-list">
                {queueItems.map((item) => (
                  <div key={`queue-${item.id}`} className="queue-item">
                    <button
                      type="button"
                      className="queue-item-image queue-item-image--open"
                      onClick={() => openProductDetail(item.productId)}
                      disabled={detailLoadingId === item.productId}
                      title="Открыть карточку товара"
                      aria-label={`Открыть карточку: ${item.productName}`}
                    >
                      <img
                        src={getImageUrl(item.productImages?.[0])}
                        alt=""
                        onError={(e) => { e.target.src = '/logo.jpg' }}
                      />
                    </button>
                    <div className="queue-item-info">
                      <button
                        type="button"
                        className="cart-item-name cart-item-name--open"
                        onClick={() => openProductDetail(item.productId)}
                        disabled={detailLoadingId === item.productId}
                        title="Открыть карточку товара"
                      >
                        {item.productName}
                      </button>
                      {item.productBrand && <p className="cart-item-brand">Бренд: {item.productBrand}</p>}
                      <div className="queue-item-meta">
                        {(item.productSize != null && item.productSize !== '') && (
                          <p className="cart-item-detail">Размер: {item.productSize}</p>
                        )}
                        {(item.productColor != null && item.productColor !== '') && (
                          <p className="cart-item-detail">Цвет: {item.productColor}</p>
                        )}
                        {item.productCondition && (
                          <p className="cart-item-detail">
                            Состояние: {item.productCondition === 'новая' ? 'Новая вещь' : item.productCondition}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="queue-item-price">
                      {(item.productPrice ?? 0).toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="queue-item-actions">
                      <button
                        className="btn-clear-cart"
                        onClick={() => cancelQueue(item.id)}
                        disabled={queueCancellingId === item.id}
                      >
                        {queueCancellingId === item.id ? '...' : 'Отменить очередь'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-summary">
            <h2>Итого</h2>
            <div className="summary-row">
              <span>Позиций:</span>
              <span>{cartItems.length}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Сумма:</span>
              <span>{getTotalPrice().toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="cart-summary-actions">
              <Link to="/checkout" className="btn btn-primary btn-checkout">
                Оформить заказ
              </Link>
              <Link to="/" className="btn btn-secondary">
                Продолжить покупки
              </Link>
            </div>
          </div>
        )}
      </div>

      {detailProduct && (
        <ProductDetail
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          getAvailableQuantity={getAvailableQuantity}
        />
      )}
    </div>
  )
}

export default Cart

