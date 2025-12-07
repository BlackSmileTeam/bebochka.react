import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://89.104.67.36:55501/api'

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
    
    // Handle 401 Unauthorized - clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login'
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
   * Gets all products
   * @returns {Promise<Array>} List of products
   */
  async getProducts() {
    try {
      console.log('[API] Fetching products...')
      const response = await apiClient.get('/products')
      
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
        createdAt: product.createdAt || product.CreatedAt,
        updatedAt: product.updatedAt || product.UpdatedAt
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
   * @returns {Promise<Object>} Product data
   */
  async getProduct(id) {
    try {
      console.log(`[API] Fetching product ${id}...`)
      const response = await apiClient.get(`/products/${id}`)
      
      if (!validateProduct(response.data)) {
        console.error('[API] Invalid product data:', response.data)
        throw new Error('Invalid product data received')
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
        createdAt: response.data.createdAt || response.data.CreatedAt,
        updatedAt: response.data.updatedAt || response.data.UpdatedAt
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
   * Updates an existing product
   * @param {number} id - Product ID
   * @param {FormData} formData - Updated product form data
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(id, formData) {
    try {
      console.log(`[API] Updating product ${id}...`)
      const response = await apiClient.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
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
        throw new Error(error.response.data?.message || `Failed to delete product: ${error.response.status}`)
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

  /**
   * Logs in a user and returns authentication token
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} Authentication response with token
   */
  async login(username, password) {
    try {
      console.log('[API] Attempting login for user:', username)
      const response = await apiClient.post('/auth/login', {
        username,
        password
      })
      
      console.log('[API] Login response received:', response.data)
      
      // Нормализуем ответ - сервер может возвращать ключи с заглавными буквами
      const data = response.data || {}
      const normalizedResponse = {
        token: data.token || data.Token || '',
        expiresAt: data.expiresAt || data.ExpiresAt || '',
        username: data.username || data.Username || '',
        fullName: data.fullName || data.FullName || ''
      }
      
      console.log('[API] Normalized login response:', normalizedResponse)
      
      if (!normalizedResponse.token) {
        console.error('[API] No token in login response:', data)
        throw new Error('Неверное имя пользователя или пароль')
      }
      
      // Сохраняем токен и данные пользователя
      localStorage.setItem('authToken', normalizedResponse.token)
      localStorage.setItem('user', JSON.stringify({
        username: normalizedResponse.username,
        fullName: normalizedResponse.fullName
      }))
      
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
  }
}
