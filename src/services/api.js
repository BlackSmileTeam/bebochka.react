import axios from 'axios'
import { getApiBaseUrl } from '../utils/apiBase'
import {
  readFavoriteProductIds,
  toggleFavoriteProductId,
} from '../utils/favoritesStorage'
import { buildCatalogPageFromProducts } from '../utils/catalogClientPage'
import { normalizeUserChildren } from '../utils/adminUserChildren'

const API_BASE_URL = getApiBaseUrl()

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

function extractApiError(error, fallback) {
  return (
    error?.response?.data?.message
    || error?.response?.data?.Message
    || error?.message
    || fallback
  )
}

function isFavoritesApiUnavailable(error) {
  const status = error?.response?.status
  return status === 404 || status === 405
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
        nuance: product.nuance ?? product.Nuance ?? null,
        discountPercent: product.discountPercent ?? product.DiscountPercent ?? null,
        finalPrice: product.finalPrice ?? product.FinalPrice ?? null,
        publishedAt: product.publishedAt || product.PublishedAt || null,
        cartAvailableAt: product.cartAvailableAt ?? product.CartAvailableAt ?? null,
        cartUnlocked: product.cartUnlocked !== undefined ? product.cartUnlocked : (product.CartUnlocked !== undefined ? product.CartUnlocked : true),
        boxNumber: product.boxNumber ?? product.BoxNumber ?? null,
        owner: product.owner ?? product.Owner ?? null,
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

  normalizeProduct(product) {
    return {
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
      nuance: product.nuance ?? product.Nuance ?? null,
      discountPercent: product.discountPercent ?? product.DiscountPercent ?? null,
      finalPrice: product.finalPrice ?? product.FinalPrice ?? null,
      boxNumber: product.boxNumber ?? product.BoxNumber ?? null,
      owner: product.owner ?? product.Owner ?? null,
      incomingShipmentId: product.incomingShipmentId ?? product.IncomingShipmentId ?? null,
      incomingShipmentName: product.incomingShipmentName ?? product.IncomingShipmentName ?? null,
      createdAt: product.createdAt || product.CreatedAt,
      updatedAt: product.updatedAt || product.UpdatedAt,
      publishedAt: product.publishedAt || product.PublishedAt || null,
      cartAvailableAt: product.cartAvailableAt ?? product.CartAvailableAt ?? null,
      cartUnlocked: product.cartUnlocked !== undefined ? product.cartUnlocked : (product.CartUnlocked !== undefined ? product.CartUnlocked : true),
      isKit: !!(product.isKit ?? product.IsKit ?? product.kitId ?? product.KitId),
      kitId: product.kitId ?? product.KitId ?? null,
      kitPrice: product.kitPrice ?? product.KitPrice ?? null,
      kitParts: product.kitParts ?? product.KitParts ?? null,
      isTestProduct: !!(product.isTestProduct ?? product.IsTestProduct),
    }
  },

  /**
   * Gets all products
   * @param {string} sessionId - Optional session ID for cart reservation calculation
   * @returns {Promise<Array>} List of products
   */
  async getProducts(sessionId = null) {
    try {
      const params = sessionId ? { sessionId } : {}
      const response = await apiClient.get('/products', { params })

      if (!validateArray(response.data, 'products')) {
        console.error('[API] Products response is not an array:', response.data)
        return []
      }

      return response.data.map((product) => this.normalizeProduct(product))
    } catch (error) {
      console.error('[API] Error fetching products:', error)
      throw error
    }
  },

  _parseCatalogApiResponse(data, page, pageSize) {
    const rawItems = data.items ?? data.Items ?? []
    const items = Array.isArray(rawItems)
      ? rawItems.map((p) => this.normalizeProduct(p))
      : []
    const facets = data.facets ?? data.Facets

    return {
      items,
      total: data.total ?? data.Total ?? items.length,
      page: data.page ?? data.Page ?? page,
      pageSize: data.pageSize ?? data.PageSize ?? pageSize,
      hasMore: data.hasMore ?? data.HasMore ?? false,
      facets: facets
        ? {
            brands: facets.brands ?? facets.Brands ?? [],
            sizes: facets.sizes ?? facets.Sizes ?? [],
            colors: facets.colors ?? facets.Colors ?? [],
            genders: facets.genders ?? facets.Genders ?? [],
            conditions: facets.conditions ?? facets.Conditions ?? [],
          }
        : null,
    }
  },

  _catalogFallbackCache: null,
  _catalogFallbackSessionKey: null,
  _catalogApiMode: null,

  _readCatalogApiMode() {
    return this._catalogApiMode
  },

  _setCatalogApiMode(mode) {
    this._catalogApiMode = mode
  },

  async _getCatalogProductsLegacyPage(options) {
    const { page, pageSize, sessionId, filters, priceSort, includeFacets } = options
    const sessionKey = sessionId || ''

    if (
      !this._catalogFallbackCache ||
      this._catalogFallbackSessionKey !== sessionKey
    ) {
      const all = await this.getProducts(sessionId)
      this._catalogFallbackCache = all.map((p) => this.normalizeProduct(p))
      this._catalogFallbackSessionKey = sessionKey
    }

    return buildCatalogPageFromProducts(this._catalogFallbackCache, {
      page,
      pageSize,
      filters,
      priceSort,
      includeFacets,
    })
  },

  /**
   * Paginated catalog: /api/products/catalog when available, else legacy /api/products + client paging.
   */
  async getCatalogProducts({
    page = 1,
    pageSize = 24,
    sessionId = null,
    filters = {},
    priceSort = '',
    includeFacets = false,
    publicOnly = false,
  } = {}) {
    const params = { page, pageSize, includeFacets }
    if (publicOnly) params.publicOnly = true
    if (sessionId) params.sessionId = sessionId
    if (filters.brand) params.brand = filters.brand
    if (filters.color) params.color = filters.color
    if (filters.gender) params.gender = filters.gender
    if (filters.condition) params.condition = filters.condition
    if (Array.isArray(filters.size) && filters.size.length > 0) {
      params.size = filters.size.join(',')
    }
    if (priceSort === 'asc') params.sort = 'price_asc'
    else if (priceSort === 'desc') params.sort = 'price_desc'

    const legacyOptions = {
      page,
      pageSize,
      sessionId,
      filters,
      priceSort,
      includeFacets,
    }

    if (this._readCatalogApiMode() === 'legacy') {
      return this._getCatalogProductsLegacyPage(legacyOptions)
    }

    try {
      const response = await apiClient.get('/products/catalog', { params })
      this._setCatalogApiMode('paged')
      this._catalogFallbackCache = null
      this._catalogFallbackSessionKey = null
      return this._parseCatalogApiResponse(response.data || {}, page, pageSize)
    } catch (error) {
      const status = error.response?.status
      if (status === 400 || status === 404 || status === 405) {
        this._setCatalogApiMode('legacy')
        return this._getCatalogProductsLegacyPage(legacyOptions)
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
        nuance: d.nuance ?? d.Nuance ?? null,
        discountPercent: d.discountPercent ?? d.DiscountPercent ?? null,
        finalPrice: d.finalPrice ?? d.FinalPrice ?? null,
        createdAt: d.createdAt || d.CreatedAt,
        updatedAt: d.updatedAt || d.UpdatedAt,
        publishedAt: d.publishedAt || d.PublishedAt || null,
        cartAvailableAt: d.cartAvailableAt ?? d.CartAvailableAt ?? null,
        cartUnlocked: d.cartUnlocked !== undefined ? d.cartUnlocked : (d.CartUnlocked !== undefined ? d.CartUnlocked : true)
        ,boxNumber: d.boxNumber ?? d.BoxNumber ?? null
        ,owner: d.owner ?? d.Owner ?? null
        ,incomingShipmentId: d.incomingShipmentId ?? d.IncomingShipmentId ?? null
        ,incomingShipmentName: d.incomingShipmentName ?? d.IncomingShipmentName ?? null
        ,isKit: !!(d.isKit ?? d.IsKit ?? d.kitId ?? d.KitId)
        ,kitId: d.kitId ?? d.KitId ?? null
        ,kitPrice: d.kitPrice ?? d.KitPrice ?? null
        ,kitParts: d.kitParts ?? d.KitParts ?? null
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
        nuance: formData.get('nuance') || null,
        discountPercent: formData.get('discountPercent') ? parseInt(formData.get('discountPercent'), 10) : null,
        publishedAt: formData.get('publishedAt') || null,
        cartAvailableAt: formData.get('cartAvailableAt') || null,
        boxNumber: formData.get('boxNumber') || null,
        owner: formData.get('owner') || null,
        incomingShipmentId: formData.get('incomingShipmentId') === '' ? null : parseInt(formData.get('incomingShipmentId') || 0),
        isKit: formData.get('isKit') === 'true',
        kitParts: formData.get('kitParts') ? JSON.parse(formData.get('kitParts')) : null,
        isTestProduct: formData.get('isTestProduct') === 'true',
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
        owner: response.data.owner ?? response.data.Owner ?? null,
        incomingShipmentId: response.data.incomingShipmentId ?? response.data.IncomingShipmentId ?? null,
        incomingShipmentName: response.data.incomingShipmentName ?? response.data.IncomingShipmentName ?? null,
        createdAt: response.data.createdAt || response.data.CreatedAt,
        updatedAt: response.data.updatedAt || response.data.UpdatedAt,
        isKit: !!(response.data.isKit ?? response.data.IsKit),
        kitId: response.data.kitId ?? response.data.KitId ?? null,
        kitPrice: response.data.kitPrice ?? response.data.KitPrice ?? null,
        kitParts: response.data.kitParts ?? response.data.KitParts ?? null,
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
        nuance: formData.get('nuance') || null,
        discountPercent: formData.get('discountPercent') ? parseInt(formData.get('discountPercent'), 10) : null,
        publishedAt: formData.get('publishedAt') || null,
        cartAvailableAt: formData.get('cartAvailableAt') || null,
        boxNumber: formData.get('boxNumber') || null,
        owner: formData.get('owner') || null,
        incomingShipmentId: formData.get('incomingShipmentId') === '' ? null : parseInt(formData.get('incomingShipmentId') || 0),
        isKit: formData.get('isKit') === 'true',
        kitParts: formData.get('kitParts') ? JSON.parse(formData.get('kitParts')) : null,
        isTestProduct: formData.get('isTestProduct') === 'true',
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
        owner: response.data.owner ?? response.data.Owner ?? null,
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

  getLoggedInUserId() {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      const id = u.userId ?? u.UserId ?? u.id ?? u.Id
      if (id == null || id === '') return null
      const n = Number(id)
      return Number.isFinite(n) ? n : null
    } catch {
      return null
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
      email: d.email ?? d.Email ?? null,
      phone: d.phone ?? d.Phone ?? null
    }
    if (!normalized.token) return normalized
    localStorage.setItem('authToken', normalized.token)
    localStorage.setItem('user', JSON.stringify({
      username: normalized.username,
      fullName: normalized.fullName,
      userId: normalized.userId,
      isAdmin: normalized.isAdmin,
      email: normalized.email,
      phone: normalized.phone
    }))
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('bebochka-auth'))
    return normalized
  },

  _normalizeReferralInfo(data) {
    const d = data || {}
    const referredByRaw = d.referredBy ?? d.ReferredBy ?? null
    const referredBy = referredByRaw
      ? {
          referralId:
            referredByRaw.referralId
            ?? referredByRaw.ReferralId
            ?? referredByRaw.id
            ?? referredByRaw.Id
            ?? null,
          code: referredByRaw.code ?? referredByRaw.Code ?? '',
          referrerName: referredByRaw.referrerName ?? referredByRaw.ReferrerName ?? null,
          status: referredByRaw.status ?? referredByRaw.Status ?? '',
          appliedAt: referredByRaw.appliedAt ?? referredByRaw.AppliedAt ?? null,
          discountUsed: !!(referredByRaw.discountUsed ?? referredByRaw.DiscountUsed),
        }
      : null
    const invited = Array.isArray(d.invited ?? d.Invited)
      ? (d.invited ?? d.Invited).map((row) => ({
          id: row.id ?? row.Id,
          referredName: row.referredName ?? row.ReferredName ?? null,
          status: row.status ?? row.Status ?? '',
          createdAt: row.createdAt ?? row.CreatedAt,
          registeredAt: row.registeredAt ?? row.RegisteredAt ?? null,
          referrerRewardAmount: row.referrerRewardAmount ?? row.ReferrerRewardAmount ?? null,
          referrerDiscountUsed: !!(row.referrerDiscountUsed ?? row.ReferrerDiscountUsed),
        }))
      : []

    return {
      myCode: d.myCode ?? d.MyCode ?? null,
      canGenerateCode: !!(d.canGenerateCode ?? d.CanGenerateCode),
      referredDiscountAvailable: (() => {
        const v = d.referredDiscountAvailable ?? d.ReferredDiscountAvailable
        return v === undefined || v === null ? null : !!v
      })(),
      hasPriorOrders: !!(d.hasPriorOrders ?? d.HasPriorOrders),
      canApplyReferrerCode: !!(d.canApplyReferrerCode ?? d.CanApplyReferrerCode),
      invitedCount: d.invitedCount ?? d.InvitedCount ?? invited.length,
      invited,
      referredBy,
      cartDiscountOptions: this._normalizeCartReferralDiscounts(
        d.cartDiscountOptions ?? d.CartDiscountOptions ?? []
      ),
      rules: d.rules ?? d.Rules ?? '',
    }
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

  async getMyProfile() {
    const response = await apiClient.get('/profile/me')
    const d = response.data || {}
    const dobRaw = d.dateOfBirth ?? d.DateOfBirth ?? null
    const normalized = {
      ...d,
      dateOfBirth: dobRaw,
      DateOfBirth: dobRaw,
      autoFilterByChildren: d.autoFilterByChildren ?? d.AutoFilterByChildren,
    }
    const af = normalized.autoFilterByChildren
    if (af !== undefined && af !== null) {
      try {
        const cached = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({
          ...cached,
          autoFilterByChildren: !!af,
          dateOfBirth: dobRaw,
          DateOfBirth: dobRaw,
        }))
        localStorage.setItem('bebochka-auto-filter-by-children', af ? '1' : '0')
      } catch (_) {}
    }
    return normalized
  },

  async updateMyProfile(payload) {
    const autoFilter =
      payload.autoFilterByChildren ?? payload.AutoFilterByChildren
    const dateOfBirth = payload.dateOfBirth ?? payload.DateOfBirth ?? null
    const response = await apiClient.put('/profile/me', {
      FullName: payload.fullName ?? payload.FullName ?? null,
      Email: payload.email ?? payload.Email ?? null,
      Phone: payload.phone ?? payload.Phone ?? null,
      AutoFilterByChildren: autoFilter,
      DateOfBirth: dateOfBirth,
      dateOfBirth,
    })
    const d = response.data || {}
    const savedAutoFilter = d.autoFilterByChildren ?? d.AutoFilterByChildren ?? autoFilter
    const savedDob = d.dateOfBirth ?? d.DateOfBirth ?? dateOfBirth
    try {
      const cached = JSON.parse(localStorage.getItem('user') || '{}')
      const next = {
        ...cached,
        fullName: d.fullName ?? d.FullName ?? cached.fullName,
        email: d.email ?? d.Email ?? cached.email,
        phone: d.phone ?? d.Phone ?? cached.phone,
        autoFilterByChildren: savedAutoFilter,
        dateOfBirth: savedDob,
        DateOfBirth: savedDob,
      }
      localStorage.setItem('user', JSON.stringify(next))
      if (savedAutoFilter !== undefined && savedAutoFilter !== null) {
        localStorage.setItem('bebochka-auto-filter-by-children', savedAutoFilter ? '1' : '0')
      }
      window.dispatchEvent(new Event('bebochka-auth'))
    } catch (_) {}
    return {
      ...d,
      dateOfBirth: savedDob,
      DateOfBirth: savedDob,
    }
  },

  async getMyChildren() {
    const response = await apiClient.get('/profile/children')
    return Array.isArray(response.data) ? response.data : []
  },

  async createMyChild(payload) {
    try {
      const response = await apiClient.post('/profile/children', {
        name: payload.name,
        dateOfBirth: payload.dateOfBirth,
        clothingSize: payload.clothingSize,
        gender: payload.gender,
      })
      return response.data
    } catch (error) {
      throw new Error(extractApiError(error, 'Не удалось сохранить'))
    }
  },

  async updateMyChild(id, payload) {
    try {
      const response = await apiClient.put(`/profile/children/${id}`, {
        name: payload.name,
        dateOfBirth: payload.dateOfBirth,
        clothingSize: payload.clothingSize,
        gender: payload.gender,
      })
      return response.data
    } catch (error) {
      throw new Error(extractApiError(error, 'Не удалось сохранить'))
    }
  },

  async deleteMyChild(id) {
    await apiClient.delete(`/profile/children/${id}`)
  },

  async getMyFavoriteProductIds() {
    if (!localStorage.getItem('authToken')) return readFavoriteProductIds()
    try {
      const response = await apiClient.get('/profile/favorites')
      const rows = Array.isArray(response.data) ? response.data : []
      return rows
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0)
    } catch (error) {
      if (isFavoritesApiUnavailable(error)) return readFavoriteProductIds()
      return []
    }
  },

  async addProductToFavorites(productId) {
    if (!localStorage.getItem('authToken')) {
      throw new Error('Войдите в аккаунт, чтобы сохранять избранное')
    }
    try {
      await apiClient.post(`/profile/favorites/${productId}`)
    } catch (error) {
      if (isFavoritesApiUnavailable(error)) {
        toggleFavoriteProductId(productId)
        return
      }
      throw new Error(extractApiError(error, 'Не удалось добавить в избранное'))
    }
  },

  async removeProductFromFavorites(productId) {
    if (!localStorage.getItem('authToken')) {
      throw new Error('Войдите в аккаунт, чтобы менять избранное')
    }
    try {
      await apiClient.delete(`/profile/favorites/${productId}`)
    } catch (error) {
      if (isFavoritesApiUnavailable(error)) {
        toggleFavoriteProductId(productId)
        return
      }
      throw new Error(extractApiError(error, 'Не удалось убрать из избранного'))
    }
  },

  _normalizeCartReferralDiscounts(data) {
    const list = Array.isArray(data) ? data : []
    return list.map((row) => ({
      referralId: row.referralId ?? row.ReferralId,
      kind: row.kind ?? row.Kind ?? '',
      label: row.label ?? row.Label ?? '',
      forUserName: row.forUserName ?? row.ForUserName ?? null,
      discountPercent: row.discountPercent ?? row.DiscountPercent ?? 10,
    }))
  },

  async getCartReferralDiscounts() {
    if (!localStorage.getItem('authToken')) {
      return []
    }
    const paths = ['/profile/referral/cart-discounts', '/referral/cart-discounts']
    for (const path of paths) {
      try {
        const response = await apiClient.get(path)
        return this._normalizeCartReferralDiscounts(response.data)
      } catch (error) {
        const status = error.response?.status
        if (status === 404 || status === 405) continue
        const msg = extractApiError(error, 'Не удалось загрузить реферальные скидки')
        throw new Error(msg)
      }
    }
    try {
      const profile = await this.getMyReferralInfo()
      if (profile?.cartDiscountOptions?.length) {
        return profile.cartDiscountOptions
      }
    } catch (_) {
      /* профиль недоступен */
    }
    return []
  },

  async getMyReferralInfo() {
    try {
      const response = await apiClient.get('/profile/referral')
      return this._normalizeReferralInfo(response.data)
    } catch (error) {
      throw new Error(extractApiError(error, 'Не удалось загрузить реферальную программу'))
    }
  },

  async generateMyReferralCode() {
    try {
      const response = await apiClient.post('/profile/referral/code')
      const code = response.data?.code ?? response.data?.Code ?? null
      return { code }
    } catch (error) {
      throw new Error(extractApiError(error, 'Не удалось создать код'))
    }
  },

  async applyReferrerCode(code) {
    try {
      const response = await apiClient.post('/profile/referral/apply', { code })
      return response.data
    } catch (error) {
      throw new Error(extractApiError(error, 'Не удалось применить код'))
    }
  },

  async getAdminReferrals(search = '', status = '') {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    const qs = params.toString()
    const response = await apiClient.get(`/admin/referrals${qs ? `?${qs}` : ''}`)
    return Array.isArray(response.data) ? response.data : []
  },

  async changeMyPassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put('/profile/me/password', {
        currentPassword,
        newPassword,
      })
      return response.data
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Не удалось сменить пароль'
      throw new Error(msg)
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
            phone: user.phone || user.Phone || null,
            fullName: user.fullName || user.FullName || null,
            vkUserId: user.vkUserId ?? user.VkUserId ?? user.vkId ?? user.VkId ?? null,
            vkProfileUrl: user.vkProfileUrl ?? user.VkProfileUrl ?? null,
            createdAt: user.createdAt || user.CreatedAt || null,
            lastLoginAt: user.lastLoginAt || user.LastLoginAt || null,
            isAdmin: !!(user.isAdmin ?? user.IsAdmin),
            childrenCount: user.childrenCount ?? user.ChildrenCount ?? 0,
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
   * Пользователь по id (админка).
   * @param {number} userId
   */
  async getUserChildren(userId) {
    try {
      const response = await apiClient.get(`/users/${userId}/children`)
      return normalizeUserChildren(response.data)
    } catch (error) {
      if (error?.response?.status !== 404) throw error
      const user = await api.getUserById(userId)
      return user?.children ?? []
    }
  },

  async getUserById(userId) {
    const response = await apiClient.get(`/users/${userId}`)
    const u = response.data
    if (!u) return null
    const children = normalizeUserChildren(u.children ?? u.Children ?? [])
    return {
      id: u.id ?? u.Id,
      username: u.username ?? u.Username ?? '',
      email: u.email ?? u.Email ?? null,
      phone: u.phone ?? u.Phone ?? null,
      fullName: u.fullName ?? u.FullName ?? null,
      isAdmin: !!(u.isAdmin ?? u.IsAdmin),
      isActive: u.isActive ?? u.IsActive,
      vkUserId: u.vkUserId ?? u.VkUserId ?? u.vkId ?? u.VkId ?? null,
      vkProfileUrl: u.vkProfileUrl ?? u.VkProfileUrl ?? null,
      createdAt: u.createdAt ?? u.CreatedAt ?? null,
      lastLoginAt: u.lastLoginAt ?? u.LastLoginAt ?? null,
      autoFilterByChildren: u.autoFilterByChildren ?? u.AutoFilterByChildren,
      dateOfBirth: u.dateOfBirth ?? u.DateOfBirth ?? null,
      childrenCount: u.childrenCount ?? u.ChildrenCount ?? children.length,
      children,
    }
  },

  /**
   * Заказы пользователя (только админ).
   * @param {number} userId
   */
  async getOrdersByUserForAdmin(userId) {
    const response = await apiClient.get(`/orders/by-user/${userId}`)
    return Array.isArray(response.data) ? response.data : []
  },

  /**
   * Удалить отзыв (админ).
   * @param {number} reviewId
   */
  async deleteOrderReview(reviewId) {
    await apiClient.delete(`/orders/reviews/${reviewId}`)
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
        createdAt: item.CreatedAt || item.createdAt,
        kitId: item.KitId ?? item.kitId ?? null,
        cartAddMode: item.CartAddMode ?? item.cartAddMode ?? null,
        kitBundleKey: item.KitBundleKey ?? item.kitBundleKey ?? null,
        kitPartName: item.KitPartName ?? item.kitPartName ?? null,
        isKitDisplayLine: item.IsKitDisplayLine ?? item.isKitDisplayLine ?? false,
        kitDisplayProductId: item.KitDisplayProductId ?? item.kitDisplayProductId ?? null,
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
  async getProductKitOptions(productId, sessionId) {
    const params = sessionId ? { sessionId } : {}
    const response = await apiClient.get(`/products/${productId}/kit-options`, { params })
    const d = response.data ?? {}
    const parts = d.parts ?? d.Parts ?? []
    return {
      ...d,
      kitId: d.kitId ?? d.KitId,
      kitPrice: d.kitPrice ?? d.KitPrice,
      partCount: d.partCount ?? d.PartCount ?? parts.length,
      hasKitReservation: d.hasKitReservation ?? d.HasKitReservation ?? false,
      canAddFullKit: d.canAddFullKit ?? d.CanAddFullKit ?? false,
      parts: parts.map((part) => ({
        productId: part.productId ?? part.ProductId,
        partName: part.partName ?? part.PartName ?? '',
        price: part.price ?? part.Price,
        sortOrder: part.sortOrder ?? part.SortOrder ?? 0,
        isReservedByOthers: part.isReservedByOthers ?? part.IsReservedByOthers ?? false,
        inMyCart: part.inMyCart ?? part.InMyCart ?? false,
        quantityInMyCart: part.quantityInMyCart ?? part.QuantityInMyCart ?? 0,
      })),
    }
  },

  async addToCart(sessionId, productId, quantity = 1, addMode = null) {
    try {
      if (!sessionId) {
        throw new Error('SessionId is required')
      }
      if (!productId) {
        throw new Error('ProductId is required')
      }
      
      console.log('[API] Adding to cart:', { sessionId, productId, quantity, addMode })
      const payload = {
        sessionId: String(sessionId),
        productId: Number(productId),
        quantity: Number(quantity)
      }
      if (addMode) payload.addMode = addMode
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
    const rows = Array.isArray(response.data) ? response.data : []
    return rows.map((item) => ({
      ...item,
      id: item.id ?? item.Id,
      userId: item.userId ?? item.UserId,
      sessionId: item.sessionId ?? item.SessionId,
      productName: item.productName ?? item.ProductName,
      productBrand: item.productBrand ?? item.ProductBrand,
      productImages: item.productImages ?? item.ProductImages ?? [],
      updatedAt: item.updatedAt ?? item.UpdatedAt,
      customerName: item.customerName ?? item.CustomerName ?? null,
      vkUserId: item.vkUserId ?? item.VkUserId ?? null,
      vkProfileUrl: item.vkProfileUrl ?? item.VkProfileUrl ?? null
    }))
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
      const response = await apiClient.post('/brands', {
        Name: brand.name ?? brand.Name,
      })
      return response.data
    } catch (error) {
      throw new Error(extractApiError(error, 'Не удалось добавить бренд'))
    }
  },

  async updateBrand(id, brand) {
    try {
      const response = await apiClient.put(`/brands/${id}`, {
        Name: brand.name ?? brand.Name,
      })
      return response.data
    } catch (error) {
      throw new Error(extractApiError(error, 'Не удалось сохранить бренд'))
    }
  },

  async deleteBrand(id) {
    try {
      await apiClient.delete(`/brands/${id}`)
    } catch (error) {
      throw new Error(extractApiError(error, 'Не удалось удалить бренд'))
    }
  },

  _normalizeLookupList(data) {
    const list = Array.isArray(data) ? data : []
    return list.map((row) => ({
      id: row.id ?? row.Id,
      name: row.name ?? row.Name ?? '',
      productCount: row.productCount ?? row.ProductCount ?? 0,
    }))
  },

  async getProductColors(search = null) {
    const params = search ? { search } : {}
    const response = await apiClient.get('/product-colors', { params })
    return this._normalizeLookupList(response.data)
  },

  async createProductColor(name) {
    const response = await apiClient.post('/product-colors', { name })
    return this._normalizeLookupList([response.data])[0]
  },

  async updateProductColor(id, name) {
    const response = await apiClient.put(`/product-colors/${id}`, { name })
    return this._normalizeLookupList([response.data])[0]
  },

  async deleteProductColor(id) {
    await apiClient.delete(`/product-colors/${id}`)
  },

  async getProductConditions(search = null) {
    const params = search ? { search } : {}
    const response = await apiClient.get('/product-conditions', { params })
    return this._normalizeLookupList(response.data)
  },

  async createProductCondition(name) {
    const response = await apiClient.post('/product-conditions', { name })
    return this._normalizeLookupList([response.data])[0]
  },

  async updateProductCondition(id, name) {
    const response = await apiClient.put(`/product-conditions/${id}`, { name })
    return this._normalizeLookupList([response.data])[0]
  },

  async deleteProductCondition(id) {
    await apiClient.delete(`/product-conditions/${id}`)
  },

  async getProductNuances(search = null) {
    const params = search ? { search } : {}
    const response = await apiClient.get('/product-nuances', { params })
    return this._normalizeLookupList(response.data)
  },

  async createProductNuance(name) {
    const response = await apiClient.post('/product-nuances', { name })
    return this._normalizeLookupList([response.data])[0]
  },

  async applyBulkProductDiscount(productIds, discountPercent) {
    const response = await apiClient.post('/products/admin/bulk-discount', {
      productIds,
      discountPercent: discountPercent ?? null,
    })
    return response.data
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
      let isAdmin = false
      try {
        const userRaw = localStorage.getItem('user')
        isAdmin = userRaw ? !!JSON.parse(userRaw).isAdmin : false
      } catch {
        isAdmin = false
      }
      const response = await apiClient.get(isAdmin ? '/orders/reviews' : '/orders/reviews/public')
      const rows = Array.isArray(response.data) ? response.data : []
      return rows.map((row) => ({
        id: row.id ?? row.Id,
        orderId: row.orderId ?? row.OrderId,
        orderId: row.orderId ?? row.OrderId ?? null,
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
    const body = await this._buildOrderReviewBody(payload)
    const response = await apiClient.post('/orders/reviews/admin', body)
    return response.data
  },

  async updateOrderReviewAsAdmin(reviewId, payload) {
    const body = await this._buildOrderReviewBody(payload)
    const response = await apiClient.put(`/orders/reviews/${reviewId}`, body)
    return response.data
  },

  async _buildOrderReviewBody(payload) {
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

    const keepImageUrls = Array.isArray(payload?.keepImageUrls)
      ? payload.keepImageUrls.filter(Boolean)
      : null

    return {
      orderNumber: payload.orderNumber ? String(payload.orderNumber).trim() : null,
      customerName: payload.customerName ? String(payload.customerName).trim() : null,
      customerPhone: payload.customerPhone ? String(payload.customerPhone).trim() : null,
      rating: Number(payload.rating) || 0,
      comment: payload.comment ? String(payload.comment).trim() : '',
      imagesBase64,
      keepImageUrls,
      createdDate: payload.createdDate ?? payload.CreatedDate ?? null,
      createdAtUtc: payload.createdAtUtc ?? payload.CreatedAtUtc ?? null
    }
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
  async updateOrderStatus(id, status, confirmSplit = false) {
    try {
      const response = await apiClient.put(`/orders/${id}/status`, { status, confirmSplit })
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
   * Removes an item from an order (admin only). Restores stock, may assign product to next in web queue.
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
      actualMargin: r.actualMargin ?? r.ActualMargin ?? null,
      notes: r.notes ?? r.Notes ?? null,
      createdAt: r.createdAt ?? r.CreatedAt ?? null,
      updatedAt: r.updatedAt ?? r.UpdatedAt ?? null
    }))
  },

  async getMiscExpenses() {
    const response = await apiClient.get('/misc-expenses')
    const rows = Array.isArray(response.data) ? response.data : []
    return rows.map((r) => ({
      id: r.id ?? r.Id,
      name: r.name ?? r.Name ?? '',
      amount: r.amount ?? r.Amount ?? 0,
      incomingShipmentId: r.incomingShipmentId ?? r.IncomingShipmentId ?? null,
      createdAt: r.createdAt ?? r.CreatedAt ?? null
    }))
  },

  async createMiscExpense(payload) {
    const response = await apiClient.post('/misc-expenses', payload)
    return response.data
  },

  async updateMiscExpense(id, payload) {
    const response = await apiClient.put(`/misc-expenses/${id}`, payload)
    return response.data
  },

  async deleteMiscExpense(id) {
    await apiClient.delete(`/misc-expenses/${id}`)
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
