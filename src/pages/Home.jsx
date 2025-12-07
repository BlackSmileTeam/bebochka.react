import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Home.css'

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getProducts()
      setProducts(data)
      setError(null)
    } catch (err) {
      setError('Не удалось загрузить товары')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="home-header">
        <h1>Каталог товаров</h1>
        <p className="subtitle">
          Недорогая и качественная одежда для мальчиков и девочек от 62 до 152 размера 🧸
        </p>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>Товары пока не добавлены</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              {product.images && product.images.length > 0 ? (
                <div className="product-image-container">
                  <img
                    src={product.images[0].startsWith('http') 
                      ? product.images[0] 
                          : `${import.meta.env.VITE_API_URL || 'http://89.104.67.36:55501'}${product.images[0]}`}
                    alt={product.name}
                    className="product-image"
                    onError={(e) => {
                      e.target.src = '/logo.jpg'
                    }}
                  />
                </div>
              ) : (
                <div className="product-image-placeholder">
                  <span>Нет фото</span>
                </div>
              )}
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                {product.brand && (
                  <p className="product-brand">Бренд: {product.brand}</p>
                )}
                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}
                <div className="product-details">
                  {product.size && (
                    <span className="product-size">Размер: {product.size}</span>
                  )}
                  {product.color && (
                    <span className="product-color">Цвет: {product.color}</span>
                  )}
                </div>
                <div className="product-price">
                  {product.price.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Home

