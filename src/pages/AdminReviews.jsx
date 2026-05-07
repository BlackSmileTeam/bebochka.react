import { useEffect, useState } from 'react'
import { api } from '../services/api'
import PageShell from '../components/PageShell'
import Toast from '../components/Toast'
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

function getViewerIsAdmin() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return !!parsed?.isAdmin
  } catch {
    return false
  }
}

function getImageUrl(path) {
  if (!path) return null
  if (String(path).startsWith('http')) return path
  const base = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5000'
  return base + (String(path).startsWith('/') ? String(path) : `/${String(path)}`)
}

function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    orderNumber: '',
    customerName: '',
    customerPhone: '',
    rating: 5,
    comment: '',
    files: []
  })
  const isAdmin = getViewerIsAdmin()

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

  const onFormChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setForm({
      orderNumber: '',
      customerName: '',
      customerPhone: '',
      rating: 5,
      comment: '',
      files: []
    })
  }

  const handleCreateReview = async (event) => {
    event.preventDefault()
    if (!form.rating || Number(form.rating) < 1 || Number(form.rating) > 5) {
      setToast({ message: 'Оценка должна быть от 1 до 5', type: 'warning' })
      return
    }
    try {
      setSubmitting(true)
      await api.createOrderReviewAsAdmin(form)
      setToast({ message: 'Отзыв добавлен', type: 'success' })
      resetForm()
      await loadReviews()
    } catch (e) {
      setToast({ message: e?.message || 'Не удалось добавить отзыв', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell
      title="Отзывы клиентов"
      subtitle={isAdmin ? 'Полный список отзывов и ручное добавление' : 'Оценки, комментарии и фото покупателей'}
    >
      <div className="admin-reviews-page">
        {loading && <div className="admin-reviews-loading">Загрузка отзывов…</div>}
        {!loading && error && <div className="admin-reviews-error">{error}</div>}
        {!loading && !error && isAdmin && (
          <form className="admin-reviews-create-form" onSubmit={handleCreateReview}>
            <h3>Добавить отзыв вручную</h3>
            <div className="admin-reviews-create-grid">
              <label className="admin-review-field">
                <span className="admin-review-field-label">Номер заказа</span>
                <input
                  type="text"
                  placeholder="Опционально"
                  value={form.orderNumber}
                  onChange={(e) => onFormChange('orderNumber', e.target.value)}
                />
              </label>
              <label className="admin-review-field">
                <span className="admin-review-field-label">Клиент</span>
                <input
                  type="text"
                  placeholder="Опционально"
                  value={form.customerName}
                  onChange={(e) => onFormChange('customerName', e.target.value)}
                />
              </label>
              <label className="admin-review-field">
                <span className="admin-review-field-label">Телефон</span>
                <input
                  type="text"
                  placeholder="Опционально"
                  value={form.customerPhone}
                  onChange={(e) => onFormChange('customerPhone', e.target.value)}
                />
              </label>
              <label className="admin-review-field">
                <span className="admin-review-field-label">Оценка</span>
                <select value={form.rating} onChange={(e) => onFormChange('rating', e.target.value)}>
                  <option value={5}>5 - Отлично</option>
                  <option value={4}>4 - Хорошо</option>
                  <option value={3}>3 - Нормально</option>
                  <option value={2}>2 - Плохо</option>
                  <option value={1}>1 - Очень плохо</option>
                </select>
              </label>
            </div>
            <label className="admin-review-field admin-review-field--full">
              <span className="admin-review-field-label">Комментарий</span>
              <textarea
                placeholder="Текст отзыва"
                value={form.comment}
                onChange={(e) => onFormChange('comment', e.target.value)}
                rows={3}
                required
              />
            </label>
            <label className="admin-reviews-upload">
              Фото (можно несколько)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => onFormChange('files', Array.from(e.target.files || []))}
              />
            </label>
            {form.files.length > 0 && (
              <p className="admin-reviews-files-note">Выбрано файлов: {form.files.length}</p>
            )}
            <div className="admin-reviews-create-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Сохранение…' : 'Добавить отзыв'}
              </button>
            </div>
          </form>
        )}

        {!loading && !error && isAdmin && (
          <div className="admin-reviews-table-wrap">
            <table className="admin-reviews-table">
              <thead>
                <tr>
                  <th>Заказ</th>
                  <th>Клиент</th>
                  <th>Телефон</th>
                  <th>Оценка</th>
                  <th>Комментарий</th>
                  <th>Фото</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-reviews-empty-cell">Отзывов пока нет.</td>
                  </tr>
                ) : reviews.map((row) => (
                  <tr key={row.id}>
                    <td>{row.orderNumber || `#${row.orderId}`}</td>
                    <td>{row.customerName || `Пользователь #${row.userId}`}</td>
                    <td>{row.customerPhone || '—'}</td>
                    <td title={row.rating ? `Оценка: ${row.rating}/5` : 'Без оценки'}>{renderStars(row.rating)}</td>
                    <td>{row.comment || 'Комментарий не оставлен.'}</td>
                    <td>
                      <div className="reviews-images-grid">
                        {(Array.isArray(row.imageUrls) ? row.imageUrls : []).map((img, idx) => (
                          <a key={`${row.id}-${idx}`} href={getImageUrl(img)} target="_blank" rel="noreferrer">
                            <img src={getImageUrl(img)} alt="" />
                          </a>
                        ))}
                      </div>
                    </td>
                    <td>{formatDate(row.createdAtUtc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && !isAdmin && (
          <div className="public-reviews-list">
            {reviews.length === 0 ? (
              <div className="admin-reviews-empty">Отзывов пока нет.</div>
            ) : reviews.map((row) => (
              <article key={row.id} className="public-review-card">
                <div className="public-review-head">
                  <strong>{renderStars(row.rating)}</strong>
                  <span>{formatDate(row.createdAtUtc)}</span>
                </div>
                <p>{row.comment || 'Комментарий не оставлен.'}</p>
                {Array.isArray(row.imageUrls) && row.imageUrls.length > 0 && (
                  <div className="reviews-images-grid">
                    {row.imageUrls.map((img, idx) => (
                      <a key={`${row.id}-${idx}`} href={getImageUrl(img)} target="_blank" rel="noreferrer">
                        <img src={getImageUrl(img)} alt="" />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </PageShell>
  )
}

export default AdminReviews
