import { useState, useEffect, useMemo, Fragment } from 'react'
import { api } from '../services/api'
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

const ORDER_STATUSES = [
  'Формирование заказа',
  'Ожидает оплату',
  'В сборке',
  'На доставку',
  'Отправлен',
  'Отменен'
]

const STATUS_COLORS = {
  'Формирование заказа': '#a0aec0',
  'Ожидает оплату': '#4299e1',
  'В сборке': '#ed8936',
  'На доставку': '#667eea',
  'Отправлен': '#48bb78',
  'Отменен': '#e53e3e'
}

const STATUS_TOOLTIPS = {
  'Формирование заказа': 'Начальный статус: покупатель собирает корзину, можно добавлять товары в заказ',
  'Ожидает оплату': 'Покупатель оформил заказ. Отправлено сообщение об успешном оформлении и необходимости оплаты. Добавлять товары в заказ нельзя',
  'В сборке': 'Заказ собирается и подготавливается к отправке',
  'На доставку': 'Заказ собран, упакован; ожидаются данные от покупателя (адрес, способ отправки)',
  'Отправлен': 'Финальный статус. Карточка товара более не доступна для публикации в канал',
  'Отменен': 'Заказ отменён'
}

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState(new Set())
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [expandedGroups, setExpandedGroups] = useState(new Set(ORDER_STATUSES))
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
  const [orderRowMenuOpen, setOrderRowMenuOpen] = useState(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [orderDetailsOrderId, setOrderDetailsOrderId] = useState(null)
  const [imageCarousel, setImageCarousel] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await api.getAllOrders()
      setOrders(data)
    } catch (err) {
      console.error('Ошибка загрузки заказов:', err)
      alert('Ошибка при загрузке заказов: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setLoading(false)
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

  // Группировка заказов по статусам
  const groupedOrders = useMemo(() => {
    const grouped = {}
    ORDER_STATUSES.forEach(status => {
      grouped[status] = []
    })
    const statusMap = { 'В пути': 'На доставку', 'Доставлен': 'Отправлен' }
    ordersForGrouping.forEach(order => {
      let status = order.status || order.Status || ORDER_STATUSES[0]
      status = statusMap[status] || status
      if (grouped[status]) {
        grouped[status].push(order)
      } else {
        grouped[ORDER_STATUSES[0]].push(order)
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
      return groupedByClient
    }
    if (selectedStatusFilter === 'all') {
      return groupedOrders
    }
    return { [selectedStatusFilter]: groupedOrders[selectedStatusFilter] || [] }
  }, [groupBy, groupedOrders, groupedByClient, selectedStatusFilter])

  const toggleOrderSelection = (orderId) => {
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
    const groupOrderIds = groupOrders.map(o => getOrderId(o))
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
    const allOrderIds = orders.map(o => o.id || o.Id)
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
      setExpandedGroups(new Set(ORDER_STATUSES))
    }
  }, [groupBy, groupedByClient])

  const handleStatusChange = async (orderId, newStatus) => {
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
      alert('Ошибка при обновлении статуса: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setUpdatingStatuses(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedOrders.size === 0) {
      alert('Выберите хотя бы один заказ')
      return
    }

    if (!confirm(`Изменить статус ${selectedOrders.size} заказ(ов) на "${newStatus}"?`)) {
      return
    }

    try {
      setBulkUpdating(true)
      const orderIds = Array.from(selectedOrders)
      const results = await api.updateOrdersStatus(orderIds, newStatus)
      
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      
      if (failCount > 0) {
        alert(`Обновлено: ${successCount}, Ошибок: ${failCount}`)
      } else {
        alert(`Успешно обновлено ${successCount} заказ(ов)`)
      }
      
      await loadOrders()
      setSelectedOrders(new Set())
    } catch (err) {
      console.error('Ошибка массового обновления:', err)
      alert('Ошибка при обновлении статусов: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setBulkUpdating(false)
    }
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
    if (!window.confirm(`Удалить заказ ${orderNumber} из списка и из базы данных? Это действие нельзя отменить.`)) return
    try {
      setDeletingOrderId(orderId)
      await api.deleteOrder(orderId)
      await loadOrders()
    } catch (err) {
      console.error('Ошибка удаления заказа:', err)
      alert('Ошибка при удалении заказа: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setDeletingOrderId(null)
    }
  }

  const getOrderId = (order) => order.id || order.Id
  const getOrderNumber = (order) => order.orderNumber || order.OrderNumber || `#${getOrderId(order)}`
  const getOrderStatus = (order) => order.status || order.Status || ORDER_STATUSES[0]
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
      : 'http://89.104.67.36:55501'
    return base + (path.startsWith('/') ? path : '/' + path)
  }

  const openPhotoCarousel = async (productId, initialUrl) => {
    setImageCarousel({ urls: [initialUrl], currentIndex: 0 })
    try {
      const product = await api.getProduct(productId)
      const images = product?.images || product?.Images || []
      const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://89.104.67.36:55501'
      const fullUrls = images.map(p => (p && (p.startsWith('http') ? p : base + (p.startsWith('/') ? p : '/' + p))))
      if (fullUrls.length > 0) {
        const idx = fullUrls.findIndex(u => u === initialUrl)
        setImageCarousel({ urls: fullUrls, currentIndex: idx >= 0 ? idx : 0 })
      }
    } catch (_) {
      /* keep single image */
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
    if (!window.confirm('Удалить товар из заказа? Комментарий пользователя в Telegram будет удалён, товар перейдёт следующему в очереди.')) return
    const key = `${orderId}-${itemId}`
    try {
      setDeletingItemKey(key)
      await api.deleteOrderItem(orderId, itemId)
      await loadOrders()
      setExpandedOrderIds(prev => new Set(prev).add(orderId))
    } catch (err) {
      console.error('Ошибка удаления позиции:', err)
      alert('Ошибка при удалении позиции: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setDeletingItemKey(null)
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
      alert('Ошибка: ' + (err.message || 'Неизвестная ошибка'))
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
      alert('Ошибка: ' + (err.message || 'Неизвестная ошибка'))
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
      alert('Ошибка: ' + (err.message || 'Неизвестная ошибка'))
    }
  }

  const handleSetOrderDiscountPercent = async (orderId, percent) => {
    try {
      await api.setOrderDiscount(orderId, percent)
      setOrderDiscountModal(null)
      await loadOrders()
    } catch (err) {
      console.error('Ошибка установки скидки:', err)
      alert('Ошибка: ' + (err.message || 'Неизвестная ошибка'))
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка заказов...</div>
      </div>
    )
  }

  const totalOrders = orders.length
  const selectedCount = selectedOrders.size

  return (
    <div className="container">
      <div className="admin-orders-header">
        <h1>Управление заказами</h1>
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
      </div>

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
        {groupBy === 'status' && ORDER_STATUSES.map(status => {
          const count = (groupedOrders[status] || []).length
          return (
            <button
              key={status}
              className={`status-filter-btn ${selectedStatusFilter === status ? 'active' : ''}`}
              onClick={() => setSelectedStatusFilter(status)}
              style={{ '--status-color': STATUS_COLORS[status] }}
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
      {selectedCount > 0 && (
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
            {ORDER_STATUSES.map(status => (
              <button
                key={status}
                className="btn btn-small"
                onClick={() => handleBulkStatusChange(status)}
                disabled={bulkUpdating}
                style={{ 
                  backgroundColor: STATUS_COLORS[status],
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
      <div className="orders-groups">
        {Object.entries(filteredGroups).map(([groupKey, statusOrders]) => {
          if (statusOrders.length === 0) return null
          const isExpanded = expandedGroups.has(groupKey)
          const groupOrderIds = statusOrders.map(o => getOrderId(o))
          const allGroupSelected = groupOrderIds.length > 0 && groupOrderIds.every(id => selectedOrders.has(id))
          const someGroupSelected = groupOrderIds.some(id => selectedOrders.has(id))
          const groupTitle = groupBy === 'client' ? getCustomerName(statusOrders[0]) : groupKey
          const groupColor = groupBy === 'status' ? STATUS_COLORS[groupKey] : '#718096'

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
                        <th>Статус и действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortOrdersInGroup(statusOrders).map(order => {
                        const orderId = getOrderId(order)
                        const isSelected = selectedOrders.has(orderId)
                        const isUpdating = updatingStatuses.has(orderId)
                        const currentStatus = getOrderStatus(order)
                        const items = getOrderItems(order)
                        const isOrderExpanded = expandedOrderIds.has(orderId)

                        return (
                          <Fragment key={orderId}>
                            <tr
                              className={isSelected ? 'row-selected' : ''}
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
                                    disabled={isUpdating}
                                    className="status-select"
                                    onClick={(e) => e.stopPropagation()}
                                    title={STATUS_TOOLTIPS[currentStatus]}
                                  >
                                    {ORDER_STATUSES.map(s => (
                                      <option key={s} value={s}>{s}</option>
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
                                      const addedToParcel = !!(item.addedToParcel ?? item.AddedToParcel)
                                      const key = `${orderId}-${itemId}`
                                      const isDeleting = deletingItemKey === key
                                      const isTogglingInParcel = inParcelTogglingKey === key
                                      return (
                                        <div key={itemId} className={`order-item-card${addedToParcel ? ' order-item-card--in-parcel' : ''}`}>
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

      {totalOrders === 0 && (
        <div className="empty-state">
          <p>Заказы не найдены</p>
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
        const isUpdating = updatingStatuses.has(orderDetailsOrderId)
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
                    disabled={isUpdating}
                    className="status-select"
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secondary" onClick={() => { setOrderDetailsOrderId(null); setOrderDiscountModal(orderDetailsOrderId) }}>🏷️ Скидка</button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setOrderDetailsOrderId(null); handleDeleteOrder(orderDetailsOrderId) }} disabled={deletingOrderId === orderDetailsOrderId}>🗑️ Удалить</button>
                </div>
                <h4>Товары</h4>
                <div className="order-items-list order-details-items">
                  {items.map(item => {
                    const itemId = item.id ?? item.Id
                    const imgUrl = getItemImageUrl(item)
                    const name = item.productName ?? item.ProductName ?? '—'
                    const size = item.size ?? item.Size ?? ''
                    const brand = item.brand ?? item.Brand ?? ''
                    const color = item.color ?? item.Color ?? ''
                    const addedToParcel = !!(item.addedToParcel ?? item.AddedToParcel)
                    const key = `${orderDetailsOrderId}-${itemId}`
                    const isDeleting = deletingItemKey === key
                    const isTogglingInParcel = inParcelTogglingKey === key
                    return (
                      <div key={itemId} className={`order-item-card${addedToParcel ? ' order-item-card--in-parcel' : ''}`}>
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
                          <button type="button" className="btn-in-parcel" onClick={() => handleToggleInParcel(orderDetailsOrderId, itemId, addedToParcel)} disabled={isTogglingInParcel}>
                            {isTogglingInParcel ? '…' : (addedToParcel ? '✓ В посылке' : 'В посылку')}
                          </button>
                          <button type="button" className="btn-delete-item" onClick={() => handleDeleteOrderItem(orderDetailsOrderId, itemId)} disabled={isDeleting}>{isDeleting ? '…' : 'Удалить'}</button>
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
    </div>
  )
}

export default AdminOrders
