import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Profile.css'

function Profile() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.getMyOrders()
        if (!cancelled) setOrders(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setError(e.message || 'Не удалось загрузить заказы')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()
  const visibleName = (() => {
    const fullName = (user.fullName || '').trim()
    if (fullName) return fullName
    const username = (user.username || '').trim()
    if (username && !username.startsWith('u_')) return username
    return 'Пользователь'
  })()
  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('bebochka-auth'))
    window.location.href = '/'
  }

  return (
    <div className="profile-page">
      <div className="profile-inner">
        <h1>Профиль</h1>
        <p className="profile-user-line">
          {visibleName}
          {user.email ? ` · ${user.email}` : ''}
        </p>
        <h2 style={{ marginTop: 24 }}>История заказов</h2>
        {loading && <p>Загрузка…</p>}
        {error && <p className="profile-error">{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <p>Пока нет заказов.</p>
        )}
        {!loading && orders.length > 0 && (
          <ul className="profile-orders">
            {orders.map((o) => (
              <li key={o.id || o.Id} className="profile-order-card">
                <div className="profile-order-head">
                  <strong>{o.orderNumber || o.OrderNumber}</strong>
                  <span>{o.status || o.Status}</span>
                </div>
                <div className="profile-order-meta">
                  {(o.createdAt || o.CreatedAt) && new Date(o.createdAt || o.CreatedAt).toLocaleString('ru-RU')}
                  {' · '}
                  {(o.finalAmount ?? o.FinalAmount ?? o.totalAmount ?? o.TotalAmount ?? 0).toLocaleString('ru-RU')} ₽
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="profile-actions profile-actions--bottom">
          <button
            type="button"
            className="profile-logout-btn"
            onClick={handleLogout}
          >
            Выйти из профиля
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
