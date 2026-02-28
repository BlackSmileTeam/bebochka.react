import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './AdminAnnouncements.css'

const DEFAULT_MESSAGE = `Анонс!

Всем доброе утречко ☕
Сегодня в 11:00 (по мск) обзор новинок для наших мальчишек/девочек 🐧

Всех очень жду🍬`

function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  
  const [formData, setFormData] = useState({
    message: DEFAULT_MESSAGE,
    scheduledAt: ''
  })
  const [channelMessage, setChannelMessage] = useState('')
  const [sendingChannel, setSendingChannel] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [announcementsData, productsData] = await Promise.all([
        api.getAnnouncements(),
        api.getUnpublishedProducts()
      ])
      console.log('Loaded announcements:', announcementsData)
      setAnnouncements(announcementsData || [])
      setProducts(productsData || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setAnnouncements([])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleProductToggle = (productId) => {
    console.log('Toggling product:', productId, 'Current selected:', selectedProducts)
    setSelectedProducts(prev => {
      const newSelection = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
      console.log('New selection:', newSelection)
      return newSelection
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.scheduledAt) {
      alert('Пожалуйста, укажите время отправки')
      return
    }

    try {
      // datetime-local gives "YYYY-MM-DDTHH:mm" (interpreted as Moscow time)
      // We need to send this as a DateTime that represents Moscow time components
      // Create a Date object with the components as UTC (which represents Moscow time)
      const [datePart, timePart] = formData.scheduledAt.split('T')
      const [year, month, day] = datePart.split('-').map(Number)
      const [hours, minutes] = timePart.split(':').map(Number)
      
      // Create Date object using UTC constructor, treating the input components as Moscow time
      // When JSON serializes this, it will send as ISO string in UTC
      // Backend will extract the components and treat them as Moscow time
      const scheduledAtDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))
      
      // Log for debugging
      console.log('Creating announcement with scheduled time:', {
        input: formData.scheduledAt,
        dateComponents: { year, month, day, hours, minutes },
        scheduledAtISO: scheduledAtDate.toISOString()
      })
      
      await api.createAnnouncement({
        message: formData.message,
        scheduledAt: scheduledAtDate.toISOString(),
        productIds: selectedProducts
      })

      alert('Анонс успешно создан!')
      setShowForm(false)
      setFormData({ message: DEFAULT_MESSAGE, scheduledAt: '' })
      setSelectedProducts([])
      loadData()
    } catch (err) {
      console.error('Error creating announcement:', err)
      alert('Ошибка при создании анонса: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот анонс?')) {
      return
    }

    try {
      await api.deleteAnnouncement(id)
      loadData()
    } catch (err) {
      console.error('Error deleting announcement:', err)
      alert('Ошибка при удалении анонса')
    }
  }

  const handleSendToChannel = async (e) => {
    e.preventDefault()
    
    if (!channelMessage.trim()) {
      alert('Пожалуйста, введите сообщение')
      return
    }

    try {
      setSendingChannel(true)
      const result = await api.sendMessageToChannel(channelMessage)
      if (result?.success) {
        alert('Сообщение успешно отправлено в канал!')
        setChannelMessage('')
      } else {
        alert(result?.message || 'Не удалось отправить сообщение в канал')
      }
    } catch (err) {
      console.error('Error sending message to channel:', err)
      alert('Ошибка при отправке сообщения в канал: ' + (err.message || 'Неизвестная ошибка'))
    } finally {
      setSendingChannel(false)
    }
  }


  const formatMoscowTime = (utcDateString) => {
    if (!utcDateString) return ''
    try {
      const utcDate = new Date(utcDateString)
      const moscowTime = new Date(utcDate.getTime() + 3 * 60 * 60 * 1000)
      return moscowTime.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return utcDateString
    }
  }

  if (loading) {
    return <div className="admin-announcements-container">Загрузка...</div>
  }

  // Ensure announcements is always an array
  const safeAnnouncements = Array.isArray(announcements) ? announcements : []

  return (
    <div className="admin-announcements-container">
      <div className="admin-announcements-header">
        <h1>Анонсы</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отменить' : '+ Создать анонс'}
        </button>
      </div>

      <div className="channel-message-section" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Отправка сообщения в канал</h2>
        <form onSubmit={handleSendToChannel}>
          <div className="form-group">
            <label>Сообщение для канала *</label>
            <textarea
              value={channelMessage}
              onChange={(e) => setChannelMessage(e.target.value)}
              rows={4}
              placeholder="Введите текст сообщения для отправки в канал..."
              required
              disabled={sendingChannel}
            />
          </div>
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={sendingChannel || !channelMessage.trim()}
            >
              {sendingChannel ? 'Отправка...' : '📢 Отправить в канал'}
            </button>
          </div>
        </form>
      </div>

      {showForm && (
        <div className="announcement-form">
          <h2>Создать новый анонс</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Сообщение *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={8}
                required
              />
            </div>

            <div className="form-group">
              <label>Время отправки (МСК) *</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Выберите товары для коллажа (до 4 изображений на коллаж, необязательно)</label>
              <div className="products-grid">
                {products.map(product => {
                  const productId = product.id || product.Id
                  const isSelected = selectedProducts.includes(productId)
                  return (
                  <div
                    key={productId}
                    className={`product-card ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleProductToggle(productId)
                    }}
                  >
                    {product.images && product.images.length > 0 && (
                      <img 
                        src={`http://89.104.67.36:55501${product.images[0]}`}
                        alt={product.name}
                      />
                    )}
                    <div className="product-info">
                      <h4>{product.name || product.Name}</h4>
                      <p>{product.brand || product.Brand}</p>
                    </div>
                    {isSelected && (
                      <div className="selected-indicator">✓</div>
                    )}
                  </div>
                  )
                })}
              </div>
              {products.length === 0 && (
                <p>Нет неопубликованных товаров</p>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Создать анонс</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Отменить
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="announcements-list">
        <h2>Запланированные анонсы</h2>
        {safeAnnouncements.length === 0 ? (
          <p>Нет запланированных анонсов</p>
        ) : (
          <table className="announcements-table">
            <thead>
              <tr>
                <th>Сообщение</th>
                <th>Время отправки</th>
                <th>Товаров</th>
                <th>Коллажей</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {safeAnnouncements.map(announcement => {
                const id = announcement.id || announcement.Id
                const message = announcement.message || announcement.Message || ''
                const scheduledAt = announcement.scheduledAt || announcement.ScheduledAt
                const productIds = announcement.productIds || announcement.ProductIds || []
                const collageImages = announcement.collageImages || announcement.CollageImages || []
                const isSent = announcement.isSent || announcement.IsSent || false
                const sentCount = announcement.sentCount || announcement.SentCount || 0
                
                // Safely get message substring
                const messageDisplay = (message && typeof message === 'string' && message.length > 0)
                  ? (message.length > 50 ? message.substring(0, 50) + '...' : message)
                  : ''
                
                return (
                  <tr key={id}>
                    <td>{messageDisplay}</td>
                    <td>{formatMoscowTime(scheduledAt)}</td>
                    <td>{Array.isArray(productIds) ? productIds.length : 0}</td>
                    <td>{Array.isArray(collageImages) ? collageImages.length : 0}</td>
                    <td>
                      {isSent ? (
                        <span className="status-sent">
                          Отправлено ({sentCount} пользователям)
                        </span>
                      ) : (
                        <span className="status-pending">Запланировано</span>
                      )}
                    </td>
                    <td>
                      {!isSent && (
                        <button
                          className="btn btn-small btn-delete"
                          onClick={() => handleDelete(id)}
                        >
                          Удалить
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminAnnouncements

