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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { cartItems } = useCart()
  const [toast, setToast] = useState(null)
  const totalItems = Array.isArray(cartItems)
    ? cartItems.reduce((total, item) => total + (item.quantity || 0), 0)
    : 0

  const logoTo = isLoggedIn ? '/' : '/account'
  const showShopLoginLink = !isLoggedIn && location.pathname !== '/account'

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

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

  const cartAriaLabel =
    totalItems > 0 ? `Корзина, ${totalItems} товаров` : 'Корзина'

  return (
    <div className="layout">
      <header className="header">
        <div className="container header-shell">
          <div className="header-top">
            <Link to={logoTo} className="logo">
              <img src="/logo.jpg" alt="bebochka" className="logo-img" />
              <span className="logo-text">bebochka</span>
            </Link>

            {isLoggedIn && !isAdminRoute && (
              <div className="header-actions">
                <Link
                  to="/profile"
                  className={`header-icon-btn header-profile-icon${
                    location.pathname === '/profile' ? ' header-icon-btn--active' : ''
                  }`}
                  aria-label="Профиль"
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                    />
                  </svg>
                </Link>
                <Link
                  to="/cart"
                  className="header-icon-btn header-cart-icon"
                  aria-label={cartAriaLabel}
                >
                  <svg className="header-cart-icon__svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45a1 1 0 0 0 .9 1.46h9.72v-2H9.42l1.1-2h7.45a1 1 0 0 0 .95-.68L21.64 6H7.21l-.94-2zm-1 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 .001 3.999A2 2 0 0 0 16 20z"
                    />
                  </svg>
                  {totalItems > 0 && (
                    <span className="cart-badge header-cart-icon__badge">{totalItems}</span>
                  )}
                </Link>
                <button
                  type="button"
                  className={`header-icon-btn header-menu-toggle${
                    mobileMenuOpen ? ' header-menu-toggle--open' : ''
                  }`}
                  aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Ещё'}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="header-mobile-menu"
                  onClick={() => setMobileMenuOpen((v) => !v)}
                >
                  <span className="header-menu-toggle__bar" />
                  <span className="header-menu-toggle__bar" />
                  <span className="header-menu-toggle__bar" />
                </button>
              </div>
            )}

            {!isLoggedIn && !isAdminRoute && (
              <button
                type="button"
                className={`header-icon-btn header-menu-toggle header-menu-toggle--guest${
                  mobileMenuOpen ? ' header-menu-toggle--open' : ''
                }`}
                aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Меню'}
                aria-expanded={mobileMenuOpen}
                aria-controls="header-mobile-menu"
                onClick={() => setMobileMenuOpen((v) => !v)}
              >
                <span className="header-menu-toggle__bar" />
                <span className="header-menu-toggle__bar" />
                <span className="header-menu-toggle__bar" />
              </button>
            )}
          </div>

          <nav className="nav nav--primary" aria-label="Основное меню">
            {isAdminRoute ? (
              <>
                <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                  Обзор
                </Link>
                <Link
                  to="/admin/products"
                  className={location.pathname === '/admin/products' ? 'active' : ''}
                >
                  Товары
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
                    <Link
                      to="/profile"
                      className={`nav-link-profile${
                        location.pathname === '/profile' ? ' active' : ''
                      }`}
                    >
                      Профиль
                    </Link>
                    <Link
                      to="/reviews"
                      className={location.pathname === '/reviews' ? 'active' : ''}
                    >
                      Отзывы
                    </Link>
                    <Link to="/cart" className="cart-link cart-link--nav">
                      Корзина
                      {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                    </Link>
                    {isAdminUser && (
                      <Link to="/admin" className="admin-link nav-link-extra">
                        Админка
                      </Link>
                    )}
                  </>
                )}
                {!isLoggedIn && (
                  <>
                    <Link
                      to="/reviews"
                      className={location.pathname === '/reviews' ? 'active' : ''}
                    >
                      Отзывы
                    </Link>
                    {showShopLoginLink && (
                      <Link to="/account" className="nav-link-extra">
                        Войти
                      </Link>
                    )}
                  </>
                )}
              </>
            )}
          </nav>

          {!isAdminRoute && (
            <nav
              id="header-mobile-menu"
              className={`nav nav--mobile-extra${mobileMenuOpen ? ' nav--mobile-extra--open' : ''}`}
              aria-label="Дополнительное меню"
            >
              {isLoggedIn && isAdminUser && (
                <Link to="/admin" className="admin-link">
                  Админка
                </Link>
              )}
              {showShopLoginLink && <Link to="/account">Войти</Link>}
            </nav>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <CookieNotice />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            По всем вопросам
            <br />
            <a href="https://t.me/mamka_vseya_russi" target="_blank" rel="noopener noreferrer">
              bebochka
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
