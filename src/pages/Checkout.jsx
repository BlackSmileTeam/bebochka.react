import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useNavigate, Link } from 'react-router-dom'
import './Checkout.css'

function Checkout() {
  const { cartItems, getTotalPrice, clearCart, sessionId } = useCart()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    deliveryMethod: 'avito',
    comment: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Валидация
    if (!formData.name.trim()) {
      setError('Укажите ваше имя')
      setLoading(false)
      return
    }
    if (!formData.phone.trim()) {
      setError('Укажите номер телефона')
      setLoading(false)
      return
    }

    try {
      // Отправляем заказ на сервер
      const orderData = {
        sessionId: sessionId,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email || null,
        customerAddress: formData.address || null,
        deliveryMethod: formData.deliveryMethod || null,
        comment: formData.comment || null,
        items: cartItems.map(item => ({
          productId: item.productId || item.id,
          quantity: item.quantity
        }))
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://89.104.67.36:55501'}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка при оформлении заказа' }))
        throw new Error(errorData.message || 'Ошибка при оформлении заказа')
      }

      const order = await response.json()

      // Очищаем корзину
      clearCart()
      
      setSuccess(true)
      
      // Перенаправляем на главную через 3 секунды
      setTimeout(() => {
        navigate('/')
      }, 3000)
    } catch (err) {
      console.error('Order error:', err)
      setError('Ошибка при оформлении заказа. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  const deliveryMethods = [
    { value: 'avito', label: 'Авито доставка' },
    { value: 'yandex', label: 'Яндекс Доставка' },
    { value: 'ozon', label: 'Ozon' },
    { value: '5post', label: '5Post' }
  ]

  if (success) {
    return (
      <div className="container">
        <div className="checkout-success">
          <div className="success-icon">✓</div>
          <h2>Заказ оформлен!</h2>
          <p>Спасибо за ваш заказ. Мы свяжемся с вами в ближайшее время.</p>
          <p>Вы будете перенаправлены на главную страницу...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container">
        <div className="checkout-empty">
          <h2>Корзина пуста</h2>
          <p>Добавьте товары в корзину для оформления заказа</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Перейти в каталог
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="checkout-header">
        <h1>Оформление заказа</h1>
      </div>

      <div className="checkout-content">
        <div className="checkout-form-container">
          <form onSubmit={handleSubmit} className="checkout-form">
            <h2>Контактные данные</h2>
            
            {error && <div className="checkout-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">Имя *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ваше имя"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Телефон *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Адрес доставки</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                placeholder="Город, улица, дом, квартира"
              />
            </div>

            <div className="form-group">
              <label htmlFor="deliveryMethod">Способ доставки</label>
              <select
                id="deliveryMethod"
                name="deliveryMethod"
                value={formData.deliveryMethod}
                onChange={handleChange}
              >
                {deliveryMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="comment">Комментарий к заказу</label>
              <textarea
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                rows="4"
                placeholder="Дополнительная информация..."
              />
            </div>

            <div className="checkout-form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-submit"
                disabled={loading}
              >
                {loading ? 'Оформление...' : 'Оформить заказ'}
              </button>
              <Link to="/cart" className="btn btn-secondary btn-back">
                Вернуться в корзину
              </Link>
            </div>
          </form>
        </div>

        <div className="checkout-summary">
          <h2>Ваш заказ</h2>
          <div className="order-items">
            {cartItems.map((item) => (
              <div key={item.id} className="order-item">
                <div className="order-item-info">
                  <span className="order-item-name">{item.name}</span>
                  <span className="order-item-quantity">× {item.quantity}</span>
                </div>
                <span className="order-item-price">
                  {((item.price || 0) * item.quantity).toLocaleString('ru-RU')} ₽
                </span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <span>Итого:</span>
            <span>{getTotalPrice().toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout

