import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { getOrderStatusColor } from '../constants/orderStatusColors'
import { useCart } from '../contexts/CartContext'
import ProductDetail from '../components/ProductDetail'
import PageShell from '../components/PageShell'
import { buildTelegramPaymentHref, buildVkPaymentHref } from '../utils/paymentMessengerLinks'
import './Profile.css'

/** Реквизиты оплаты: модалка «К оплате». Авито: VITE_PAYMENT_AVITO_URL или запасная ссылка на сайт. */
const PAYMENT_TELEGRAM_URL = 'https://t.me/mamka_vseya_russi'
const PAYMENT_VK_URL = 'https://vk.com/i7911729911'
const PAYMENT_AVITO_PROFILE_URL = (import.meta.env.VITE_PAYMENT_AVITO_URL || '').trim()
/** Пока нет ссылки на профиль — ведёт на главную Авито (всё строка кликабельна). Задайте VITE_PAYMENT_AVITO_URL для своего профиля. */
const PAYMENT_AVITO_FALLBACK_URL = 'https://www.avito.ru/'
const payAvitoHref = PAYMENT_AVITO_PROFILE_URL || PAYMENT_AVITO_FALLBACK_URL

function getOrderItems(o) {
  return o.orderItems || o.OrderItems || []
}

function getStatusHistory(o) {
  const h = o.statusHistory || o.StatusHistory
  return Array.isArray(h) ? h : []
}

