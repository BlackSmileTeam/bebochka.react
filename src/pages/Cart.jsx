import { useCart } from '../contexts/CartContext'
import { Link } from 'react-router-dom'
import './Cart.css'

function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://89.104.67.36:55501'

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/logo.jpg'
    if (imagePath.startsWith('http')) return imagePath
    return `${apiUrl}${imagePath}`
  }

  if (cartItems.length === 0) {
    return (
      <div className="container">
        <div className="cart-empty">
          <h2>Корзина пуста</h2>
          <p>Добавьте товары из каталога</p>
          <Link to="/" className="btn btn-primary">
            Перейти в каталог
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="cart-header">
        <h1>Корзина</h1>
        <button className="btn-clear-cart" onClick={clearCart} title="Очистить корзину">
          Очистить
        </button>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                <img
                  src={getImageUrl(item.images?.[0])}
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = '/logo.jpg'
                  }}
                />
              </div>
              
              <div className="cart-item-info">
                <h3 className="cart-item-name">{item.name}</h3>
                {item.brand && (
                  <p className="cart-item-brand">Бренд: {item.brand}</p>
                )}
                {item.size && (
                  <p className="cart-item-detail">Размер: {item.size}</p>
                )}
                {item.color && (
                  <p className="cart-item-detail">Цвет: {item.color}</p>
                )}
              </div>

              <div className="cart-item-quantity">
                <label>Количество:</label>
                <div className="quantity-controls">
                  <button
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="quantity-value">{item.quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="cart-item-price">
                <div className="item-total-price">
                  {((item.price || 0) * item.quantity).toLocaleString('ru-RU')} ₽
                </div>
                <div className="item-unit-price">
                  {item.price?.toLocaleString('ru-RU')} ₽ за шт.
                </div>
              </div>

              <button
                className="cart-item-remove"
                onClick={() => removeFromCart(item.id)}
                aria-label="Удалить из корзины"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Итого</h2>
          <div className="summary-row">
            <span>Товаров:</span>
            <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} шт.</span>
          </div>
          <div className="summary-row summary-total">
            <span>Сумма:</span>
            <span>{getTotalPrice().toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="cart-summary-actions">
            <Link to="/checkout" className="btn btn-primary btn-checkout">
              Оформить заказ
            </Link>
            <Link to="/" className="btn btn-secondary">
              Продолжить покупки
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart

