import { useState, useEffect, useMemo } from 'react'
import { api } from '../services/api'
import ProductForm from '../components/ProductForm'
import Toast from '../components/Toast'
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
  const [showFiltersPopup, setShowFiltersPopup] = useState(false) // Popup с фильтрами
  const [selectedProductIds, setSelectedProductIds] = useState(new Set())
  const [sendingToChannel, setSendingToChannel] = useState(false)
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 })
  const [toast, setToast] = useState(null)
  
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
    publishedStatus: 'scheduled' // all, published, scheduled - default to scheduled (unpublished)
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

  // Закрытие popup при нажатии Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showFiltersPopup) {
        setShowFiltersPopup(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showFiltersPopup])

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
    
    if (filters.publishedStatus !== 'all') {
      filtered = filtered.filter(p => {
        if (filters.publishedStatus === 'published') {
          // Published: has PublishedAt and it's in the past (or null means published in old logic)
          const published = isPublished(p)
          return published
        } else if (filters.publishedStatus === 'scheduled') {
          // Scheduled: not published yet (null PublishedAt means scheduled/new product, or future date)
          if (!p.publishedAt) {
            // No PublishedAt means it's a new/scheduled product
            return true
          }
          // Has PublishedAt but it's in the future
          const published = isPublished(p)
          return !published
        }
        return true
      })
    }
    
    setFilteredProducts(filtered)
  }
  
  // Функция для проверки, опубликован ли товар
  const isPublished = (product) => {
    // If PublishedAt is null, product is not published (newly created)
    if (!product.publishedAt) return false
    try {
      const publishedAt = new Date(product.publishedAt)
      if (isNaN(publishedAt.getTime())) return false
      // Use UTC for comparison to avoid timezone issues
      // publishedAt is stored in UTC in the database
      const now = new Date()
      // Compare UTC timestamps - only return true if publishedAt is in the past
      return publishedAt.getTime() <= now.getTime()
    } catch (error) {
      console.error('Ошибка при проверке даты публикации:', error)
      return false
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
      setToast({ message: 'Товар успешно удален', type: 'success' })
    } catch (err) {
      setToast({ message: 'Ошибка при удалении товара', type: 'error' })
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
      publishedStatus: 'scheduled' // Default to scheduled (unpublished)
    })
  }

  const clearFilter = (field) => {
    setFilters(prev => ({
      ...prev,
      [field]: field === 'publishedStatus' ? 'all' : ''
    }))
  }

  const getFilterLabel = (field, value) => {
    const labels = {
      name: 'Название',
      brand: 'Бренд',
      size: 'Размер',
      color: 'Цвет',
      gender: 'Пол',
      condition: 'Состояние',
      priceMin: 'Цена от',
      priceMax: 'Цена до',
      publishedStatus: value === 'published' ? 'Опубликованные' : value === 'scheduled' ? 'Запланированные' : ''
    }
    return labels[field] || field
  }

  const getFilterDisplayValue = (field, value) => {
    if (field === 'publishedStatus') {
      return value === 'published' ? 'Опубликованные' : value === 'scheduled' ? 'Запланированные' : ''
    }
    if (field.includes('price')) {
      return value ? `${value} ₽` : ''
    }
    return value
  }
  
  const activeFiltersCount = Object.values(filters).filter(v => v !== '' && v !== 'all').length

  const toggleProductSelection = (productId, event) => {
    event.stopPropagation()
    setSelectedProductIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const toggleAllProducts = (event) => {
    event.stopPropagation()
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set())
    } else {
      setSelectedProductIds(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const handleSendToChannel = async () => {
    if (selectedProductIds.size === 0) {
      setToast({ message: 'Выберите хотя бы один товар для отправки в канал', type: 'warning' })
      return
    }

    const selectedProducts = filteredProducts.filter(p => selectedProductIds.has(p.id))
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://89.104.67.36:55501'
    
    // Форматируем сообщения и собираем изображения как в боте
    const productData = []
    selectedProducts.forEach((p) => {
      let caption = `🛍️ ${p.name}\n`
      if (p.brand) caption += `🏷️ Бренд: ${p.brand}\n`
      if (p.size) caption += `📏 Размер: ${p.size}\n`
      if (p.color) caption += `🎨 Цвет: ${p.color}\n`
      if (p.gender) caption += `👤 Пол: ${p.gender}\n`
      if (p.condition) caption += `✨ Состояние: ${p.condition}\n`
      if (p.description) caption += `\n📝 ${p.description}\n`
      caption += `\n💰 Цена: ${(p.price ?? 0).toLocaleString('ru-RU')} ₽\n`
      
      // Собираем URL изображений
      const imageUrls = []
      if (p.images && p.images.length > 0) {
        p.images.forEach(imagePath => {
          let fullUrl = null
          if (imagePath.startsWith('http')) {
            fullUrl = imagePath
          } else if (imagePath.startsWith('/')) {
            fullUrl = `${apiBaseUrl}${imagePath}`
          } else {
            fullUrl = `${apiBaseUrl}/${imagePath.trimStart('/')}`
          }
          if (fullUrl) {
            imageUrls.push(fullUrl)
          }
        })
      }
      
      productData.push({ caption, imageUrls })
    })

    // Send messages sequentially to show progress
    try {
      setSendingToChannel(true)
      setSendProgress({ current: 0, total: productData.length })
      
      let successCount = 0
      let failCount = 0
      
      // Send messages one by one to track progress
      const publishedProductIds = []
      for (let i = 0; i < productData.length; i++) {
        const { caption, imageUrls } = productData[i]
        const product = selectedProducts[i]
        setSendProgress({ current: i + 1, total: productData.length })
        
        try {
          const result = await api.sendMessageToChannel(caption, imageUrls.length > 0 ? imageUrls : null)
          if (result?.success) {
            successCount++
            // Mark product as published
            publishedProductIds.push(product.id)
          } else {
            failCount++
          }
        } catch (err) {
          console.error('Error sending message to channel:', err)
          failCount++
        }
      }

      // Update PublishedAt for successfully sent products
      if (publishedProductIds.length > 0) {
        try {
          await Promise.allSettled(
            publishedProductIds.map(productId => api.publishProduct(productId))
          )
          // Reload products to update status
          await loadProducts()
        } catch (err) {
          console.error('Error updating product publication status:', err)
          // Don't fail the whole operation if status update fails
        }
      }

      if (successCount > 0 && failCount === 0) {
        setToast({ 
          message: `Сообщения успешно отправлены в канал! (${successCount} товар(ов))`, 
          type: 'success' 
        })
        setSelectedProductIds(new Set())
      } else if (successCount > 0 && failCount > 0) {
        setToast({ 
          message: `Отправлено: ${successCount}, Ошибок: ${failCount}`, 
          type: 'warning' 
        })
      } else {
        setToast({ 
          message: 'Не удалось отправить сообщения в канал', 
          type: 'error' 
        })
      }
    } catch (err) {
      console.error('Error sending to channel:', err)
      setToast({ 
        message: 'Ошибка при отправке в канал: ' + (err.message || 'Неизвестная ошибка'), 
        type: 'error' 
      })
    } finally {
      setSendingToChannel(false)
      setSendProgress({ current: 0, total: 0 })
    }
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
        <div className="header-actions">
          <button 
            className={`btn btn-secondary ${showFiltersPopup ? 'active' : ''}`}
            onClick={() => setShowFiltersPopup(!showFiltersPopup)}
            title="Настроить фильтры"
          >
            🔍 Фильтры {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
          {selectedProductIds.size > 0 && (
            <>
              <button 
                className="btn btn-secondary btn-send-channel" 
                onClick={handleSendToChannel}
                disabled={sendingToChannel}
                title={`Отправить ${selectedProductIds.size} товар(ов) в канал`}
              >
                {sendingToChannel 
                  ? `📢 Отправка... (${sendProgress.current}/${sendProgress.total})` 
                  : `📢 Отправить в канал (${selectedProductIds.size})`}
              </button>
              {sendingToChannel && sendProgress.total > 0 && (
                <div className="send-progress-bar">
                  <div 
                    className="send-progress-fill" 
                    style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </>
          )}
          <button className="btn btn-primary" onClick={handleCreate}>
            ➕ Добавить
          </button>
        </div>
      </div>

      {/* Active filters chips - показываем только если есть активные фильтры */}
      {activeFiltersCount > 0 && (
        <div className="active-filters-bar">
          <div className="active-filters">
            {filters.name && (
              <span className="filter-chip">
                {getFilterLabel('name')}: {filters.name}
                <button onClick={() => clearFilter('name')} title="Удалить фильтр">×</button>
              </span>
            )}
            {filters.brand && (
              <span className="filter-chip">
                {getFilterLabel('brand')}: {filters.brand}
                <button onClick={() => clearFilter('brand')} title="Удалить фильтр">×</button>
              </span>
            )}
            {filters.size && (
              <span className="filter-chip">
                {getFilterLabel('size')}: {filters.size}
                <button onClick={() => clearFilter('size')} title="Удалить фильтр">×</button>
              </span>
            )}
            {filters.color && (
              <span className="filter-chip">
                {getFilterLabel('color')}: {filters.color}
                <button onClick={() => clearFilter('color')} title="Удалить фильтр">×</button>
              </span>
            )}
            {filters.gender && (
              <span className="filter-chip">
                {getFilterLabel('gender')}: {filters.gender}
                <button onClick={() => clearFilter('gender')} title="Удалить фильтр">×</button>
              </span>
            )}
            {filters.condition && (
              <span className="filter-chip">
                {getFilterLabel('condition')}: {filters.condition}
                <button onClick={() => clearFilter('condition')} title="Удалить фильтр">×</button>
              </span>
            )}
            {filters.priceMin && (
              <span className="filter-chip">
                {getFilterLabel('priceMin')}: {getFilterDisplayValue('priceMin', filters.priceMin)}
                <button onClick={() => clearFilter('priceMin')} title="Удалить фильтр">×</button>
              </span>
            )}
            {filters.priceMax && (
              <span className="filter-chip">
                {getFilterLabel('priceMax')}: {getFilterDisplayValue('priceMax', filters.priceMax)}
                <button onClick={() => clearFilter('priceMax')} title="Удалить фильтр">×</button>
              </span>
            )}
            {filters.publishedStatus !== 'all' && (
              <span className="filter-chip">
                {getFilterLabel('publishedStatus', filters.publishedStatus)}
                <button onClick={() => clearFilter('publishedStatus')} title="Удалить фильтр">×</button>
              </span>
            )}
            {activeFiltersCount > 0 && (
              <button className="btn-clear-all" onClick={clearFilters} title="Очистить все фильтры">
                Очистить все
              </button>
            )}
          </div>
        </div>
      )}

      {/* Popup с фильтрами */}
      {showFiltersPopup && (
        <div className="filters-popup-overlay" onClick={() => setShowFiltersPopup(false)}>
          <div className="filters-popup" onClick={(e) => e.stopPropagation()}>
            <div className="filters-popup-header">
              <h3>Фильтры</h3>
              <button className="filters-popup-close" onClick={() => setShowFiltersPopup(false)}>×</button>
            </div>
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
          
            <div className="filters-popup-actions">
              <button className="btn btn-clear" onClick={clearFilters}>
                Очистить все
              </button>
              <button className="btn btn-primary" onClick={() => setShowFiltersPopup(false)}>
                Применить
              </button>
            </div>
          </div>
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
          formatMoscowTime={formatMoscowTime}
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
            <span>Показано: {filteredProducts.length} из {products.length} товаров</span>
            {filteredProducts.length > 0 && (
              <button 
                className="btn btn-secondary btn-select-all" 
                onClick={(e) => {
                  e.stopPropagation()
                  toggleAllProducts(e)
                }}
              title={selectedProductIds.size === filteredProducts.length ? 'Снять выделение со всех' : `Выбрать все ${filteredProducts.length} товар(ов)`}
            >
              {selectedProductIds.size === filteredProducts.length ? '☑️ Снять выделение' : `☐ Все (${filteredProducts.length})`}
              </button>
            )}
          </div>
          <table className="products-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedProductIds.size === filteredProducts.length}
                    onChange={toggleAllProducts}
                    onClick={(e) => e.stopPropagation()}
                    title={selectedProductIds.size === filteredProducts.length ? 'Снять выделение' : 'Все'}
                  />
                </th>
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
                  className={`product-row ${published ? '' : 'product-unpublished'} ${selectedProductIds.has(product.id) ? 'row-selected' : ''}`}
                  style={published ? {} : { backgroundColor: '#fff8e1' }}
                  onClick={(e) => handleRowClick(product, e)}
                >
                  <td className="checkbox-column" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedProductIds.has(product.id)}
                      onChange={(e) => toggleProductSelection(product.id, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td data-label="Фото" className="product-image-td" data-product-name={product.name}>
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
                  <td data-label="Информация" className="product-info-wrapper">
                    <div className="product-info-mobile">
                      <div className="product-name-mobile" data-brand={product.brand ? ` • ${product.brand}` : ''}>
                        {product.name}
                      </div>
                      <div className="product-details-mobile">
                        <span className="size-cell">{product.size || '-'}</span>
                        <span className="color-cell">{product.color || '-'}</span>
                        <span className="gender-cell" title={product.gender || '-'}>
                          {getGenderIcon(product.gender)}
                        </span>
                        <span className="condition-cell">{product.condition ? capitalize(product.condition) : '-'}</span>
                      </div>
                      <div className="price-cell">{(product.price ?? 0).toLocaleString('ru-RU')} ₽</div>
                    </div>
                  </td>
                  <td data-label="Бренд" className="brand-cell desktop-only">{product.brand || '-'}</td>
                  <td data-label="Размер" className="size-cell desktop-only">{product.size || '-'}</td>
                  <td data-label="Цвет" className="color-cell desktop-only">{product.color || '-'}</td>
                  <td data-label="Пол" className="gender-cell desktop-only" title={product.gender || '-'}>
                    {getGenderIcon(product.gender)}
                  </td>
                  <td data-label="Состояние" className="condition-cell desktop-only">{product.condition ? capitalize(product.condition) : '-'}</td>
                  <td data-label="В наличии" className="quantity-cell">
                    <span style={{ 
                      color: (product.quantityInStock || 0) > 0 ? '#48bb78' : '#e53e3e',
                      fontWeight: 'bold'
                    }}>
                      {product.quantityInStock || 0} шт.
                    </span>
                  </td>
                  <td data-label="Цена" className="price-cell desktop-only">{(product.price ?? 0).toLocaleString('ru-RU')} ₽</td>
                  <td data-label="Статус" className="publication-cell">
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
                  <td data-label="Действия" className="actions-cell">
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

// Компонент модального окна деталей товара
function ProductDetailsModal({ product, onClose, onEdit, isPublished, getGenderIcon, capitalize, formatMoscowTime }) {
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
                  <span style={{ color: '#e53e3e', fontWeight: 'bold' }}>Не опубликован</span>
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
