import { useState, useEffect, useMemo, Fragment } from 'react'
import { api } from '../services/api'
import './AdminOrders.css'

const ORDER_STATUSES = [
  'В сборке',
  'Ожидает оплату',
  'В пути',
  'Доставлен',
  'Отменен'
]

const STATUS_COLORS = {
  'В сборке': '#ed8936',
  'Ожидает оплату': '#4299e1',
  'В пути': '#667eea',
  'Доставлен': '#48bb78',
  'Отменен': '#e53e3e'
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
  const [imageModalUrl, setImageModalUrl] = useState(null)

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

  // Группировка заказов по статусам
  const groupedOrders = useMemo(() => {
    const grouped = {}
    ORDER_STATUSES.forEach(status => {
      grouped[status] = []
    })
    
    orders.forEach(order => {
      const status = order.status || order.Status || 'В сборке'
      if (grouped[status]) {
        grouped[status].push(order)
      } else {
        grouped['В сборке'].push(order)
      }
    })

    // Сортировка внутри каждой группы по дате создания (новые сверху)
    Object.keys(grouped).forEach(status => {
      grouped[status].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.CreatedAt || 0)
        const dateB = new Date(b.createdAt || b.CreatedAt || 0)
        return dateB - dateA
      })
    })

    return grouped
  }, [orders])

  // Фильтрация по выбранному статусу
  const filteredGroups = useMemo(() => {
    if (selectedStatusFilter === 'all') {
      return groupedOrders
    }
    return { [selectedStatusFilter]: groupedOrders[selectedStatusFilter] || [] }
  }, [groupedOrders, selectedStatusFilter])

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

  const toggleGroupSelection = (status) => {
    const groupOrders = filteredGroups[status] || []
    const groupOrderIds = groupOrders.map(o => o.id || o.Id)
    const allSelected = groupOrderIds.every(id => selectedOrders.has(id))
    
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

  const toggleGroupExpansion = (status) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

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
  const getOrderStatus = (order) => order.status || order.Status || 'В сборке'
  const getTelegramUserId = (order) => order.telegramUserId ?? order.TelegramUserId
  const getTelegramUsername = (order) => order.telegramUsername || order.TelegramUsername || order.customerName || order.CustomerName
  // Ссылка только на пользователя: id в Telegram у пользователей положительный, у чатов/обсуждений — отрицательный
  const hasTelegramUser = (order) => {
    const id = getTelegramUserId(order)
    return id != null && Number(id) > 0
  }
  const getCustomerName = (order) => order.customerName || order.CustomerName || '-'
  const getCustomerPhone = (order) => order.customerPhone || order.CustomerPhone || '-'
  const getTotalAmount = (order) => order.totalAmount || order.TotalAmount || 0

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
        <div className="header-actions">
          <button 
            className="btn btn-secondary" 
            onClick={loadOrders}
            disabled={loading}
          >
            🔄 Обновить
          </button>
        </div>
      </div>

      {/* Фильтры по статусам */}
      <div className="status-filters">
        <button
          className={`status-filter-btn ${selectedStatusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedStatusFilter('all')}
        >
          Все ({totalOrders})
        </button>
        {ORDER_STATUSES.map(status => {
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
      </div>

      {/* Массовые действия */}
      {selectedCount > 0 && (
        <div className="bulk-actions">
          <div className="bulk-actions-info">
            Выбрано: <strong>{selectedCount}</strong> заказ(ов)
          </div>
          <div className="bulk-actions-buttons">
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
        {Object.entries(filteredGroups).map(([status, statusOrders]) => {
          if (statusOrders.length === 0) return null
          
          const isExpanded = expandedGroups.has(status)
          const groupOrderIds = statusOrders.map(o => getOrderId(o))
          const allGroupSelected = groupOrderIds.length > 0 && groupOrderIds.every(id => selectedOrders.has(id))
          const someGroupSelected = groupOrderIds.some(id => selectedOrders.has(id))

          return (
            <div key={status} className="order-group">
              <div 
                className="order-group-header"
                style={{ borderLeftColor: STATUS_COLORS[status] }}
              >
                <div className="group-header-left">
                  <input
                    type="checkbox"
                    checked={allGroupSelected}
                    ref={input => {
                      if (input) input.indeterminate = someGroupSelected && !allGroupSelected
                    }}
                    onChange={() => toggleGroupSelection(status)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <h2 
                    onClick={() => toggleGroupExpansion(status)}
                    style={{ cursor: 'pointer', color: STATUS_COLORS[status] }}
                  >
                    {status} ({statusOrders.length})
                  </h2>
                </div>
                <button
                  className="expand-btn"
                  onClick={() => toggleGroupExpansion(status)}
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
                            onChange={() => toggleGroupSelection(status)}
                          />
                        </th>
                        <th>Номер</th>
                        <th>Клиент</th>
                        <th>Телефон</th>
                        <th>Дата</th>
                        <th>Сумма</th>
                        <th>Статус</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusOrders.map(order => {
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
                              <td><strong>{getOrderNumber(order)}</strong></td>
                              <td className="client-cell">
                                {hasTelegramUser(order) ? (
                                  <a
                                    href={`tg://user?id=${getTelegramUserId(order)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="client-link-telegram"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Открыть чат с пользователем в Telegram"
                                  >
                                    {getCustomerName(order)}
                                  </a>
                                ) : (
                                  getCustomerName(order)
                                )}
                              </td>
                              <td>{getCustomerPhone(order)}</td>
                              <td>{formatDate(order.createdAt || order.CreatedAt)}</td>
                              <td><strong>{formatPrice(getTotalAmount(order))}</strong></td>
                              <td className="status-cell">
                                <span 
                                  className="status-badge"
                                  style={{ backgroundColor: STATUS_COLORS[currentStatus] }}
                                >
                                  {currentStatus}
                                </span>
                              </td>
                              <td className="actions-cell">
                                <div className="actions-wrapper">
                                  <span 
                                    className="status-badge-mobile"
                                    style={{ backgroundColor: STATUS_COLORS[currentStatus] }}
                                  >
                                    {currentStatus}
                                  </span>
                                  <select
                                    value={currentStatus}
                                    onChange={(e) => handleStatusChange(orderId, e.target.value)}
                                    disabled={isUpdating}
                                    className="status-select"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {ORDER_STATUSES.map(s => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className="btn-delete-order"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteOrder(orderId) }}
                                    disabled={deletingOrderId === orderId}
                                    title="Удалить заказ из базы данных"
                                  >
                                    {deletingOrderId === orderId ? '…' : '🗑️'}
                                  </button>
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
                                      const key = `${orderId}-${itemId}`
                                      const isDeleting = deletingItemKey === key
                                      return (
                                        <div key={itemId} className="order-item-card">
                                          {imgUrl ? (
                                            <div 
                                              className="order-item-photo"
                                              onClick={() => setImageModalUrl(imgUrl)}
                                              role="button"
                                              tabIndex={0}
                                              onKeyDown={(e) => e.key === 'Enter' && setImageModalUrl(imgUrl)}
                                              title="Открыть в полном размере"
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
