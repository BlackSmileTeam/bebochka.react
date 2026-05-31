import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import PageShell from '../components/PageShell'
import Toast from '../components/Toast'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { getApiPublicOrigin } from '../utils/apiBase'
import './AdminReviews.css'

function renderStars(rating) {
  const value = Number(rating || 0)
  if (!value) return '—'
  return `${'★'.repeat(value)}${'☆'.repeat(Math.max(0, 5 - value))}`
}

function formatReviewDate(dateRaw) {
  if (!dateRaw) return '—'
  const d = new Date(dateRaw)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU')
}

function sortReviewsByDisplayDate(rows) {
  const list = Array.isArray(rows) ? [...rows] : []
  list.sort((a, b) => {
    const ta = new Date(a.createdAtUtc || 0).getTime()
    const tb = new Date(b.createdAtUtc || 0).getTime()
    return tb - ta
  })
  return list
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
  const base = getApiPublicOrigin()
  return base + (String(path).startsWith('/') ? String(path) : `/${String(path)}`)
}

const EMPTY_REVIEW_FORM = {
  orderNumber: '',
  customerName: '',
  customerPhone: '',
  rating: 5,
  reviewDateLocal: '',
  comment: '',
  files: [],
}

function toReviewDateInput(dateRaw) {
  if (!dateRaw) return ''
  const s = String(dateRaw)
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) return match[1]
  const d = new Date(dateRaw)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function absentToEmpty(value) {
  const v = String(value || '').trim()
  return v === 'Отсутствует' ? '' : v
}

