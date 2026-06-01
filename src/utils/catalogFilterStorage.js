import { countActiveCatalogFilters } from './catalogFilters'

const STORAGE_KEY = 'bebochka-catalog-state'

export const DEFAULT_CATALOG_FILTERS = {
  brand: '',
  size: [],
  color: '',
  gender: '',
  condition: '',
}

export function readCatalogStateFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const filters = parsed?.filters
    const priceSort = parsed?.priceSort
    return {
      filters: filters
        ? {
            brand: filters.brand || '',
            size: Array.isArray(filters.size) ? filters.size : [],
            color: filters.color || '',
            gender: filters.gender || '',
            condition: filters.condition || '',
          }
        : null,
      priceSort: priceSort === 'asc' || priceSort === 'desc' ? priceSort : '',
    }
  } catch {
    return null
  }
}

export function saveCatalogStateToSession({ filters, priceSort }) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        filters: filters ?? DEFAULT_CATALOG_FILTERS,
        priceSort: priceSort === 'asc' || priceSort === 'desc' ? priceSort : '',
      })
    )
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasStoredCatalogFilters() {
  const stored = readCatalogStateFromSession()
  return stored?.filters ? countActiveCatalogFilters(stored.filters) > 0 : false
}
