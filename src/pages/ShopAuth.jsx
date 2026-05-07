import { useState, useMemo, useEffect } from 'react'
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

const VK_ERROR_MESSAGES = {
  denied: 'Вход через ВКонтакте отменён.',
  incomplete: 'Ответ от ВКонтакте неполный — попробуйте войти ещё раз.',
  state: 'Сессия входа устарела — начните вход через ВКонтакте заново.',
  consent: 'Для первого входа через ВКонтакте нужно согласие на обработку персональных данных.',
  email_conflict: 'Этот email в ВК уже занят другим аккаунтом на сайте. Войдите другим способом или напишите в поддержку.',
  config: 'Вход через ВКонтакте на сайте пока не настроен. Используйте телефон и пароль.',
  failed: 'Не удалось завершить вход через ВКонтакте. Попробуйте позже.',
}

const CONSENT_DETAILS = `Нажимая «Зарегистрироваться», вы подтверждаете, что:
- даете согласие на обработку персональных данных для оформления и сопровождения заказов;
- принимаете пользовательское соглашение интернет-магазина;
- ознакомлены с тем, что данные используются только для работы сервиса (заказы, доставка, связь по заказу).`

function decodeBase64UrlJson(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const b64std = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64std)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return JSON.parse(new TextDecoder().decode(bytes))
}

function readBebochkaAuthHashPayload() {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash || ''
  if (!hash.startsWith('#bebochkaAuth=')) return null
  const b64 = hash.slice('#bebochkaAuth='.length)
  try {
    return decodeBase64UrlJson(b64)
  } catch {
    return null
  }
}

function clearBebochkaAuthHash() {
  const u = new URL(window.location.href)
  if (!(u.hash || '').startsWith('#bebochkaAuth=')) return
  u.hash = ''
  window.history.replaceState(null, document.title, u.pathname + u.search + u.hash)
}

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

  useEffect(() => {
    const vkErr = searchParams.get('vkError')
    if (vkErr) {
      setError(VK_ERROR_MESSAGES[vkErr] || VK_ERROR_MESSAGES.failed)
      const u = new URL(window.location.href)
      u.searchParams.delete('vkError')
      window.history.replaceState(null, document.title, u.pathname + u.search + u.hash)
    }

    const payload = readBebochkaAuthHashPayload()
    if (!payload) return

    api._applyAuthPayload(payload)
    clearBebochkaAuthHash()
    if (payload.isAdmin) {
      window.location.href = '/admin/products'
      return
    }
    const ret = safeReturnPath(searchParams.get('returnUrl'))
    navigate(ret)
    window.location.reload()
  }, [searchParams, navigate])

  const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

  const startVkOAuth = () => {
    setError('')
    const u = new URL(`${apiOrigin}/api/auth/vk/start`)
    u.searchParams.set('returnUrl', returnAfterAuth)
    if (sessionId) u.searchParams.set('sessionId', sessionId)
    // Нажатие кнопки "Войти через ВК" считается действием пользователя,
    // поэтому для первичной регистрации передаём согласие автоматически.
    u.searchParams.set('acceptPersonalDataProcessing', 'true')
    window.location.href = u.toString()
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
    <div className="auth-page-root">
      <div className="login-container login-container--embedded">
        <div className="login-card" style={{ maxWidth: 440 }}>
          <div className="login-header login-header--compact">
            <img src="/logo.jpg" alt="bebochka" className="login-logo" />
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

            <div className="auth-alt-divider" aria-hidden="true">
              <span>или</span>
            </div>

            <div className="auth-vk-block">
              <button type="button" className="btn btn-vk" onClick={startVkOAuth} disabled={loading} aria-label="Войти через ВКонтакте">
                <span className="vk-icon" aria-hidden="true">VK</span>
              </button>
            </div>

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

            <div className="auth-alt-divider" aria-hidden="true">
              <span>или</span>
            </div>

            <div className="auth-vk-block">
              <button type="button" className="btn btn-vk" onClick={startVkOAuth} disabled={loading} aria-label="Войти через ВКонтакте">
                <span className="vk-icon" aria-hidden="true">VK</span>
              </button>
            </div>

            <p className="auth-switch-row">
              <button type="button" className="auth-switch-link" onClick={() => { setView('login'); setError('') }}>
                Уже есть аккаунт? Войти
              </button>
            </p>
          </>
        )}
        </div>
      </div>
    </div>
  )
}

export default ShopAuth
