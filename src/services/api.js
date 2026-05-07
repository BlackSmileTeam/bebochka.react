import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api'

console.log('API Base URL:', API_BASE_URL)

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000, // 60 seconds timeout для больших ответов с изображениями
  validateStatus: function (status) {
    // Accept status codes from 200 to 299 as success
    return status >= 200 && status < 300
  }
})

// Request interceptor for logging and adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token to requests if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data
    })
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    })
    return response
  },
  (error) => {
    console.error('[API Response Error]', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      } : null,
      request: error.request ? {
        url: error.config?.url,
        method: error.config?.method
      } : null
    })
    
    // 401: единая страница входа /account с возвратом на текущий путь
    if (error.response?.status === 401) {
      const path = window.location.pathname || ''
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      if (!path.startsWith('/account')) {
        const ret = encodeURIComponent(path + (window.location.search || ''))
        window.location.href = `/account?returnUrl=${ret}`
      }
    }
    
    return Promise.reject(error)
  }
)

/**
 * Validates that data is an array
 * @param {any} data - Data to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {boolean} True if valid array
 */
function validateArray(data, fieldName = 'data') {
  if (!Array.isArray(data)) {
    console.warn(`[Validation] ${fieldName} is not an array:`, data, typeof data)
    return false
  }
  return true
}

/**
 * Validates product data structure
 * @param {any} product - Product data to validate
 * @returns {boolean} True if valid product
 */
function validateProduct(product) {
  if (!product) {
    console.warn('[Validation] Product is null or undefined')
    return false
  }
  if (!product.id && !product.Id) {
    console.warn('[Validation] Product missing id:', product)
    return false
  }
  if (!product.name && !product.Name) {
    console.warn('[Validation] Product missing name:', product)
    return false
  }
  return true
}

