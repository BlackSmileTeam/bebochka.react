import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import Toast from './Toast'
import './ProductForm.css'

// Фолбэк-список для автозаполнения названия товара
const DEFAULT_PRODUCT_NAME_SUGGESTIONS = [
  'Футболка', 'Куртка', 'Платье', 'Брюки', 'Шорты', 'Юбка', 'Свитер', 'Кардиган',
  'Жилет', 'Комбинезон', 'Сарафан', 'Боди', 'Пижама', 'Халат', 'Пальто', 'Пуховик',
  'Джинсы', 'Леггинсы', 'Лосины', 'Костюм', 'Водолазка', 'Блузка', 'Рубашка',
  'Майка', 'Толстовка', 'Худи', 'Шапка', 'Шарф', 'Варежки', 'Носки', 'Колготки',
  'Плащ', 'Жакет', 'Парка', 'Анорак', 'Спортивный костюм', 'Кроп-топ', 'Топ'
]

function ProductForm({ product, colors = [], onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    size: '',
    color: '',
    quantityInStock: 1,
    gender: 'мальчик',
    condition: '',
    publishedAt: '',
    cartAvailableAt: '',
    boxNumber: '',
    incomingShipmentId: ''
  })
  const [scheduleSend, setScheduleSend] = useState(false)
  const [scheduleCartUnlock, setScheduleCartUnlock] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [brands, setBrands] = useState([])
  const [incomingShipments, setIncomingShipments] = useState([])
  const [brandSearch, setBrandSearch] = useState('')
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const brandDropdownRef = useRef(null)
  const [nameSuggestions, setNameSuggestions] = useState([])
  const [showNameDropdown, setShowNameDropdown] = useState(false)
  const [allNameSuggestions, setAllNameSuggestions] = useState(DEFAULT_PRODUCT_NAME_SUGGESTIONS)
  const nameDropdownRef = useRef(null)
  const fileInputRef = useRef(null)
  const [draggingImage, setDraggingImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [toast, setToast] = useState(null)

  const moveImage = (kind, fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex == null || toIndex == null) return
    if (kind === 'new') {
      setImages((prev) => {
        const next = [...prev]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return next
      })
      return
    }
    setExistingImages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const handleDragStart = (kind, index) => setDraggingImage({ kind, index })
  const handleDragEnd = () => setDraggingImage(null)
  const handleDrop = (kind, index) => {
    if (!draggingImage || draggingImage.kind !== kind) return
    moveImage(kind, draggingImage.index, index)
    setDraggingImage(null)
  }

  // Log colors when component mounts or colors change
  useEffect(() => {
    console.log('[ProductForm] Colors prop received:', colors, 'Type:', typeof colors, 'IsArray:', Array.isArray(colors), 'Length:', colors?.length)
  }, [colors])

  // Load brands when brand search changes
  useEffect(() => {
    if (brandSearch) {
      // Update formData.brand with what user types
      setFormData(prev => ({ ...prev, brand: brandSearch }))
      
      // Load brands from API
      api.getBrands(brandSearch).then(data => {
        setBrands(data)
        setShowBrandDropdown(data.length > 0)
      }).catch(err => {
        console.error('Error loading brands:', err)
        setBrands([])
        setShowBrandDropdown(false)
      })
    } else {
      setBrands([])
      setShowBrandDropdown(false)
      setFormData(prev => ({ ...prev, brand: '' }))
    }
  }, [brandSearch])

  useEffect(() => {
    let mounted = true
    api.getProductNameSuggestions()
      .then((rows) => {
        if (!mounted) return
        const names = rows
          .map((r) => (typeof r === 'string' ? r : (r.name || r.Name || '')).trim())
          .filter(Boolean)
        if (names.length > 0) {
          setAllNameSuggestions(names)
        }
      })
      .catch(() => {
        // keep fallback list
      })

    return () => { mounted = false }
  }, [])

  // Name autocomplete: filter suggestions when user types
  useEffect(() => {
    const query = (formData.name || '').trim().toLowerCase()
    if (query.length >= 2) {
      const filtered = allNameSuggestions.filter(s =>
        s.toLowerCase().includes(query)
      )
      setNameSuggestions(filtered)
      setShowNameDropdown(filtered.length > 0)
    } else {
      setNameSuggestions([])
      setShowNameDropdown(false)
    }
  }, [formData.name, allNameSuggestions])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
        setShowBrandDropdown(false)
      }
      if (nameDropdownRef.current && !nameDropdownRef.current.contains(event.target)) {
        setShowNameDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    api.getIncomingShipments().then(setIncomingShipments).catch(() => setIncomingShipments([]))
  }, [])

  useEffect(() => {
    if (product) {
      // Format PublishedAt if it exists (it's stored as Moscow time in database)
      let publishedAtValue = ''
      if (product.publishedAt || product.PublishedAt) {
        const publishedAt = product.publishedAt || product.PublishedAt
        // PublishedAt is stored as Moscow time in the database
        // Parse it and format for datetime-local input (YYYY-MM-DDTHH:mm)
        const date = new Date(publishedAt)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        publishedAtValue = `${year}-${month}-${day}T${hours}:${minutes}`
      }
      let cartAtValue = ''
      if (product.cartAvailableAt || product.CartAvailableAt) {
        const ca = product.cartAvailableAt || product.CartAvailableAt
        const date = new Date(ca)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        cartAtValue = `${year}-${month}-${day}T${hours}:${minutes}`
      }
      
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        size: product.size || '',
        color: product.color || '',
        quantityInStock: product.quantityInStock || 1,
        gender: product.gender || 'мальчик',
        condition: product.condition || '',
        publishedAt: publishedAtValue,
        cartAvailableAt: cartAtValue,
        boxNumber: product.boxNumber || '',
        incomingShipmentId: product.incomingShipmentId ?? ''
      })
      setScheduleSend(!!(product.publishedAt || product.PublishedAt))
      setScheduleCartUnlock(!!(product.cartAvailableAt || product.CartAvailableAt))
      setBrandSearch(product.brand || '')
      setExistingImages(product.images || [])
    } else {
      setScheduleSend(false)
      setScheduleCartUnlock(false)
      setFormData({
        name: '',
        brand: '',
        description: '',
        price: '',
        size: '',
        color: '',
        quantityInStock: 1,
        gender: 'мальчик',
        condition: '',
        publishedAt: '',
        cartAvailableAt: '',
        boxNumber: '',
        incomingShipmentId: ''
      })
      setBrandSearch('')
      setExistingImages([])
    }
  }, [product])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setImages(prev => [...prev, ...Array.from(files)])
    }
    e.target.value = ''
  }

  const handleRemoveNewImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!product && images.length === 0) {
      setError('Добавьте хотя бы одно фото')
      return
    }
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('brand', formData.brand || '')
      formDataToSend.append('description', formData.description || '')
      formDataToSend.append('price', formData.price)
      formDataToSend.append('size', formData.size || '')
      formDataToSend.append('color', formData.color || '')
      formDataToSend.append('quantityInStock', formData.quantityInStock || 1)
      formDataToSend.append('gender', formData.gender || '')
      formDataToSend.append('condition', formData.condition || '')
      formDataToSend.append('boxNumber', formData.boxNumber || '')
      formDataToSend.append('incomingShipmentId', formData.incomingShipmentId === '' ? '' : formData.incomingShipmentId)
      
      // Add PublishedAt if "отправить ко времени" is checked
      // datetime-local gives "YYYY-MM-DDTHH:mm" (interpreted as Moscow time)
      if (scheduleSend && formData.publishedAt) {
        const [datePart, timePart] = formData.publishedAt.split('T')
        const [year, month, day] = datePart.split('-').map(Number)
        const [hours, minutes] = timePart.split(':').map(Number)
        
        // Create Date object as UTC with the components (representing Moscow time)
        const publishedAtDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))
        formDataToSend.append('publishedAt', publishedAtDate.toISOString())
      }

      if (scheduleCartUnlock && formData.cartAvailableAt) {
        const [datePart, timePart] = formData.cartAvailableAt.split('T')
        const [year, month, day] = datePart.split('-').map(Number)
        const [hours, minutes] = timePart.split(':').map(Number)
        const cartAtDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))
        formDataToSend.append('cartAvailableAt', cartAtDate.toISOString())
      }

      if (product) {
        // For update: send existing images that should be preserved
        existingImages.forEach((imgPath) => {
          formDataToSend.append('existingImages', imgPath)
        })
      }

      // Add new images
      images.forEach((image) => {
        formDataToSend.append('images', image)
      })

      let result
      if (product) {
        // Update existing product
        result = await api.updateProduct(product.id, formDataToSend)
      } else {
        // Create new product
        result = await api.createProduct(formDataToSend)
      }

      // Check if result is valid
      if (result && (result.id || result.Id)) {
        onSuccess()
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      const errorMessage = err.message || 'Ошибка при сохранении товара. Проверьте все поля.'
      setError(errorMessage)
      console.error('Error saving product:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={loading ? undefined : onClose}>
      <div className="modal-content product-form-modal" onClick={(e) => e.stopPropagation()}>
        {loading && (
          <div className="product-form-loading-overlay" aria-hidden="true">
            <div className="product-form-spinner" />
            <p className="product-form-loading-text">Сохранение карточки…</p>
          </div>
        )}
        <div className="modal-header">
          <h2>{product ? 'Редактировать товар' : 'Добавить товар'}</h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={loading} aria-label="Закрыть">×</button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group form-group-photos-first">
            <label htmlFor="images">
              {product ? 'Добавить новые фотографии' : 'Фотографии *'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              id="images"
              name="images"
              onChange={handleImageChange}
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              disabled={loading}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                {images.length === 0 ? 'Выбрать файлы' : 'Добавить ещё фото'}
              </button>
              {images.length > 0 && (
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  Выбрано: {images.length}
                </span>
              )}
            </div>
            {images.length > 0 && (
              <div className="image-preview">
                {Array.from(images).map((file, index) => (
                  <div
                    key={index}
                    className={`preview-item preview-item--draggable ${draggingImage?.kind === 'new' && draggingImage?.index === index ? 'is-dragging' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart('new', index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop('new', index)}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      className="preview-image"
                      onClick={() => setPreviewImage({ src: URL.createObjectURL(file), label: `Фото #${index + 1}` })}
                    />
                    <span className="preview-order-badge">{index + 1}</span>
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => handleRemoveNewImage(index)}
                      title="Удалить фото"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {product && existingImages.length > 0 && (
              <div className="existing-images">
                <p>Текущие фотографии:</p>
                <div className="image-preview">
                  {existingImages.map((img, index) => (
                    <div
                      key={index}
                      className={`preview-item preview-item--draggable ${draggingImage?.kind === 'existing' && draggingImage?.index === index ? 'is-dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart('existing', index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop('existing', index)}
                    >
                      <img
                        src={img.startsWith('http') 
                          ? img 
                          : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${img}`}
                        alt={`Existing ${index}`}
                        className="preview-image"
                        onClick={() =>
                          setPreviewImage({
                            src: img.startsWith('http')
                              ? img
                              : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${img}`,
                            label: `Фото #${index + 1}`
                          })
                        }
                      />
                      <span className="preview-order-badge">{index + 1}</span>
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => handleRemoveExistingImage(index)}
                        disabled={loading}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(images.length > 1 || existingImages.length > 1) && (
              <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
                Перетаскивайте фото, чтобы изменить порядок. Первое фото будет главным в карточке.
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="name">Название товара *</label>
            <div ref={nameDropdownRef} style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => {
                  if (formData.name.trim().length >= 2 && nameSuggestions.length > 0) {
                    setShowNameDropdown(true)
                  }
                }}
                required
                placeholder="Например: Футболка, Платье..."
              />
              {showNameDropdown && nameSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  width: '100%',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  marginTop: '4px'
                }}>
                  {nameSuggestions.map((suggestion) => (
                    <div
                      key={suggestion}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setFormData(prev => ({ ...prev, name: suggestion }))
                        setShowNameDropdown(false)
                      }}
                      style={{
                        padding: '0.75rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid #e2e8f0',
                        color: '#2d3748',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: '100%'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="brand">Бренд</label>
            <div ref={brandDropdownRef} style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                id="brand"
                name="brand"
                value={brandSearch}
                onChange={(e) => {
                  setBrandSearch(e.target.value)
                }}
                onFocus={() => {
                  if (brandSearch && brands.length > 0) {
                    setShowBrandDropdown(true)
                  }
                }}
                onBlur={() => {
                  // При потере фокуса сохраняем введенное значение, если оно не было выбрано из списка
                  setTimeout(() => {
                    setShowBrandDropdown(false)
                    if (brandSearch && !brands.some(b => {
                      const brandName = typeof b === 'string' ? b : (b.name || b.Name || '');
                      return brandName.toLowerCase() === brandSearch.toLowerCase();
                    })) {
                      // Если бренда нет в списке, используем то что ввел пользователь
                      setFormData(prev => ({ ...prev, brand: brandSearch }))
                    }
                  }, 200)
                }}
                placeholder="Начните вводить название бренда..."
                style={{ width: '100%' }}
              />
              {showBrandDropdown && brands.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  width: '100%',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  marginTop: '4px'
                }}>
                  {brands.map((brand, index) => {
                    const brandName = typeof brand === 'string' ? brand : (brand.name || brand.Name || '');
                    const brandId = typeof brand === 'string' ? brand : (brand.id || brand.Id || index);
                    return (
                      <div
                        key={brandId}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setFormData(prev => ({ ...prev, brand: brandName }))
                          setBrandSearch(brandName)
                          setShowBrandDropdown(false)
                        }}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #e2e8f0',
                          color: '#2d3748',
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: '100%'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        {brandName}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Цена (₽) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="1000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="size">Размер</label>
              <input
                type="text"
                id="size"
                name="size"
                value={formData.size}
                onChange={handleChange}
                placeholder="Например: 104, 110-116"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="boxNumber">Номер коробки</label>
              <input
                type="text"
                id="boxNumber"
                name="boxNumber"
                value={formData.boxNumber}
                onChange={handleChange}
                placeholder="Отсутствует (оставьте пустым) или, например: A-12"
              />
            </div>
            <div className="form-group">
              <label htmlFor="incomingShipmentId">Поставка</label>
              <select
                className="form-native-select"
                id="incomingShipmentId"
                name="incomingShipmentId"
                value={formData.incomingShipmentId}
                onChange={handleChange}
              >
                <option value="">Отсутствует</option>
                {incomingShipments.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>


          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color">Цвет</label>
              <select
                className="form-native-select"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
              >
                <option value="">Выберите цвет</option>
                {Array.isArray(colors) && colors.length > 0 ? (
                  colors.map((color, index) => (
                    <option key={color || index} value={color}>
                      {color}
                    </option>
                  ))
                ) : (
                  <option disabled>Загрузка цветов...</option>
                )}
              </select>
              {(!Array.isArray(colors) || colors.length === 0) && (
                <small style={{ color: '#999', display: 'block', marginTop: '4px' }}>
                  Цвета не загружены. Проверьте подключение к API. (Получено: {typeof colors}, Длина: {colors?.length || 0})
                </small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="gender">Пол</label>
              <select
                className="form-native-select"
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Выберите пол</option>
                <option value="мальчик">Мальчик</option>
                <option value="девочка">Девочка</option>
                <option value="унисекс">Унисекс</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="condition">Состояние</label>
            <select
              className="form-native-select"
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
            >
              <option value="">Выберите состояние</option>
              <option value="состояние новой вещи">Состояние новой вещи</option>
              <option value="очень хорошее">Очень хорошее</option>
              <option value="хорошее">Хорошее</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Краткое описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Краткое описание товара"
            />
          </div>

          <div className="form-group">
            <label className="form-checkbox-inline">
              <input
                type="checkbox"
                checked={scheduleSend}
                onChange={(e) => setScheduleSend(e.target.checked)}
              />
              Отправить ко времени
            </label>
            {scheduleSend && (
              <>
                <input
                  type="datetime-local"
                  id="publishedAt"
                  name="publishedAt"
                  value={formData.publishedAt}
                  onChange={handleChange}
                  style={{ marginTop: '8px' }}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                  Укажите дату и время публикации (МСК).
                </small>
              </>
            )}
          </div>

          <div className="form-group">
            <label className="form-checkbox-inline">
              <input
                type="checkbox"
                checked={scheduleCartUnlock}
                onChange={(e) => setScheduleCartUnlock(e.target.checked)}
              />
              Открыть «В корзину» позже (МСК)
            </label>
            {scheduleCartUnlock && (
              <>
                <input
                  type="datetime-local"
                  id="cartAvailableAt"
                  name="cartAvailableAt"
                  value={formData.cartAvailableAt}
                  onChange={handleChange}
                  style={{ marginTop: '8px' }}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                  Карточка может быть уже на сайте (после превью), а кнопка корзины активируется в это время.
                </small>
              </>
            )}
          </div>

          {product && (
            <div className="form-group">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={previewLoading || loading}
                onClick={async () => {
                  setPreviewLoading(true)
                  try {
                    await api.publishProduct(product.id)
                    setToast({
                      type: 'success',
                      message: 'Товар опубликован в каталоге (МСК). В Telegram пост не отправляется, пока отключен флаг PostNewProductsToChannel.'
                    })
                  } catch (e) {
                    setToast({ type: 'error', message: e.message || 'Не удалось обновить публикацию' })
                  } finally {
                    setPreviewLoading(false)
                  }
                }}
              >
                {previewLoading ? '…' : 'Превью: показать в каталоге сейчас'}
              </button>
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                Ставит время появления карточки на текущий момент (МСК). Рассылка в Telegram отключена флагом PostNewProductsToChannel.
              </small>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary btn-with-spinner" disabled={loading}>
              {loading && <span className="btn-spinner" aria-hidden="true" />}
              {loading ? 'Сохранение…' : (product ? 'Сохранить' : 'Добавить')}
            </button>
          </div>
        </form>
        {previewImage && (
          <div className="image-lightbox-overlay" onClick={() => setPreviewImage(null)}>
            <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="image-lightbox-close" onClick={() => setPreviewImage(null)}>×</button>
              <img src={previewImage.src} alt={previewImage.label || 'Фото'} className="image-lightbox-image" />
            </div>
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
    </div>
  )
}

export default ProductForm