function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirmReviewId, setDeleteConfirmReviewId] = useState(null)
  const [deleteReviewBusy, setDeleteReviewBusy] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editingOrderLinked, setEditingOrderLinked] = useState(false)
  const [existingImages, setExistingImages] = useState([])
  const [form, setForm] = useState({ ...EMPTY_REVIEW_FORM })
  const isAdmin = getViewerIsAdmin()
  const fileInputRef = useRef(null)
  const formRef = useRef(null)
  const [filePreviewUrls, setFilePreviewUrls] = useState([])

  useEffect(() => {
    const urls = (form.files || []).map((file) => URL.createObjectURL(file))
    setFilePreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [form.files])

  const loadReviews = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getOrderReviews()
      setReviews(sortReviewsByDisplayDate(Array.isArray(data) ? data : []))
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

  const handleFilesChange = (event) => {
    const picked = Array.from(event.target.files || [])
    if (!picked.length) return
    setForm((prev) => ({ ...prev, files: [...prev.files, ...picked] }))
    event.target.value = ''
  }

  const removeFile = (index) => {
    setForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }))
  }

  const resetForm = () => {
    setForm({ ...EMPTY_REVIEW_FORM })
    setEditingReviewId(null)
    setEditingOrderLinked(false)
    setExistingImages([])
  }

  const startEditReview = (row) => {
    setEditingReviewId(row.id)
    setEditingOrderLinked(!!row.orderId)
    setExistingImages(Array.isArray(row.imageUrls) ? [...row.imageUrls] : [])
    setForm({
      orderNumber: absentToEmpty(row.orderNumber),
      customerName: absentToEmpty(row.customerName),
      customerPhone: absentToEmpty(row.customerPhone),
      rating: Number(row.rating) || 5,
      reviewDateLocal: toReviewDateInput(row.createdAtUtc),
      comment: row.comment || '',
      files: [],
    })
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const removeExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((item) => item !== url))
  }

  const handleSaveReview = async (event) => {
    event.preventDefault()
    if (!form.rating || Number(form.rating) < 1 || Number(form.rating) > 5) {
      setToast({ message: 'Оценка должна быть от 1 до 5', type: 'warning' })
      return
    }
    const hasComment = String(form.comment || '').trim().length > 0
    const hasNewPhotos = Array.isArray(form.files) && form.files.length > 0
    const hasExistingPhotos = existingImages.length > 0
    if (!hasComment && !hasNewPhotos && !hasExistingPhotos) {
      setToast({ message: 'Добавьте текст отзыва или хотя бы одно фото', type: 'warning' })
      return
    }
    try {
      setSubmitting(true)
      const { files, reviewDateLocal, ...formRest } = form
      const createdDate =
        reviewDateLocal && String(reviewDateLocal).trim()
          ? String(reviewDateLocal).trim().slice(0, 10)
          : null
      const payload = {
        ...formRest,
        files,
        keepImageUrls: editingReviewId ? existingImages : undefined,
        createdDate,
        createdAtUtc: null,
      }
      if (editingReviewId) {
        await api.updateOrderReviewAsAdmin(editingReviewId, payload)
        setToast({ message: 'Отзыв обновлён', type: 'success' })
      } else {
        await api.createOrderReviewAsAdmin(payload)
        setToast({ message: 'Отзыв добавлен', type: 'success' })
      }
      resetForm()
      await loadReviews()
    } catch (e) {
      setToast({
        message: e?.message || (editingReviewId ? 'Не удалось сохранить отзыв' : 'Не удалось добавить отзыв'),
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const requestDeleteReview = (reviewId) => {
    if (!reviewId) return
    setDeleteConfirmReviewId(reviewId)
  }

  const confirmDeleteReview = async () => {
    if (deleteConfirmReviewId == null) return
    setDeleteReviewBusy(true)
    try {
      await api.deleteOrderReview(deleteConfirmReviewId)
      setToast({ message: 'Отзыв удалён', type: 'success' })
      setDeleteConfirmReviewId(null)
      await loadReviews()
    } catch (e) {
      setToast({ message: e?.message || 'Не удалось удалить отзыв', type: 'error' })
    } finally {
      setDeleteReviewBusy(false)
    }
  }

  return (
    <PageShell
      title="Отзывы"
      subtitle={isAdmin ? 'Полный список отзывов и ручное добавление' : 'Оценки, комментарии и фото покупателей'}
    >
      <div className="admin-reviews-page">
        {loading && <div className="admin-reviews-loading">Загрузка отзывов…</div>}
        {!loading && error && <div className="admin-reviews-error">{error}</div>}
        {!loading && !error && isAdmin && (
          <form ref={formRef} className="admin-reviews-create-form" onSubmit={handleSaveReview}>
            <h3>{editingReviewId ? 'Редактировать отзыв' : 'Добавить отзыв вручную'}</h3>
            <div className="admin-reviews-create-grid">
              <label className="admin-review-field">
                <span className="admin-review-field-label">Дата отзыва</span>
                <input
                  type="date"
                  title="Если не указать — будет дата создания отзыва"
                  value={form.reviewDateLocal}
                  onChange={(e) => onFormChange('reviewDateLocal', e.target.value)}
                />
              </label>
              <label className="admin-review-field">
                <span className="admin-review-field-label">Номер заказа</span>
                <input
                  type="text"
                  placeholder="Опционально"
                  value={form.orderNumber}
                  onChange={(e) => onFormChange('orderNumber', e.target.value)}
                  disabled={editingOrderLinked}
                  title={editingOrderLinked ? 'Отзыв привязан к заказу — номер нельзя изменить' : undefined}
                />
              </label>
              <label className="admin-review-field">
                <span className="admin-review-field-label">Клиент</span>
                <input
                  type="text"
                  placeholder="Опционально"
                  value={form.customerName}
                  onChange={(e) => onFormChange('customerName', e.target.value)}
                  disabled={editingOrderLinked}
                />
              </label>
              <label className="admin-review-field">
                <span className="admin-review-field-label">Телефон</span>
                <input
                  type="text"
                  placeholder="Опционально"
                  value={form.customerPhone}
                  onChange={(e) => onFormChange('customerPhone', e.target.value)}
                  disabled={editingOrderLinked}
                />
              </label>
              <label className="admin-review-field">
                <span className="admin-review-field-label">Оценка</span>
                <select
                  className="admin-reviews-rating-select"
                  value={form.rating}
                  onChange={(e) => onFormChange('rating', Number(e.target.value))}
                >
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
                placeholder={
                  form.files.length > 0 || existingImages.length > 0
                    ? 'Необязательно, если добавлено фото'
                    : 'Текст отзыва'
                }
                value={form.comment}
                onChange={(e) => onFormChange('comment', e.target.value)}
                rows={3}
              />
            </label>
            <div className="admin-review-field admin-review-field--full">
              <span className="admin-review-field-label">Фото</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="admin-reviews-upload-input"
                onChange={handleFilesChange}
              />
              <button
                type="button"
                className="admin-reviews-btn admin-reviews-btn--secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                {form.files.length === 0 && existingImages.length === 0 ? 'Выбрать файлы' : 'Добавить фото'}
              </button>
              {(existingImages.length > 0 || form.files.length > 0) && (
                <div className="admin-reviews-preview-grid">
                  {existingImages.map((url) => (
                    <div key={url} className="admin-reviews-preview-item">
                      <img
                        src={getImageUrl(url)}
                        alt="Фото отзыва"
                        className="admin-reviews-preview-image"
                      />
                      <button
                        type="button"
                        className="admin-reviews-preview-remove"
                        onClick={() => removeExistingImage(url)}
                        aria-label="Удалить фото"
                        disabled={submitting}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {form.files.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${index}`} className="admin-reviews-preview-item">
                      <img
                        src={filePreviewUrls[index]}
                        alt={file.name}
                        className="admin-reviews-preview-image"
                      />
                      <button
                        type="button"
                        className="admin-reviews-preview-remove"
                        onClick={() => removeFile(index)}
                        aria-label={`Удалить ${file.name}`}
                        disabled={submitting}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-reviews-create-actions">
              <button type="submit" className="admin-reviews-btn admin-reviews-btn--primary" disabled={submitting}>
                {submitting ? 'Сохранение…' : (editingReviewId ? 'Сохранить изменения' : 'Добавить отзыв')}
              </button>
              {editingReviewId && (
                <button
                  type="button"
                  className="admin-reviews-btn admin-reviews-btn--secondary"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Отмена
                </button>
              )}
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
                  <th className="admin-reviews-th-actions" aria-label="Действия" />
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-reviews-empty-cell">Отзывов пока нет.</td>
                  </tr>
                ) : reviews.map((row) => (
                  <tr key={row.id}>
                    <td>{row.orderNumber || 'Отсутствует'}</td>
                    <td>{row.customerName || 'Отсутствует'}</td>
                    <td>{row.customerPhone || 'Отсутствует'}</td>
                    <td title={row.rating ? `Оценка: ${row.rating}/5` : 'Без оценки'}>{renderStars(row.rating)}</td>
                    <td>{row.comment || ''}</td>
                    <td>
                      <div className="reviews-images-grid">
                        {(Array.isArray(row.imageUrls) ? row.imageUrls : []).map((img, idx) => (
                          <a key={`${row.id}-${idx}`} href={getImageUrl(img)} target="_blank" rel="noreferrer">
                            <img src={getImageUrl(img)} alt={`Фото к отзыву ${idx + 1}`} loading="lazy" decoding="async" />
                          </a>
                        ))}
                      </div>
                    </td>
                    <td>{formatReviewDate(row.createdAtUtc)}</td>
                    <td className="admin-reviews-actions-cell">
                      <div className="admin-reviews-row-actions">
                        <button
                          type="button"
                          className="btn-review-edit"
                          disabled={submitting && editingReviewId === row.id}
                          onClick={() => startEditReview(row)}
                          title="Редактировать отзыв"
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          className="btn-review-delete"
                          disabled={deleteReviewBusy && deleteConfirmReviewId === row.id}
                          onClick={() => requestDeleteReview(row.id)}
                          title="Удалить отзыв"
                        >
                          {deleteReviewBusy && deleteConfirmReviewId === row.id ? '…' : 'Удалить'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && !isAdmin && (
          reviews.length === 0 ? (
            <p className="public-reviews-empty">Отзывов пока нет.</p>
          ) : (
            <div className="public-reviews-list">
              {reviews.map((row) => (
              <article key={row.id} className="public-review-card">
                <div className="public-review-head">
                  <strong>{renderStars(row.rating)}</strong>
                  <span>{formatReviewDate(row.createdAtUtc)}</span>
                </div>
                {row.comment && <p>{row.comment}</p>}
                {Array.isArray(row.imageUrls) && row.imageUrls.length > 0 && (
                  <div className="reviews-images-grid">
                    {row.imageUrls.map((img, idx) => (
                      <a key={`${row.id}-${idx}`} href={getImageUrl(img)} target="_blank" rel="noreferrer">
                        <img src={getImageUrl(img)} alt={`Фото к отзыву ${idx + 1}`} loading="lazy" decoding="async" />
                      </a>
                    ))}
                  </div>
                )}
              </article>
              ))}
            </div>
          )
        )}
      </div>
      <ConfirmDialog
        open={deleteConfirmReviewId !== null}
        title="Удалить отзыв?"
        message="Отзыв будет удалён без возможности восстановления. Продолжить?"
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
        busy={deleteReviewBusy}
        onCancel={() => {
          if (!deleteReviewBusy) setDeleteConfirmReviewId(null)
        }}
        onConfirm={confirmDeleteReview}
      />
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
