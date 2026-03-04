import { useState, useEffect } from 'react'
import { api } from '../services/api'
import Toast from '../components/Toast'
import './AdminTelegramErrors.css'

function AdminTelegramErrors() {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [expandedDates, setExpandedDates] = useState(new Set())

  useEffect(() => {
    loadErrors()
  }, [])

  const loadErrors = async () => {
    try {
      setLoading(true)
      const data = await api.getTelegramErrors()
      setErrors(data || {})
      
      // Expand today's errors by default
      const today = new Date().toISOString().split('T')[0]
      if (data && data[today]) {
        setExpandedDates(new Set([today]))
      }
    } catch (err) {
      console.error('Error loading errors:', err)
      setToast({ message: 'Ошибка при загрузке ошибок', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const toggleDate = (date) => {
    setExpandedDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        next.add(date)
      }
      return next
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту ошибку?')) {
      return
    }

    try {
      await api.deleteTelegramError(id)
      setToast({ message: 'Ошибка удалена', type: 'success' })
      loadErrors()
    } catch (err) {
      console.error('Error deleting error:', err)
      setToast({ message: 'Ошибка при удалении', type: 'error' })
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера'
    } else {
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading) {
    return <div className="container">Загрузка...</div>
  }

  const errorDates = Object.keys(errors).sort((a, b) => b.localeCompare(a))
  const totalErrors = Object.values(errors).reduce((sum, errs) => sum + errs.length, 0)

  return (
    <div className="container">
      <div className="admin-errors-header">
        <h1>Ошибки отправки в Telegram канал</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={loadErrors}>
            🔄 Обновить
          </button>
        </div>
      </div>

      {totalErrors === 0 ? (
        <div className="empty-state">
          <p>Ошибок не найдено</p>
        </div>
      ) : (
        <div className="errors-list">
          {errorDates.map(date => {
            const dateErrors = errors[date]
            const isExpanded = expandedDates.has(date)
            
            return (
              <div key={date} className="error-date-group">
                <div 
                  className="error-date-header"
                  onClick={() => toggleDate(date)}
                >
                  <span className="error-date-title">
                    {formatDate(date)} ({dateErrors.length})
                  </span>
                  <span className="error-date-toggle">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
                
                {isExpanded && (
                  <div className="error-date-content">
                    {dateErrors.map(error => (
                      <div key={error.id} className="error-item">
                        <div className="error-item-header">
                          <div className="error-item-time">
                            {formatTime(error.errorDate)}
                          </div>
                          <div className="error-item-type">
                            {error.errorType}
                          </div>
                          <button
                            className="btn btn-small btn-delete"
                            onClick={() => handleDelete(error.id)}
                          >
                            Удалить
                          </button>
                        </div>
                        <div className="error-item-message">
                          {error.message}
                        </div>
                        {error.productInfo && (
                          <div className="error-item-product">
                            <strong>Товар:</strong> {error.productInfo.substring(0, 200)}
                          </div>
                        )}
                        {error.imageCount && (
                          <div className="error-item-info">
                            Изображений: {error.imageCount}
                          </div>
                        )}
                        {error.details && (
                          <details className="error-item-details">
                            <summary>Детали ошибки</summary>
                            <pre>{error.details}</pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default AdminTelegramErrors
