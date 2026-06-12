import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import PageShell from '../components/PageShell'
import PersonAddIcon from '../components/PersonAddIcon.jsx'
import StatsIcon from '../components/StatsIcon.jsx'
import FilterIcon from '../components/FilterIcon.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog'
import AdminUserChildrenPanel from '../components/AdminUserChildrenPanel'
import { getVkProfileUrl } from '../utils/vkProfile'
import { userDisplayName } from '../utils/adminUserChildren'
import { AdminUserEmailLink, AdminUserPhoneLink } from '../utils/adminUserContact'
import './AdminUsers.css'

function parseUserDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) return d

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
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    accountType: '',
    registeredFrom: '',
    registeredTo: '',
  })
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })
  const [childrenModal, setChildrenModal] = useState(null)
  const [statsUsersModal, setStatsUsersModal] = useState(null)

  const isVkUser = (user) => {
    const vk = user.vkUserId ?? user.VkUserId
    if (vk == null || vk === '') return false
    const n = Number(vk)
    return Number.isFinite(n) && n > 0
  }

  const matchesDateRange = (user) => {
    const d = parseUserDate(user.createdAt || user.CreatedAt)
    if (!d) return !filters.registeredFrom && !filters.registeredTo

    if (filters.registeredFrom) {
      const from = new Date(`${filters.registeredFrom}T00:00:00`)
      if (!Number.isNaN(from.getTime()) && d < from) return false
    }
    if (filters.registeredTo) {
      const to = new Date(`${filters.registeredTo}T23:59:59.999`)
      if (!Number.isNaN(to.getTime()) && d > to) return false
    }
    return true
  }

  const activeFiltersCount = useMemo(() => {
    let n = 0
    if (filters.accountType) n += 1
    if (filters.registeredFrom) n += 1
    if (filters.registeredTo) n += 1
    return n
  }, [filters])

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return users.filter((user) => {
      if (filters.accountType === 'vk' && !isVkUser(user)) return false
      if (filters.accountType === 'regular' && isVkUser(user)) return false
      if (!matchesDateRange(user)) return false

      if (!q) return true
      const haystack = [
        user.username,
        user.Username,
        user.fullName,
        user.FullName,
        user.email,
        user.Email,
        user.phone,
        user.Phone,
        String(user.id ?? user.Id ?? ''),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [users, searchQuery, filters])

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

  const formatDateTime = (value) => {
    if (!value) return '—'
    try {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '—'
      return `${date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow'
      })} МСК`
    } catch {
      return String(value)
    }
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
    const weekStart = new Date(now)
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - 6)
    const weekCount = users.reduce((acc, u) => {
      const d = parseUserDate(u.createdAt || u.CreatedAt)
      return d && d >= weekStart ? acc + 1 : acc
    }, 0)
    const currentMonthCount = users.reduce((acc, u) => {
      const d = parseUserDate(u.createdAt || u.CreatedAt)
      return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() ? acc + 1 : acc
    }, 0)

    return {
      todayCount,
      weekCount,
      totalCount: users.length,
      currentMonthCount,
      daily,
      monthly,
      maxDay: Math.max(1, ...daily.map((x) => x.count)),
      maxMonth: Math.max(1, ...monthly.map((x) => x.count))
    }
  }

  const stats = buildStats()

  const getUserCreatedDate = (user) => parseUserDate(user.createdAt || user.CreatedAt)

  const sortUsersByCreatedDesc = (list) =>
    [...list].sort((a, b) => {
      const ta = getUserCreatedDate(a)?.getTime() ?? 0
      const tb = getUserCreatedDate(b)?.getTime() ?? 0
      return tb - ta
    })

  const statsUserLists = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - 6)

    const byDay = (dayKey) =>
      sortUsersByCreatedDesc(
        users.filter((u) => {
          const d = getUserCreatedDate(u)
          return d && toDisplayDayKey(d) === dayKey
        })
      )

    const byMonth = (monthKey) =>
      sortUsersByCreatedDesc(
        users.filter((u) => {
          const d = getUserCreatedDate(u)
          return d && toLocalMonthKey(d) === monthKey
        })
      )

    return {
      all: () => sortUsersByCreatedDesc(users),
      week: () =>
        sortUsersByCreatedDesc(
          users.filter((u) => {
            const d = getUserCreatedDate(u)
            return d && d >= weekStart
          })
        ),
      today: () =>
        sortUsersByCreatedDesc(
          users.filter((u) => {
            const d = getUserCreatedDate(u)
            return d && isSameLocalDay(d, now)
          })
        ),
      month: () =>
        sortUsersByCreatedDesc(
          users.filter((u) => {
            const d = getUserCreatedDate(u)
            return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
          })
        ),
      byDay,
      byMonth,
    }
  }, [users])

  const openStatsUsersList = (title, list) => {
    if (!list?.length) return
    setStatsUsersModal({ title, users: list })
  }

  const renderStatsCountButton = (count, title, list) => {
    if (count <= 0) {
      return <div className="stats-card__value">{count}</div>
    }
    return (
      <button
        type="button"
        className="stats-count-btn stats-card__value"
        onClick={() => openStatsUsersList(title, list)}
        title="Показать список пользователей"
      >
        {count}
      </button>
    )
  }

  const renderChartCountButton = (count, title, list) => {
    if (count <= 0) {
      return <div className="stats-bar-value">{count}</div>
    }
    return (
      <button
        type="button"
        className="stats-count-btn stats-bar-value"
        onClick={() => openStatsUsersList(title, list)}
        title="Показать список пользователей"
      >
        {count}
      </button>
    )
  }

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
      case 'childrenCount':
        return Number(user.childrenCount ?? user.ChildrenCount ?? 0)
      default:
        return ''
    }
  }

  const sortedUsers = useMemo(() => {
    const copy = [...filteredUsers]
    copy.sort((a, b) => {
      const av = getSortValue(a, sortConfig.key)
      const bv = getSortValue(b, sortConfig.key)
      if (av === bv) return 0
      const cmp = av > bv ? 1 : -1
      return sortConfig.direction === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filteredUsers, sortConfig])

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

  const openChildrenModal = async (user) => {
    const uid = Number(user.id ?? user.Id)
    if (!Number.isFinite(uid) || uid <= 0) return
    setChildrenModal({
      userId: uid,
      userLabel: userDisplayName(user),
      loading: true,
      error: '',
      children: [],
    })
    try {
      const children = await api.getUserChildren(uid)
      setChildrenModal((prev) =>
        prev && prev.userId === uid
          ? { ...prev, loading: false, children: Array.isArray(children) ? children : [] }
          : prev
      )
    } catch (err) {
      setChildrenModal((prev) =>
        prev && prev.userId === uid
          ? { ...prev, loading: false, error: err.message || 'Не удалось загрузить детей' }
          : prev
      )
    }
  }

  const renderChildrenCount = (user, count) => {
    if (count <= 0) return null
    return (
      <button
        type="button"
        className="children-count-btn"
        onClick={() => openChildrenModal(user)}
        title="Показать данные о детях"
      >
        {count}
      </button>
    )
  }

  const userActionsId = (user) => user.id || user.Id

  const renderUserActionsMenu = (user, vkProfileUrl, { includeOrders = true, className = '', dropdownClassName = '' } = {}) => {
    const uid = userActionsId(user)
    const currentUserId = parseInt(localStorage.getItem('userId') || '0', 10)
    const canDelete = uid !== currentUserId

    return (
      <div className={`actions-menu-wrap${className ? ` ${className}` : ''}`}>
        <button
          type="button"
          className="btn btn-icon-dots"
          aria-label="Действия с пользователем"
          aria-expanded={openActionsFor === uid}
          onClick={() => setOpenActionsFor(openActionsFor === uid ? null : uid)}
        >
          ⋯
        </button>
        {openActionsFor === uid && (
          <div className={`actions-dropdown${dropdownClassName ? ` ${dropdownClassName}` : ''}`}>
            {includeOrders && (
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
            )}
            <button
              type="button"
              className="actions-dropdown-item"
              onClick={() => {
                setShowPasswordForm(uid)
                setOpenActionsFor(null)
              }}
            >
              Изменить пароль
            </button>
            {vkProfileUrl && (
              <a
                className="actions-dropdown-item actions-dropdown-link"
                href={vkProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpenActionsFor(null)}
              >
                Открыть профиль в ВК
              </a>
            )}
            {canDelete && (
              <button
                type="button"
                className="actions-dropdown-item actions-dropdown-item--danger"
                onClick={() => requestDeleteUser(uid)}
              >
                Удалить
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <PageShell className="page-shell--admin-toolbar" title="Управление пользователями">
        <div className="admin-users-page">
          <div className="loading">Загрузка...</div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      className="page-shell--admin-toolbar"
      title="Управление пользователями"
      actions={(
        <div className="admin-page-toolbar">
          <button
            type="button"
            className={`btn btn-secondary btn-toolbar-icon btn-toolbar-icon--square${showFiltersPanel ? ' active' : ''}`}
            onClick={() => setShowFiltersPanel((v) => !v)}
            title="Фильтры"
            aria-label="Фильтры"
            aria-expanded={showFiltersPanel}
          >
            <FilterIcon className="btn-toolbar-icon__icon" />
            <span className="btn-toolbar-icon__label">
              Фильтры{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-toolbar-icon btn-toolbar-icon--square"
            onClick={() => setShowStatsModal(true)}
            title="Статистика"
            aria-label="Статистика"
          >
            <StatsIcon className="btn-toolbar-icon__icon" />
            <span className="btn-toolbar-icon__label">Статистика</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-toolbar-icon btn-toolbar-icon--square"
            onClick={() => setShowCreateForm(true)}
            title="Создать пользователя"
            aria-label="Создать пользователя"
          >
            <PersonAddIcon className="btn-toolbar-icon__icon" />
            <span className="btn-toolbar-icon__label">Создать</span>
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

      <div className="admin-users-toolbar">
        <label className="admin-users-search">
          <span className="admin-users-search__label">Поиск</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Имя, email, телефон, логин…"
            aria-label="Поиск пользователей"
          />
        </label>
        {filteredUsers.length !== users.length && (
          <span className="admin-users-count-hint">
            Найдено: {filteredUsers.length} из {users.length}
          </span>
        )}
      </div>

      {showFiltersPanel && (
        <div className="admin-users-filters-panel">
          <div className="admin-users-filters-grid">
            <label className="admin-users-filter-field">
              <span>Тип аккаунта</span>
              <select
                value={filters.accountType}
                onChange={(e) => setFilters((f) => ({ ...f, accountType: e.target.value }))}
              >
                <option value="">Все</option>
                <option value="vk">ВКонтакте</option>
                <option value="regular">Обычный</option>
              </select>
            </label>
            <label className="admin-users-filter-field">
              <span>Регистрация с</span>
              <input
                type="date"
                value={filters.registeredFrom}
                onChange={(e) => setFilters((f) => ({ ...f, registeredFrom: e.target.value }))}
              />
            </label>
            <label className="admin-users-filter-field">
              <span>Регистрация по</span>
              <input
                type="date"
                value={filters.registeredTo}
                onChange={(e) => setFilters((f) => ({ ...f, registeredTo: e.target.value }))}
              />
            </label>
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary admin-users-filters-reset"
              onClick={() =>
                setFilters({ accountType: '', registeredFrom: '', registeredTo: '' })
              }
            >
              Сбросить фильтры
            </button>
          )}
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
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>По поиску и фильтрам ничего не найдено</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>{renderSortHeader('Имя пользователя', 'username')}</th>
                <th>{renderSortHeader('Email', 'email')}</th>
                <th>{renderSortHeader('Телефон', 'phone')}</th>
                <th>{renderSortHeader('Дети', 'childrenCount')}</th>
                <th>{renderSortHeader('Создан', 'createdAt')}</th>
                <th>{renderSortHeader('Последний вход', 'lastLoginAt')}</th>
                <th aria-label="Действия">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => {
                const vkProfileUrl = getVkProfileUrl(user)
                const isAdmin = !!(user.isAdmin ?? user.IsAdmin)
                const childrenCount = Number(user.childrenCount ?? user.ChildrenCount ?? 0)
                const showVkBadge = isVkUser(user) && vkProfileUrl
                const userEmail = String(user.email || user.Email || '').trim()
                const hasEmail = Boolean(userEmail)
                const lastLoginRaw = user.lastLoginAt || user.LastLoginAt
                return (
                    <tr
                      key={user.id || user.Id}
                      className={isAdmin ? 'users-table-row--admin' : undefined}
                    >
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
                                {userDisplayName(user)}
                              </Link>
                              {showVkBadge && (
                                <a
                                  href={vkProfileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="user-account-badge user-account-badge--vk user-account-badge--link"
                                  title="Открыть профиль ВКонтакте"
                                >
                                  ВК
                                </a>
                              )}
                            </span>
                          </div>
                          <div className="user-mobile-head__right">
                            {renderUserActionsMenu(user, vkProfileUrl, {
                              includeOrders: false,
                              className: 'actions-menu-mobile-head',
                              dropdownClassName: 'actions-dropdown--mobile-head',
                            })}
                            {childrenCount > 0 && (
                              <span className="user-mobile-meta">
                                Дети: {renderChildrenCount(user, childrenCount)}
                              </span>
                            )}
                            <span className="user-mobile-meta">
                              Создан: {formatDate(user.createdAt || user.CreatedAt)}
                            </span>
                            {lastLoginRaw && (
                              <span className="user-mobile-meta">
                                Вход: {formatDateTime(lastLoginRaw)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {hasEmail ? (
                        <td data-label="Email" className="email-cell">
                          <AdminUserEmailLink email={userEmail} className="admin-user-contact-link" />
                        </td>
                      ) : (
                        <td data-label="Email" className="email-cell email-cell--empty" aria-hidden="true" />
                      )}
                      <td data-label="Телефон" className="phone-cell">
                        <AdminUserPhoneLink user={user} className="admin-user-contact-link" />
                      </td>
                      <td
                        data-label="Дети"
                        className={`children-count-cell${childrenCount > 0 ? '' : ' children-count-cell--empty'}`}
                      >
                        {renderChildrenCount(user, childrenCount)}
                      </td>
                      <td data-label="Создан" className="created-cell">{formatDate(user.createdAt || user.CreatedAt)}</td>
                      <td data-label="Последний вход" className="last-login-cell">{formatDateTime(user.lastLoginAt || user.LastLoginAt)}</td>
                      <td data-label="Действия" className="actions-cell">
                        {renderUserActionsMenu(user, vkProfileUrl, { className: 'actions-menu-desktop' })}
                        <button
                          type="button"
                          className="btn btn-small btn-secondary btn-orders-mobile"
                          onClick={() => handleGoToOrders(user)}
                        >
                          К заказам
                        </button>
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
                  <div className="stats-card__label">Всего пользователей</div>
                  {renderStatsCountButton(
                    stats.totalCount,
                    'Все пользователи',
                    statsUserLists.all()
                  )}
                </div>
                <div className="stats-card">
                  <div className="stats-card__label">Новых за неделю</div>
                  {renderStatsCountButton(
                    stats.weekCount,
                    'Новые за неделю',
                    statsUserLists.week()
                  )}
                </div>
                <div className="stats-card">
                  <div className="stats-card__label">Новых за сегодня</div>
                  {renderStatsCountButton(
                    stats.todayCount,
                    'Новые за сегодня',
                    statsUserLists.today()
                  )}
                </div>
                <div className="stats-card">
                  <div className="stats-card__label">Новых за текущий месяц</div>
                  {renderStatsCountButton(
                    stats.currentMonthCount,
                    'Новые за текущий месяц',
                    statsUserLists.month()
                  )}
                </div>
              </div>

              <section className="stats-section">
                <h3>Новые пользователи по дням (7 дней)</h3>
                <div className="stats-chart">
                  {stats.daily.map((item) => {
                    const dayUsers = statsUserLists.byDay(item.key)
                    return (
                      <div key={item.key} className="stats-bar-item">
                        {item.count > 0 ? (
                          <button
                            type="button"
                            className="stats-bar stats-bar--clickable"
                            style={{ height: `${Math.max(8, Math.round((item.count / stats.maxDay) * 100))}%` }}
                            title={`${item.label}: ${item.count}`}
                            onClick={() => openStatsUsersList(`Новые за ${item.label}`, dayUsers)}
                            aria-label={`Новые за ${item.label}: ${item.count}`}
                          />
                        ) : (
                          <div
                            className="stats-bar"
                            style={{ height: `${Math.max(8, Math.round((item.count / stats.maxDay) * 100))}%` }}
                            aria-hidden="true"
                          />
                        )}
                        {renderChartCountButton(
                          item.count,
                          `Новые за ${item.label}`,
                          dayUsers
                        )}
                        <div className="stats-bar-label">{item.label}</div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="stats-section">
                <h3>Новые пользователи по месяцам (6 месяцев)</h3>
                <div className="stats-chart">
                  {stats.monthly.map((item) => {
                    const monthUsers = statsUserLists.byMonth(item.key)
                    return (
                      <div key={item.key} className="stats-bar-item">
                        {item.count > 0 ? (
                          <button
                            type="button"
                            className="stats-bar stats-bar--month stats-bar--clickable"
                            style={{ height: `${Math.max(8, Math.round((item.count / stats.maxMonth) * 100))}%` }}
                            title={`${item.label}: ${item.count}`}
                            onClick={() => openStatsUsersList(`Новые за ${item.label}`, monthUsers)}
                            aria-label={`Новые за ${item.label}: ${item.count}`}
                          />
                        ) : (
                          <div
                            className="stats-bar stats-bar--month"
                            style={{ height: `${Math.max(8, Math.round((item.count / stats.maxMonth) * 100))}%` }}
                            aria-hidden="true"
                          />
                        )}
                        {renderChartCountButton(
                          item.count,
                          `Новые за ${item.label}`,
                          monthUsers
                        )}
                        <div className="stats-bar-label">{item.label}</div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {statsUsersModal && (
        <div className="modal-overlay modal-overlay--nested" onClick={() => setStatsUsersModal(null)}>
          <div className="modal-content modal-content--stats-users" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{statsUsersModal.title}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setStatsUsersModal(null)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="stats-users-list-body">
              <p className="stats-users-list-hint">
                {statsUsersModal.users.length}{' '}
                {statsUsersModal.users.length === 1
                  ? 'пользователь'
                  : statsUsersModal.users.length < 5
                    ? 'пользователя'
                    : 'пользователей'}
              </p>
              <ul className="stats-users-list">
                {statsUsersModal.users.map((user) => {
                  const uid = user.id ?? user.Id
                  return (
                    <li key={uid} className="stats-users-list__item">
                      <Link
                        to={ordersPathForUser(user)}
                        className="stats-users-list__link admin-users-orders-link"
                        onClick={() => setStatsUsersModal(null)}
                      >
                        <span className="stats-users-list__name">{userDisplayName(user)}</span>
                        <span className="stats-users-list__meta">
                          Создан: {formatDate(user.createdAt || user.CreatedAt)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {childrenModal && (
        <div className="modal-overlay" onClick={() => setChildrenModal(null)}>
          <div className="modal-content modal-content--children" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Дети — {childrenModal.userLabel}</h2>
              <button type="button" className="modal-close" onClick={() => setChildrenModal(null)} aria-label="Закрыть">
                ×
              </button>
            </div>
            <div className="admin-children-modal-body">
              <AdminUserChildrenPanel
                title={null}
                loading={childrenModal.loading}
                error={childrenModal.error}
                children={childrenModal.children}
              />
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

