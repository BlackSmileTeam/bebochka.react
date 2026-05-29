import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import { CONTACT_TELEGRAM_URL } from '../constants/contactLinks'
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

function CartIcon() {
  return (
    <svg className="header-cart-icon__svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45a1 1 0 0 0 .9 1.46h9.72v-2H9.42l1.1-2h7.45a1 1 0 0 0 .95-.68L21.64 6H7.21l-.94-2zm-1 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 .001 3.999A2 2 0 0 0 16 20z"
      />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      />
    </svg>
  )
}

function BurgerButton({ open, onClick, controlsId }) {
  return (
    <button
      type="button"
      className={`header-icon-btn header-menu-toggle${open ? ' header-menu-toggle--open' : ''}`}
      aria-label={open ? 'Закрыть меню' : 'Меню'}
      aria-expanded={open}
      aria-controls={controlsId}
      onClick={onClick}
    >
      <span className="header-menu-toggle__bar" />
      <span className="header-menu-toggle__bar" />
      <span className="header-menu-toggle__bar" />
    </button>
  )
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

  const closeMobileMenu = () => setMobileMenuOpen(false)

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
        <div className={`container header-shell${isAdminRoute ? ' header-shell--admin' : ' header-shell--shop'}`}>
          <div className="header-top">
            <Link to={logoTo} className="logo">
              <img
                src="/logo.jpg"
                alt="bebochka — логотип магазина"
                className="logo-img"
                width={50}
                height={50}
              />
              <span className="logo-text">bebochka</span>
            </Link>

            {isAdminRoute ? (
              <nav className="nav nav--admin" aria-label="Админ-меню">
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
              </nav>
            ) : isLoggedIn ? (
              <div className="header-end">
                <nav className="nav nav--shop-text" aria-label="Основное меню">
                  <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                    Каталог
                  </Link>
                  <Link
                    to="/delivery"
                    className={location.pathname === '/delivery' ? 'active' : ''}
                  >
                    Доставка
                  </Link>
                  <Link
                    to="/faq"
                    className={location.pathname === '/faq' ? 'active' : ''}
                  >
                    FAQ
                  </Link>
                  <Link
                    to="/reviews"
                    className={location.pathname === '/reviews' ? 'active' : ''}
                  >
                    Отзывы
                  </Link>
                  <Link
                    to="/about"
                    className={location.pathname === '/about' ? 'active' : ''}
                  >
                    О нас
                  </Link>
                  {isAdminUser && (
                    <Link to="/admin" className="nav-link-admin">
                      Админка
                    </Link>
                  )}
                </nav>
                <div className="header-actions">
                  <Link
                    to="/cart"
                    className="header-icon-btn header-cart-icon"
                    aria-label={cartAriaLabel}
                  >
                    <CartIcon />
                    {totalItems > 0 && (
                      <span className="cart-badge header-cart-icon__badge">{totalItems}</span>
                    )}
                  </Link>
                  <Link
                    to="/profile"
                    className={`header-icon-btn${
                      location.pathname === '/profile' ? ' header-icon-btn--active' : ''
                    }`}
                    aria-label="Профиль"
                  >
                    <ProfileIcon />
                  </Link>
                  <BurgerButton
                    open={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen((v) => !v)}
                    controlsId="header-mobile-menu"
                  />
                </div>
              </div>
            ) : (
              <div className="header-end">
                <nav className="nav nav--shop-text" aria-label="Основное меню">
                  <Link
                    to="/delivery"
                    className={location.pathname === '/delivery' ? 'active' : ''}
                  >
                    Доставка
                  </Link>
                  <Link
                    to="/faq"
                    className={location.pathname === '/faq' ? 'active' : ''}
                  >
                    FAQ
                  </Link>
                  <Link
                    to="/reviews"
                    className={location.pathname === '/reviews' ? 'active' : ''}
                  >
                    Отзывы
                  </Link>
                  <Link
                    to="/about"
                    className={location.pathname === '/about' ? 'active' : ''}
                  >
                    О нас
                  </Link>
                  {showShopLoginLink && <Link to="/account">Войти</Link>}
                </nav>
                <div className="header-actions header-actions--guest">
                  <BurgerButton
                    open={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen((v) => !v)}
                    controlsId="header-mobile-menu"
                  />
                </div>
              </div>
            )}
          </div>

          {!isAdminRoute && (
            <nav
              id="header-mobile-menu"
              className={`nav nav--mobile-menu${mobileMenuOpen ? ' nav--mobile-menu--open' : ''}`}
              aria-label="Меню"
            >
              {isLoggedIn ? (
                <>
                  <Link
                    to="/"
                    className={location.pathname === '/' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    Каталог
                  </Link>
                  <Link
                    to="/reviews"
                    className={location.pathname === '/reviews' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    Отзывы
                  </Link>
                  <Link
                    to="/delivery"
                    className={location.pathname === '/delivery' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    Доставка
                  </Link>
                  <Link
                    to="/faq"
                    className={location.pathname === '/faq' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    FAQ
                  </Link>
                  <Link
                    to="/about"
                    className={location.pathname === '/about' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    О нас
                  </Link>
                  {isAdminUser && (
                    <Link
                      to="/admin"
                      className={location.pathname === '/admin' ? 'active' : ''}
                      onClick={closeMobileMenu}
                    >
                      Админка
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className={location.pathname === '/' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    Каталог
                  </Link>
                  <Link
                    to="/reviews"
                    className={location.pathname === '/reviews' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    Отзывы
                  </Link>
                  <Link
                    to="/delivery"
                    className={location.pathname === '/delivery' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    Доставка
                  </Link>
                  <Link
                    to="/faq"
                    className={location.pathname === '/faq' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    FAQ
                  </Link>
                  <Link
                    to="/about"
                    className={location.pathname === '/about' ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    О нас
                  </Link>
                  {showShopLoginLink && (
                    <Link to="/account" onClick={closeMobileMenu}>
                      Войти
                    </Link>
                  )}
                </>
              )}
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
            <a href={CONTACT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
              bebochka
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
