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
          <Link to="/admin/helpers" className="admin-card">
            <div className="admin-card-icon">🏷️</div>
            <h2>Помощники</h2>
            <p>Бренды, состояния и цвета для списков при добавлении товара</p>
          </Link>
          <Link to="/admin/referrals" className="admin-card">
            <div className="admin-card-icon">🎁</div>
            <h2>Рефералы</h2>
            <p>Кто кого пригласил, статусы и начисленные скидки</p>
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
          <Link to="/admin/backup" className="admin-card">
            <div className="admin-card-icon">💾</div>
            <h2>Бэкап</h2>
            <p>Скачать архив БД и фотографий или восстановить из архива</p>
          </Link>
        </div>
      </div>
    </PageShell>
  )
}

export default Admin
