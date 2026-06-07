import { useEffect, useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { api } from '../services/api'
import { Link, useNavigate } from 'react-router-dom'
import ProductDetail from '../components/ProductDetail'
import PageShell from '../components/PageShell'
import CartReservationTimer from '../components/CartReservationTimer'
import { buildCatalogFilterSearch } from '../utils/catalogFilters'
import CartReferralDiscountPanel, { ReferralDiscountTotals } from '../components/CartReferralDiscount'
import { getReferralDiscountSelection } from '../utils/referralDiscountStorage'
import { mergeCartReferralOptions, resolveReferralSelection } from '../utils/referralCartDiscount'
import { getApiPublicOrigin } from '../utils/apiBase'
import './Cart.css'
import '../components/CartReferralDiscount.css'

function Cart() {
  const navigate = useNavigate()
  const { cartItems, removeFromCart, getTotalPrice, clearCart, sessionId } = useCart()
  const [queueItems, setQueueItems] = useState([])
  const [queueLoading, setQueueLoading] = useState(false)
  const [queueCancellingId, setQueueCancellingId] = useState(null)
  const [detailProduct, setDetailProduct] = useState(null)
  const [detailLoadingId, setDetailLoadingId] = useState(null)
  const [referralOptions, setReferralOptions] = useState([])
  const [referralOptionsLoading, setReferralOptionsLoading] = useState(false)
  const [referralLoadError, setReferralLoadError] = useState(null)
  const [referralProfile, setReferralProfile] = useState(null)
  const [referralSelection, setReferralSelection] = useState(() => getReferralDiscountSelection())
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('authToken'))
  const apiUrl = getApiPublicOrigin()

  const getAvailableQuantity = (product) =>
    product.availableQuantity !== undefined
      ? product.availableQuantity
      : (product.quantityInStock || 0)

  const goToCatalogFilter = (key, value) => {
    navigate(buildCatalogFilterSearch({ [key]: key === 'size' ? [value] : value }))
    setDetailProduct(null)
  }

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

  const loadReferralDiscountOptions = async () => {
    const token = localStorage.getItem('authToken')
    setIsLoggedIn(!!token)
    if (!token || cartItems.length === 0) {
      setReferralOptions([])
      setReferralLoadError(null)
      setReferralOptionsLoading(false)
      return
    }
    setReferralOptionsLoading(true)
    setReferralLoadError(null)
    try {
      const profile = await api.getMyReferralInfo()
      setReferralProfile(profile)
      let apiOpts = profile?.cartDiscountOptions ?? []
      if (!apiOpts.length) {
        try {
          apiOpts = await api.getCartReferralDiscounts()
        } catch (optsErr) {
          const status = optsErr?.response?.status
          if (status !== 404 && status !== 405) {
            setReferralLoadError(optsErr?.message || 'Не удалось загрузить реферальные скидки')
          }
        }
      }
      const merged = mergeCartReferralOptions(apiOpts, profile)
      setReferralOptions(merged)
      setReferralSelection(resolveReferralSelection(merged, profile))
    } catch (e) {
      setReferralProfile(null)
      setReferralOptions([])
      setReferralLoadError(e?.message || 'Не удалось загрузить реферальные скидки')
    } finally {
      setReferralOptionsLoading(false)
    }
  }

  useEffect(() => {
    loadReferralDiscountOptions()
  }, [cartItems.length])

  useEffect(() => {
    const onAuth = () => {
      setIsLoggedIn(!!localStorage.getItem('authToken'))
      loadReferralDiscountOptions()
    }
    window.addEventListener('bebochka-auth', onAuth)
    return () => window.removeEventListener('bebochka-auth', onAuth)
  }, [cartItems.length])

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
      <PageShell title="Корзина">
        <div className="cart-empty">
          <h2>Корзина пуста</h2>
          <p>Добавьте товары из каталога</p>
          <Link to="/" className="btn btn-primary">
            Перейти в каталог
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      className="page-shell--cart"
      title={(
        <>
          <span className="cart-page-title">Корзина</span>
          {cartItems.length > 0 && (
            <button
              type="button"
              className="btn-clear-cart cart-page-clear"
              onClick={clearCart}
              title="Очистить корзину"
            >
              Очистить
            </button>
          )}
        </>
      )}
    >
      <div
        className={
          cartItems.length > 0
            ? 'cart-content'
            : 'cart-content cart-content--no-summary'
        }
      >
        <div className="cart-main">
          <div className="cart-retention-note">
            Товары в корзине и в очереди хранятся до 24 часов. Если за это время не поступила оплата, бронь снимается автоматически.
          </div>
          <div className="cart-items">
            {cartItems.length > 0 ? cartItems.map((item) => {
              const isKitBundle = item.isKitDisplayLine || item.cartAddMode === 'bundle'
              const detailProductId = item.kitDisplayProductId ?? item.productId ?? item.id
              return (
              <div key={`cart-${item.cartItemId ?? item.productId}`} className="cart-item">
                <button
                  type="button"
                  className="cart-item-image cart-item-image--open"
                  onClick={() => openProductDetail(detailProductId)}
                  disabled={detailLoadingId === detailProductId}
                  title="Открыть карточку товара"
                  aria-label={`Открыть карточку: ${item.name}`}
                >
                  <img
                    src={getImageUrl(item.images?.[0])}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.src = '/logo.jpg'
                    }}
                  />
                </button>

                <div className="cart-item-info">
                  <button
                    type="button"
                    className="cart-item-name cart-item-name--open"
                    onClick={() => openProductDetail(detailProductId)}
                    disabled={detailLoadingId === detailProductId}
                    title="Открыть карточку товара"
                  >
                    {item.name}
                  </button>
                  {isKitBundle ? (
                    <p className="cart-item-detail cart-item-detail--kit">Комплект</p>
                  ) : item.kitPartName ? (
                    <p className="cart-item-detail cart-item-detail--kit-part">
                      Из комплекта · {item.kitPartName}
                    </p>
                  ) : null}
                  {item.brand && (
                    <p className="cart-item-brand">Бренд: {item.brand}</p>
                  )}
                  {!isKitBundle && item.size && (
                    <p className="cart-item-detail">Размер: {item.size}</p>
                  )}
                  {!isKitBundle && item.color && (
                    <p className="cart-item-detail">Цвет: {item.color}</p>
                  )}
                </div>

                <div className="cart-item-price">
                  <ReferralDiscountTotals
                    total={(item.price || 0) * (item.quantity || 1)}
                    selection={referralSelection}
                    className="cart-item-price-totals"
                  />
                </div>

                <button
                  className="cart-item-remove"
                  onClick={() => removeFromCart(item.productId || item.id)}
                  aria-label="Удалить из корзины"
                >
                  ×
                </button>
              </div>
            )}) : (
              <div className="cart-empty-inline">В корзине пока нет товаров</div>
            )}
          </div>

          {queueItems.length > 0 && (
            <div className="queue-section">
              <div className="queue-section-header">
                <h2>Товары в очереди</h2>
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
                        alt={item.productName || 'Товар в очереди'}
                        loading="lazy"
                        decoding="async"
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
            <div className="summary-row summary-row--positions">
              <span>Позиций:</span>
              <span>{cartItems.length}</span>
            </div>
            <CartReferralDiscountPanel
              options={referralOptions}
              loading={referralOptionsLoading}
              loadError={referralLoadError}
              isAuthenticated={isLoggedIn}
              referredBy={referralProfile?.referredBy}
              referredDiscountAvailable={referralProfile?.referredDiscountAvailable}
              hasPriorOrders={referralProfile?.hasPriorOrders}
              total={getTotalPrice()}
              selection={referralSelection}
              onSelectionChange={setReferralSelection}
            />
            <div className="summary-row summary-total">
              <span>Сумма:</span>
              <ReferralDiscountTotals
                total={getTotalPrice()}
                selection={referralSelection}
              />
            </div>
            <div className="cart-summary-actions">
              <CartReservationTimer cartItems={cartItems} compact />
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
          onFilterSelect={goToCatalogFilter}
        />
      )}
    </PageShell>
  )
}

export default Cart

