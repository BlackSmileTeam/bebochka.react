import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './ProductForm.css'

function ProductForm({ product, colors = [], onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    size: '',
    color: '',
    quantityInStock: 1,
    gender: '',
    condition: '',
    publishedAt: ''
  })
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Log colors when component mounts or colors change
  useEffect(() => {
    console.log('[ProductForm] Colors prop received:', colors, 'Type:', typeof colors, 'IsArray:', Array.isArray(colors), 'Length:', colors?.length)
  }, [colors])

  useEffect(() => {
    if (product) {
      // Format PublishedAt if it exists (convert to local datetime-local format)
      let publishedAtValue = ''
      if (product.publishedAt || product.PublishedAt) {
        const publishedAt = product.publishedAt || product.PublishedAt
        // Convert UTC date to local datetime-local format
        const date = new Date(publishedAt)
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        publishedAtValue = localDate.toISOString().slice(0, 16)
      }
      
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        size: product.size || '',
        color: product.color || '',
        quantityInStock: product.quantityInStock || 1,
        gender: product.gender || '',
        condition: product.condition || '',
        publishedAt: publishedAtValue
      })
      setExistingImages(product.images || [])
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
    const files = Array.from(e.target.files)
    setImages(files)
  }

  const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
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
      
      // Add PublishedAt if provided
      if (formData.publishedAt) {
        // Convert local datetime to ISO string for backend
        const publishedAtDate = new Date(formData.publishedAt)
        formDataToSend.append('publishedAt', publishedAtDate.toISOString())
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Редактировать товар' : 'Добавить товар'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Название товара *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Например: Платье розовое"
            />
          </div>

          <div className="form-group">
            <label htmlFor="brand">Бренд</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Например: Zara, H&M"
            />
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
              <label htmlFor="color">Цвет</label>
              <select
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
              <label htmlFor="quantityInStock">Количество в наличии *</label>
              <input
                type="number"
                id="quantityInStock"
                name="quantityInStock"
                value={formData.quantityInStock}
                onChange={handleChange}
                required
                min="1"
                placeholder="1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Пол</label>
              <select
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

            <div className="form-group">
              <label htmlFor="condition">Состояние</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
              >
                <option value="">Выберите состояние</option>
                <option value="новая">Новая</option>
                <option value="отличное">Отличное</option>
                <option value="недостаток">Недостаток</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="publishedAt">Дата и время публикации</label>
            <input
              type="datetime-local"
              id="publishedAt"
              name="publishedAt"
              value={formData.publishedAt}
              onChange={handleChange}
              placeholder="Оставьте пустым для немедленной публикации"
            />
            <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
              Оставьте пустым, чтобы товар был опубликован сразу. Укажите дату и время для отложенной публикации.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="images">
              {product ? 'Добавить новые фотографии' : 'Фотографии *'}
            </label>
            <input
              type="file"
              id="images"
              name="images"
              onChange={handleImageChange}
              multiple
              accept="image/*"
              required={!product && images.length === 0}
            />
            {images.length > 0 && (
              <div className="image-preview">
                {Array.from(images).map((file, index) => (
                  <div key={index} className="preview-item">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      className="preview-image"
                    />
                  </div>
                ))}
              </div>
            )}
            {product && existingImages.length > 0 && (
              <div className="existing-images">
                <p>Текущие фотографии:</p>
                <div className="image-preview">
                  {existingImages.map((img, index) => (
                    <div key={index} className="preview-item">
                      <img
                        src={img.startsWith('http') 
                          ? img 
                          : `${import.meta.env.VITE_API_URL || 'http://89.104.67.36:55501'}${img}`}
                        alt={`Existing ${index}`}
                        className="preview-image"
                      />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => handleRemoveExistingImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохранение...' : (product ? 'Сохранить' : 'Добавить')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm

