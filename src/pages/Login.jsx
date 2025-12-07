import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import './Login.css'

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.login(formData.username, formData.password)
      
      if (response && response.token) {
        // Save token to localStorage
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('user', JSON.stringify({
          username: response.username,
          fullName: response.fullName
        }))
        
        // Redirect to admin page
        navigate('/admin/products')
      } else {
        setError('Неверное имя пользователя или пароль')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Ошибка при входе. Проверьте данные.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.jpg" alt="bebochka" className="login-logo" />
          <h1>Вход в админку</h1>
          <p>bebochka | детский секонд-хенд</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
              placeholder="Введите имя пользователя"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Введите пароль"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

