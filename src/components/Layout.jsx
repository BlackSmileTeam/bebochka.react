import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import CookieNotice from './CookieNotice'
import Toast from './Toast'
import './Layout.css'

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
}

function useAuthNav() {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'))
  useEffect(() => {
    const sync = () => setToken(localStorage.getItem('authToken'))
    window.addEventListener('bebochka-auth', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('bebochka-auth', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return !!token
}

function Layout() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const user = readUser()
  const isAdminUser = !!user.isAdmin
  const isLoggedIn = useAuthNav()

  const { cartItems } = useCart()
  const [toast, setToast] = useState(null)
  const totalItems = Array.isArray(cartItems)
    ? cartItems.reduce((total, item) => total + (item.quantity || 0), 0)
    : 0

  const logoTo = isLoggedIn ? '/' : '/account'
  const showShopLoginLink = !isLoggedIn && location.pathname !== '/account'

  useEffect(() => {
    const onToast = (event) => {
      const message = event?.detail?.message
      if (!message) return
      setToast({
        type: event.detail.type || 'info',
        message
      })
    }
    window.addEventListener('bebochka-toast', onToast)
    return () => window.removeEventListener('bebochka-toast', onToast)
  }, [])

  return (
    <div className="layout">
      <header className="header">
        <div className="container header-inner">
          <Link to={logoTo} className="logo">
            <img src="/logo.jpg" alt="bebochka" className="logo-img" />
            <span className="logo-text">bebochka | детский секонд-хенд</span>
          </Link>

          <nav className="nav" aria-label="Основное меню">
            {isAdminRoute ? (
              <>
                <Link
                  to="/admin"
                  className={location.pathname === '/admin' ? 'active' : ''}
                >
                  Обзор
                </Link>
                <Link
                  to="/admin/products"
                  className={location.pathname === '/admin/products' ? 'active' : ''}
                >
                  Товары
                </Link>
                <Link
                  to="/admin/announcements"
                  className={location.pathname === '/admin/announcements' ? 'active' : ''}
                >
                  Анонсы
                </Link>
                <Link
                  to="/admin/users"
                  className={location.pathname === '/admin/users' ? 'active' : ''}
                >
                  Пользователи
                </Link>
                <Link
                  to="/admin/orders"
                  className={location.pathname === '/admin/orders' ? 'active' : ''}
                >
                  Заказы
                </Link>
              </>
            ) : (
              <>
                {isLoggedIn && (
                  <>
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                      Каталог
                    </Link>
                    <Link to="/cart" className="cart-link">
                      Корзина
                      {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                    </Link>
                    <Link
                      to="/profile"
                      className={location.pathname === '/profile' ? 'active' : ''}
                    >
                      {isAdminUser ? 'Профиль' : 'Заказы'}
                    </Link>
                    <Link
                      to="/reviews"
                      className={location.pathname === '/reviews' ? 'active' : ''}
                    >
                      Отзывы
                    </Link>
                    {isAdminUser && (
                      <Link to="/admin" className="admin-link">
                        Админка
                      </Link>
                    )}
                  </>
                )}
                {!isLoggedIn && (
                  <Link
                    to="/reviews"
                    className={location.pathname === '/reviews' ? 'active' : ''}
                  >
                    Отзывы
                  </Link>
                )}
                {showShopLoginLink && <Link to="/account">Войти</Link>}
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <CookieNotice />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            Недорогая и качественная одежда для мальчиков и девочек от 62 до 152 размера 🧸
          </p>
          <p className="footer-text">
            Отправка заказов через Авито доставку, яндекс, ozon, 5post 📦
          </p>
          <p className="footer-text">
            По всем вопросам{' '}
            <a href="https://t.me/bebochkaa" target="_blank" rel="noopener noreferrer">
              @bebochkaa
            </a>
          </p>
          <p className="footer-text">
            <a href="https://t.me/bebochkasekond" target="_blank" rel="noopener noreferrer">
              Наш канал в Telegram
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
