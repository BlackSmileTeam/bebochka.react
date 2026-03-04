import { useState, useEffect, useMemo } from 'react'
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
  const [updatingStatuses, setUpdatingStatuses] = useState(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)

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

  const getOrderId = (order) => order.id || order.Id
  const getOrderNumber = (order) => order.orderNumber || order.OrderNumber || `#${getOrderId(order)}`
  const getOrderStatus = (order) => order.status || order.Status || 'В сборке'
  const getTelegramUserId = (order) => order.telegramUserId || order.TelegramUserId
  const getTelegramUsername = (order) => order.telegramUsername || order.TelegramUsername || order.customerName || order.CustomerName
  const hasTelegram = (order) => !!getTelegramUserId(order)
  const getCustomerName = (order) => order.customerName || order.CustomerName || '-'
  const getCustomerPhone = (order) => order.customerPhone || order.CustomerPhone || '-'
  const getTotalAmount = (order) => order.totalAmount || order.TotalAmount || 0

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

                        return (
                          <tr 
                            key={orderId}
                            className={isSelected ? 'row-selected' : ''}
                          >
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
                              {hasTelegram(order) ? (
                                <a
                                  href={`tg://user?id=${getTelegramUserId(order)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="client-link-telegram"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Открыть чат в Telegram"
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
                              </div>
                            </td>
                          </tr>
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
    </div>
  )
}

export default AdminOrders
