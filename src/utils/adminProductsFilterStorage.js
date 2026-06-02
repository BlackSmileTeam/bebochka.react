const STORAGE_KEY = 'bebochka-admin-products-filters'

const STOCK_STATES = ['all', 'availableRegular', 'reserved', 'purchased']
const PUBLISHED_STATUSES = ['all', 'published', 'scheduled']
const SORT_BY_BOX = ['none', 'asc', 'desc']

export const DEFAULT_ADMIN_PRODUCT_FILTERS = {
  name: '',
  brand: '',
  size: '',
  color: '',
  gender: '',
  condition: '',
  priceMin: '',
  priceMax: '',
  publishedStatus: 'all',
  stockState: 'availableRegular',
  sortByBox: 'none',
}

function normalizeFilters(raw) {
  const base = { ...DEFAULT_ADMIN_PRODUCT_FILTERS, ...(raw && typeof raw === 'object' ? raw : {}) }
  if (!STOCK_STATES.includes(base.stockState)) {
    base.stockState = 'all'
  }
  if (!PUBLISHED_STATUSES.includes(base.publishedStatus)) {
    base.publishedStatus = 'all'
  }
  if (!SORT_BY_BOX.includes(base.sortByBox)) {
    base.sortByBox = 'none'
  }
  return base
}

export function readAdminProductsFilters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_ADMIN_PRODUCT_FILTERS }
    return normalizeFilters(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_ADMIN_PRODUCT_FILTERS }
  }
}

export function saveAdminProductsFilters(filters) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeFilters(filters)))
  } catch {
    /* ignore */
  }
}

export function clearAdminProductsFiltersStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
