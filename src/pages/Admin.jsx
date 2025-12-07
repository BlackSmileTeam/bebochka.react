import { Link } from 'react-router-dom'
import './Admin.css'

function Admin() {
  return (
    <div className="container">
      <div className="admin-dashboard">
        <h1>Панель администратора</h1>
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
        </div>
      </div>
    </div>
  )
}

export default Admin

