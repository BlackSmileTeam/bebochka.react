import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import PageShell from '../components/PageShell'
import { ConfirmDialog } from '../components/ConfirmDialog'
import './AdminUsers.css'

function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    isAdmin: false
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openActionsFor, setOpenActionsFor] = useState(null)
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState(null)
  const [deleteUserBusy, setDeleteUserBusy] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })

  const formatDate = (value) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return String(value)
    }
  }

  const parseUserDate = (value) => {
    if (!value) return null
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d

    // Fallback for values like "28.05.2026" or "28.05.2026 13:45:00"
    const m = String(value).match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/)
    if (!m) return null
    const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = m
    const parsed = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss)
    )
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const formatDayLabel = (date) => date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  const formatMonthLabel = (date) => date.toLocaleDateString('ru-RU', { month: '2-digit', year: 'numeric' })
  const toDisplayDayKey = (date) =>
    date.toLocaleDateString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const toLocalMonthKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const isSameLocalDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const buildStats = () => {
    const now = new Date()
    const usersByDay = new Map()
    const usersByMonth = new Map()
    const sevenDays = []
    const sixMonths = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const key = toDisplayDayKey(d)
      usersByDay.set(key, 0)
      sevenDays.push({ key, label: formatDayLabel(d), count: 0 })
    }

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = toLocalMonthKey(d)
      usersByMonth.set(key, 0)
      sixMonths.push({ key, label: formatMonthLabel(d), count: 0 })
    }

    users.forEach((u) => {
      const raw = u.createdAt || u.CreatedAt
      const d = parseUserDate(raw)
      if (!d) return
      const dayKey = toDisplayDayKey(d)
      if (usersByDay.has(dayKey)) usersByDay.set(dayKey, (usersByDay.get(dayKey) || 0) + 1)
      const monthKey = toLocalMonthKey(d)
      if (usersByMonth.has(monthKey)) usersByMonth.set(monthKey, (usersByMonth.get(monthKey) || 0) + 1)
    })

    const daily = sevenDays.map((x) => ({ ...x, count: usersByDay.get(x.key) || 0 }))
    const monthly = sixMonths.map((x) => ({ ...x, count: usersByMonth.get(x.key) || 0 }))
    const todayCount = users.reduce((acc, u) => {
      const d = parseUserDate(u.createdAt || u.CreatedAt)
      return d && isSameLocalDay(d, now) ? acc + 1 : acc
    }, 0)
    const currentMonthCount = users.reduce((acc, u) => {
      const d = parseUserDate(u.createdAt || u.CreatedAt)
      return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() ? acc + 1 : acc
    }, 0)

    return {
      todayCount,
      currentMonthCount,
      daily,
      monthly,
      maxDay: Math.max(1, ...daily.map((x) => x.count)),
      maxMonth: Math.max(1, ...monthly.map((x) => x.count))
    }
  }

  const stats = buildStats()

  const getSortValue = (user, key) => {
    switch (key) {
      case 'id':
        return Number(user.id || user.Id || 0)
      case 'username':
        return String(user.username || user.Username || '').toLowerCase()
      case 'email':
        return String(user.email || user.Email || '').toLowerCase()
      case 'phone':
        return String(user.phone || user.Phone || '').toLowerCase()
      case 'fullName':
        return String(user.fullName || user.FullName || '').toLowerCase()
      case 'isAdmin':
        return (user.isAdmin ?? user.IsAdmin) ? 1 : 0
      case 'createdAt': {
        const d = parseUserDate(user.createdAt || user.CreatedAt)
        return d ? d.getTime() : 0
      }
      case 'lastLoginAt': {
        const d = parseUserDate(user.lastLoginAt || user.LastLoginAt)
        return d ? d.getTime() : 0
      }
      default:
        return ''
    }
  }

  const sortedUsers = useMemo(() => {
    const copy = [...users]
    copy.sort((a, b) => {
      const av = getSortValue(a, sortConfig.key)
      const bv = getSortValue(b, sortConfig.key)
      if (av === bv) return 0
      const cmp = av > bv ? 1 : -1
      return sortConfig.direction === 'asc' ? cmp : -cmp
    })
    return copy
  }, [users, sortConfig])

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const renderSortHeader = (label, key) => {
    const active = sortConfig.key === key
    const arrow = active ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''
    return (
      <button
        type="button"
        className={`users-sort-btn${active ? ' users-sort-btn--active' : ''}`}
        onClick={() => handleSort(key)}
      >
        {label}
        <span aria-hidden="true">{arrow}</span>
      </button>
    )
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await api.getUsers()
      setUsers(data)
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err)
      setError('Не удалось загрузить пользователей')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.username || !formData.password) {
      setError('Имя пользователя и пароль обязательны')
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    try {
      await api.createUser(formData)
      setSuccess('Пользователь успешно создан')
      setFormData({ username: '', password: '', email: '', fullName: '', isAdmin: false })
      setShowCreateForm(false)
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Ошибка при создании пользователя')
    }
  }

  const handlePasswordSubmit = async (e, userId) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Заполните все поля')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    try {
      await api.changePassword(userId, passwordData.newPassword)
      setSuccess('Пароль успешно изменен')
      setPasswordData({ newPassword: '', confirmPassword: '' })
      setShowPasswordForm(null)
    } catch (err) {
      setError(err.message || 'Ошибка при изменении пароля')
    }
  }

  const requestDeleteUser = (id) => {
    setOpenActionsFor(null)
    setError('')
    setDeleteConfirmUserId(id)
  }

  const confirmDeleteUser = async () => {
    if (deleteConfirmUserId == null) return
    setDeleteUserBusy(true)
    setError('')
    try {
      await api.deleteUser(deleteConfirmUserId)
      setSuccess('Пользователь успешно удален')
      setDeleteConfirmUserId(null)
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Ошибка при удалении пользователя')
    } finally {
      setDeleteUserBusy(false)
    }
  }

  const handleGoToOrders = (user) => {
    const uid = Number(user.id ?? user.Id)
    if (!Number.isFinite(uid) || uid <= 0) {
      setError('Некорректный идентификатор пользователя')
      return
    }
    setOpenActionsFor(null)
    navigate(`/admin/users/${uid}/orders`)
  }

  const ordersPathForUser = (user) => `/admin/users/${user.id ?? user.Id}/orders`

  if (loading) {
    return (
      <PageShell title="Управление пользователями">
        <div className="admin-users-page">
          <div className="loading">Загрузка...</div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Управление пользователями"
      actions={(
        <div className="admin-users-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setShowStatsModal(true)}>
            Статистика
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            + Создать пользователя
          </button>
        </div>
      )}
    >
      <div className="admin-users-page">

      {(error || success) && (
        <div className={`message ${error ? 'message-error' : 'message-success'}`}>
          {error || success}
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Создать пользователя</h2>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="user-form">
              <div className="form-group">
                <label htmlFor="username">Имя пользователя *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Пароль *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="fullName">Полное имя</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="form-group form-group-checkbox">
                <label htmlFor="isAdmin" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    name="isAdmin"
                    checked={!!formData.isAdmin}
                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  />
                  <span>Администратор</span>
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <div className="empty-state">
          <p>Пользователи не найдены</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>{renderSortHeader('ID', 'id')}</th>
                <th>{renderSortHeader('Имя пользователя', 'username')}</th>
                <th>{renderSortHeader('Email', 'email')}</th>
                <th>{renderSortHeader('Телефон', 'phone')}</th>
                <th>{renderSortHeader('Полное имя', 'fullName')}</th>
                <th>{renderSortHeader('Админ', 'isAdmin')}</th>
                <th>{renderSortHeader('Создан', 'createdAt')}</th>
                <th>{renderSortHeader('Последний вход', 'lastLoginAt')}</th>
                <th aria-label="Действия">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => {
                return (
                    <tr key={user.id || user.Id}>
                      <td data-label="ID" className="id-cell">{user.id || user.Id}</td>
                      <td data-label="Имя пользователя" className="username-cell">
                        <div className="user-mobile-head">
                          <div className="user-mobile-head__left">
                            <span className="user-mobile-username">
                              <Link
                                className="admin-users-orders-link"
                                to={ordersPathForUser(user)}
                                onClick={() => setOpenActionsFor(null)}
                                title="Заказы пользователя"
                              >
                                {user.fullName || user.FullName || user.username || user.Username || '-'}
                              </Link>
                            </span>
                          </div>
                          <div className="user-mobile-head__right">
                            <span className="user-mobile-meta">Создан: {formatDate(user.createdAt || user.CreatedAt)}</span>
                            <span className="user-mobile-meta">Вход: {formatDate(user.lastLoginAt || user.LastLoginAt)}</span>
                            <span className="user-mobile-meta">Админ: {(user.isAdmin ?? user.IsAdmin) ? 'Да' : 'Нет'}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Email" className="email-cell">{user.email || user.Email || '-'}</td>
                      <td data-label="Телефон" className="phone-cell">{user.phone || user.Phone || '-'}</td>
                      <td data-label="Полное имя" className="fullname-cell">
                        <Link
                          className="admin-users-orders-link"
                          to={ordersPathForUser(user)}
                          onClick={() => setOpenActionsFor(null)}
                          title="Заказы пользователя"
                        >
                          {user.fullName || user.FullName || '-'}
                        </Link>
                      </td>
                      <td data-label="Админ" className="admin-cell">{(user.isAdmin ?? user.IsAdmin) ? '✓' : '—'}</td>
                      <td data-label="Создан" className="created-cell">{formatDate(user.createdAt || user.CreatedAt)}</td>
                      <td data-label="Последний вход" className="last-login-cell">{formatDate(user.lastLoginAt || user.LastLoginAt)}</td>
                      <td data-label="Действия" className="actions-cell">
                        <div className="actions-menu-desktop">
                          <button
                            type="button"
                            className="btn btn-icon-dots"
                            aria-label="Действия"
                            onClick={() => setOpenActionsFor(openActionsFor === (user.id || user.Id) ? null : (user.id || user.Id))}
                          >
                            ⋯
                          </button>
                          {openActionsFor === (user.id || user.Id) && (
                            <div className="actions-dropdown">
                              <button
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  handleGoToOrders(user)
                                  setOpenActionsFor(null)
                                }}
                              >
                                К заказам
                              </button>
                              <button
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  setShowPasswordForm(user.id || user.Id)
                                  setOpenActionsFor(null)
                                }}
                              >
                                Изменить пароль
                              </button>
                              {(user.id || user.Id) !== parseInt(localStorage.getItem('userId') || '0') && (
                                <button
                                  type="button"
                                  className="actions-dropdown-item actions-dropdown-item--danger"
                                  onClick={() => {
                                    requestDeleteUser(user.id || user.Id)
                                  }}
                                >
                                  Удалить
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="actions-mobile-inline">
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => handleGoToOrders(user)}
                          >
                            К заказам
                          </button>
                          <button
                            className="btn btn-small btn-edit"
                            onClick={() => setShowPasswordForm(user.id || user.Id)}
                          >
                            Изменить пароль
                          </button>
                          {(user.id || user.Id) !== parseInt(localStorage.getItem('userId') || '0') && (
                            <button
                              className="btn btn-small btn-delete"
                              onClick={() => requestDeleteUser(user.id || user.Id)}
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showPasswordForm && (
        <div className="modal-overlay" onClick={() => setShowPasswordForm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Изменить пароль</h2>
              <button className="modal-close" onClick={() => setShowPasswordForm(null)}>×</button>
            </div>
            <form onSubmit={(e) => handlePasswordSubmit(e, showPasswordForm)} className="user-form">
              <div className="form-group">
                <label htmlFor="newPassword">Новый пароль *</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Подтвердите пароль *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordForm(null)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Изменить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="modal-content modal-content--stats" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Статистика пользователей</h2>
              <button className="modal-close" onClick={() => setShowStatsModal(false)}>×</button>
            </div>
            <div className="stats-body">
              <div className="stats-cards">
                <div className="stats-card">
                  <div className="stats-card__label">Новых за сегодня</div>
                  <div className="stats-card__value">{stats.todayCount}</div>
                </div>
                <div className="stats-card">
                  <div className="stats-card__label">Новых за текущий месяц</div>
                  <div className="stats-card__value">{stats.currentMonthCount}</div>
                </div>
              </div>

              <section className="stats-section">
                <h3>Новые пользователи по дням (7 дней)</h3>
                <div className="stats-chart">
                  {stats.daily.map((item) => (
                    <div key={item.key} className="stats-bar-item">
                      <div
                        className="stats-bar"
                        style={{ height: `${Math.max(8, Math.round((item.count / stats.maxDay) * 100))}%` }}
                        title={`${item.label}: ${item.count}`}
                      />
                      <div className="stats-bar-value">{item.count}</div>
                      <div className="stats-bar-label">{item.label}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="stats-section">
                <h3>Новые пользователи по месяцам (6 месяцев)</h3>
                <div className="stats-chart">
                  {stats.monthly.map((item) => (
                    <div key={item.key} className="stats-bar-item">
                      <div
                        className="stats-bar stats-bar--month"
                        style={{ height: `${Math.max(8, Math.round((item.count / stats.maxMonth) * 100))}%` }}
                        title={`${item.label}: ${item.count}`}
                      />
                      <div className="stats-bar-value">{item.count}</div>
                      <div className="stats-bar-label">{item.label}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmUserId !== null}
        title="Удалить пользователя?"
        message="Пользователь будет удалён без возможности восстановления. Продолжить?"
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
        busy={deleteUserBusy}
        onCancel={() => {
          if (!deleteUserBusy) setDeleteConfirmUserId(null)
        }}
        onConfirm={confirmDeleteUser}
      />
      </div>
    </PageShell>
  )
}

export default AdminUsers