function Profile() {
  const { sessionId } = useCart()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailProduct, setDetailProduct] = useState(null)
  const [detailLoadingId, setDetailLoadingId] = useState(null)
  const [receiveFormOrderId, setReceiveFormOrderId] = useState(null)
  const [formRating, setFormRating] = useState('')
  const [formComment, setFormComment] = useState('')
  const [markSubmittingId, setMarkSubmittingId] = useState(null)
  const [thankYouByOrderId, setThankYouByOrderId] = useState({})
  const [expandedItemsOrderIds, setExpandedItemsOrderIds] = useState(new Set())
  const [expandedHistoryOrderIds, setExpandedHistoryOrderIds] = useState(new Set())
  const [paymentHintOrderId, setPaymentHintOrderId] = useState(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const loadOrders = async () => {
    const data = await api.getMyOrders()
    setOrders(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await loadOrders()
      } catch (e) {
        if (!cancelled) setError(e.message || 'Не удалось загрузить заказы')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/logo.jpg'
    if (imagePath.startsWith('http')) return imagePath
    return `${apiUrl}${imagePath}`
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

  const startReceiveFlow = (orderId) => {
    setReceiveFormOrderId(orderId)
    setFormRating('')
    setFormComment('')
  }

  const cancelReceiveFlow = () => {
    setReceiveFormOrderId(null)
    setFormRating('')
    setFormComment('')
  }

  const toggleOrderItems = (orderId) => {
    setExpandedItemsOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const toggleStatusHistory = (orderId) => {
    setExpandedHistoryOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const submitMarkReceived = async (orderId) => {
    const hadFeedback =
      (formRating !== '' && formRating != null) ||
      (formComment && String(formComment).trim().length > 0)
    try {
      setMarkSubmittingId(orderId)
      const updated = await api.markMyOrderReceived(orderId, {
        rating: formRating === '' ? null : formRating,
        comment: formComment
      })
      setOrders((prev) =>
        prev.map((row) => {
          const id = row.id ?? row.Id
          const newId = updated?.id ?? updated?.Id
          if (id === orderId && newId != null) return { ...row, ...updated }
          return row
        })
      )
      cancelReceiveFlow()
      setThankYouByOrderId((prev) => ({
        ...prev,
        [orderId]: { hadFeedback }
      }))
    } catch (e) {
      alert(e?.message || 'Не удалось подтвердить получение')
    } finally {
      setMarkSubmittingId(null)
    }
  }

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()
  const visibleName = (() => {
    const fullName = (user.fullName || '').trim()
    if (fullName) return fullName
    const username = (user.username || '').trim()
    if (username && !username.startsWith('u_')) return username
    return 'Пользователь'
  })()
  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('bebochka-auth'))
    window.location.href = '/'
  }

  const profileSubtitle = `${visibleName}${user.email ? ` · ${user.email}` : ''}`

  const paymentHintOrder =
    paymentHintOrderId == null
      ? null
      : orders.find((row) => (row.id ?? row.Id) === paymentHintOrderId)
  const paymentHintOrderNumber =
    paymentHintOrder != null
      ? (paymentHintOrder.orderNumber ?? paymentHintOrder.OrderNumber ?? String(paymentHintOrderId))
      : ''

  const paymentContactOrderLabel =
    String(paymentHintOrderNumber || '').trim() ||
    (paymentHintOrderId != null ? String(paymentHintOrderId) : '')
  const paymentTelegramHrefWithDraft =
    paymentHintOrderId != null
      ? buildTelegramPaymentHref(PAYMENT_TELEGRAM_URL, paymentContactOrderLabel)
      : PAYMENT_TELEGRAM_URL
  const paymentVkHrefWithDraft =
    paymentHintOrderId != null
      ? buildVkPaymentHref(PAYMENT_VK_URL, paymentContactOrderLabel)
      : PAYMENT_VK_URL

  const copyPaymentOrderNumber = async () => {
    const text = String(paymentHintOrderNumber || '').trim()
    if (!text) return
    const notify = (type, message) => {
      window.dispatchEvent(new CustomEvent('bebochka-toast', { detail: { type, message } }))
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      notify('success', 'Номер заказа скопирован')
    } catch {
      notify('error', 'Не удалось скопировать номер')
    }
  }

  return (
    <>
      <PageShell className="page-shell--catalog" title="Профиль" subtitle={profileSubtitle}>
        <h2 className="profile-section-title">История заказов</h2>
        {loading && <p>Загрузка…</p>}
        {error && <p className="profile-error">{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <p>Пока нет заказов.</p>
        )}
        {!loading && orders.length > 0 && (
          <ul className="profile-orders">
            {orders.map((o) => {
              const oid = o.id ?? o.Id
              const statusText = (o.status || o.Status || '').trim() || '—'
              const items = getOrderItems(o)
              const history = getStatusHistory(o)
              const totalAmount = Number(o.totalAmount ?? o.TotalAmount ?? 0)
              const finalAmount = Number(o.finalAmount ?? o.FinalAmount ?? totalAmount)
              const hasDiscount = finalAmount < totalAmount
              const thank = thankYouByOrderId[oid]
              const hasReviewFlag = !!(o.hasCustomerReview ?? o.HasCustomerReview)
              const showReceiveBtn = statusText === 'Отправлен' && receiveFormOrderId !== oid
              const isItemsExpanded = expandedItemsOrderIds.has(oid)
              const isHistoryExpanded = expandedHistoryOrderIds.has(oid)
              const statusColor = getOrderStatusColor(statusText)
              const showPaymentHintBtn = statusText === 'Ожидает оплату'
              return (
                <li key={oid} className="profile-order-card">
                  <div className="profile-order-head">
                    <strong>{o.orderNumber || o.OrderNumber}</strong>
                    <span
                      className="profile-order-status-badge"
                      style={{ borderColor: statusColor, color: statusColor }}
                    >
                      {statusText}
                    </span>
                  </div>
                  <div className="profile-order-meta">
                    {(o.createdAt || o.CreatedAt) && new Date(o.createdAt || o.CreatedAt).toLocaleString('ru-RU')}
                    {' · '}
                    <span className="profile-order-amount">
                      <span className="profile-order-amount-current">
                        {finalAmount.toLocaleString('ru-RU')}
                        {'\u00a0'}
                        {'\u20bd'}
                      </span>
                      {hasDiscount && (
                        <span className="profile-order-amount-old">
                          {totalAmount.toLocaleString('ru-RU')}
                          {'\u00a0'}
                          {'\u20bd'}
                        </span>
                      )}
                    </span>
                  </div>

                  {thank && (
                    <div className="profile-thank-you" role="status">
                      <p>Заказ отмечен как получен. Спасибо!</p>
                      {thank.hadFeedback && (
                        <p className="profile-thank-you-review">
                          Благодарим за оставленный отзыв — он помогает нам делать сервис лучше.
                        </p>
                      )}
                    </div>
                  )}

                  {statusText === 'Получен' && hasReviewFlag && !thank && (
                    <p className="profile-review-note">Спасибо за ваш отзыв по этому заказу.</p>
                  )}

                  {history.length > 0 && (
                    <div className="profile-status-history">
                      <button
                        type="button"
                        className="profile-status-history-toggle"
                        onClick={() => toggleStatusHistory(oid)}
                        aria-expanded={isHistoryExpanded}
                      >
                        {isHistoryExpanded
                          ? '▼ Скрыть историю статусов'
                          : `▶ История статусов (${history.length})`}
                      </button>
                      {isHistoryExpanded && (
                        <ul className="profile-status-history-list">
                          {history.map((row, idx) => {
                            const st = row.status || row.Status || '—'
                            const at = row.changedAtUtc || row.ChangedAtUtc
                            const label = at ? new Date(at).toLocaleString('ru-RU') : '—'
                            return (
                              <li key={`${oid}-h-${idx}`}>
                                <span className="profile-sh-status">{st}</span>
                                <span className="profile-sh-meta">{label}</span>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}

                  {items.length > 0 && (
                    <div className="profile-order-items">
                      <button
                        type="button"
                        className="profile-order-items-toggle"
                        onClick={() => toggleOrderItems(oid)}
                        aria-expanded={isItemsExpanded}
                      >
                        {isItemsExpanded ? '▼ Скрыть состав заказа' : `▶ Состав заказа (${items.length})`}
                      </button>
                      {isItemsExpanded && (
                        <ul className="profile-order-items-list">
                          {items.map((it) => {
                            const pid = it.productId ?? it.ProductId
                            const name = it.productName ?? it.ProductName ?? 'Товар'
                            const imgRaw = it.imageUrl ?? it.ImageUrl
                            const quantity = Number(it.quantity ?? it.Quantity ?? 1) || 1
                            const unitPrice = Number(it.productPrice ?? it.ProductPrice ?? 0) || 0
                            const lineTotal = unitPrice * quantity
                            return (
                              <li key={it.id ?? it.Id} className="profile-order-item-row">
                                <button
                                  type="button"
                                  className="profile-order-item-thumb"
                                  onClick={() => openProductDetail(pid)}
                                  disabled={detailLoadingId === pid}
                                  title="Открыть карточку товара"
                                >
                                  <img src={getImageUrl(imgRaw)} alt="" onError={(e) => { e.target.src = '/logo.jpg' }} />
                                </button>
                                <div className="profile-order-item-text">
                                  <span className="profile-order-item-name">{name}</span>
                                  <span className="profile-order-item-qty">
                                    {quantity > 1
                                      ? `${unitPrice.toLocaleString('ru-RU')} ₽ × ${quantity} = ${lineTotal.toLocaleString('ru-RU')} ₽`
                                      : `${lineTotal.toLocaleString('ru-RU')} ₽`}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="profile-order-item-open"
                                  onClick={() => openProductDetail(pid)}
                                  disabled={detailLoadingId === pid}
                                >
                                  {detailLoadingId === pid ? '…' : 'Смотреть'}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}

                  {showPaymentHintBtn && (
                    <div className="profile-pay-hint">
                      <button
                        type="button"
                        className="profile-btn-pay"
                        onClick={() => setPaymentHintOrderId(oid)}
                      >
                        К оплате{' '}
                        {finalAmount.toLocaleString('ru-RU')}
                        {'\u00a0'}
                        {'\u20bd'}
                      </button>
                    </div>
                  )}

                  {showReceiveBtn && (
                    <div className="profile-receive-actions">
                      <button
                        type="button"
                        className="profile-btn-received"
                        onClick={() => startReceiveFlow(oid)}
                      >
                        Получен
                      </button>
                    </div>
                  )}

                </li>
              )
            })}
          </ul>
        )}
        <div className="profile-actions profile-actions--bottom">
          <button
            type="button"
            className="profile-logout-btn"
            onClick={handleLogout}
          >
            Выйти из профиля
          </button>
        </div>
      </PageShell>

      {detailProduct && (
        <ProductDetail product={detailProduct} onClose={() => setDetailProduct(null)} />
      )}

      {paymentHintOrderId != null && (
        <div
          className="profile-receive-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-pay-hint-title"
          onClick={() => setPaymentHintOrderId(null)}
        >
          <div className="profile-receive-modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="profile-pay-hint-title" className="profile-receive-modal-title">
              Оплата заказа
            </h3>
            <div className="profile-pay-hint-body">
              <p className="profile-pay-hint-text">
                Чтобы получить реквизиты и пошаговую инструкцию по оплате, свяжитесь с администратором магазина
                одним из способов:
              </p>
              <ul className="profile-pay-contact-list">
                <li>
                  <a
                    className="profile-pay-contact-row"
                    href={paymentTelegramHrefWithDraft}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Telegram
                  </a>
                </li>
                <li>
                  <a
                    className="profile-pay-contact-row"
                    href={paymentVkHrefWithDraft}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ВКонтакте
                  </a>
                </li>
                <li>
                  <a
                    className="profile-pay-contact-row"
                    href={payAvitoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Авито
                  </a>
                </li>
              </ul>
              <p className="profile-pay-hint-text profile-pay-hint-text--footer">
                {paymentHintOrderNumber ? (
                  <>
                    Укажите номер заказа{' '}
                    <button
                      type="button"
                      className="profile-pay-order-number-btn"
                      onClick={copyPaymentOrderNumber}
                      title="Скопировать номер заказа"
                    >
                      {paymentHintOrderNumber}
                    </button>
                    {' '}— вам подскажут, как оплатить удобным способом.
                  </>
                ) : (
                  'Сообщите номер заказа — вам подскажут, как оплатить удобным способом.'
                )}
              </p>
            </div>
            <button
              type="button"
              className="profile-btn-pay-modal-ok"
              onClick={() => setPaymentHintOrderId(null)}
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {receiveFormOrderId != null && (
        <div className="profile-receive-modal-overlay" onClick={cancelReceiveFlow}>
          <div className="profile-receive-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="profile-receive-modal-title">Подтвердите получение заказа</h3>
            <p className="profile-receive-form-hint">
              Оценку и отзыв можно не заполнять.
            </p>

            <label className="profile-receive-label">
              Оценка (необязательно)
            </label>
            <div className="profile-receive-stars" role="radiogroup" aria-label="Оценка заказа">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = Number(formRating || 0) >= n
                return (
                  <button
                    key={n}
                    type="button"
                    className={`profile-receive-star${active ? ' is-active' : ''}`}
                    onClick={() => setFormRating((prev) => (Number(prev || 0) === n ? '' : String(n)))}
                    aria-label={`Оценка ${n}`}
                    aria-pressed={active}
                  >
                    ★
                  </button>
                )
              })}
            </div>

            <label className="profile-receive-label">
              Отзыв (необязательно)
              <textarea
                className="profile-receive-textarea"
                rows={3}
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Поделитесь впечатлениями"
              />
            </label>

            <div className="profile-receive-form-buttons">
              <button
                type="button"
                className="profile-btn-received-submit"
                onClick={() => submitMarkReceived(receiveFormOrderId)}
                disabled={markSubmittingId === receiveFormOrderId}
              >
                {markSubmittingId === receiveFormOrderId ? 'Отправка…' : 'Подтвердить получение'}
              </button>
              <button
                type="button"
                className="profile-btn-received-cancel"
                onClick={cancelReceiveFlow}
                disabled={markSubmittingId === receiveFormOrderId}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Profile
