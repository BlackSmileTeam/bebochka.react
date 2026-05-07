import { useEffect, useState } from 'react'
import { api } from '../services/api'
import PageShell from '../components/PageShell'
import './AdminReviews.css'

function renderStars(rating) {
  const value = Number(rating || 0)
  if (!value) return '—'
  return `${'★'.repeat(value)}${'☆'.repeat(Math.max(0, 5 - value))}`
}

function formatDate(dateRaw) {
  if (!dateRaw) return '—'
  const d = new Date(dateRaw)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU')
}

function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReviews = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getOrderReviews()
      setReviews(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e?.message || 'Не удалось загрузить отзывы')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  return (
    <PageShell
      title="Отзывы клиентов"
      subtitle="Оценки и комментарии по полученным заказам"
      actions={(
        <button type="button" className="btn-refresh-unified" onClick={loadReviews} disabled={loading}>
          {loading ? 'Обновление…' : '🔄 Обновить'}
        </button>
      )}
    >
      <div className="admin-reviews-page">
        {loading && <div className="admin-reviews-loading">Загрузка отзывов…</div>}
        {!loading && error && <div className="admin-reviews-error">{error}</div>}
        {!loading && !error && (
          <div className="admin-reviews-table-wrap">
            <table className="admin-reviews-table">
              <thead>
                <tr>
                  <th>Заказ</th>
                  <th>Клиент</th>
                  <th>Телефон</th>
                  <th>Оценка</th>
                  <th>Комментарий</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-reviews-empty-cell">Отзывов пока нет.</td>
                  </tr>
                ) : reviews.map((row) => (
                  <tr key={row.id}>
                    <td>{row.orderNumber || `#${row.orderId}`}</td>
                    <td>{row.customerName || `Пользователь #${row.userId}`}</td>
                    <td>{row.customerPhone || '—'}</td>
                    <td title={row.rating ? `Оценка: ${row.rating}/5` : 'Без оценки'}>{renderStars(row.rating)}</td>
                    <td>{row.comment || 'Комментарий не оставлен.'}</td>
                    <td>{formatDate(row.createdAtUtc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  )
}

export default AdminReviews