export const api = {
  /**
   * Gets all products for admin panel (including unpublished)
   * @returns {Promise<Array>} List of all products
   */
  async getAllProductsForAdmin() {
    try {
      console.log('[API] Fetching all products for admin...')
      const response = await apiClient.get('/products/admin/all')
      
      if (!validateArray(response.data, 'products')) {
        console.error('[API] Products response is not an array:', response.data)
        return []
      }
      
      // Нормализуем данные - конвертируем Id в id для совместимости
      const normalizedProducts = response.data.map(product => ({
        ...product,
        id: product.id || product.Id,
        name: product.name || product.Name,
        brand: product.brand || product.Brand,
        description: product.description || product.Description,
        price: product.price || product.Price,
        size: product.size || product.Size,
        color: product.color || product.Color,
        images: product.images || product.Images || [],
        quantityInStock: product.quantityInStock !== undefined ? product.quantityInStock : (product.QuantityInStock !== undefined ? product.QuantityInStock : 1),
        availableQuantity: product.availableQuantity !== undefined ? product.availableQuantity : (product.AvailableQuantity !== undefined ? product.AvailableQuantity : product.quantityInStock || product.QuantityInStock || 1),
        gender: product.gender || product.Gender || null,
        condition: product.condition || product.Condition || null,
        publishedAt: product.publishedAt || product.PublishedAt || null,
        cartAvailableAt: product.cartAvailableAt ?? product.CartAvailableAt ?? null,
        cartUnlocked: product.cartUnlocked !== undefined ? product.cartUnlocked : (product.CartUnlocked !== undefined ? product.CartUnlocked : true),
        boxNumber: product.boxNumber ?? product.BoxNumber ?? null,
        incomingShipmentId: product.incomingShipmentId ?? product.IncomingShipmentId ?? null,
        incomingShipmentName: product.incomingShipmentName ?? product.IncomingShipmentName ?? null,
        createdAt: product.createdAt || product.CreatedAt,
        updatedAt: product.updatedAt || product.UpdatedAt
      }))
      
      console.log(`[API] Successfully loaded ${normalizedProducts.length} products for admin`)
      return normalizedProducts
    } catch (error) {
      console.error('[API] Error fetching products for admin:', error)
      if (error.response) {
        console.error('[API] Server error:', error.response.status, error.response.data)
      } else if (error.request) {
        console.error('[API] No response received:', error.request)
      }
      throw error
    }
  },

  /**
   * Gets all products
   * @param {string} sessionId - Optional session ID for cart reservation calculation
   * @returns {Promise<Array>} List of products
   */
  async getProducts(sessionId = null) {
    try {
      console.log('[API] Fetching products...', sessionId ? `sessionId: ${sessionId}` : '')
      const params = sessionId ? { sessionId } : {}
      const response = await apiClient.get('/products', { params })
      
      if (!validateArray(response.data, 'products')) {
        console.error('[API] Products response is not an array:', response.data)
        return []
      }
      
      // Нормализуем данные - конвертируем Id в id для совместимости
      const normalizedProducts = response.data.map(product => ({
        ...product,
        id: product.id || product.Id,
        name: product.name || product.Name,
        brand: product.brand || product.Brand,
        description: product.description || product.Description,
        price: product.price || product.Price,
        size: product.size || product.Size,
        color: product.color || product.Color,
        images: product.images || product.Images || [],
        quantityInStock: product.quantityInStock !== undefined ? product.quantityInStock : (product.QuantityInStock !== undefined ? product.QuantityInStock : 1),
        availableQuantity: product.availableQuantity !== undefined ? product.availableQuantity : (product.AvailableQuantity !== undefined ? product.AvailableQuantity : product.quantityInStock || product.QuantityInStock || 1),
        gender: product.gender || product.Gender || null,
        condition: product.condition || product.Condition || null,
        boxNumber: product.boxNumber ?? product.BoxNumber ?? null,
        incomingShipmentId: product.incomingShipmentId ?? product.IncomingShipmentId ?? null,
        incomingShipmentName: product.incomingShipmentName ?? product.IncomingShipmentName ?? null,
        createdAt: product.createdAt || product.CreatedAt,
        updatedAt: product.updatedAt || product.UpdatedAt,
        publishedAt: product.publishedAt || product.PublishedAt || null,
        cartAvailableAt: product.cartAvailableAt ?? product.CartAvailableAt ?? null,
        cartUnlocked: product.cartUnlocked !== undefined ? product.cartUnlocked : (product.CartUnlocked !== undefined ? product.CartUnlocked : true)
      }))
      
      console.log(`[API] Successfully loaded ${normalizedProducts.length} products`)
      return normalizedProducts
    } catch (error) {
      console.error('[API] Error fetching products:', error)
      if (error.response) {
        console.error('[API] Server error:', error.response.status, error.response.data)
      } else if (error.request) {
        console.error('[API] No response received:', error.request)
      }
      throw error
    }
  },

  /**
   * Gets a product by ID
   * @param {number} id - Product ID
   * @param {string|null} sessionId - для корректного availableQuantity с учётом корзины
   * @returns {Promise<Object>} Product data
   */
  async getProduct(id, sessionId = null) {
    try {
      console.log(`[API] Fetching product ${id}...`, sessionId ? `sessionId: ${sessionId}` : '')
      const params = sessionId ? { sessionId } : {}
      const response = await apiClient.get(`/products/${id}`, { params })

      if (!validateProduct(response.data)) {
        console.error('[API] Invalid product data:', response.data)
        throw new Error('Invalid product data received')
      }

      const d = response.data
      const normalizedProduct = {
        ...d,
        id: d.id || d.Id,
        name: d.name || d.Name,
        brand: d.brand || d.Brand,
        description: d.description || d.Description,
        price: d.price ?? d.Price,
        size: d.size || d.Size,
        color: d.color || d.Color,
        images: d.images || d.Images || [],
        quantityInStock: d.quantityInStock !== undefined ? d.quantityInStock : (d.QuantityInStock !== undefined ? d.QuantityInStock : 1),
        availableQuantity: d.availableQuantity !== undefined ? d.availableQuantity : (d.AvailableQuantity !== undefined ? d.AvailableQuantity : d.quantityInStock ?? d.QuantityInStock ?? 1),
        gender: d.gender || d.Gender || null,
        condition: d.condition || d.Condition || null,
        createdAt: d.createdAt || d.CreatedAt,
        updatedAt: d.updatedAt || d.UpdatedAt,
        publishedAt: d.publishedAt || d.PublishedAt || null,
        cartAvailableAt: d.cartAvailableAt ?? d.CartAvailableAt ?? null,
        cartUnlocked: d.cartUnlocked !== undefined ? d.cartUnlocked : (d.CartUnlocked !== undefined ? d.CartUnlocked : true)
        ,boxNumber: d.boxNumber ?? d.BoxNumber ?? null
        ,incomingShipmentId: d.incomingShipmentId ?? d.IncomingShipmentId ?? null
        ,incomingShipmentName: d.incomingShipmentName ?? d.IncomingShipmentName ?? null
      }

      console.log('[API] Successfully loaded product:', normalizedProduct)
      return normalizedProduct
    } catch (error) {
      console.error(`[API] Error fetching product ${id}:`, error)
      throw error
    }
  },

  /**
   * Creates a new product
   * @param {FormData} formData - Product form data
   * @returns {Promise<Object>} Created product
   */
  /**
   * Converts File to base64 string
   * @param {File} file - File to convert
   * @returns {Promise<string>} Base64 string
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const result = reader.result
            if (!result) {
              reject(new Error('FileReader returned empty result'))
              return
            }
            // Убираем префикс data:image/...;base64,
            const base64 = result.includes(',') ? result.split(',')[1] : result
            resolve(base64)
          } catch (err) {
            console.error('[API] Error processing FileReader result:', err)
            reject(err)
          }
        }
        reader.onerror = (error) => {
          console.error('[API] FileReader error:', error)
          reject(new Error('Failed to read file: ' + (error.message || 'Unknown error')))
        }
        reader.readAsDataURL(file)
      } catch (err) {
        console.error('[API] Error setting up FileReader:', err)
        reject(err)
      }
    })
  },

  async createProduct(formData) {
    try {
      console.log('[API] Creating product...')
      console.log('[API] FormData entries:', Array.from(formData.entries()).map(([key, value]) => [key, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value]))
      
      // Конвертируем FormData в JSON с base64 изображениями
      const productData = {
        name: formData.get('name') || '',
        brand: formData.get('brand') || '',
        description: formData.get('description') || '',
        price: parseFloat(formData.get('price') || 0),
        size: formData.get('size') || '',
        color: formData.get('color') || '',
        quantityInStock: parseInt(formData.get('quantityInStock') || 1),
        gender: formData.get('gender') || null,
        condition: formData.get('condition') || null,
        publishedAt: formData.get('publishedAt') || null,
        cartAvailableAt: formData.get('cartAvailableAt') || null,
        boxNumber: formData.get('boxNumber') || null,
        incomingShipmentId: formData.get('incomingShipmentId') === '' ? null : parseInt(formData.get('incomingShipmentId') || 0),
        images: []
      }
      
      // Конвертируем файлы в base64
      const imageFiles = formData.getAll('images')
      console.log('[API] Converting', imageFiles.length, 'images to base64...')
      
      let totalSize = 0
      for (const file of imageFiles) {
        if (file instanceof File) {
          console.log('[API] Converting file:', file.name, 'Size:', file.size, 'bytes')
          const base64 = await this.fileToBase64(file)
          totalSize += base64.length
          productData.images.push(base64)
          console.log('[API] File converted, base64 size:', base64.length, 'bytes')
        }
      }
      
      const jsonSize = JSON.stringify(productData).length
      console.log('[API] Sending JSON request with', productData.images.length, 'images')
      console.log('[API] Total JSON size:', jsonSize, 'bytes (', (jsonSize / 1024).toFixed(2), 'KB)')
      console.log('[API] Request URL:', `${API_BASE_URL}/products`)
      console.log('[API] Auth token:', localStorage.getItem('authToken') ? 'Present' : 'Missing')
      
      const response = await apiClient.post('/products', productData, {
        timeout: 180000 // 3 minutes для больших JSON с base64
      })
      
      console.log('[API] Product created successfully:', response.status, response.data)
      
      if (!validateProduct(response.data)) {
        console.error('[API] Invalid product data in response:', response.data)
        throw new Error('Invalid product data received from server')
      }
      
      // Нормализуем данные - конвертируем Id в id для совместимости
      const normalizedProduct = {
        ...response.data,
        id: response.data.id || response.data.Id,
        name: response.data.name || response.data.Name,
        brand: response.data.brand || response.data.Brand,
        description: response.data.description || response.data.Description,
        price: response.data.price || response.data.Price,
        size: response.data.size || response.data.Size,
        color: response.data.color || response.data.Color,
        images: response.data.images || response.data.Images || [],
        quantityInStock: response.data.quantityInStock !== undefined ? response.data.quantityInStock : (response.data.QuantityInStock !== undefined ? response.data.QuantityInStock : 1),
        availableQuantity: response.data.availableQuantity !== undefined ? response.data.availableQuantity : (response.data.AvailableQuantity !== undefined ? response.data.AvailableQuantity : response.data.quantityInStock || response.data.QuantityInStock || 1),
        gender: response.data.gender || response.data.Gender || null,
        condition: response.data.condition || response.data.Condition || null,
        publishedAt: response.data.publishedAt || response.data.PublishedAt || null,
        boxNumber: response.data.boxNumber ?? response.data.BoxNumber ?? null,
        incomingShipmentId: response.data.incomingShipmentId ?? response.data.IncomingShipmentId ?? null,
        incomingShipmentName: response.data.incomingShipmentName ?? response.data.IncomingShipmentName ?? null,
        createdAt: response.data.createdAt || response.data.CreatedAt,
        updatedAt: response.data.updatedAt || response.data.UpdatedAt
      }
      
      return normalizedProduct
    } catch (error) {
      console.error('[API] Error creating product:', error)
      if (error.response) {
        const errorMessage = error.response.data?.message 
          || error.response.data?.title
          || `Server error: ${error.response.status} ${error.response.statusText}`
        console.error('[API] Server error details:', error.response.data)
        throw new Error(errorMessage)
      } else if (error.request) {
        console.error('[API] No response received')
        throw new Error('No response from server. Please check your connection.')
      } else {
        console.error('[API] Request setup error:', error.message)
        throw new Error(error.message || 'Failed to create product')
      }
    }
  },

  /**
   * Marks a product as published by setting PublishedAt to current time
   * @param {number} id - Product ID
   * @returns {Promise<Object>} Updated product
   */
  async publishProduct(id) {
    try {
      const response = await apiClient.patch(`/products/${id}/publish`)
      return response.data
    } catch (error) {
      console.error('[API] Error publishing product:', error)
      throw error
    }
  },

  /**
   * Updates an existing product
   * @param {number} id - Product ID
   * @param {FormData} formData - Updated product form data
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(id, formData) {
    try {
      console.log(`[API] Updating product ${id}...`)
      
      // Конвертируем FormData в JSON с base64 изображениями
      const productData = {
        name: formData.get('name') || '',
        brand: formData.get('brand') || '',
        description: formData.get('description') || '',
        price: parseFloat(formData.get('price') || 0),
        size: formData.get('size') || '',
        color: formData.get('color') || '',
        quantityInStock: parseInt(formData.get('quantityInStock') || 1),
        gender: formData.get('gender') || null,
        condition: formData.get('condition') || null,
        publishedAt: formData.get('publishedAt') || null,
        cartAvailableAt: formData.get('cartAvailableAt') || null,
        boxNumber: formData.get('boxNumber') || null,
        incomingShipmentId: formData.get('incomingShipmentId') === '' ? null : parseInt(formData.get('incomingShipmentId') || 0),
        images: []
      }
      
      // Сохраняем существующие изображения
      const existingImages = formData.getAll('existingImages')
      if (existingImages && existingImages.length > 0) {
        productData.existingImages = existingImages
      }
      
      // Конвертируем новые файлы в base64
      const imageFiles = formData.getAll('images')
      for (const file of imageFiles) {
        if (file instanceof File) {
          const base64 = await this.fileToBase64(file)
          productData.images.push(base64)
        }
      }
      
      const response = await apiClient.put(`/products/${id}`, productData, {
        timeout: 120000
      })
      
      console.log('[API] Product updated successfully:', response.status, response.data)
      
      if (!validateProduct(response.data)) {
        console.error('[API] Invalid product data in response:', response.data)
        throw new Error('Invalid product data received from server')
      }
      
      // Нормализуем данные - конвертируем Id в id для совместимости
      const normalizedProduct = {
        ...response.data,
        id: response.data.id || response.data.Id,
        name: response.data.name || response.data.Name,
        brand: response.data.brand || response.data.Brand,
        description: response.data.description || response.data.Description,
        price: response.data.price || response.data.Price,
        size: response.data.size || response.data.Size,
        color: response.data.color || response.data.Color,
        images: response.data.images || response.data.Images || [],
        quantityInStock: response.data.quantityInStock !== undefined ? response.data.quantityInStock : (response.data.QuantityInStock !== undefined ? response.data.QuantityInStock : 1),
        availableQuantity: response.data.availableQuantity !== undefined ? response.data.availableQuantity : (response.data.AvailableQuantity !== undefined ? response.data.AvailableQuantity : response.data.quantityInStock || response.data.QuantityInStock || 1),
        gender: response.data.gender || response.data.Gender || null,
        condition: response.data.condition || response.data.Condition || null,
        publishedAt: response.data.publishedAt || response.data.PublishedAt || null,
        boxNumber: response.data.boxNumber ?? response.data.BoxNumber ?? null,
        incomingShipmentId: response.data.incomingShipmentId ?? response.data.IncomingShipmentId ?? null,
        incomingShipmentName: response.data.incomingShipmentName ?? response.data.IncomingShipmentName ?? null,
        createdAt: response.data.createdAt || response.data.CreatedAt,
        updatedAt: response.data.updatedAt || response.data.UpdatedAt
      }
      
      return normalizedProduct
    } catch (error) {
      console.error(`[API] Error updating product ${id}:`, error)
      if (error.response) {
        const errorMessage = error.response.data?.message 
          || error.response.data?.title
          || `Server error: ${error.response.status} ${error.response.statusText}`
        console.error('[API] Server error details:', error.response.data)
        throw new Error(errorMessage)
      } else if (error.request) {
        console.error('[API] No response received')
        throw new Error('No response from server. Please check your connection.')
      } else {
        console.error('[API] Request setup error:', error.message)
        throw new Error(error.message || 'Failed to update product')
      }
    }
  },

  /**
   * Deletes a product
   * @param {number} id - Product ID
   * @returns {Promise<void>}
   */
  async deleteProduct(id) {
    try {
      console.log(`[API] Deleting product ${id}...`)
      const response = await apiClient.delete(`/products/${id}`)
      console.log('[API] Product deleted successfully:', response.status)
    } catch (error) {
      console.error(`[API] Error deleting product ${id}:`, error)
      if (error.response) {
        console.error('[API] Server error:', error.response.status, error.response.data)
        const msg =
          error.response.data?.message ||
          error.response.data?.Message ||
          (error.response.status === 409
            ? 'Товар нельзя удалить: есть связанные данные.'
            : null)
        throw new Error(msg || `Failed to delete product: ${error.response.status}`)
      }
      throw error
    }
  },

  /**
   * Gets the list of available colors
   * @returns {Promise<Array<string>>} List of color names
   */
  async getColors() {
    try {
      console.log('[API] Fetching colors from:', `${API_BASE_URL}/colors`)
      
      const response = await apiClient.get('/colors', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      console.log('[API] Colors raw response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataStringified: JSON.stringify(response.data)
      })
      
      // Handle different response formats
      let colors = response.data
      
      // If response.data is null or undefined
      if (colors == null) {
        console.error('[API] Colors response is null or undefined')
        return []
      }
      
      // If response.data is wrapped in an object, extract it
      if (typeof colors === 'object' && !Array.isArray(colors)) {
        console.log('[API] Colors is an object, checking for array properties...')
        // Check common wrapper properties
        if (colors.data && Array.isArray(colors.data)) {
          colors = colors.data
          console.log('[API] Extracted colors from data property')
        } else if (colors.colors && Array.isArray(colors.colors)) {
          colors = colors.colors
          console.log('[API] Extracted colors from colors property')
        } else if (colors.value && Array.isArray(colors.value)) {
          colors = colors.value
          console.log('[API] Extracted colors from value property')
        } else {
          // Try to get all values if it's a plain object
          const values = Object.values(colors)
          if (Array.isArray(values) && values.length > 0) {
            console.log('[API] Extracted colors from object values')
            colors = values
          } else {
            console.error('[API] Could not extract array from object:', colors)
            return []
          }
        }
      }
      
      // Validate that we have an array
      if (!validateArray(colors, 'colors')) {
        console.error('[API] Colors is not an array after processing:', colors, typeof colors)
        return []
      }
      
      // Validate array items are strings
      const validColors = colors.filter(color => {
        if (typeof color !== 'string') {
          console.warn('[API] Invalid color item (not a string):', color, typeof color)
          return false
        }
        return true
      })
      
      if (validColors.length === 0) {
        console.warn('[API] No valid colors found in response')
        return []
      }
      
      console.log(`[API] Successfully loaded ${validColors.length} colors:`, validColors)
      return validColors
    } catch (error) {
      console.error('[API] Error loading colors:', error)
      if (error.response) {
        console.error('[API] Server error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        })
      } else if (error.request) {
        console.error('[API] No response received for colors request. Request:', error.request)
        console.error('[API] This might be a CORS issue. Check server CORS configuration.')
      } else {
        console.error('[API] Request setup error:', error.message)
      }
      // Return empty array if error, so form still works
      return []
    }
  },

  _applyAuthPayload(data) {
    const d = data || {}
    const normalized = {
      token: d.token || d.Token || '',
      expiresAt: d.expiresAt || d.ExpiresAt || '',
      username: d.username || d.Username || '',
      fullName: d.fullName || d.FullName || '',
      userId: d.userId ?? d.UserId,
      isAdmin: !!(d.isAdmin ?? d.IsAdmin),
      email: d.email ?? d.Email ?? null
    }
    if (!normalized.token) return normalized
    localStorage.setItem('authToken', normalized.token)
    localStorage.setItem('user', JSON.stringify({
      username: normalized.username,
      fullName: normalized.fullName,
      userId: normalized.userId,
      isAdmin: normalized.isAdmin,
      email: normalized.email
    }))
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('bebochka-auth'))
    return normalized
  },

  /**
   * Logs in a user and returns authentication token
   * @param {string} username - Username
   * @param {string} password - Password
   * @param {string} [sessionIdForMerge] - гостевая сессия для слияния корзины
   * @returns {Promise<Object>} Authentication response with token
   */
  async login(username, password, sessionIdForMerge = null) {
    try {
      console.log('[API] Attempting login for user:', username)
      const response = await apiClient.post('/auth/login', {
        username,
        password
      })
      
      console.log('[API] Login response received:', response.data)
      
      const data = response.data || {}
      const normalizedResponse = this._applyAuthPayload(data)
      
      console.log('[API] Normalized login response:', normalizedResponse)
      
      if (!normalizedResponse.token) {
        console.error('[API] No token in login response:', data)
        throw new Error('Неверное имя пользователя или пароль')
      }

      if (sessionIdForMerge) {
        try {
          await apiClient.post('/auth/merge-cart', { sessionId: sessionIdForMerge })
        } catch (e) {
          console.warn('[API] merge-cart:', e)
        }
      }
      
      console.log('[API] Login successful. Token stored.')
      return normalizedResponse
    } catch (error) {
      console.error('[API] Login error:', error)
      if (error.response) {
        console.error('[API] Login error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        })
        const errorMessage = error.response.data?.message 
          || error.response.data?.Message
          || error.message
          || 'Неверное имя пользователя или пароль'
        throw new Error(errorMessage)
      }
      throw new Error(error.message || 'Ошибка при входе. Проверьте данные.')
    }
  },

  /**
   * Gets current user information
   * @returns {Promise<Object>} User information
   */
  async getCurrentUser() {
    try {
      console.log('[API] Getting current user...')
      const response = await apiClient.get('/auth/me')
      console.log('[API] Current user:', response.data)
      return response.data
    } catch (error) {
      console.error('[API] Error getting current user:', error)
      throw error
    }
  },

  async register(payload, sessionIdForMerge = null) {
    try {
      const response = await apiClient.post('/auth/register', {
        phone: payload.phone,
        password: payload.password,
        email: payload.email || null,
        fullName: payload.fullName || null,
        acceptPersonalDataProcessing: !!payload.acceptPersonalDataProcessing
      })
      const normalized = this._applyAuthPayload(response.data)
      if (sessionIdForMerge && normalized.token) {
        try {
          await apiClient.post('/auth/merge-cart', { sessionId: sessionIdForMerge })
        } catch (e) { console.warn(e) }
      }
      return normalized
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Ошибка регистрации'
      throw new Error(msg)
    }
  },

  async sendPhoneCode(phone) {
    await apiClient.post('/auth/phone/send-code', { phone })
  },

  async verifyPhoneLogin(phone, code, sessionIdForMerge = null, acceptPersonalDataProcessing = false) {
    try {
      const response = await apiClient.post('/auth/phone/verify', {
        phone,
        code,
        acceptPersonalDataProcessing: !!acceptPersonalDataProcessing
      })
      const normalized = this._applyAuthPayload(response.data)
      if (sessionIdForMerge && normalized.token) {
        try {
          await apiClient.post('/auth/merge-cart', { sessionId: sessionIdForMerge })
        } catch (e) { console.warn(e) }
      }
      return normalized
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Ошибка входа по телефону'
      throw new Error(msg)
    }
  },

  async getMyOrders() {
    try {
      const response = await apiClient.get('/orders/mine')
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Не удалось загрузить заказы'
      throw new Error(msg)
    }
  },

  /**
   * Клиент: подтвердить получение заказа («Отправлен» → «Получен»). Оценка и комментарий необязательны.
   * @param {number} orderId
   * @param {{ rating?: number | null, comment?: string | null }} [payload]
   */
  async markMyOrderReceived(orderId, payload = {}) {
    try {
      const body = {}
      const r = payload.rating
      if (r != null && r !== '' && Number.isFinite(Number(r))) {
        const n = Number(r)
        if (n >= 1 && n <= 5) body.rating = n
      }
      const c = payload.comment != null ? String(payload.comment).trim() : ''
      if (c) body.comment = c
      try {
        const response = await apiClient.post(`/orders/mine/${orderId}/mark-received`, body)
        return response.data
      } catch (error) {
        // Совместимость со старыми/альтернативными маршрутами на бэкенде.
        if (error?.response?.status === 404) {
          const fallback = await apiClient.post(`/orders/${orderId}/mark-received`, body)
          return fallback.data
        }
        throw error
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Не удалось подтвердить получение'
      throw new Error(msg)
    }
  },

  async joinCartQueue(productId) {
    await apiClient.post('/cart/queue', { productId })
  },

  async getMyCartQueue() {
    const response = await apiClient.get('/cart/queue/mine')
    const items = Array.isArray(response.data) ? response.data : []
    return items.map((item) => {
      const priceRaw = item.ProductPrice ?? item.productPrice
      const priceNum =
        priceRaw === null || priceRaw === undefined || priceRaw === ''
          ? 0
          : Number(priceRaw)
      return {
        id: item.Id ?? item.id,
        productId: item.ProductId ?? item.productId,
        productName: item.ProductName ?? item.productName ?? '',
        productBrand: item.ProductBrand ?? item.productBrand ?? null,
        productImages: item.ProductImages ?? item.productImages ?? [],
        productPrice: Number.isFinite(priceNum) ? priceNum : 0,
        productSize: String(item.ProductSize ?? item.productSize ?? '').trim() || null,
        productColor: String(item.ProductColor ?? item.productColor ?? '').trim() || null,
        productCondition: String(item.ProductCondition ?? item.productCondition ?? '').trim() || null,
        createdAt: item.CreatedAt ?? item.createdAt
      }
    })
  },

  async cancelMyCartQueueItem(queueItemId) {
    await apiClient.delete(`/cart/queue/${queueItemId}`)
  },

  /**
   * Gets all users
   * @returns {Promise<Array>} List of users
   */
  async getUsers() {
    try {
      console.log('[API] Fetching all users...')
      const response = await apiClient.get('/users')
      
      // Нормализуем данные пользователей
      const normalizedUsers = Array.isArray(response.data) 
        ? response.data.map(user => ({
            id: user.id || user.Id,
            username: user.username || user.Username || '',
            email: user.email || user.Email || null,
            fullName: user.fullName || user.FullName || null,
            createdAt: user.createdAt || user.CreatedAt || null,
            lastLoginAt: user.lastLoginAt || user.LastLoginAt || null,
            isAdmin: !!(user.isAdmin ?? user.IsAdmin)
          }))
        : []
      
      console.log('[API] Successfully loaded users:', normalizedUsers.length)
      return normalizedUsers
    } catch (error) {
      console.error('[API] Error fetching users:', error)
      throw error
    }
  },

  /**
   * Creates a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      console.log('[API] Creating user...', userData)
      const formData = new FormData()
      formData.append('username', userData.username)
      formData.append('password', userData.password)
      if (userData.email) formData.append('email', userData.email)
      if (userData.fullName) formData.append('fullName', userData.fullName)
      formData.append('isAdmin', userData.isAdmin ? 'true' : 'false')
      
      const response = await apiClient.post('/users', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log('[API] User created successfully:', response.data)
      return response.data
    } catch (error) {
      console.error('[API] Error creating user:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  /**
   * Changes user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, newPassword) {
    try {
      console.log('[API] Changing password for user:', userId)
      await apiClient.put(`/users/${userId}/password`, { newPassword })
      console.log('[API] Password changed successfully')
    } catch (error) {
      console.error('[API] Error changing password:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  /**
   * Deletes a user
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      console.log('[API] Deleting user:', userId)
      await apiClient.delete(`/users/${userId}`)
      console.log('[API] User deleted successfully')
    } catch (error) {
      console.error('[API] Error deleting user:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  /**
   * Gets cart items for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} List of cart items
   */
  async getCartItems(sessionId) {
    try {
      const token = localStorage.getItem('authToken')
      if (!token && !sessionId) {
        console.warn('[API] SessionId is missing for getCartItems (guest)')
        return []
      }
      const params = {}
      if (sessionId) params.sessionId = sessionId
      console.log('[API] Fetching cart items', sessionId ? `sessionId: ${sessionId}` : '(authorized)')
      const response = await apiClient.get('/cart', { params })
      console.log('[API] Cart items response:', response.data)
      
      // Нормализуем данные, если они приходят в разных форматах
      const items = Array.isArray(response.data) ? response.data : []
      return items.map(item => ({
        id: item.Id || item.id,
        productId: item.ProductId || item.productId,
        productName: item.ProductName || item.productName,
        productBrand: item.ProductBrand || item.productBrand,
        productSize: item.ProductSize || item.productSize,
        productColor: item.ProductColor || item.productColor,
        productImages: item.ProductImages || item.productImages || [],
        productPrice: item.ProductPrice ?? item.productPrice ?? 0,
        quantity: item.Quantity ?? item.quantity ?? 0,
        createdAt: item.CreatedAt || item.createdAt
      }))
    } catch (error) {
      console.error('[API] Error fetching cart items:', error)
      // Если ошибка 400 из-за отсутствия sessionId, возвращаем пустой массив
      if (error.response?.status === 400) {
        console.warn('[API] Bad request for cart items, returning empty array')
        return []
      }
      throw error
    }
  },

  /**
   * Adds a product to cart
   * @param {string} sessionId - Session ID
   * @param {number} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<Object>} Cart item
   */
  async addToCart(sessionId, productId, quantity = 1) {
    try {
      if (!sessionId) {
        throw new Error('SessionId is required')
      }
      if (!productId) {
        throw new Error('ProductId is required')
      }
      
      console.log('[API] Adding to cart:', { sessionId, productId, quantity })
      const payload = {
        sessionId: String(sessionId),
        productId: Number(productId),
        quantity: Number(quantity)
      }
      console.log('[API] Payload:', payload)
      
      const response = await apiClient.post('/cart', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('[API] Add to cart response:', response.data)
      return response.data
    } catch (error) {
      console.error('[API] Error adding to cart:', error)
      console.error('[API] Error response:', error.response?.data)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      if (error.message) {
        throw error
      }
      throw new Error('Failed to add item to cart')
    }
  },

  /**
   * Updates cart item quantity
   * @param {number} cartItemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated cart item
   */
  async updateCartItem(cartItemId, quantity) {
    try {
      console.log('[API] Updating cart item:', { cartItemId, quantity })
      const response = await apiClient.put(`/cart/${cartItemId}`, { quantity })
      return response.data
    } catch (error) {
      console.error('[API] Error updating cart item:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  /**
   * Removes item from cart
   * @param {number} cartItemId - Cart item ID
   * @returns {Promise<void>}
   */
  async removeFromCart(cartItemId) {
    try {
      console.log('[API] Removing from cart:', cartItemId)
      await apiClient.delete(`/cart/${cartItemId}`)
    } catch (error) {
      console.error('[API] Error removing from cart:', error)
      throw error
    }
  },

  /**
   * Clears cart for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async clearCart(sessionId) {
    try {
      const params = {}
      if (sessionId) params.sessionId = sessionId
      console.log('[API] Clearing cart', sessionId || '(authorized)')
      await apiClient.delete('/cart', { params })
    } catch (error) {
      console.error('[API] Error clearing cart:', error)
      throw error
    }
  },

  /**
   * Gets all active cart items (admin only)
   * @returns {Promise<Array>}
   */
  async getAdminCartItems() {
    const response = await apiClient.get('/cart/admin/items')
    return Array.isArray(response.data) ? response.data : []
  },

  /**
   * Removes cart item by id (admin only)
   * @param {number} id
   * @returns {Promise<void>}
   */
  async removeAdminCartItem(id) {
    await apiClient.delete(`/cart/admin/items/${id}`)
  },

  /**
   * Gets all announcements
   * @returns {Promise<Array>} List of announcements
   */
  async getAnnouncements() {
    try {
      const response = await apiClient.get('/announcements')
      return response.data || []
    } catch (error) {
      console.error('[API] Error fetching announcements:', error)
      throw error
    }
  },

  /**
   * Gets unpublished products for announcement selection
   * @returns {Promise<Array>} List of unpublished products
   */
  async getUnpublishedProducts() {
    try {
      const response = await apiClient.get('/announcements/unpublished-products')
      return response.data || []
    } catch (error) {
      console.error('[API] Error fetching unpublished products:', error)
      throw error
    }
  },

  /**
   * Creates a new announcement
   * @param {Object} announcement - Announcement data
   * @returns {Promise<Object>} Created announcement
   */
  async createAnnouncement(announcement) {
    try {
      const response = await apiClient.post('/announcements', announcement)
      return response.data
    } catch (error) {
      console.error('[API] Error creating announcement:', error)
      throw error
    }
  },

  /**
   * Deletes an announcement
   * @param {number} id - Announcement ID
   * @returns {Promise<void>}
   */
  async deleteAnnouncement(id) {
    try {
      await apiClient.delete(`/announcements/${id}`)
    } catch (error) {
      console.error('[API] Error deleting announcement:', error)
      throw error
    }
  },

  /**
   * Gets all brands with optional search
   * @param {string} search - Search term
   * @returns {Promise<Array>} List of brands
   */
  async getBrands(search = null) {
    try {
      const params = search ? { search } : {}
      const response = await apiClient.get('/brands', { params })
      return response.data || []
    } catch (error) {
      console.error('[API] Error fetching brands:', error)
      throw error
    }
  },

  /**
   * Gets all product name suggestions with optional search.
   * @param {string} search
   * @returns {Promise<Array>}
   */
  async getProductNameSuggestions(search = null) {
    try {
      const params = search ? { search } : {}
      const response = await apiClient.get('/productnamesuggestions', { params })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('[API] Error fetching product name suggestions:', error)
      return []
    }
  },

  /**
   * Creates a new brand
   * @param {Object} brand - Brand data
   * @returns {Promise<Object>} Created brand
   */
  async createBrand(brand) {
    try {
      const response = await apiClient.post('/brands', brand)
      return response.data
    } catch (error) {
      console.error('[API] Error creating brand:', error)
      throw error
    }
  },

  /**
   * Sends a message to Telegram channel
   * @param {string} message - Message text to send
   * @param {Array<string>} imageUrls - Optional list of image URLs to send with the message
   * @returns {Promise<Object>} Response with success status
   */
  async sendMessageToChannel(message, imageUrls = null) {
    try {
      const payload = { message }
      if (imageUrls && imageUrls.length > 0) {
        payload.imageUrls = imageUrls
      }
      // Increase timeout for Telegram channel sending (can take up to 500 seconds on backend)
      const response = await apiClient.post('/telegram/channel/send', payload, {
        timeout: 600000 // 10 minutes timeout for sending large images to Telegram
      })
      const data = response.data
      const isObject = data && typeof data === 'object'
      const success = isObject ? (data.success ?? data.Success ?? false) : false
      const normalizedMessage = isObject ? (data.message ?? data.Message ?? '') : ''
      return isObject ? { ...data, success, message: normalizedMessage } : { success, message: normalizedMessage, raw: data }
    } catch (error) {
      console.error('[API] Error sending message to channel:', error)
      const apiMessage = error.response?.data?.message || error.response?.data?.Message
      if (apiMessage) {
        throw new Error(apiMessage)
      }
      throw error
    }
  },

  /**
   * Sends products to Telegram channel by product IDs
   * All message formatting and image loading happens on the backend
   * @param {Array<number>} productIds - Array of product IDs to send
   * @param {string|null} preferredEmojiId - Optional. Telegram custom_emoji_id for this send (overrides saved preference)
   * @returns {Promise<Object>} Response with success status and details
   */
  async sendProductsToChannel(productIds, preferredEmojiId = null) {
    try {
      const payload = { productIds }
      if (preferredEmojiId) payload.preferredEmojiId = preferredEmojiId
      // Increase timeout for Telegram channel sending (can take up to 500 seconds per product on backend)
      const response = await apiClient.post('/telegram/channel/send-products', payload, {
        timeout: 600000 // 10 minutes timeout for sending large images to Telegram
      })
      const data = response.data
      return {
        success: data.success ?? data.Success ?? false,
        successCount: data.successCount ?? data.SuccessCount ?? 0,
        failCount: data.failCount ?? data.FailCount ?? 0,
        totalCount: data.totalCount ?? data.TotalCount ?? 0,
        results: data.results ?? data.Results ?? [],
        message: data.message ?? data.Message ?? ''
      }
    } catch (error) {
      console.error('[API] Error sending products to channel:', error)
      const apiMessage = error.response?.data?.message || error.response?.data?.Message
      if (apiMessage) {
        throw new Error(apiMessage)
      }
      throw error
    }
  },

  /**
   * Gets current admin user's preferred channel emoji (Telegram custom_emoji_id)
   * @returns {Promise<string|null>}
   */
  async getMyChannelEmoji() {
    try {
      const response = await apiClient.get('/users/me/channel-emoji')
      return response.data?.emojiId ?? null
    } catch (error) {
      console.error('[API] Error getting channel emoji preference:', error)
      return null
    }
  },

  /**
   * Updates current admin user's preferred channel emoji (Telegram custom_emoji_id)
   * @param {string|null} emojiId
   * @returns {Promise<string|null>}
   */
  async setMyChannelEmoji(emojiId) {
    try {
      const payload = { emojiId }
      const response = await apiClient.post('/users/me/channel-emoji', payload)
      return response.data?.emojiId ?? null
    } catch (error) {
      console.error('[API] Error setting channel emoji preference:', error)
      throw error
    }
  },

  /**
   * Gets the sending status for products by their IDs
   * Returns how many products have been published (sent to channel)
   * @param {Array<number>} productIds - Array of product IDs to check
   * @returns {Promise<Object>} Status with count of published products
   */
  async getSendStatus(productIds) {
    try {
      const response = await apiClient.post('/telegram/channel/send-status', productIds)
      const data = response.data
      return {
        totalCount: data.totalCount ?? data.TotalCount ?? 0,
        publishedCount: data.publishedCount ?? data.PublishedCount ?? 0,
        remainingCount: data.remainingCount ?? data.RemainingCount ?? 0
      }
    } catch (error) {
      console.error('[API] Error getting send status:', error)
      const apiMessage = error.response?.data?.message || error.response?.data?.Message
      if (apiMessage) {
        throw new Error(apiMessage)
      }
      throw error
    }
  },

  /**
   * Gets all Telegram errors grouped by date
   * @returns {Promise<Object>} Errors grouped by date
   */
  async getTelegramErrors() {
    try {
      const response = await apiClient.get('/TelegramErrors')
      return response.data
    } catch (error) {
      console.error('[API] Error fetching Telegram errors:', error)
      throw error
    }
  },

  /**
   * Deletes a Telegram error by ID
   * @param {number} id - Error ID
   * @returns {Promise<void>}
   */
  async deleteTelegramError(id) {
    try {
      await apiClient.delete(`/TelegramErrors/${id}`)
    } catch (error) {
      console.error('[API] Error deleting Telegram error:', error)
      throw error
    }
  },

  /**
   * Deletes all Telegram errors
   * @returns {Promise<void>}
   */
  async deleteAllTelegramErrors() {
    try {
      await apiClient.delete('/TelegramErrors/all')
    } catch (error) {
      console.error('[API] Error deleting all Telegram errors:', error)
      throw error
    }
  },

  /**
   * Gets all orders (admin only)
   * @returns {Promise<Array>} List of orders
   */
  async getAllOrders() {
    try {
      const response = await apiClient.get('/orders')
      return response.data || []
    } catch (error) {
      console.error('[API] Error fetching orders:', error)
      throw error
    }
  },

  /**
   * Gets customer reviews for admin panel
   * @returns {Promise<Array>}
   */
  async getOrderReviews() {
    try {
      const response = await apiClient.get('/orders/reviews')
      const rows = Array.isArray(response.data) ? response.data : []
      return rows.map((row) => ({
        id: row.id ?? row.Id,
        orderId: row.orderId ?? row.OrderId,
        orderNumber: row.orderNumber ?? row.OrderNumber ?? '',
        userId: row.userId ?? row.UserId,
        customerName: row.customerName ?? row.CustomerName ?? '',
        customerPhone: row.customerPhone ?? row.CustomerPhone ?? '',
        rating: row.rating ?? row.Rating ?? null,
        comment: row.comment ?? row.Comment ?? '',
        createdAtUtc: row.createdAtUtc ?? row.CreatedAtUtc ?? null,
        imageUrls: row.imageUrls ?? row.ImageUrls ?? []
      }))
    } catch (error) {
      console.error('[API] Error fetching order reviews:', error)
      throw error
    }
  },

  async createOrderReviewAsAdmin(payload) {
    const toBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = String(reader.result || '')
        const base64 = result.includes(',') ? result.split(',')[1] : result
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const files = Array.isArray(payload?.files) ? payload.files : []
    const imagesBase64 = []
    for (const file of files) {
      if (file instanceof File) {
        imagesBase64.push(await toBase64(file))
      }
    }

    const body = {
      orderNumber: payload.orderNumber ? String(payload.orderNumber).trim() : null,
      customerName: payload.customerName ? String(payload.customerName).trim() : null,
      customerPhone: payload.customerPhone ? String(payload.customerPhone).trim() : null,
      rating: Number(payload.rating) || 0,
      comment: payload.comment ? String(payload.comment).trim() : '',
      imagesBase64
    }
    const response = await apiClient.post('/orders/reviews/admin', body)
    return response.data
  },

  /**
   * Gets an order by ID
   * @param {number} id - Order ID
   * @returns {Promise<Object>} Order data
   */
  async getOrder(id) {
    try {
      const response = await apiClient.get(`/orders/${id}`)
      return response.data
    } catch (error) {
      console.error('[API] Error fetching order:', error)
      throw error
    }
  },

  /**
   * Updates order status
   * @param {number} id - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Response
   */
  async updateOrderStatus(id, status) {
    try {
      const response = await apiClient.put(`/orders/${id}/status`, { status })
      return response.data
    } catch (error) {
      console.error('[API] Error updating order status:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  /**
   * Updates multiple orders status
   * @param {Array<number>} orderIds - Array of order IDs
   * @param {string} status - New status
   * @returns {Promise<Array>} Results
   */
  async updateOrdersStatus(orderIds, status) {
    try {
      const promises = orderIds.map(id => this.updateOrderStatus(id, status))
      const results = await Promise.allSettled(promises)
      return results.map((result, index) => ({
        orderId: orderIds[index],
        success: result.status === 'fulfilled',
        error: result.status === 'rejected' ? result.reason?.message : null
      }))
    } catch (error) {
      console.error('[API] Error updating orders status:', error)
      throw error
    }
  },

  /**
   * Deletes an order and its items from the database (admin only).
   * @param {number} id - Order ID
   * @returns {Promise<void>}
   */
  async deleteOrder(id) {
    try {
      await apiClient.delete(`/orders/${id}`)
    } catch (error) {
      console.error('[API] Error deleting order:', error)
      throw error
    }
  },

  /**
   * Removes an item from an order (admin only). Deletes user's Telegram comment, restores stock, may assign product to next in queue.
   * @param {number} orderId - Order ID
   * @param {number} itemId - Order item ID
   * @returns {Promise<void>}
   */
  async deleteOrderItem(orderId, itemId) {
    try {
      await apiClient.delete(`/orders/${orderId}/items/${itemId}`)
    } catch (error) {
      console.error('[API] Error deleting order item:', error)
      throw error
    }
  },

  /**
   * Marks an order item as added to parcel or not (admin only).
   * @param {number} orderId - Order ID
   * @param {number} itemId - Order item ID
   * @param {boolean} addedToParcel
   * @returns {Promise<void>}
   */
  async setOrderItemInParcel(orderId, itemId, addedToParcel) {
    try {
      await apiClient.patch(`/orders/${orderId}/items/${itemId}/in-parcel`, { addedToParcel })
    } catch (error) {
      console.error('[API] Error setting order item in-parcel:', error)
      throw error
    }
  },

  async applyDiscount(orderIds, discountType, fixedPercent, condition1, condition3, condition5Plus) {
    await apiClient.post('/orders/apply-discount', {
      orderIds,
      discountType,
      fixedDiscountPercent: fixedPercent,
      condition1ItemPercent: condition1,
      condition3ItemsPercent: condition3,
      condition5PlusPercent: condition5Plus
    })
  },

  async removeOrderDiscount(orderId) {
    await apiClient.delete(`/orders/${orderId}/discount`)
  },

  async setOrderDiscount(orderId, percent) {
    await apiClient.put(`/orders/${orderId}/discount`, { percent })
  },

  async getIncomingShipments() {
    const response = await apiClient.get('/incoming-shipments')
    const rows = Array.isArray(response.data) ? response.data : []
    return rows.map((r) => ({
      id: r.id ?? r.Id,
      name: r.name ?? r.Name ?? '',
      weightKg: r.weightKg ?? r.WeightKg ?? 0,
      itemCount: r.itemCount ?? r.ItemCount ?? 0,
      orderedAmount: r.orderedAmount ?? r.OrderedAmount ?? 0,
      revenue: r.revenue ?? r.Revenue ?? null,
      miscExpensesTotal: r.miscExpensesTotal ?? r.MiscExpensesTotal ?? 0,
      totalExpenses: r.totalExpenses ?? r.TotalExpenses ?? 0,
      actualMargin: r.actualMargin ?? r.ActualMargin ?? null,
      expenses: Array.isArray(r.expenses ?? r.Expenses)
        ? (r.expenses ?? r.Expenses).map((e) => ({
            id: e.id ?? e.Id,
            name: e.name ?? e.Name ?? '',
            amount: e.amount ?? e.Amount ?? 0,
            createdAt: e.createdAt ?? e.CreatedAt ?? null
          }))
        : [],
      notes: r.notes ?? r.Notes ?? null,
      createdAt: r.createdAt ?? r.CreatedAt ?? null,
      updatedAt: r.updatedAt ?? r.UpdatedAt ?? null
    }))
  },

  async createIncomingShipment(payload) {
    const response = await apiClient.post('/incoming-shipments', payload)
    return response.data
  },

  async updateIncomingShipment(id, payload) {
    const response = await apiClient.put(`/incoming-shipments/${id}`, payload)
    return response.data
  },

  async deleteIncomingShipment(id) {
    await apiClient.delete(`/incoming-shipments/${id}`)
  }
}
