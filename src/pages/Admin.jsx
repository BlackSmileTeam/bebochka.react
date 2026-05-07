import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import './Admin.css'

function Admin() {
  return (
    <PageShell title="Панель администратора">
      <div className="admin-dashboard">
        <div className="admin-cards">
          <Link to="/admin/products" className="admin-card">
            <div className="admin-card-icon">📦</div>
            <h2>Управление товарами</h2>
            <p>Добавляйте, редактируйте и удаляйте товары</p>
          </Link>
          <Link to="/admin/users" className="admin-card">
            <div className="admin-card-icon">👥</div>
            <h2>Управление пользователями</h2>
            <p>Создавайте администраторов и управляйте паролями</p>
          </Link>
          <Link to="/admin/announcements" className="admin-card">
            <div className="admin-card-icon">📢</div>
            <h2>Анонсы</h2>
            <p>Создавайте и планируйте отправку анонсов пользователям</p>
          </Link>
          <Link to="/admin/orders" className="admin-card">
            <div className="admin-card-icon">🧾</div>
            <h2>Заказы</h2>
            <p>Просматривайте и управляйте заказами пользователей</p>
          </Link>
          <Link to="/reviews" className="admin-card">
            <div className="admin-card-icon">⭐</div>
            <h2>Отзывы</h2>
            <p>Публичная страница отзывов клиентов</p>
          </Link>
          <Link to="/admin/incoming-shipments" className="admin-card">
            <div className="admin-card-icon">🚚</div>
            <h2>Поступления</h2>
            <p>Учитывайте вес, количество, закупку и прибыль по посылкам</p>
          </Link>
          <Link to="/admin/telegram-errors" className="admin-card">
            <div className="admin-card-icon">⚠️</div>
            <h2>Ошибки Telegram</h2>
            <p>Просматривайте ошибки отправки в канал</p>
          </Link>
        </div>
      </div>
    </PageShell>
  )
}

export default Admin

