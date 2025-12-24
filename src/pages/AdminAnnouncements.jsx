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
      setAnnouncements(announcementsData)
      setProducts(productsData)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProductToggle = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.scheduledAt) {
      alert('Пожалуйста, укажите время отправки')
      return
    }

    if (selectedProducts.length === 0) {
      alert('Пожалуйста, выберите хотя бы один товар')
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

  return (
    <div className="admin-announcements-container">
      <div className="admin-announcements-header">
        <h1>Анонсы</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отменить' : '+ Создать анонс'}
        </button>
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
              <label>Выберите товары для коллажа (до 4 изображений на коллаж) *</label>
              <div className="products-grid">
                {products.map(product => (
                  <div
                    key={product.id}
                    className={`product-card ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
                    onClick={() => handleProductToggle(product.id)}
                  >
                    {product.images && product.images.length > 0 && (
                      <img 
                        src={`http://89.104.67.36:55501${product.images[0]}`}
                        alt={product.name}
                      />
                    )}
                    <div className="product-info">
                      <h4>{product.name}</h4>
                      <p>{product.brand}</p>
                    </div>
                    {selectedProducts.includes(product.id) && (
                      <div className="selected-indicator">✓</div>
                    )}
                  </div>
                ))}
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
        {announcements.length === 0 ? (
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
              {announcements.map(announcement => (
                <tr key={announcement.id}>
                  <td>{announcement.message.substring(0, 50)}...</td>
                  <td>{formatMoscowTime(announcement.scheduledAt)}</td>
                  <td>{announcement.productIds?.length || 0}</td>
                  <td>{announcement.collageImages?.length || 0}</td>
                  <td>
                    {announcement.isSent ? (
                      <span className="status-sent">
                        Отправлено ({announcement.sentCount} пользователям)
                      </span>
                    ) : (
                      <span className="status-pending">Запланировано</span>
                    )}
                  </td>
                  <td>
                    {!announcement.isSent && (
                      <button
                        className="btn btn-small btn-delete"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminAnnouncements

