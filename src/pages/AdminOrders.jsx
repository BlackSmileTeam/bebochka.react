import { useState, useEffect, useMemo, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { ORDER_STATUS_COLORS, getOrderStatusSelectSurfaceStyle, getOrderStatusOptionStyle } from '../constants/orderStatusColors'
import PageShell from '../components/PageShell'
import Toast from '../components/Toast'
import { ConfirmDialog } from '../components/ConfirmDialog'
import './AdminOrders.css'

function OrderDiscountSingleModal({ orderId, order, getOrderNumber, getCustomerName, getTotalAmount, getFinalAmount, formatPrice, hasDiscount, onClose, onApply, onRemove }) {
  const [percent, setPercent] = useState(10)
  const total = order ? getTotalAmount(order) : 0
  const sumAfter = total * (100 - percent) / 100
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--single-discount" onClick={e => e.stopPropagation()}>
        <h3>Скидка для заказа {order ? getOrderNumber(order) : `#${orderId}`}</h3>
        {order && (
          <p className="modal-order-info">
            Клиент: <strong>{getCustomerName(order)}</strong>
          </p>
        )}
        <div className="sale-input-row">
          <label>Скидка, %</label>
          <input type="number" min={0} max={100} value={percent} onChange={e => setPercent(Number(e.target.value) || 0)} />
        </div>
        <div className="modal-discount-sums">
          <span>Текущая сумма: <strong>{formatPrice(total)}</strong></span>
          <span>Со скидкой: <strong>{formatPrice(sumAfter)}</strong></span>
        </div>
        <div className="modal-actions modal-actions--inline">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Закрыть</button>
          {hasDiscount && (
            <button type="button" className="btn btn-cancel-discount" onClick={onRemove}>Отменить скидку</button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => onApply(percent)}>Применить</button>
        </div>
      </div>
    </div>
  )
}

/** Все статусы (фильтры, группировка). «Получен» выставляется только клиентом. */
const ORDER_STATUSES_ALL = [
  'Формирование заказа',
  'Ожидает оплату',
  'Оплачен',
  'В сборке',
  'На доставку',
  'Отправлен',
  'Получен',
  'Отменен'
]

/** Статусы, доступные администратору в выпадающих списках и массовых действиях. */
const ORDER_STATUSES_ADMIN = ORDER_STATUSES_ALL.filter(s => s !== 'Получен')

function getAdminStatusSelectOptions(currentStatus) {
  if (currentStatus === 'Получен') return ['Получен']
  return [...ORDER_STATUSES_ADMIN]
}

const STATUS_TOOLTIPS = {
  'Формирование заказа': 'Начальный статус: покупатель собирает корзину, можно добавлять товары в заказ',
  'Ожидает оплату': 'Покупатель оформил заказ. Отправлено сообщение об успешном оформлении и необходимости оплаты. Добавлять товары в заказ нельзя',
  'Оплачен': 'Оплата подтверждена. Заказ можно переводить в сборку',
  'В сборке': 'Заказ собирается и подготавливается к отправке',
  'На доставку': 'Заказ собран, упакован; ожидаются данные от покупателя (адрес, способ отправки)',
  'Отправлен': 'Заказ передан в доставку. Клиент может подтвердить получение',
  'Получен': 'Клиент подтвердил получение. Состав заказа не меняется',
  'Отменен': 'Заказ отменён'
}

const PARCEL_EDITABLE_STATUSES = new Set([
  'Формирование заказа',
  'Ожидает оплату',
  'В сборке'
])
const ORDER_STATUS_INDEX = ORDER_STATUSES_ALL.reduce((acc, status, idx) => {
  acc[status] = idx
  return acc
}, {})

function AdminOrders() {
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState(new Set())
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [expandedGroups, setExpandedGroups] = useState(new Set(ORDER_STATUSES_ALL))
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set())
  const [updatingStatuses, setUpdatingStatuses] = useState(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [deletingOrderId, setDeletingOrderId] = useState(null)
  const [deletingItemKey, setDeletingItemKey] = useState(null)
  const [inParcelTogglingKey, setInParcelTogglingKey] = useState(null)
  const [imageModalUrl, setImageModalUrl] = useState(null)
  const [sortBy, setSortBy] = useState(null)
  const [sortDir, setSortDir] = useState('desc')
  const [discountFilter, setDiscountFilter] = useState('all')
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [orderDiscountModal, setOrderDiscountModal] = useState(null)
  const [saleType, setSaleType] = useState('fixed')
  const [saleFixedPercent, setSaleFixedPercent] = useState(10)
  const [saleCond1, setSaleCond1] = useState(20)
  const [saleCond3, setSaleCond3] = useState(25)
  const [saleCond5, setSaleCond5] = useState(30)
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const [groupBy, setGroupBy] = useState('status')
  const [clientFilterKey, setClientFilterKey] = useState(null)
  const [orderRowMenuOpen, setOrderRowMenuOpen] = useState(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [orderDetailsOrderId, setOrderDetailsOrderId] = useState(null)
  const [imageCarousel, setImageCarousel] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [adminCartItems, setAdminCartItems] = useState([])
  const [loadingAdminCart, setLoadingAdminCart] = useState(false)
  const [removingAdminCartItemId, setRemovingAdminCartItemId] = useState(null)
  const [statusChangeWarning, setStatusChangeWarning] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'error') => {
    if (!message) return
    setToast({ message, type })
  }

  useEffect(() => {
    loadOrders()
    loadAdminCartItems()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await api.getAllOrders()
      setOrders(data)
    } catch (err) {
      console.error('Ошибка загрузки заказов:', err)
      showToast('Ошибка при загрузке заказов: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setLoading(false)
    }
  }

  const loadAdminCartItems = async () => {
    try {
      setLoadingAdminCart(true)
      const data = await api.getAdminCartItems()
      setAdminCartItems(data)
    } catch (err) {
      console.error('Ошибка загрузки корзин:', err)
    } finally {
      setLoadingAdminCart(false)
    }
  }

  const hasOrderDiscount = (order) => {
    const t = order.discountType || order.DiscountType || 'None'
    return t && t !== 'None'
  }

  // Фильтр по скидке: все заказы или только со скидкой
  const ordersForGrouping = useMemo(() => {
    if (discountFilter !== 'withDiscount') return orders
    return orders.filter(hasOrderDiscount)
  }, [orders, discountFilter])

  const getCustomerKey = (order) => {
    const name = order.customerName || order.CustomerName || '-'
    const phone = order.customerPhone || order.CustomerPhone || ''
    return `${name}|${phone}`
  }

  const normalize = (value) => String(value || '').trim().toLowerCase()

  // Группировка заказов по статусам
  const groupedOrders = useMemo(() => {
    const grouped = {}
    ORDER_STATUSES_ALL.forEach(status => {
      grouped[status] = []
    })
    const statusMap = { 'В пути': 'На доставку', 'Доставлен': 'Отправлен' }
    ordersForGrouping.forEach(order => {
      let status = order.status || order.Status || ORDER_STATUSES_ALL[0]
      status = statusMap[status] || status
      if (grouped[status]) {
        grouped[status].push(order)
      } else {
        grouped[ORDER_STATUSES_ALL[0]].push(order)
      }
    })
    Object.keys(grouped).forEach(status => {
      grouped[status].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.CreatedAt || 0)
        const dateB = new Date(b.createdAt || b.CreatedAt || 0)
        return dateB - dateA
      })
    })
    return grouped
  }, [ordersForGrouping])

  // Группировка по клиенту (все заказы клиента во всех статусах)
  const groupedByClient = useMemo(() => {
    const map = {}
    ordersForGrouping.forEach(order => {
      const key = getCustomerKey(order)
      if (!map[key]) map[key] = []
      map[key].push(order)
    })
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.CreatedAt || 0)
        const dateB = new Date(b.createdAt || b.CreatedAt || 0)
        return dateB - dateA
      })
    })
    return map
  }, [ordersForGrouping])

  // Фильтрация по выбранному статусу (только для groupBy === 'status')
  const filteredGroups = useMemo(() => {
    if (groupBy === 'client') {
      if (clientFilterKey) {
        const match = Object.entries(groupedByClient).find(([key]) => normalize(key) === normalize(clientFilterKey))
        if (match) return { [match[0]]: match[1] }
        return {}
      }
      return groupedByClient
    }
    if (selectedStatusFilter === 'all') {
      return groupedOrders
    }
    return { [selectedStatusFilter]: groupedOrders[selectedStatusFilter] || [] }
  }, [groupBy, groupedOrders, groupedByClient, selectedStatusFilter, clientFilterKey])

  useEffect(() => {
    const groupByParam = searchParams.get('groupBy')
    const clientName = searchParams.get('clientName') || ''
    const clientPhone = searchParams.get('clientPhone') || ''
    if (groupByParam === 'client' && clientName) {
      setGroupBy('client')
      setSelectedStatusFilter('all')
      setClientFilterKey(`${clientName}|${clientPhone}`)
    } else {
      setClientFilterKey(null)
    }
  }, [searchParams])

  const toggleOrderSelection = (orderId) => {
    const order = orders.find(o => getOrderId(o) === orderId)
    if (order && getOrderStatus(order) === 'Получен') return
    setSelectedOrders(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const toggleGroupSelection = (groupKey) => {
    const groupOrders = filteredGroups[groupKey] || []
    const groupOrderIds = groupOrders
      .filter(o => getOrderStatus(o) !== 'Получен')
      .map(o => getOrderId(o))
    const allSelected = groupOrderIds.length > 0 && groupOrderIds.every(id => selectedOrders.has(id))
    setSelectedOrders(prev => {
      const next = new Set(prev)
      if (allSelected) {
        groupOrderIds.forEach(id => next.delete(id))
      } else {
        groupOrderIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  const toggleAllSelection = () => {
    const allOrderIds = orders
      .filter(o => getOrderStatus(o) !== 'Получен')
      .map(o => o.id || o.Id)
    const allSelected = allOrderIds.every(id => selectedOrders.has(id))
    
    setSelectedOrders(allSelected ? new Set() : new Set(allOrderIds))
  }

  const toggleGroupExpansion = (groupKey) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }

  useEffect(() => {
    if (groupBy === 'client') {
      setExpandedGroups(new Set(Object.keys(groupedByClient)))
    } else {
      setExpandedGroups(new Set(ORDER_STATUSES_ALL))
    }
  }, [groupBy, groupedByClient])

  const performStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingStatuses(prev => new Set(prev).add(orderId))
      await api.updateOrderStatus(orderId, newStatus)
      await loadOrders()
      setSelectedOrders(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    } catch (err) {
      console.error('Ошибка обновления статуса:', err)
      showToast('Ошибка при обновлении статуса: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setUpdatingStatuses(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find(o => getOrderId(o) === orderId)
    const currentStatus = order ? getOrderStatus(order) : null
    if (currentStatus && currentStatus === newStatus) return

    if (order && shouldWarnAboutUnmarkedParcelItems(order, currentStatus, newStatus)) {
      setStatusChangeWarning({
        type: 'single',
        orderId,
        newStatus,
        text: 'В заказе есть товары, не отмеченные как «В посылке». Перевести заказ в этот статус?'
      })
      return
    }

    await performStatusChange(orderId, newStatus)
  }

  const performBulkStatusChange = async (orderIds, newStatus) => {
    try {
      setBulkUpdating(true)
      const results = await api.updateOrdersStatus(orderIds, newStatus)
      
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      
      if (failCount > 0) {
        showToast(`Обновлено: ${successCount}, Ошибок: ${failCount}`, 'warning')
      } else {
        showToast(`Успешно обновлено ${successCount} заказ(ов)`, 'success')
      }
      
      await loadOrders()
      setSelectedOrders(new Set())
    } catch (err) {
      console.error('Ошибка массового обновления:', err)
      showToast('Ошибка при обновлении статусов: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedOrders.size === 0) {
      showToast('Выберите хотя бы один заказ', 'warning')
      return
    }

    const orderIds = Array.from(selectedOrders)
    const selectedList = orders.filter(o => selectedOrders.has(getOrderId(o)))
    const withUnmarked = selectedList.filter((order) =>
      shouldWarnAboutUnmarkedParcelItems(order, getOrderStatus(order), newStatus)
    )

    if (withUnmarked.length > 0) {
      setStatusChangeWarning({
        type: 'bulk',
        orderIds,
        newStatus,
        text: `В ${withUnmarked.length} заказ(ах) есть товары без отметки «В посылке». Всё равно перевести в статус «${newStatus}»?`
      })
      return
    }

    setConfirmDialog({
      title: 'Подтвердите действие',
      message: `Изменить статус ${orderIds.length} заказ(ов) на "${newStatus}"?`,
      confirmLabel: 'Изменить статус',
      variant: 'primary',
      action: 'bulkStatus',
      payload: { orderIds, newStatus },
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const formatPrice = (price) => {
    return (price ?? 0).toLocaleString('ru-RU') + ' ₽'
  }

  const handleDeleteOrder = async (orderId) => {
    const order = orders.find(o => (o.id || o.Id) === orderId)
    const orderNumber = order ? (order.orderNumber || order.OrderNumber) : orderId
    setConfirmDialog({
      title: 'Подтвердите действие',
      message: `Удалить заказ ${orderNumber} из списка и из базы данных? Это действие нельзя отменить.`,
      confirmLabel: 'Удалить',
      variant: 'danger',
      action: 'deleteOrder',
      payload: { orderId },
    })
  }

  const executeDeleteOrder = async (orderId) => {
    try {
      setDeletingOrderId(orderId)
      await api.deleteOrder(orderId)
      await loadOrders()
    } catch (err) {
      console.error('Ошибка удаления заказа:', err)
      showToast('Ошибка при удалении заказа: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setDeletingOrderId(null)
    }
  }

  const getOrderId = (order) => order.id || order.Id
  const getOrderNumber = (order) => order.orderNumber || order.OrderNumber || `#${getOrderId(order)}`
  const getOrderStatus = (order) => order.status || order.Status || ORDER_STATUSES_ALL[0]
  const isOrderStatusLocked = (order) => getOrderStatus(order) === 'Получен'
  const isItemAddedToParcel = (item) => !!(item.addedToParcel ?? item.AddedToParcel)
  const hasUnmarkedParcelItems = (order) => getOrderItems(order).some(item => !isItemAddedToParcel(item))
  const isMoveToPastStatus = (oldStatus, nextStatus) => {
    const oldIdx = ORDER_STATUS_INDEX[oldStatus]
    const nextIdx = ORDER_STATUS_INDEX[nextStatus]
    if (oldIdx == null || nextIdx == null) return false
    return nextIdx < oldIdx
  }
  const shouldHighlightMissingParcel = (order) => {
    const status = getOrderStatus(order)
    return !PARCEL_EDITABLE_STATUSES.has(status) && hasUnmarkedParcelItems(order)
  }
  const shouldWarnAboutUnmarkedParcelItems = (order, oldStatus, nextStatus) => (
    oldStatus === 'В сборке' &&
    nextStatus !== 'В сборке' &&
    !isMoveToPastStatus(oldStatus, nextStatus) &&
    hasUnmarkedParcelItems(order)
  )
  const getTelegramUserId = (order) => order.telegramUserId ?? order.TelegramUserId
  const getTelegramUsername = (order) => order.telegramUsername || order.TelegramUsername || order.customerName || order.CustomerName
  // Ссылка на профиль/чат: из API (CustomerProfileLink) или собираем из telegramUserId
  const getCustomerProfileLink = (order) => order.customerProfileLink || order.CustomerProfileLink || (getTelegramUserId(order) != null && Number(getTelegramUserId(order)) > 0 ? `tg://openmessage?user_id=${getTelegramUserId(order)}` : null)
  const hasClientLink = (order) => !!getCustomerProfileLink(order)
  const getCustomerName = (order) => order.customerName || order.CustomerName || '-'
  const getCustomerPhone = (order) => order.customerPhone || order.CustomerPhone || '-'
  const getTotalAmount = (order) => order.totalAmount || order.TotalAmount || 0
  const getFinalAmount = (order) => order.finalAmount ?? order.FinalAmount ?? getTotalAmount(order)

  const getOrderSortValue = (order, key) => {
    switch (key) {
      case 'number': return (order.orderNumber || order.OrderNumber || '').toLowerCase()
      case 'client': return getCustomerName(order).toLowerCase()
      case 'phone': return getCustomerPhone(order).toLowerCase()
      case 'date': return new Date(order.createdAt || order.CreatedAt || 0).getTime()
      case 'amount': return Number(getTotalAmount(order)) || 0
      default: return 0
    }
  }

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortDir(key === 'client' || key === 'phone' ? 'asc' : 'desc')
    }
  }

  useEffect(() => {
    setSelectedOrders(prev => {
      const next = new Set()
      prev.forEach((id) => {
        const order = orders.find(o => getOrderId(o) === id)
        if (order && !isOrderStatusLocked(order)) next.add(id)
      })
      return next
    })
  }, [orders])

  const sortOrdersInGroup = (statusOrders) => {
    if (!sortBy) return statusOrders
    const dir = sortDir === 'asc' ? 1 : -1
    return [...statusOrders].sort((a, b) => {
      const va = getOrderSortValue(a, sortBy)
      const vb = getOrderSortValue(b, sortBy)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir
    })
  }

  const SortableTh = ({ sortKey, children, className }) => (
    <th className={`sortable-th ${className || ''}`}>
      <button type="button" className="th-sort-btn" onClick={() => handleSort(sortKey)}>
        {children}
        <span className="sort-icon">{sortBy === sortKey ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ⇅'}</span>
      </button>
    </th>
  )

  const getOrderItems = (order) => order.orderItems || order.OrderItems || []
  const getItemImageUrl = (item) => {
    const path = item.imageUrl || item.ImageUrl
    if (!path) return null
    if (path.startsWith('http')) return path
    const base = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000'
    return base + (path.startsWith('/') ? path : '/' + path)
  }

  const getCartImageUrl = (cartItem) => {
    const first = cartItem.productImages?.[0] ?? cartItem.ProductImages?.[0]
    if (!first) return null
    if (first.startsWith('http')) return first
    const base = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000'
    return base + (first.startsWith('/') ? first : '/' + first)
  }

  const handleRemoveAdminCartItem = async (cartItemId) => {
    setConfirmDialog({
      title: 'Подтвердите действие',
      message: 'Убрать этот товар из корзины пользователя?',
      confirmLabel: 'Убрать',
      variant: 'danger',
      action: 'removeAdminCartItem',
      payload: { cartItemId },
    })
  }

  const executeRemoveAdminCartItem = async (cartItemId) => {
    try {
      setRemovingAdminCartItemId(cartItemId)
      await api.removeAdminCartItem(cartItemId)
      await loadAdminCartItems()
    } catch (err) {
      console.error('Ошибка удаления товара из корзины:', err)
      showToast('Ошибка удаления из корзины: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setRemovingAdminCartItemId(null)
    }
  }

  const openPhotoCarousel = async (productId, initialUrl) => {
    setImageCarousel({ urls: [initialUrl], currentIndex: 0 })
    try {
      const product = await api.getProduct(productId)
      const images = product?.images || product?.Images || []
      const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000'
      const fullUrls = images.map(p => (p && (p.startsWith('http') ? p : base + (p.startsWith('/') ? p : '/' + p))))
      if (fullUrls.length > 0) {
        const idx = fullUrls.findIndex(u => u === initialUrl)
        setImageCarousel({ urls: fullUrls, currentIndex: idx >= 0 ? idx : 0 })
      }
    } catch (_) {
      /* keep single image */
    }
  }

  const handleConfirmStatusWarning = async () => {
    const warning = statusChangeWarning
    if (!warning) return
    setStatusChangeWarning(null)
    if (warning.type === 'single') {
      await performStatusChange(warning.orderId, warning.newStatus)
      return
    }
    if (warning.type === 'bulk') {
      await performBulkStatusChange(warning.orderIds, warning.newStatus)
    }
  }

  const toggleOrderExpanded = (orderId) => {
    setExpandedOrderIds(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  const handleDeleteOrderItem = async (orderId, itemId) => {
    setConfirmDialog({
      title: 'Подтвердите действие',
      message: 'Удалить товар из заказа? Комментарий пользователя в Telegram будет удалён, товар перейдёт следующему в очереди.',
      confirmLabel: 'Удалить',
      variant: 'danger',
      action: 'deleteOrderItem',
      payload: { orderId, itemId },
    })
  }

  const executeDeleteOrderItem = async (orderId, itemId) => {
    const key = `${orderId}-${itemId}`
    try {
      setDeletingItemKey(key)
      await api.deleteOrderItem(orderId, itemId)
      await loadOrders()
      setExpandedOrderIds(prev => new Set(prev).add(orderId))
    } catch (err) {
      console.error('Ошибка удаления позиции:', err)
      showToast('Ошибка при удалении позиции: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setDeletingItemKey(null)
    }
  }

  const handleConfirmDialog = async () => {
    if (!confirmDialog) return
    const { action, payload } = confirmDialog
    setConfirmDialog(null)
    if (action === 'bulkStatus') {
      await performBulkStatusChange(payload.orderIds, payload.newStatus)
      return
    }
    if (action === 'deleteOrder') {
      await executeDeleteOrder(payload.orderId)
      return
    }
    if (action === 'removeAdminCartItem') {
      await executeRemoveAdminCartItem(payload.cartItemId)
      return
    }
    if (action === 'deleteOrderItem') {
      await executeDeleteOrderItem(payload.orderId, payload.itemId)
    }
  }

  const handleToggleInParcel = async (orderId, itemId, currentAddedToParcel) => {
    const key = `${orderId}-${itemId}`
    const nextValue = !currentAddedToParcel
    try {
      setInParcelTogglingKey(key)
      await api.setOrderItemInParcel(orderId, itemId, nextValue)
      setOrders(prev => prev.map(o => {
        if (getOrderId(o) !== orderId) return o
        const items = (o.orderItems || o.OrderItems || []).map(it => {
          const itId = it.id ?? it.Id
          if (itId !== itemId) return it
          return { ...it, addedToParcel: nextValue, AddedToParcel: nextValue }
        })
        return { ...o, orderItems: items, OrderItems: items }
      }))
    } catch (err) {
      console.error('Ошибка отметки «в посылку»:', err)
      showToast('Ошибка: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setInParcelTogglingKey(null)
    }
  }

  const handleApplySale = async () => {
    const ids = Array.from(selectedOrders)
    if (ids.length === 0) return
    try {
      setApplyingDiscount(true)
      if (saleType === 'fixed') {
        await api.applyDiscount(ids, 'Fixed', saleFixedPercent, null, null, null)
      } else {
        await api.applyDiscount(ids, 'ByCondition', null, saleCond1, saleCond3, saleCond5)
      }
      setSaleModalOpen(false)
      await loadOrders()
    } catch (err) {
      console.error('Ошибка применения скидки:', err)
      showToast('Ошибка: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setApplyingDiscount(false)
    }
  }

  const handleRemoveOrderDiscount = async (orderId) => {
    try {
      await api.removeOrderDiscount(orderId)
      await loadOrders()
      setSaleModalOpen(false)
    } catch (err) {
      console.error('Ошибка отмены скидки:', err)
      showToast('Ошибка: ' + (err.message || 'Неизвестная ошибка'))
    }
  }

  const handleSetOrderDiscountPercent = async (orderId, percent) => {
    try {
      await api.setOrderDiscount(orderId, percent)
      setOrderDiscountModal(null)
      await loadOrders()
    } catch (err) {
      console.error('Ошибка установки скидки:', err)
      showToast('Ошибка: ' + (err.message || 'Неизвестная ошибка'))
    }
  }

  if (loading) {
    return (
      <PageShell title="Управление заказами">
        <div className="admin-orders-page">
          <div className="loading">Загрузка заказов...</div>
        </div>
      </PageShell>
    )
  }

  const totalOrders = orders.length
  const selectedCount = selectedOrders.size

  return (
    <PageShell
      title="Управление заказами"
      actions={(
        <div className="header-actions header-actions--row">
          {selectedCount > 0 && (
            <button
              type="button"
              className="btn btn-sale"
              onClick={() => setSaleModalOpen(true)}
            >
              🏷️ Распродажа
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadOrders}
            disabled={loading}
          >
            🔄 Обновить
          </button>
        </div>
      )}
    >
      <div className="admin-orders-page">

      {/* Группировка и фильтры */}
      <div className={`status-filters ${filtersExpanded ? 'status-filters--expanded' : 'status-filters--collapsed'}`}>
        <button
          type="button"
          className="status-filters-toggle-btn"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          aria-expanded={filtersExpanded}
        >
          {filtersExpanded ? '▼ Скрыть фильтры' : '▶ Фильтры'}
        </button>
        <div className="status-filters-body">
        <div className="group-by-row">
          <span className="group-by-label">Группировка:</span>
          <button
            type="button"
            className={`group-by-btn ${groupBy === 'status' ? 'active' : ''}`}
            onClick={() => setGroupBy('status')}
          >
            По статусу
          </button>
          <button
            type="button"
            className={`group-by-btn ${groupBy === 'client' ? 'active' : ''}`}
            onClick={() => setGroupBy('client')}
          >
            По клиенту
          </button>
        </div>
        <button
          className={`status-filter-btn ${selectedStatusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedStatusFilter('all')}
        >
          Все ({totalOrders})
        </button>
        <button
          className={`status-filter-btn ${selectedStatusFilter === 'cart' ? 'active' : ''}`}
          onClick={() => setSelectedStatusFilter('cart')}
        >
          В корзинах ({adminCartItems.length})
        </button>
        {groupBy === 'status' && ORDER_STATUSES_ALL.map(status => {
          const count = (groupedOrders[status] || []).length
          return (
            <button
              key={status}
              className={`status-filter-btn ${selectedStatusFilter === status ? 'active' : ''}`}
              onClick={() => setSelectedStatusFilter(status)}
              style={{ '--status-color': ORDER_STATUS_COLORS[status] }}
            >
              {status} ({count})
            </button>
          )
        })}
        <button
          className={`filter-discount-btn ${discountFilter === 'withDiscount' ? 'active' : ''}`}
          onClick={() => setDiscountFilter(discountFilter === 'withDiscount' ? 'all' : 'withDiscount')}
          title="Показать только заказы со скидкой"
        >
          🏷️ Со скидкой ({orders.filter(hasOrderDiscount).length})
        </button>
        </div>
      </div>

      {/* Массовые действия */}
      {selectedStatusFilter !== 'cart' && selectedCount > 0 && (
        <div className="bulk-actions">
          <div className="bulk-actions-info">
            Выбрано: <strong>{selectedCount}</strong> заказ(ов)
          </div>
          <div className="bulk-actions-buttons">
            <button
              type="button"
              className="btn btn-small btn-sale-inline"
              onClick={() => setSaleModalOpen(true)}
              disabled={bulkUpdating}
            >
              🏷️ Распродажа
            </button>
            {ORDER_STATUSES_ADMIN.map(status => (
              <button
                key={status}
                className="btn btn-small"
                onClick={() => handleBulkStatusChange(status)}
                disabled={bulkUpdating}
                style={{ 
                  backgroundColor: ORDER_STATUS_COLORS[status],
                  color: 'white',
                  border: 'none'
                }}
              >
                {bulkUpdating ? 'Обновление...' : `→ ${status}`}
              </button>
            ))}
          </div>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setSelectedOrders(new Set())}
          >
            Снять выделение
          </button>
        </div>
      )}

      {/* Группированный список заказов */}
      {selectedStatusFilter === 'cart' ? (
        <div className="orders-groups">
          <div className="order-group">
            <div className="order-group-header" style={{ borderLeftColor: '#667eea' }}>
              <div className="group-header-left">
                <h2 style={{ color: '#667eea', cursor: 'default' }}>
                  Товары в корзинах ({adminCartItems.length})
                </h2>
              </div>
              <button type="button" className="btn btn-secondary btn-small" onClick={loadAdminCartItems} disabled={loadingAdminCart}>
                {loadingAdminCart ? 'Обновление...' : '🔄 Обновить'}
              </button>
            </div>
            <div className="order-group-content">
              <div className="admin-cart-list admin-cart-list--embedded">
                {adminCartItems.length === 0 ? (
                  <p className="admin-cart-empty">Активных товаров в корзинах нет</p>
                ) : (
                  adminCartItems.map((item) => {
                    const id = item.id ?? item.Id
                    const userId = item.userId ?? item.UserId
                    const sessionId = item.sessionId ?? item.SessionId
                    const imageUrl = getCartImageUrl(item)
                    const productName = item.productName ?? item.ProductName ?? '—'
                    const productBrand = item.productBrand ?? item.ProductBrand
                    const updatedAt = item.updatedAt ?? item.UpdatedAt
                    return (
                      <div key={id} className="admin-cart-item-card">
                        {imageUrl ? (
                          <img className="admin-cart-item-image" src={imageUrl} alt="" />
                        ) : (
                          <div className="admin-cart-item-image admin-cart-item-image--empty">фото</div>
                        )}
                        <div className="admin-cart-item-info">
                          <strong>{productName}</strong>
                          {productBrand && <span>Бренд: {productBrand}</span>}
                          <span>Владелец: {userId ? `user #${userId}` : `guest (${sessionId || '—'})`}</span>
                          <span>Обновлено: {formatDate(updatedAt)}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-delete-item"
                          onClick={() => handleRemoveAdminCartItem(id)}
                          disabled={removingAdminCartItemId === id}
                          title="Убрать из корзины"
                        >
                          {removingAdminCartItemId === id ? '…' : 'Убрать'}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
      <div className="orders-groups">
        {Object.entries(filteredGroups).map(([groupKey, statusOrders]) => {
          if (statusOrders.length === 0) return null
          const isExpanded = expandedGroups.has(groupKey)
          const groupOrderIds = statusOrders
            .filter(o => !isOrderStatusLocked(o))
            .map(o => getOrderId(o))
          const allGroupSelected = groupOrderIds.length > 0 && groupOrderIds.every(id => selectedOrders.has(id))
          const someGroupSelected = groupOrderIds.some(id => selectedOrders.has(id))
          const groupTitle = groupBy === 'client' ? getCustomerName(statusOrders[0]) : groupKey
          const groupColor = groupBy === 'status' ? ORDER_STATUS_COLORS[groupKey] : '#718096'

          return (
            <div key={groupKey} className="order-group">
              <div
                className="order-group-header"
                style={{ borderLeftColor: groupColor }}
              >
                <div className="group-header-left">
                  <input
                    type="checkbox"
                    checked={allGroupSelected}
                    ref={input => {
                      if (input) input.indeterminate = someGroupSelected && !allGroupSelected
                    }}
                    onChange={() => toggleGroupSelection(groupKey)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <h2
                    onClick={() => toggleGroupExpansion(groupKey)}
                    style={{ cursor: 'pointer', color: groupColor }}
                  >
                    {groupTitle} ({statusOrders.length})
                  </h2>
                </div>
                <button
                  className="expand-btn"
                  onClick={() => toggleGroupExpansion(groupKey)}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>

              {isExpanded && (
                <div className="order-group-content">
                  <table className="orders-table">
                    <colgroup>
                      <col style={{ width: '36px' }} />
                      <col style={{ width: '40px' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '0%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="expand-column"></th>
                        <th className="checkbox-column">
                          <input
                            type="checkbox"
                            checked={allGroupSelected}
                            ref={input => {
                              if (input) input.indeterminate = someGroupSelected && !allGroupSelected
                            }}
                            onChange={() => toggleGroupSelection(groupKey)}
                          />
                        </th>
                        <SortableTh sortKey="number" className="th-number">Номер</SortableTh>
                        <SortableTh sortKey="client" className="th-client">Клиент</SortableTh>
                        <SortableTh sortKey="phone" className="th-phone">Телефон</SortableTh>
                        <SortableTh sortKey="date" className="th-date">Дата</SortableTh>
                        <th className="th-open-details">Подробнее</th>
                        <SortableTh sortKey="amount">Сумма</SortableTh>
                        <th className="th-status-actions">Статус и действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortOrdersInGroup(statusOrders).map(order => {
                        const orderId = getOrderId(order)
                        const isSelected = selectedOrders.has(orderId)
                        const isUpdating = updatingStatuses.has(orderId)
                        const currentStatus = getOrderStatus(order)
                        const statusLocked = isOrderStatusLocked(order)
                        const items = getOrderItems(order)
                        const isOrderExpanded = expandedOrderIds.has(orderId)
                        const parcelActionsAllowed = currentStatus === 'В сборке'
                        const highlightMissingParcel = shouldHighlightMissingParcel(order)

                        return (
                          <Fragment key={orderId}>
                            <tr
                              className={`${isSelected ? 'row-selected' : ''} ${orderRowMenuOpen === orderId ? 'row-menu-open' : ''}`.trim()}
                            >
                              <td className="expand-column">
                                {items.length > 0 && (
                                  <button
                                    type="button"
                                    className="btn-expand-items"
                                    onClick={(e) => { e.stopPropagation(); toggleOrderExpanded(orderId) }}
                                    title={isOrderExpanded ? 'Свернуть товары' : 'Развернуть товары'}
                                  >
                                    {isOrderExpanded ? '▼' : '▶'}
                                  </button>
                                )}
                              </td>
                              <td className="checkbox-column">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleOrderSelection(orderId)}
                                  onClick={(e) => e.stopPropagation()}
                                  disabled={statusLocked}
                                />
                              </td>
                              <td className="td-number">
                                <strong>{getOrderNumber(order)}</strong>
                                {hasOrderDiscount(order) && (
                                  <span className="order-discount-icon" title="У заказа есть скидка">🏷️</span>
                                )}
                              </td>
                              <td className="td-client client-cell">
                                {hasClientLink(order) ? (
                                  <a
                                    href={getCustomerProfileLink(order)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="client-link-telegram"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Открыть профиль/чат в Telegram"
                                  >
                                    {getCustomerName(order)}
                                  </a>
                                ) : (
                                  getCustomerName(order)
                                )}
                              </td>
                              <td className="td-phone">{getCustomerPhone(order)}</td>
                              <td className="td-date">{formatDate(order.createdAt || order.CreatedAt)}</td>
                              <td className="td-open-details">
                                <button type="button" className="btn-open-order-details" onClick={(e) => { e.stopPropagation(); setOrderDetailsOrderId(orderId) }}>
                                  Подробнее
                                </button>
                              </td>
                              <td>
                                <strong>{formatPrice(getFinalAmount(order))}</strong>
                                {hasOrderDiscount(order) && getFinalAmount(order) !== getTotalAmount(order) && (
                                  <span className="order-sum-original"> ({formatPrice(getTotalAmount(order))})</span>
                                )}
                              </td>
                              <td className="status-actions-cell">
                                <div className="status-actions-wrapper">
                                  <select
                                    value={currentStatus}
                                    onChange={(e) => handleStatusChange(orderId, e.target.value)}
                                    disabled={isUpdating || statusLocked}
                                    className="status-select status-select--colored"
                                    style={getOrderStatusSelectSurfaceStyle(currentStatus)}
                                    onClick={(e) => e.stopPropagation()}
                                    title={STATUS_TOOLTIPS[currentStatus]}
                                  >
                                    {getAdminStatusSelectOptions(currentStatus).map(s => (
                                      <option key={s} value={s} style={getOrderStatusOptionStyle(s)}>{s}</option>
                                    ))}
                                  </select>
                                  <div className="order-row-dropdown">
                                    <button
                                      type="button"
                                      className="btn-order-menu-trigger"
                                      onClick={(e) => { e.stopPropagation(); setOrderRowMenuOpen(orderRowMenuOpen === orderId ? null : orderId) }}
                                      title="Ещё"
                                      aria-expanded={orderRowMenuOpen === orderId}
                                    >
                                      ⋯
                                    </button>
                                    {orderRowMenuOpen === orderId && (
                                      <>
                                        <div className="order-row-dropdown-backdrop" onClick={(e) => { e.stopPropagation(); setOrderRowMenuOpen(null) }} />
                                        <div className="order-row-dropdown-menu">
                                          <button type="button" onClick={(e) => { e.stopPropagation(); setOrderRowMenuOpen(null); setOrderDiscountModal(orderId) }}>
                                            🏷️ Скидка
                                          </button>
                                          <button type="button" className="order-row-dropdown-delete" onClick={(e) => { e.stopPropagation(); setOrderRowMenuOpen(null); handleDeleteOrder(orderId) }} disabled={deletingOrderId === orderId}>
                                            {deletingOrderId === orderId ? '…' : '🗑️ Удалить'}
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                            {isOrderExpanded && items.length > 0 && (
                              <tr key={`${orderId}-items`} className="order-items-tr">
                                <td colSpan={9} className="order-items-td">
                                  <div className="order-items-list">
                                    {items.map(item => {
                                      const itemId = item.id ?? item.Id
                                      const imgUrl = getItemImageUrl(item)
                                      const name = item.productName ?? item.ProductName ?? '—'
                                      const size = item.size ?? item.Size ?? ''
                                      const brand = item.brand ?? item.Brand ?? ''
                                      const color = item.color ?? item.Color ?? ''
                                      const addedToParcel = isItemAddedToParcel(item)
                                      const key = `${orderId}-${itemId}`
                                      const isDeleting = deletingItemKey === key
                                      const isTogglingInParcel = inParcelTogglingKey === key
                                      return (
                                        <div key={itemId} className={`order-item-card${addedToParcel ? ' order-item-card--in-parcel' : ''}${highlightMissingParcel && !addedToParcel ? ' order-item-card--missing-parcel' : ''}`}>
                                          {imgUrl ? (
                                            <div 
                                              className="order-item-photo"
                                              onClick={() => openPhotoCarousel(item.productId ?? item.ProductId, imgUrl)}
                                              role="button"
                                              tabIndex={0}
                                              onKeyDown={(e) => e.key === 'Enter' && openPhotoCarousel(item.productId ?? item.ProductId, imgUrl)}
                                              title="Открыть фото (карусель)"
                                            >
                                              <img src={imgUrl} alt="" />
                                            </div>
                                          ) : (
                                            <div className="order-item-photo order-item-photo-placeholder">фото</div>
                                          )}
                                          <div className="order-item-info">
                                            <strong>{name}</strong>
                                            {size && <span className="order-item-meta">Размер: {size}</span>}
                                            {brand && <span className="order-item-meta">Бренд: {brand}</span>}
                                            {color && <span className="order-item-meta">Цвет: {color}</span>}
                                          </div>
                                          <div className="order-item-actions">
                                            {parcelActionsAllowed && (
                                              <>
                                            <button
                                              type="button"
                                              className="btn-in-parcel"
                                              onClick={(e) => { e.stopPropagation(); handleToggleInParcel(orderId, itemId, addedToParcel) }}
                                              disabled={isTogglingInParcel}
                                              title={addedToParcel ? 'Убрать отметку «в посылке»' : 'Отметить: добавлен в посылку'}
                                            >
                                              {isTogglingInParcel ? '…' : (addedToParcel ? '✓ В посылке' : 'В посылку')}
                                            </button>
                                            <button
                                              type="button"
                                              className="btn-delete-item"
                                              onClick={(e) => { e.stopPropagation(); handleDeleteOrderItem(orderId, itemId) }}
                                              disabled={isDeleting}
                                              title="Удалить товар из заказа"
                                            >
                                              {isDeleting ? '…' : 'Удалить'}
                                            </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
      )}

      {totalOrders === 0 && (
        <div className="empty-state">
          <p>Заказы не найдены</p>
        </div>
      )}

      {statusChangeWarning && (
        <div className="modal-overlay" onClick={() => setStatusChangeWarning(null)}>
          <div className="modal-content status-warning-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Проверка перед сменой статуса</h3>
            <p>{statusChangeWarning.text}</p>
            <div className="modal-actions status-warning-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStatusChangeWarning(null)}>
                Отмена
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmStatusWarning}>
                Перевести
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно распродажи */}
      {saleModalOpen && (
        <div className="modal-overlay" onClick={() => !applyingDiscount && setSaleModalOpen(false)}>
          <div className="modal-content sale-modal" onClick={e => e.stopPropagation()}>
            <h3>Распродажа</h3>
            <p className="modal-sub">Выбрано заказов: {selectedCount}</p>
            <div className="sale-type-row">
              <label>
                <input type="radio" checked={saleType === 'fixed'} onChange={() => setSaleType('fixed')} />
                Фиксированная скидка
              </label>
              <label>
                <input type="radio" checked={saleType === 'byCondition'} onChange={() => setSaleType('byCondition')} />
                Скидка по условию
              </label>
            </div>
            {saleType === 'fixed' && (
              <div className="sale-input-row">
                <label>Скидка, %</label>
                <input type="number" min={0} max={100} value={saleFixedPercent} onChange={e => setSaleFixedPercent(Number(e.target.value) || 0)} />
              </div>
            )}
            {saleType === 'byCondition' && (
              <div className="sale-conditions">
                <div className="sale-input-row">
                  <label>1 вещь, %</label>
                  <input type="number" min={0} max={100} value={saleCond1} onChange={e => setSaleCond1(Number(e.target.value) || 0)} />
                </div>
                <div className="sale-input-row">
                  <label>3 вещи, %</label>
                  <input type="number" min={0} max={100} value={saleCond3} onChange={e => setSaleCond3(Number(e.target.value) || 0)} />
                </div>
                <div className="sale-input-row">
                  <label>5 и более, %</label>
                  <input type="number" min={0} max={100} value={saleCond5} onChange={e => setSaleCond5(Number(e.target.value) || 0)} />
                </div>
              </div>
            )}
            <div className="sale-selected-list">
              <strong>Выбранные заказы (можно снять скидку):</strong>
              {Array.from(selectedOrders).map(oid => {
                const order = orders.find(o => getOrderId(o) === oid)
                return (
                  <div key={oid} className="sale-selected-item">
                    <span>{getOrderNumber(order || {})} — {order ? getCustomerName(order) : ''}</span>
                    {order && hasOrderDiscount(order) && (
                      <button type="button" className="btn-cancel-discount" onClick={() => handleRemoveOrderDiscount(oid)}>
                        Отменить скидку
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setSaleModalOpen(false)} disabled={applyingDiscount}>
                Закрыть
              </button>
              <button type="button" className="btn btn-primary" onClick={handleApplySale} disabled={applyingDiscount}>
                {applyingDiscount ? 'Применяем…' : 'Применить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно скидки для одного заказа */}
      {orderDiscountModal != null && (
        <OrderDiscountSingleModal
          orderId={orderDiscountModal}
          order={orders.find(o => getOrderId(o) === orderDiscountModal)}
          getOrderNumber={getOrderNumber}
          getCustomerName={getCustomerName}
          getTotalAmount={getTotalAmount}
          getFinalAmount={getFinalAmount}
          formatPrice={formatPrice}
          hasDiscount={(() => { const o = orders.find(ord => getOrderId(ord) === orderDiscountModal); return o && hasOrderDiscount(o) })()}
          onClose={() => setOrderDiscountModal(null)}
          onApply={(percent) => handleSetOrderDiscountPercent(orderDiscountModal, percent)}
          onRemove={() => { handleRemoveOrderDiscount(orderDiscountModal); setOrderDiscountModal(null) }}
        />
      )}

      {/* Детали заказа (модалка) */}
      {orderDetailsOrderId != null && (() => {
        const order = orders.find(o => getOrderId(o) === orderDetailsOrderId)
        if (!order) return null
        const items = getOrderItems(order)
        const currentStatus = getOrderStatus(order)
        const statusLocked = isOrderStatusLocked(order)
        const parcelActionsAllowed = currentStatus === 'В сборке'
        const statusHistory = order.statusHistory || order.StatusHistory || []
        const isUpdating = updatingStatuses.has(orderDetailsOrderId)
        const highlightMissingParcel = shouldHighlightMissingParcel(order)
        return (
          <div className="modal-overlay order-details-overlay" onClick={() => setOrderDetailsOrderId(null)}>
            <div className="modal-content order-details-modal" onClick={e => e.stopPropagation()}>
              <div className="order-details-header">
                <h3>Заказ {getOrderNumber(order)}</h3>
                <button type="button" className="btn-close-modal" onClick={() => setOrderDetailsOrderId(null)} aria-label="Закрыть">×</button>
              </div>
              <div className="order-details-body">
                <p><strong>Номер:</strong> {getOrderNumber(order)}</p>
                <p><strong>Телефон:</strong> {getCustomerPhone(order)}</p>
                <p><strong>Клиент:</strong> {hasClientLink(order) ? (
                  <a href={getCustomerProfileLink(order)} target="_blank" rel="noopener noreferrer" className="client-link-telegram">{getCustomerName(order)}</a>
                ) : getCustomerName(order)}</p>
                <p><strong>Дата:</strong> {formatDate(order.createdAt || order.CreatedAt)}</p>
                <p><strong>Сумма:</strong> {formatPrice(getFinalAmount(order))}{hasOrderDiscount(order) && getFinalAmount(order) !== getTotalAmount(order) && ` (${formatPrice(getTotalAmount(order))})`}</p>
                <div className="order-details-actions">
                  <label>Статус:</label>
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(orderDetailsOrderId, e.target.value)}
                    disabled={isUpdating || statusLocked}
                    className="status-select status-select--colored"
                    style={getOrderStatusSelectSurfaceStyle(currentStatus)}
                  >
                    {getAdminStatusSelectOptions(currentStatus).map(s => (
                      <option key={s} value={s} style={getOrderStatusOptionStyle(s)}>{s}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secondary" onClick={() => { setOrderDetailsOrderId(null); setOrderDiscountModal(orderDetailsOrderId) }}>🏷️ Скидка</button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setOrderDetailsOrderId(null); handleDeleteOrder(orderDetailsOrderId) }} disabled={deletingOrderId === orderDetailsOrderId}>🗑️ Удалить</button>
                </div>
                {Array.isArray(statusHistory) && statusHistory.length > 0 && (
                  <div className="order-details-status-history">
                    <h4>История статусов</h4>
                    <ul className="order-status-history-list">
                      {statusHistory.map((row, idx) => {
                        const st = row.status || row.Status || '—'
                        const at = row.changedAtUtc || row.ChangedAtUtc
                        const actor = row.actorKind || row.ActorKind || ''
                        const label = at ? new Date(at).toLocaleString('ru-RU') : '—'
                        return (
                          <li key={`${idx}-${st}-${label}`}>
                            <strong>{st}</strong>
                            <span className="order-status-history-meta">{label}{actor ? ` · ${actor}` : ''}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                <h4>Товары</h4>
                <div className="order-items-list order-details-items">
                  {items.map(item => {
                    const itemId = item.id ?? item.Id
                    const imgUrl = getItemImageUrl(item)
                    const name = item.productName ?? item.ProductName ?? '—'
                    const size = item.size ?? item.Size ?? ''
                    const brand = item.brand ?? item.Brand ?? ''
                    const color = item.color ?? item.Color ?? ''
                    const addedToParcel = isItemAddedToParcel(item)
                    const key = `${orderDetailsOrderId}-${itemId}`
                    const isDeleting = deletingItemKey === key
                    const isTogglingInParcel = inParcelTogglingKey === key
                    return (
                      <div key={itemId} className={`order-item-card${addedToParcel ? ' order-item-card--in-parcel' : ''}${highlightMissingParcel && !addedToParcel ? ' order-item-card--missing-parcel' : ''}`}>
                        {imgUrl ? (
                          <div className="order-item-photo" onClick={() => openPhotoCarousel(item.productId ?? item.ProductId, imgUrl)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openPhotoCarousel(item.productId ?? item.ProductId, imgUrl)} title="Открыть фото">
                            <img src={imgUrl} alt="" />
                          </div>
                        ) : (
                          <div className="order-item-photo order-item-photo-placeholder">фото</div>
                        )}
                        <div className="order-item-info">
                          <strong>{name}</strong>
                          {size && <span className="order-item-meta">Размер: {size}</span>}
                          {brand && <span className="order-item-meta">Бренд: {brand}</span>}
                          {color && <span className="order-item-meta">Цвет: {color}</span>}
                        </div>
                        <div className="order-item-actions">
                          {parcelActionsAllowed && (
                            <>
                          <button type="button" className="btn-in-parcel" onClick={() => handleToggleInParcel(orderDetailsOrderId, itemId, addedToParcel)} disabled={isTogglingInParcel}>
                            {isTogglingInParcel ? '…' : (addedToParcel ? '✓ В посылке' : 'В посылку')}
                          </button>
                          <button type="button" className="btn-delete-item" onClick={() => handleDeleteOrderItem(orderDetailsOrderId, itemId)} disabled={isDeleting}>{isDeleting ? '…' : 'Удалить'}</button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Карусель фото товара */}
      {imageCarousel && (
        <div className="modal-overlay image-carousel-overlay" onClick={() => setImageCarousel(null)}>
          <div className="image-carousel-modal" onClick={e => e.stopPropagation()}>
            <button type="button" className="carousel-close" onClick={() => setImageCarousel(null)} aria-label="Закрыть">×</button>
            <img src={imageCarousel.urls[imageCarousel.currentIndex]} alt="" className="carousel-image" />
            {imageCarousel.urls.length > 1 && (
              <>
                <button type="button" className="carousel-prev" onClick={(e) => { e.stopPropagation(); setImageCarousel(prev => ({ ...prev, currentIndex: (prev.currentIndex - 1 + prev.urls.length) % prev.urls.length })) }}>‹</button>
                <button type="button" className="carousel-next" onClick={(e) => { e.stopPropagation(); setImageCarousel(prev => ({ ...prev, currentIndex: (prev.currentIndex + 1) % prev.urls.length })) }}>›</button>
                <div className="carousel-dots">
                  {imageCarousel.urls.map((_, i) => (
                    <button key={i} type="button" className={`carousel-dot ${i === imageCarousel.currentIndex ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setImageCarousel(prev => ({ ...prev, currentIndex: i })) }} aria-label={`Фото ${i + 1}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {imageModalUrl && (
        <div
          className="image-modal-overlay"
          onClick={() => setImageModalUrl(null)}
          onKeyDown={(e) => e.key === 'Escape' && setImageModalUrl(null)}
          role="button"
          tabIndex={0}
          aria-label="Закрыть"
        >
          <img src={imageModalUrl} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title || 'Подтвердите действие'}
        message={confirmDialog?.message || ''}
        confirmLabel={confirmDialog?.confirmLabel || 'Подтвердить'}
        variant={confirmDialog?.variant || 'danger'}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={handleConfirmDialog}
      />
    </div>
    </PageShell>
  )
}

export default AdminOrders
