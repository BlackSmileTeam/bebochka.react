import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import PageShell from '../components/PageShell'
import ProductDetail from '../components/ProductDetail'
import { useCart } from '../contexts/CartContext'
import { getOrderStatusColor } from '../constants/orderStatusColors'
import ProductImage from '../components/ProductImage'
import VkProfileLink from '../components/VkProfileLink'
import AdminUserChildrenPanel from '../components/AdminUserChildrenPanel'
import { AdminUserEmailLink, AdminUserPhoneLink } from '../utils/adminUserContact'
import './AdminUserOrders.css'

function getOrderId(o) {
  return o.id ?? o.Id
}

function getChildOrders(o) {
  const nested = o?.childOrders ?? o?.ChildOrders
  return Array.isArray(nested) ? nested : []
}

function getParentOrderId(o) {
  const pid = o?.parentOrderId ?? o?.ParentOrderId
  return pid != null && pid !== '' ? pid : null
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
  if (Number.isNaN(x.getTime())) return '—'
  return `${x.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow'
  })} МСК`
}

function formatDateOnly(d) {
  if (!d) return '—'
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return '—'
  return x.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatBool(value) {
  if (value === true || value === 1) return 'Да'
  if (value === false || value === 0) return 'Нет'
  return '—'
}

function enrichOrderFromRoots(order, rootOrders) {
  if (!order || getItems(order).length > 0) return order
  const id = getOrderId(order)
  for (const root of rootOrders) {
    for (const c of getChildOrders(root)) {
      if (getOrderId(c) === id && getItems(c).length > 0) return c
    }
  }
  return order
}

function resolveChildOrders(order, ordersById, rootOrders) {
  const nested = getChildOrders(order)
  if (nested.length > 0) {
    return nested.map((c) => enrichOrderFromRoots(c, rootOrders))
  }
  const oid = getOrderId(order)
  if (!oid) return []
  return Array.from(ordersById.values())
    .filter((o) => getParentOrderId(o) === oid)
    .map((c) => enrichOrderFromRoots(c, rootOrders))
}

function AdminUserInfo({ user, userId, children, childrenLoading, childrenError }) {
  if (!user) {
    return (
      <div className="admin-user-orders-user-info">
        <span><strong>ID:</strong> {userId}</span>
      </div>
    )
  }

  const rows = [
    { label: 'ID', value: user.id ?? userId },
    { label: 'Имя пользователя', value: user.username || user.Username || '—' },
    { label: 'ФИО', value: user.fullName || user.FullName || '—' },
    {
      label: 'Email',
      value: <AdminUserEmailLink email={user.email || user.Email} className="admin-user-contact-link" />
    },
    {
      label: 'Телефон',
      value: <AdminUserPhoneLink user={user} className="admin-user-contact-link" />
    },
    { label: 'Администратор', value: formatBool(user.isAdmin ?? user.IsAdmin) },
    ...(user.isActive !== undefined || user.IsActive !== undefined
      ? [{ label: 'Активен', value: formatBool(user.isActive ?? user.IsActive) }]
      : []),
    { label: 'Создан', value: formatDateOnly(user.createdAt || user.CreatedAt) },
    { label: 'Последний вход', value: formatWhen(user.lastLoginAt || user.LastLoginAt) },
    ...(user.autoFilterByChildren !== undefined || user.AutoFilterByChildren !== undefined
      ? [{ label: 'Автофильтр по детям', value: formatBool(user.autoFilterByChildren ?? user.AutoFilterByChildren) }]
      : []),
    ...(user.dateOfBirth || user.DateOfBirth
      ? [{ label: 'Дата рождения', value: formatDateOnly(user.dateOfBirth || user.DateOfBirth) }]
      : []),
    ...(user.telegramUserId || user.TelegramUserId
      ? [{ label: 'Telegram ID', value: user.telegramUserId ?? user.TelegramUserId }]
      : []),
  ]

  return (
    <div className="admin-user-orders-user-info">
      <div className="admin-user-orders-user-info-links admin-user-orders-user-info-links--vk">
        <VkProfileLink user={user} />
      </div>
      <details className="admin-user-orders-collapsible">
        <summary className="admin-user-orders-collapsible-summary">Пользователь</summary>
        <dl className="admin-user-orders-user-info-grid">
          {rows.map(({ label, value }) => (
            <div key={label} className="admin-user-orders-user-info-row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </details>
      <details className="admin-user-orders-collapsible">
        <summary className="admin-user-orders-collapsible-summary">
          Дети{children.length > 0 ? ` (${children.length})` : ''}
        </summary>
        <AdminUserChildrenPanel
          loading={childrenLoading}
          error={childrenError}
          children={children}
          title=""
        />
      </details>
    </div>
  )
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
                <ProductImage
                  src={img}
                  thumbWidth={104}
                  alt={name}
                  className="admin-user-orders-item-thumb-img"
                  width={52}
                  height={52}
                />
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
  rootOrders,
  ordersById,
  defaultOpen,
  parcelAllowed,
  togglingKey,
  onToggleInParcel,
  onOpenProduct,
  detailLoadingId
}) {
  const displayOrder = enrichOrderFromRoots(order, rootOrders)
  const oid = getOrderId(displayOrder)
  const status = getOrderStatus(displayOrder)
  const num = displayOrder.orderNumber || displayOrder.OrderNumber || `#${oid}`
  const sum = displayOrder.finalAmount ?? displayOrder.FinalAmount ?? displayOrder.totalAmount ?? displayOrder.TotalAmount ?? 0
  const color = getOrderStatusColor(status)
  const childOrders = resolveChildOrders(displayOrder, ordersById, rootOrders)
  const parentId = getParentOrderId(displayOrder)
  const parentHint = parentId ? ` · часть #${parentId}` : ''
  const parcelForOrder = status === 'В сборке'
  return (
    <details className="admin-user-orders-order" open={defaultOpen}>
      <summary className="admin-user-orders-order-summary">
        <span className="admin-user-orders-order-chevron" aria-hidden>▶</span>
        <span className="admin-user-orders-order-num">{num}{parentHint}</span>
        <span className="admin-user-orders-order-sum">{formatMoney(sum)}</span>
        <span className="admin-user-orders-order-status" style={{ backgroundColor: color }}>{status}</span>
        <span className="admin-user-orders-order-date">{formatWhen(displayOrder.createdAt || displayOrder.CreatedAt)}</span>
      </summary>
      <div className="admin-user-orders-order-body">
        {childOrders.length > 0 ? (
          <div className="admin-user-orders-child-parts">
            {childOrders.map((child) => {
              const childId = getOrderId(child)
              const childStatus = getOrderStatus(child)
              const childParcelAllowed = childStatus === 'В сборке'
              return (
                <div key={childId} className="admin-user-orders-child-part">
                  <div className="admin-user-orders-child-part-head">
                    <strong>{child.orderNumber || child.OrderNumber || `#${childId}`}</strong>
                    <span
                      className="admin-user-orders-order-status admin-user-orders-order-status--inline"
                      style={{ backgroundColor: getOrderStatusColor(childStatus) }}
                    >
                      {childStatus}
                    </span>
                  </div>
                  <OrderItemsGrid
                    order={child}
                    orderId={childId}
                    parcelAllowed={childParcelAllowed}
                    togglingKey={togglingKey}
                    onToggleInParcel={onToggleInParcel}
                    onOpenProduct={onOpenProduct}
                    detailLoadingId={detailLoadingId}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <OrderItemsGrid
            order={displayOrder}
            orderId={oid}
            parcelAllowed={parcelForOrder || parcelAllowed}
            togglingKey={togglingKey}
            onToggleInParcel={onToggleInParcel}
            onOpenProduct={onOpenProduct}
            detailLoadingId={detailLoadingId}
          />
        )}
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
  const [children, setChildren] = useState([])
  const [childrenLoading, setChildrenLoading] = useState(false)
  const [childrenError, setChildrenError] = useState('')
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

  const ordersById = useMemo(() => {
    const byId = new Map()
    for (const o of orders) {
      const id = getOrderId(o)
      if (id != null) byId.set(id, o)
      for (const c of getChildOrders(o)) {
        const cid = getOrderId(c)
        if (cid != null) byId.set(cid, c)
      }
    }
    return byId
  }, [orders])

  const sortedRootOrders = useMemo(() => {
    const list = Array.isArray(orders) ? [...orders] : []
    list.sort((a, b) => {
      const da = new Date(a.createdAt || a.CreatedAt || 0).getTime()
      const db = new Date(b.createdAt || b.CreatedAt || 0).getTime()
      return db - da
    })
    return list
  }, [orders])

  const primaryOrder = useMemo(() => {
    let found = null
    if (highlightOrderId != null && !Number.isNaN(highlightOrderId) && ordersById.has(highlightOrderId)) {
      found = ordersById.get(highlightOrderId)
    } else {
      found = sortedRootOrders[0] ?? null
    }
    if (!found) return null
    const parentId = getParentOrderId(found)
    if (parentId) {
      return enrichOrderFromRoots(found, sortedRootOrders)
    }
    const rootId = getOrderId(found)
    const fromRoot = sortedRootOrders.find((o) => getOrderId(o) === rootId)
    return fromRoot ?? enrichOrderFromRoots(found, sortedRootOrders)
  }, [sortedRootOrders, highlightOrderId, ordersById])

  const primaryRootId = useMemo(() => {
    if (!primaryOrder) return null
    const parentId = getParentOrderId(primaryOrder)
    return parentId ?? getOrderId(primaryOrder)
  }, [primaryOrder])

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
        setChildrenLoading(true)
        setChildrenError('')
        setError('')
        const [u, allUsers, list] = await Promise.all([
          api.getUserById(userId),
          api.getUsers(),
          api.getOrdersByUserForAdmin(userId),
        ])
        if (cancelled) return
        const fromList = Array.isArray(allUsers)
          ? allUsers.find((x) => (x.id ?? x.Id) === userId)
          : null
        const mergedUser = fromList ? { ...fromList, ...u } : u
        setUser(mergedUser)
        setOrders(Array.isArray(list) ? list : [])
        try {
          const childList = await api.getUserChildren(userId)
          if (!cancelled) {
            setChildren(Array.isArray(childList) ? childList : [])
            setChildrenError('')
          }
        } catch (e) {
          if (!cancelled) {
            setChildren(mergedUser?.children ?? [])
            setChildrenError(e?.message || 'Не удалось загрузить детей')
          }
        } finally {
          if (!cancelled) setChildrenLoading(false)
        }
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
  const renderOrderCard = (o, defaultOpen) => (
    <OrderCard
      key={getOrderId(o)}
      order={o}
      rootOrders={sortedRootOrders}
      ordersById={ordersById}
      defaultOpen={defaultOpen}
      parcelAllowed={getOrderStatus(o) === 'В сборке'}
      togglingKey={inParcelTogglingKey}
      onToggleInParcel={handleToggleInParcel}
      onOpenProduct={openProductDetail}
      detailLoadingId={detailLoadingId}
    />
  )

  return (
    <PageShell
      title="Заказы пользователя"
      subtitle={userLabel}
      actions={(
        <div className="admin-user-orders-header-actions">
          <Link to="/admin/orders" className="admin-user-orders-back">
            ← Все заказы
          </Link>
        </div>
      )}
    >
      <div className="admin-user-orders-page">
        {!loading && !error && (
          <AdminUserInfo
            user={user}
            userId={userId}
            children={children}
            childrenLoading={childrenLoading}
            childrenError={childrenError}
          />
        )}
        {loading && <p className="admin-user-orders-muted">Загрузка…</p>}
        {!loading && error && <p className="admin-user-orders-error">{error}</p>}
        {!loading && !error && sortedRootOrders.length === 0 && (
          <p className="admin-user-orders-muted">У этого пользователя пока нет заказов.</p>
        )}
        {!loading && !error && primaryOrder && (
          <>
            <section className="admin-user-orders-section">
              <h2 className="admin-user-orders-section-title">
                {highlightOrderId != null && !Number.isNaN(highlightOrderId) ? 'Выбранный заказ' : 'Последний заказ'}
              </h2>
              {renderOrderCard(primaryOrder, true)}
            </section>
            {sortedRootOrders.filter((o) => getOrderId(o) !== primaryRootId).length > 0 && (
              <section className="admin-user-orders-section">
                <h2 className="admin-user-orders-section-title">Прошлые заказы</h2>
                {sortedRootOrders
                  .filter((o) => getOrderId(o) !== primaryRootId)
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
