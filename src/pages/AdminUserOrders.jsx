import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import PageShell from '../components/PageShell'
import ProductDetail from '../components/ProductDetail'
import { useCart } from '../contexts/CartContext'
import { getOrderStatusColor } from '../constants/orderStatusColors'
import { getApiPublicOrigin } from '../utils/apiBase'
import './AdminUserOrders.css'

function getOrderId(o) {
  return o.id ?? o.Id
}

function getItems(o) {
  return o.orderItems || o.OrderItems || []
}

function getOrderStatus(o) {
  return (o.status || o.Status || '').trim() || '—'
}

function formatMoney(n) {
  const v = Number(n || 0)
  return `${v.toLocaleString('ru-RU')} ₽`
}

function formatWhen(d) {
  if (!d) return '—'
  const x = new Date(d)
  return Number.isNaN(x.getTime()) ? '—' : x.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}

function toImgUrl(path) {
  if (!path) return '/logo.jpg'
  if (String(path).startsWith('http')) return path
  const base = getApiPublicOrigin()
  return base + (String(path).startsWith('/') ? String(path) : `/${String(path)}`)
}

function isItemAddedToParcel(item) {
  return !!(item.addedToParcel ?? item.AddedToParcel)
}

function OrderItemsGrid({
  order,
  orderId,
  parcelAllowed,
  togglingKey,
  onToggleInParcel,
  onOpenProduct,
  detailLoadingId
}) {
  const items = getItems(order)
  if (!items.length) return <p className="admin-user-orders-no-items">Нет позиций</p>
  return (
    <ul className="admin-user-orders-items">
      {items.map((it) => {
        const itemId = it.id ?? it.Id
        const pid = it.productId ?? it.ProductId
        const name = it.productName || it.ProductName || `Товар #${pid}`
        const qty = it.quantity ?? it.Quantity ?? 1
        const price = it.productPrice || it.ProductPrice || 0
        const img = it.imageUrl || it.ImageUrl
        const size = it.size ?? it.Size ?? ''
        const brand = it.brand ?? it.Brand ?? ''
        const color = it.color ?? it.Color ?? ''
        const addedToParcel = isItemAddedToParcel(it)
        const toggleKey = `${orderId}-${itemId}`
        const toggling = togglingKey === toggleKey
        const loadingThis = detailLoadingId === pid
        return (
          <li
            key={itemId}
            className={`admin-user-orders-item-card${addedToParcel ? ' admin-user-orders-item-card--in-parcel' : ''}`}
          >
            <button
              type="button"
              className="admin-user-orders-item-card-main"
              onClick={() => onOpenProduct(pid)}
              disabled={!pid || loadingThis}
              title="Открыть карточку товара"
            >
              <div className="admin-user-orders-item-thumb">
                <img src={toImgUrl(img)} alt="" onError={(e) => { e.target.src = '/logo.jpg' }} />
              </div>
              <div className="admin-user-orders-item-body">
                <div className="admin-user-orders-item-name">{loadingThis ? 'Загрузка…' : name}</div>
                <div className="admin-user-orders-item-meta">
                  {qty > 1 ? `${formatMoney(price)} × ${qty}` : formatMoney(price * qty)}
                </div>
                {(brand || size || color) && (
                  <div className="admin-user-orders-item-extra">
                    {brand && <span>{brand}</span>}
                    {size && <span>· {size}</span>}
                    {color && <span>· {color}</span>}
                  </div>
                )}
              </div>
            </button>
            {parcelAllowed && (
              <div className="admin-user-orders-item-actions">
                <button
                  type="button"
                  className="admin-user-orders-btn-parcel"
                  onClick={() => onToggleInParcel(orderId, itemId, addedToParcel)}
                  disabled={toggling}
                  title={addedToParcel ? 'Убрать отметку «в посылке»' : 'Отметить: добавлен в посылку'}
                >
                  {toggling ? '…' : (addedToParcel ? '✓ В посылке' : 'В посылку')}
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function OrderCard({
  order,
  defaultOpen,
  parcelAllowed,
  togglingKey,
  onToggleInParcel,
  onOpenProduct,
  detailLoadingId
}) {
  const oid = getOrderId(order)
  const status = getOrderStatus(order)
  const num = order.orderNumber || order.OrderNumber || `#${oid}`
  const sum = order.finalAmount ?? order.FinalAmount ?? order.totalAmount ?? order.TotalAmount ?? 0
  const color = getOrderStatusColor(status)
  return (
    <details className="admin-user-orders-order" open={defaultOpen}>
      <summary className="admin-user-orders-order-summary">
        <span className="admin-user-orders-order-chevron" aria-hidden>▶</span>
        <span className="admin-user-orders-order-num">{num}</span>
        <span className="admin-user-orders-order-sum">{formatMoney(sum)}</span>
        <span className="admin-user-orders-order-status" style={{ backgroundColor: color }}>{status}</span>
        <span className="admin-user-orders-order-date">{formatWhen(order.createdAt || order.CreatedAt)}</span>
      </summary>
      <div className="admin-user-orders-order-body">
        <OrderItemsGrid
          order={order}
          orderId={oid}
          parcelAllowed={parcelAllowed}
          togglingKey={togglingKey}
          onToggleInParcel={onToggleInParcel}
          onOpenProduct={onOpenProduct}
          detailLoadingId={detailLoadingId}
        />
      </div>
    </details>
  )
}

export default function AdminUserOrders() {
  const { sessionId } = useCart()
  const { userId: userIdParam } = useParams()
  const [searchParams] = useSearchParams()
  const userId = Number(userIdParam)
  const highlightOrderIdRaw = searchParams.get('order')
  const highlightOrderId = highlightOrderIdRaw != null && highlightOrderIdRaw !== '' ? Number(highlightOrderIdRaw) : null

  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailProduct, setDetailProduct] = useState(null)
  const [detailLoadingId, setDetailLoadingId] = useState(null)
  const [inParcelTogglingKey, setInParcelTogglingKey] = useState(null)

  const reloadOrders = useCallback(async () => {
    if (!userId || Number.isNaN(userId)) return
    const list = await api.getOrdersByUserForAdmin(userId)
    setOrders(Array.isArray(list) ? list : [])
  }, [userId])

  const sortedOrders = useMemo(() => {
    const list = Array.isArray(orders) ? [...orders] : []
    list.sort((a, b) => {
      const da = new Date(a.createdAt || a.CreatedAt || 0).getTime()
      const db = new Date(b.createdAt || b.CreatedAt || 0).getTime()
      return db - da
    })
    return list
  }, [orders])

  const primaryOrderId = useMemo(() => {
    if (highlightOrderId != null && !Number.isNaN(highlightOrderId) && sortedOrders.some((o) => getOrderId(o) === highlightOrderId)) {
      return highlightOrderId
    }
    const first = sortedOrders[0]
    return first ? getOrderId(first) : null
  }, [sortedOrders, highlightOrderId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!userId || Number.isNaN(userId)) {
        setError('Некорректный пользователь')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError('')
        const [u, list] = await Promise.all([
          api.getUserById(userId),
          api.getOrdersByUserForAdmin(userId)
        ])
        if (cancelled) return
        setUser(u)
        setOrders(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Не удалось загрузить данные')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const openProductDetail = async (productId) => {
    if (productId == null) return
    setDetailLoadingId(productId)
    try {
      const p = await api.getProduct(productId, sessionId)
      setDetailProduct(p)
    } catch (e) {
      window.dispatchEvent(new CustomEvent('bebochka-toast', {
        detail: { type: 'error', message: e?.message || 'Не удалось открыть товар' }
      }))
    } finally {
      setDetailLoadingId(null)
    }
  }

  const handleToggleInParcel = async (orderId, itemId, currentAdded) => {
    const key = `${orderId}-${itemId}`
    setInParcelTogglingKey(key)
    try {
      await api.setOrderItemInParcel(orderId, itemId, !currentAdded)
      await reloadOrders()
    } catch (e) {
      window.dispatchEvent(new CustomEvent('bebochka-toast', {
        detail: { type: 'error', message: e?.message || 'Не удалось обновить отметку «в посылке»' }
      }))
    } finally {
      setInParcelTogglingKey(null)
    }
  }

  const userLabel = user
    ? (user.fullName || user.FullName || user.username || user.Username || user.email || user.Email || `id ${userId}`)
    : `id ${userId}`

  const renderOrderCard = (o, defaultOpen) => {
    const st = getOrderStatus(o)
    const parcelAllowed = st === 'В сборке'
    return (
      <OrderCard
        key={getOrderId(o)}
        order={o}
        defaultOpen={defaultOpen}
        parcelAllowed={parcelAllowed}
        togglingKey={inParcelTogglingKey}
        onToggleInParcel={handleToggleInParcel}
        onOpenProduct={openProductDetail}
        detailLoadingId={detailLoadingId}
      />
    )
  }

  return (
    <PageShell
      title="Заказы пользователя"
      subtitle={userLabel}
      actions={(
        <Link to="/admin/orders" className="admin-user-orders-back">
          ← Все заказы
        </Link>
      )}
    >
      <div className="admin-user-orders-page">
        {loading && <p className="admin-user-orders-muted">Загрузка…</p>}
        {!loading && error && <p className="admin-user-orders-error">{error}</p>}
        {!loading && !error && sortedOrders.length === 0 && (
          <p className="admin-user-orders-muted">У этого пользователя пока нет заказов.</p>
        )}
        {!loading && !error && sortedOrders.length > 0 && (
          <p className="admin-user-orders-hint">
            Строка заказа сворачивает список. Карточка товара открывает просмотр. В статусе «В сборке» — кнопка «В посылку».
          </p>
        )}
        {!loading && !error && sortedOrders.length > 0 && (
          <>
            <section className="admin-user-orders-section">
              <h2 className="admin-user-orders-section-title">
                {highlightOrderId != null && !Number.isNaN(highlightOrderId) ? 'Выбранный заказ' : 'Последний заказ'}
              </h2>
              {sortedOrders
                .filter((o) => getOrderId(o) === primaryOrderId)
                .map((o) => renderOrderCard(o, true))}
            </section>
            {sortedOrders.filter((o) => getOrderId(o) !== primaryOrderId).length > 0 && (
              <section className="admin-user-orders-section">
                <h2 className="admin-user-orders-section-title">Прошлые заказы</h2>
                {sortedOrders
                  .filter((o) => getOrderId(o) !== primaryOrderId)
                  .map((o) => renderOrderCard(o, false))}
              </section>
            )}
          </>
        )}
      </div>

      {detailProduct && (
        <ProductDetail product={detailProduct} onClose={() => setDetailProduct(null)} />
      )}
    </PageShell>
  )
}
