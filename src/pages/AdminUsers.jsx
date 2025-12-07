import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './AdminUsers.css'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: ''
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
      setFormData({ username: '', password: '', email: '', fullName: '' })
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

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return
    }

    try {
      await api.deleteUser(id)
      setSuccess('Пользователь успешно удален')
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Ошибка при удалении пользователя')
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="admin-users-header">
        <h1>Управление пользователями</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
          + Создать пользователя
        </button>
      </div>

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
                <th>ID</th>
                <th>Имя пользователя</th>
                <th>Email</th>
                <th>Полное имя</th>
                <th>Создан</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email || '-'}</td>
                  <td>{user.fullName || '-'}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '-'}</td>
                  <td>
                    <button
                      className="btn btn-small btn-edit"
                      onClick={() => setShowPasswordForm(user.id)}
                    >
                      Изменить пароль
                    </button>
                    {user.id !== parseInt(localStorage.getItem('userId') || '0') && (
                      <button
                        className="btn btn-small btn-delete"
                        onClick={() => handleDelete(user.id)}
                      >
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
    </div>
  )
}

export default AdminUsers

