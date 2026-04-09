import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { getSessionId } from '../utils/sessionId'
import './Login.css'

function safeReturnPath(raw) {
  if (!raw || typeof raw !== 'string') return '/'
  try {
    const path = decodeURIComponent(raw.trim())
    if (!path.startsWith('/') || path.startsWith('//')) return '/'
    return path
  } catch {
    return '/'
  }
}

const CONSENT_DETAILS = `Регистрируясь, вы даёте согласие на обработку персональных данных в соответствии с
Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных». Обрабатываются данные, необходимые для
работы магазина, оформления и исполнения заказа, доставки и связи с вами (в т.ч. телефон, ФИО, адрес, история заказов).
Хранение и защита данных осуществляются с учётом требований 152-ФЗ. Отозвать согласие можно через контакты на сайте.`

function ShopAuth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnAfterAuth = useMemo(() => safeReturnPath(searchParams.get('returnUrl')), [searchParams])
  const [view, setView] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginForm, setLoginForm] = useState({ loginOrPhone: '', password: '' })
  const [regForm, setRegForm] = useState({
    phone: '',
    password: '',
    email: '',
    fullName: '',
    acceptPersonalDataProcessing: false
  })

  const sessionId = getSessionId()

  const finishAuth = () => {
    navigate(returnAfterAuth)
    window.location.reload()
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.login(loginForm.loginOrPhone.trim(), loginForm.password, sessionId)
      if (res.isAdmin) {
        window.location.href = '/admin/products'
        return
      }
      finishAuth()
    } catch (err) {
      setError(err.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!regForm.acceptPersonalDataProcessing) {
      setError('Отметьте согласие с пользовательским соглашением и обработкой персональных данных.')
      return
    }
    setLoading(true)
    try {
      const res = await api.register(regForm, sessionId)
      if (res.isAdmin) {
        window.location.href = '/admin/products'
        return
      }
      finishAuth()
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container login-container--embedded">
      <div className="login-card" style={{ maxWidth: 440 }}>
        <div className="login-header">
          <img src="/logo.jpg" alt="bebochka" className="login-logo" />
          <h1>{view === 'login' ? 'Вход' : 'Регистрация'}</h1>
          <p>{view === 'login' ? 'Телефон или логин и пароль' : 'Укажите телефон — логин для входа создаётся автоматически'}</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {view === 'login' && (
          <>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="loginOrPhone">Логин или телефон</label>
                <input
                  id="loginOrPhone"
                  name="loginOrPhone"
                  autoComplete="username"
                  placeholder="Например: ivan или +7 900 000-00-00"
                  value={loginForm.loginOrPhone}
                  onChange={(e) => setLoginForm({ ...loginForm, loginOrPhone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '…' : 'Войти'}
              </button>
            </form>

            <p className="auth-switch-row">
              <button type="button" className="auth-switch-link" onClick={() => { setView('register'); setError('') }}>
                Нет аккаунта? Зарегистрироваться
              </button>
            </p>
          </>
        )}

        {view === 'register' && (
          <>
            <form onSubmit={handleRegister} className="login-form login-form--register">
              <div className="form-group">
                <label htmlFor="regPhone">Телефон *</label>
                <input
                  id="regPhone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+7 900 000-00-00"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="regPassword">Пароль * (от 6 символов)</label>
                <input
                  id="regPassword"
                  type="password"
                  autoComplete="new-password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="regEmail">Email</label>
                <input
                  id="regEmail"
                  type="email"
                  autoComplete="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="regName">Имя</label>
                <input
                  id="regName"
                  autoComplete="name"
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                />
              </div>
              <div className="consent-block">
                <label>
                  <input
                    type="checkbox"
                    checked={regForm.acceptPersonalDataProcessing}
                    onChange={(e) => setRegForm({ ...regForm, acceptPersonalDataProcessing: e.target.checked })}
                  />
                  <span>
                    Я принимаю пользовательское соглашение и даю согласие на обработку моих персональных данных *
                  </span>
                </label>
                <details className="consent-details">
                  <summary>Текст соглашения</summary>
                  <p>{CONSENT_DETAILS}</p>
                </details>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '…' : 'Зарегистрироваться'}</button>
            </form>
            <p className="auth-switch-row">
              <button type="button" className="auth-switch-link" onClick={() => { setView('login'); setError('') }}>
                Уже есть аккаунт? Войти
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default ShopAuth
