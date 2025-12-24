import { Link, Outlet, useLocation } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import './Layout.css'

function Layout() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  
  // Используем хук useCart для получения данных корзины
  const { cartItems } = useCart()
  const totalItems = Array.isArray(cartItems) 
    ? cartItems.reduce((total, item) => total + (item.quantity || 0), 0)
    : 0
  
  // Отладочный вывод
  if (process.env.NODE_ENV === 'development') {
    console.log('[Layout] Cart items:', cartItems, 'Total:', totalItems)
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">
            <img src="/logo.jpg" alt="bebochka" className="logo-img" />
            <span className="logo-text">bebochka | детский секонд-хенд</span>
          </Link>
          <nav className="nav">
            {!isAdmin && (
              <>
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                  Каталог
                </Link>
                <Link to="/cart" className="cart-link">
                  Корзина
                  {totalItems > 0 && (
                    <span className="cart-badge">{totalItems}</span>
                  )}
                </Link>
                {localStorage.getItem('authToken') && (
                  <Link to="/admin" className="admin-link">
                    Админка
                  </Link>
                )}
              </>
            )}
            {isAdmin && (
              <>
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
                <Link to="/" className="back-link">
                  На сайт
                </Link>
                <button 
                  className="logout-btn"
                  onClick={() => {
                    localStorage.removeItem('authToken')
                    localStorage.removeItem('user')
                    window.location.href = '/'
                  }}
                >
                  Выйти
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            Недорогая и качественная одежда для мальчиков и девочек от 62 до 152 размера 🧸
          </p>
          <p className="footer-text">
            Отправка заказов через Авито доставку, яндекс, ozon, 5post 📦
          </p>
          <p className="footer-text">
            По всем вопросам <a href="https://t.me/bebochkaa" target="_blank" rel="noopener noreferrer">@bebochkaa</a>
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

