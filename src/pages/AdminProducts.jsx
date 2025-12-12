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
  
  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-menu-wrapper')) {
        document.querySelectorAll('.action-menu').forEach(menu => {
          menu.classList.remove('show')
        })
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [products])

  const loadProducts = async () => {
    try {
      setLoading(true)
      // Используем специальный метод для админа, который возвращает все товары
      const data = await api.getAllProductsForAdmin()
      setProducts(data)
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Функция для проверки, опубликован ли товар
  const isPublished = (product) => {
    if (!product.publishedAt) return true // Если PublishedAt не установлен, товар опубликован
    try {
      const publishedAt = new Date(product.publishedAt)
      if (isNaN(publishedAt.getTime())) return true // Если дата невалидна, считаем опубликованным
      const now = new Date()
      return publishedAt <= now
    } catch (error) {
      console.error('Ошибка при проверке даты публикации:', error)
      return true // В случае ошибки считаем опубликованным
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
                <th>Пол</th>
                <th>Состояние</th>
                <th title="Наличие товара"><span style={{cursor: 'help'}}>📦</span></th>
                <th>Цена</th>
                <th title="Статус публикации"><span style={{cursor: 'help'}}>📢</span></th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const published = isPublished(product)
                return (
                <tr 
                  key={product.id}
                  className={published ? '' : 'product-unpublished'}
                  style={published ? {} : { backgroundColor: '#fff8e1' }}
                >
                  <td>
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].startsWith('http') 
                          ? product.images[0] 
                          : `${import.meta.env.VITE_API_URL || 'http://89.104.67.36:55501'}${product.images[0]}`}
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
                  <td>{product.gender || '-'}</td>
                  <td>{product.condition || '-'}</td>
                  <td>
                    <div 
                      className="stock-icon-wrapper"
                      title={`В наличии: ${product.quantityInStock || 0} шт.`}
                    >
                      {(product.quantityInStock || 0) > 0 ? (
                        <span className="stock-icon stock-available" title="В наличии">
                          ✓
                        </span>
                      ) : (
                        <span className="stock-icon stock-unavailable" title="Нет в наличии">
                          ✗
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{(product.price ?? 0).toLocaleString('ru-RU')} ₽</td>
                  <td>
                    <div className="publication-icon-wrapper">
                      {product.publishedAt ? (
                        published ? (
                          <span 
                            className="publication-icon published" 
                            title="Опубликован"
                          >
                            ✓
                          </span>
                        ) : (
                          <span 
                            className="publication-icon scheduled" 
                            title={`Запланировано на ${new Date(product.publishedAt).toLocaleString('ru-RU')}`}
                          >
                            ⏰
                          </span>
                        )
                      ) : (
                        <span 
                          className="publication-icon published" 
                          title="Опубликован"
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-menu-wrapper">
                      <button
                        className="btn-more"
                        onClick={(e) => {
                          e.stopPropagation()
                          const menu = e.currentTarget.nextElementSibling
                          const allMenus = document.querySelectorAll('.action-menu')
                          allMenus.forEach(m => {
                            if (m !== menu) m.classList.remove('show')
                          })
                          if (menu) {
                            menu.classList.toggle('show')
                          }
                        }}
                        title="Действия"
                      >
                        ⋮
                      </button>
                      <div className="action-menu">
                        <button
                          className="action-menu-item edit"
                          onClick={() => {
                            handleEdit(product)
                            document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'))
                          }}
                        >
                          Редактировать
                        </button>
                        <button
                          className="action-menu-item delete"
                          onClick={() => {
                            document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'))
                            handleDelete(product.id)
                          }}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminProducts

