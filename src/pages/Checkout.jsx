import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useNavigate, Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import './Checkout.css'

function formatPhoneRu(value) {
  const digitsOnly = String(value || '').replace(/\D/g, '')
  if (!digitsOnly) return ''

  let normalized = digitsOnly
  if (normalized.startsWith('8')) {
    normalized = `7${normalized.slice(1)}`
  } else if (!normalized.startsWith('7')) {
    normalized = `7${normalized}`
  }

  normalized = normalized.slice(0, 11)
  const body = normalized.slice(1)

  const p1 = body.slice(0, 3)
  const p2 = body.slice(3, 6)
  const p3 = body.slice(6, 8)
  const p4 = body.slice(8, 10)

  const parts = [p1, p2, p3, p4].filter(Boolean)
  return `+7${parts.length ? ` ${parts.join(' ')}` : ''}`
}

function isValidPhoneRu(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('7')
}

function Checkout() {
  const { cartItems, getTotalPrice, clearCart, sessionId } = useCart()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    comment: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'phone' ? formatPhoneRu(value) : value
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
    if (!isValidPhoneRu(formData.phone)) {
      setError('Укажите телефон в формате +7 111 222 33 44')
      setLoading(false)
      return
    }

    try {
      let userId = null
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}')
        if (u.userId != null) userId = u.userId
      } catch (_) {}

      // Отправляем заказ на сервер
      const orderData = {
        sessionId: sessionId,
        userId: userId,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email || null,
        customerAddress: null,
        deliveryMethod: null,
        comment: formData.comment || null,
        items: cartItems.map(item => ({
          productId: item.productId || item.id,
          quantity: item.quantity
        }))
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, {
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

  if (success) {
    return (
      <PageShell className="page-shell--checkout" title="Заказ оформлен!">
        <div className="checkout-success">
          <div className="success-icon">✓</div>
          <p>Спасибо за ваш заказ. Мы свяжемся с вами в ближайшее время.</p>
          <p>Вы будете перенаправлены на главную страницу...</p>
        </div>
      </PageShell>
    )
  }
  if (cartItems.length === 0) {
    return (
      <PageShell className="page-shell--checkout" title="Оформление заказа">
        <div className="checkout-empty">
          <h2>Корзина пуста</h2>
          <p>Добавьте товары в корзину для оформления заказа</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Перейти в каталог
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell className="page-shell--checkout" title="Оформление заказа">
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
                onFocus={(e) => {
                  if (!e.target.value) {
                    setFormData((prev) => ({ ...prev, phone: '+7 ' }))
                  }
                }}
                required
                inputMode="numeric"
                placeholder="+7 111 222 33 44"
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
    </PageShell>
  )
}

export default Checkout

