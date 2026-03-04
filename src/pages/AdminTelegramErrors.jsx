import { useState, useEffect } from 'react'
import { api } from '../services/api'
import Toast from '../components/Toast'
import './AdminTelegramErrors.css'

function AdminTelegramErrors() {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [expandedDates, setExpandedDates] = useState(new Set())
  const [diagnostics, setDiagnostics] = useState(null)
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false)

  useEffect(() => {
    loadErrors()
    loadDiagnostics()
  }, [])

  const loadDiagnostics = async () => {
    try {
      setDiagnosticsLoading(true)
      const data = await api.getTelegramWebhookDiagnostics()
      setDiagnostics(data)
    } catch (err) {
      console.error('Error loading webhook diagnostics:', err)
      setDiagnostics({ configured: false, error: 'Не удалось загрузить диагностику' })
    } finally {
      setDiagnosticsLoading(false)
    }
  }

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

  const handleDeleteAll = async () => {
    if (!window.confirm('Удалить все ошибки?')) {
      return
    }

    try {
      await api.deleteAllTelegramErrors()
      setToast({ message: 'Все ошибки удалены', type: 'success' })
      loadErrors()
    } catch (err) {
      console.error('Error deleting all errors:', err)
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
          {totalErrors > 0 && (
            <button className="btn btn-danger" onClick={handleDeleteAll}>
              🗑️ Удалить все
            </button>
          )}
        </div>
      </div>

      <section className="webhook-diagnostics">
        <h2>Диагностика вебхука</h2>
        {diagnosticsLoading ? (
          <p className="diagnostics-loading">Загрузка…</p>
        ) : diagnostics ? (
          <div className="diagnostics-content">
            {diagnostics.error && (
              <p className="diagnostics-error">{diagnostics.error}</p>
            )}
            {diagnostics.configured && (
              <>
                <div className="diagnostics-row">
                  <span className="diagnostics-label">Текущий URL вебхука:</span>
                  <span className="diagnostics-value">
                    {diagnostics.currentWebhookUrl || <em>не установлен</em>}
                  </span>
                </div>
                <div className="diagnostics-row">
                  <span className="diagnostics-label">Ожидающих обновлений:</span>
                  <span className="diagnostics-value">{diagnostics.pendingUpdateCount ?? '—'}</span>
                </div>
                {(diagnostics.lastErrorMessage || diagnostics.lastErrorDateUnix) && (
                  <div className="diagnostics-row">
                    <span className="diagnostics-label">Последняя ошибка Telegram:</span>
                    <span className="diagnostics-value">
                      {diagnostics.lastErrorMessage || ''}
                      {diagnostics.lastErrorDateUnix && (
                        <small> ({new Date(diagnostics.lastErrorDateUnix * 1000).toLocaleString('ru-RU')})</small>
                      )}
                    </span>
                  </div>
                )}
                {diagnostics.suggestedWebhookUrl && (
                  <div className="diagnostics-row">
                    <span className="diagnostics-label">Рекомендуемый URL для вебхука:</span>
                    <code className="diagnostics-url">{diagnostics.suggestedWebhookUrl}</code>
                  </div>
                )}
              </>
            )}
            {diagnostics.suggestedWebhookUrl && (
              <div className="diagnostics-setwebhook">
                <p className="diagnostics-note">
                  Telegram принимает только <strong>HTTPS</strong>. Для HTTP-сервера используйте туннель (ngrok и т.п.) или настройте SSL перед API.
                </p>
                <p>Полный запрос для установки вебхука (подставьте свой токен бота вместо <code>&lt;ВАШ_ТОКЕН&gt;</code>):</p>
                <pre className="diagnostics-request">
{`POST https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook
Content-Type: application/x-www-form-urlencoded

url=${encodeURIComponent(diagnostics.suggestedWebhookUrl || '')}`}
                </pre>
                <p>Или GET (скопируйте в браузер, замените токен):</p>
                <pre className="diagnostics-request">
{`https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook?url=${encodeURIComponent(diagnostics.suggestedWebhookUrl || '')}`}
                </pre>
                <button type="button" className="btn btn-secondary" onClick={loadDiagnostics}>
                  🔄 Обновить диагностику
                </button>
              </div>
            )}
          </div>
        ) : null}
      </section>

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
