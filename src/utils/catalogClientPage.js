import { productMatchesCatalogFilters } from './catalogFilters'
import { getProductPriceInfo } from './productPrice'

const CONDITION_PRIORITY = {
  'состояние новой вещи': 0,
  'новая вещь': 0,
  'новая': 0,
  'очень хорошее': 1,
  'отличное': 2,
  'хорошее': 3,
  'нюанс': 4,
  'недостаток': 4,
}

function sortProducts(list, priceSort) {
  if (priceSort !== 'asc' && priceSort !== 'desc') return list
  const dir = priceSort === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    const pa = getProductPriceInfo(a).finalPrice
    const pb = getProductPriceInfo(b).finalPrice
    if (pa !== pb) return (pa - pb) * dir
    return String(a.name || '').localeCompare(String(b.name || ''), 'ru')
  })
}

function buildFacets(visible) {
  const collect = (key) =>
    [...new Set(visible.map((p) => p[key]).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), 'ru')
    )

  const conditions = [...new Set(visible.map((p) => p.condition).filter(Boolean))].sort((a, b) => {
    const av = String(a).trim().toLowerCase()
    const bv = String(b).trim().toLowerCase()
    const ap = CONDITION_PRIORITY[av] ?? 999
    const bp = CONDITION_PRIORITY[bv] ?? 999
    if (ap !== bp) return ap - bp
    return String(a).localeCompare(String(b), 'ru')
  })

  return {
    brands: collect('brand'),
    sizes: collect('size'),
    colors: collect('color'),
    genders: collect('gender'),
    conditions,
  }
}

/**
 * Client-side catalog page when /api/products/catalog is unavailable (legacy API).
 */
export function buildCatalogPageFromProducts(allProducts, {
  page = 1,
  pageSize = 24,
  filters = {},
  priceSort = '',
  includeFacets = false,
} = {}) {
  const visible = (allProducts || []).filter((p) => {
    const stock = p.quantityInStock ?? p.QuantityInStock ?? 0
    return stock > 0
  })

  const filtered = sortProducts(
    visible.filter((p) => productMatchesCatalogFilters(p, filters)),
    priceSort
  )

  const total = filtered.length
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return {
    items,
    total,
    page: safePage,
    pageSize,
    hasMore: safePage * pageSize < total,
    facets: includeFacets ? buildFacets(visible) : null,
  }
}
