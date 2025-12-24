import { useState, useEffect, useMemo } from 'react'
import { api } from '../services/api'
import ProductForm from '../components/ProductForm'
import './AdminProducts.css'

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState(null)
  const [viewingProduct, setViewingProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [colors, setColors] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  
  // Фильтры
  const [filters, setFilters] = useState({
    name: '',
    brand: '',
    size: '',
    color: '',
    gender: '',
    condition: '',
    priceMin: '',
    priceMax: '',
    quantityMin: '',
    quantityMax: '',
    publishedStatus: 'all' // all, published, scheduled
  })

  useEffect(() => {
    loadProducts()
    loadColors()
  }, [])
  
  useEffect(() => {
    // Применяем фильтры при изменении товаров или фильтров
    applyFilters()
  }, [products, filters])
  
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
  }, [filteredProducts])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getAllProductsForAdmin()
      setProducts(data)
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Получаем уникальные значения для фильтров
  const filterOptions = useMemo(() => {
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort()
    const sizes = [...new Set(products.map(p => p.size).filter(Boolean))].sort()
    const productColors = [...new Set(products.map(p => p.color).filter(Boolean))].sort()
    const genders = [...new Set(products.map(p => p.gender).filter(Boolean))].sort()
    const conditions = [...new Set(products.map(p => p.condition).filter(Boolean))].sort()
    
    return { brands, sizes, colors: productColors, genders, conditions }
  }, [products])
  
  const applyFilters = () => {
    let filtered = [...products]
    
    if (filters.name) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(filters.name.toLowerCase())
      )
    }
    
    if (filters.brand) {
      filtered = filtered.filter(p => p.brand === filters.brand)
    }
    
    if (filters.size) {
      filtered = filtered.filter(p => p.size === filters.size)
    }
    
    if (filters.color) {
      filtered = filtered.filter(p => p.color === filters.color)
    }
    
    if (filters.gender) {
      filtered = filtered.filter(p => p.gender === filters.gender)
    }
    
    if (filters.condition) {
      filtered = filtered.filter(p => p.condition === filters.condition)
    }
    
    if (filters.priceMin) {
      filtered = filtered.filter(p => p.price >= parseFloat(filters.priceMin))
    }
    
    if (filters.priceMax) {
      filtered = filtered.filter(p => p.price <= parseFloat(filters.priceMax))
    }
    
    if (filters.quantityMin) {
      filtered = filtered.filter(p => p.quantityInStock >= parseInt(filters.quantityMin))
    }
    
    if (filters.quantityMax) {
      filtered = filtered.filter(p => p.quantityInStock <= parseInt(filters.quantityMax))
    }
    
    if (filters.publishedStatus !== 'all') {
      filtered = filtered.filter(p => {
        const published = isPublished(p)
        if (filters.publishedStatus === 'published') {
          return published
        } else if (filters.publishedStatus === 'scheduled') {
          return !published && p.publishedAt
        }
        return true
      })
    }
    
    setFilteredProducts(filtered)
  }
  
  // Функция для проверки, опубликован ли товар
  const isPublished = (product) => {
    if (!product.publishedAt) return true
    try {
      const publishedAt = new Date(product.publishedAt)
      if (isNaN(publishedAt.getTime())) return true
      // Use UTC for comparison to avoid timezone issues
      // publishedAt is stored in UTC in the database
      const now = new Date()
      // Compare UTC timestamps
      return publishedAt.getTime() <= now.getTime()
    } catch (error) {
      console.error('Ошибка при проверке даты публикации:', error)
      return true
    }
  }
  
  // Получить иконку для пола
  const getGenderIcon = (gender) => {
    if (!gender) return '-'
    const genderLower = gender.toLowerCase()
    if (genderLower.includes('мальчик') || genderLower.includes('boy')) return '👦'
    if (genderLower.includes('девочка') || genderLower.includes('girl')) return '👧'
    if (genderLower.includes('унисекс') || genderLower.includes('unisex')) return '👶'
    return gender
  }

  // Конвертировать UTC время в московское время для отображения
  const formatMoscowTime = (dateString) => {
    if (!dateString) return ''
    try {
      // PublishedAt is stored as Moscow time in database
      // Parse and format it directly (it's already Moscow time)
      const date = new Date(dateString)
      // Format as DD.MM.YYYY HH:mm
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}.${month}.${year} ${hours}:${minutes}`
    } catch (error) {
      console.error('Ошибка при форматировании времени:', error)
      return dateString
    }
  }

  const loadColors = async () => {
    try {
      const data = await api.getColors()
      if (Array.isArray(data) && data.length > 0) {
        setColors(data)
      } else {
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
    setShowDetails(false)
  }
  
  const handleRowClick = (product, event) => {
    // Не открываем детали если кликнули на кнопку меню или внутри меню
    if (event.target.closest('.action-menu-wrapper') || event.target.closest('.action-menu')) {
      return
    }
    setViewingProduct(product)
    setShowDetails(true)
  }
  
  const handleCloseDetails = () => {
    setShowDetails(false)
    setViewingProduct(null)
  }
  
  const handleEditFromDetails = () => {
    if (viewingProduct) {
      handleEdit(viewingProduct)
    }
  }
  
  // Функция для капитализации первой буквы
  const capitalize = (str) => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
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
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const clearFilters = () => {
    setFilters({
      name: '',
      brand: '',
      size: '',
      color: '',
      gender: '',
      condition: '',
      priceMin: '',
      priceMax: '',
      quantityMin: '',
      quantityMax: '',
      publishedStatus: 'all'
    })
  }
  
  const activeFiltersCount = Object.values(filters).filter(v => v !== '' && v !== 'all').length

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
        <div className="header-actions">
          <button 
            className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Фильтры {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            ➕ Добавить
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Название</label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                placeholder="Поиск по названию..."
              />
            </div>
            
            <div className="filter-group">
              <label>Бренд</label>
              <select
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
              >
                <option value="">Все бренды</option>
                {filterOptions.brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Размер</label>
              <select
                value={filters.size}
                onChange={(e) => handleFilterChange('size', e.target.value)}
              >
                <option value="">Все размеры</option>
                {filterOptions.sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Цвет</label>
              <select
                value={filters.color}
                onChange={(e) => handleFilterChange('color', e.target.value)}
              >
                <option value="">Все цвета</option>
                {filterOptions.colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Пол</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="">Все</option>
                {filterOptions.genders.map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Состояние</label>
              <select
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
              >
                <option value="">Все</option>
                {filterOptions.conditions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Цена от (₽)</label>
              <input
                type="number"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            
            <div className="filter-group">
              <label>Цена до (₽)</label>
              <input
                type="number"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                placeholder="∞"
                min="0"
              />
            </div>
            
            <div className="filter-group">
              <label>Количество от (шт)</label>
              <input
                type="number"
                value={filters.quantityMin}
                onChange={(e) => handleFilterChange('quantityMin', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            
            <div className="filter-group">
              <label>Количество до (шт)</label>
              <input
                type="number"
                value={filters.quantityMax}
                onChange={(e) => handleFilterChange('quantityMax', e.target.value)}
                placeholder="∞"
                min="0"
              />
            </div>
            
            <div className="filter-group">
              <label>Статус публикации</label>
              <select
                value={filters.publishedStatus}
                onChange={(e) => handleFilterChange('publishedStatus', e.target.value)}
              >
                <option value="all">Все</option>
                <option value="published">Опубликованные</option>
                <option value="scheduled">Запланированные</option>
              </select>
            </div>
          </div>
          
          {activeFiltersCount > 0 && (
            <div className="filters-actions">
              <button className="btn btn-clear" onClick={clearFilters}>
                Очистить фильтры
              </button>
            </div>
          )}
        </div>
      )}

      {showDetails && viewingProduct && (
        <ProductDetailsModal
          product={viewingProduct}
          onClose={handleCloseDetails}
          onEdit={handleEditFromDetails}
          isPublished={isPublished(viewingProduct)}
          getGenderIcon={getGenderIcon}
          capitalize={capitalize}
        />
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          colors={colors}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p>
            {products.length === 0 
              ? 'Товары не добавлены. Нажмите "Добавить товар" для начала.'
              : 'Товары не найдены по заданным фильтрам.'}
          </p>
        </div>
      ) : (
        <div className="products-table-container">
          <div className="table-info">
            Показано: {filteredProducts.length} из {products.length} товаров
          </div>
          <table className="products-table">
            <thead>
              <tr>
                <th>Фото</th>
                <th>Бренд</th>
                <th>Размер</th>
                <th>Цвет</th>
                <th>Пол</th>
                <th>Состояние</th>
                <th>В наличии</th>
                <th>Цена</th>
                <th title="Статус публикации"><span style={{cursor: 'help'}}>📢</span></th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const published = isPublished(product)
                return (
                <tr 
                  key={product.id}
                  className={`product-row ${published ? '' : 'product-unpublished'}`}
                  style={published ? {} : { backgroundColor: '#fff8e1' }}
                  onClick={(e) => handleRowClick(product, e)}
                >
                  <td>
                    <div className="product-image-cell">
                      {product.images && product.images.length > 0 ? (
                        <>
                          <img
                            src={product.images[0].startsWith('http') 
                              ? product.images[0] 
                              : `${import.meta.env.VITE_API_URL || 'http://89.104.67.36:55501'}${product.images[0]}`}
                            alt={product.name}
                            className="table-image"
                            title={product.name}
                            onError={(e) => {
                              e.target.src = '/logo.jpg'
                            }}
                          />
                          <div className="product-name-tooltip">{product.name}</div>
                        </>
                      ) : (
                        <div className="table-image-placeholder" title={product.name}>
                          Нет фото
                        </div>
                      )}
                      <div className="product-name-below">{product.name}</div>
                    </div>
                  </td>
                  <td>{product.brand || '-'}</td>
                  <td>{product.size || '-'}</td>
                  <td>{product.color || '-'}</td>
                  <td className="gender-cell" title={product.gender || '-'}>
                    {getGenderIcon(product.gender)}
                  </td>
                  <td>{product.condition ? capitalize(product.condition) : '-'}</td>
                  <td className="quantity-cell">
                    <span style={{ 
                      color: (product.quantityInStock || 0) > 0 ? '#48bb78' : '#e53e3e',
                      fontWeight: 'bold'
                    }}>
                      {product.quantityInStock || 0} шт.
                    </span>
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
                            title={`Запланировано на ${formatMoscowTime(product.publishedAt)}`}
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

// Компонент модального окна деталей товара
function ProductDetailsModal({ product, onClose, onEdit, isPublished, getGenderIcon, capitalize }) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://89.104.67.36:55501'
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content product-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Детали товара</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="product-details-content">
          <div className="product-details-images">
            {product.images && product.images.length > 0 ? (
              <div className="product-images-grid">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.startsWith('http') ? image : `${apiUrl}${image}`}
                    alt={`${product.name} - фото ${index + 1}`}
                    className="product-detail-image"
                    onError={(e) => {
                      e.target.src = '/logo.jpg'
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="product-image-placeholder-large">
                Нет фотографий
              </div>
            )}
          </div>
          
          <div className="product-details-info">
            <div className="detail-section">
              <h3>{product.name}</h3>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Бренд:</span>
              <span className="detail-value">{product.brand || '-'}</span>
            </div>
            
            {product.description && (
              <div className="detail-row">
                <span className="detail-label">Описание:</span>
                <span className="detail-value">{product.description}</span>
              </div>
            )}
            
            <div className="detail-row">
              <span className="detail-label">Цена:</span>
              <span className="detail-value">{product.price?.toLocaleString('ru-RU')} ₽</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Размер:</span>
              <span className="detail-value">{product.size || '-'}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Цвет:</span>
              <span className="detail-value">{product.color || '-'}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Пол:</span>
              <span className="detail-value">
                <span className="gender-icon-large" title={product.gender || '-'}>
                  {getGenderIcon(product.gender)}
                </span>
                {product.gender && ` ${product.gender}`}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Состояние:</span>
              <span className="detail-value">{product.condition ? capitalize(product.condition) : '-'}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">В наличии:</span>
              <span className="detail-value" style={{
                color: (product.quantityInStock || 0) > 0 ? '#48bb78' : '#e53e3e',
                fontWeight: 'bold'
              }}>
                {product.quantityInStock || 0} шт.
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Статус публикации:</span>
              <span className="detail-value">
                {product.publishedAt ? (
                  isPublished ? (
                    <span style={{ color: '#48bb78', fontWeight: 'bold' }}>Опубликован</span>
                  ) : (
                    <span style={{ color: '#ed8936', fontWeight: 'bold' }}>
                      Запланировано на {formatMoscowTime(product.publishedAt)}
                    </span>
                  )
                ) : (
                  <span style={{ color: '#48bb78', fontWeight: 'bold' }}>Опубликован</span>
                )}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Дата создания:</span>
              <span className="detail-value">
                {product.createdAt ? new Date(product.createdAt).toLocaleString('ru-RU') : '-'}
              </span>
            </div>
            
            {product.updatedAt && (
              <div className="detail-row">
                <span className="detail-label">Дата обновления:</span>
                <span className="detail-value">
                  {new Date(product.updatedAt).toLocaleString('ru-RU')}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Закрыть
          </button>
          <button className="btn btn-primary" onClick={onEdit}>
            Редактировать
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminProducts
