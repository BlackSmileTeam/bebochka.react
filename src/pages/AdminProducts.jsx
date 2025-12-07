import { useState, useEffect } from 'react'
import { api } from '../services/api'
import ProductForm from '../components/ProductForm'
import './AdminProducts.css'

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [colors, setColors] = useState([])

  useEffect(() => {
    loadProducts()
    loadColors()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getProducts()
      setProducts(data)
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadColors = async () => {
    try {
      console.log('[AdminProducts] Loading colors...')
      const data = await api.getColors()
      console.log('[AdminProducts] Colors received:', data, 'Type:', typeof data, 'IsArray:', Array.isArray(data))
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[AdminProducts] Setting ${data.length} colors`)
        setColors(data)
      } else {
        console.warn('[AdminProducts] Colors data is invalid:', data)
        setColors([])
      }
    } catch (err) {
      console.error('[AdminProducts] Ошибка загрузки цветов:', err)
      setColors([])
    }
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setShowForm(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      return
    }

    try {
      await api.deleteProduct(id)
      await loadProducts()
    } catch (err) {
      alert('Ошибка при удалении товара')
      console.error(err)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingProduct(null)
    loadProducts()
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="admin-products-header">
        <h1>Управление товарами</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Добавить товар
        </button>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          colors={colors}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {products.length === 0 ? (
        <div className="empty-state">
          <p>Товары не добавлены. Нажмите "Добавить товар" для начала.</p>
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Фото</th>
                <th>Название</th>
                <th>Бренд</th>
                <th>Размер</th>
                <th>Цвет</th>
                <th>Цена</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].startsWith('http') 
                          ? product.images[0] 
                          : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.images[0]}`}
                        alt={product.name}
                        className="table-image"
                        onError={(e) => {
                          e.target.src = '/logo.jpg'
                        }}
                      />
                    ) : (
                      <div className="table-image-placeholder">Нет фото</div>
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>{product.brand || '-'}</td>
                  <td>{product.size || '-'}</td>
                  <td>{product.color || '-'}</td>
                  <td>{product.price.toLocaleString('ru-RU')} ₽</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-small btn-edit"
                        onClick={() => handleEdit(product)}
                      >
                        Редактировать
                      </button>
                      <button
                        className="btn btn-small btn-delete"
                        onClick={() => handleDelete(product.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminProducts

