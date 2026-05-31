/** Read catalog filter values from URL search params (/?brand=...&size=86,92) */

export function catalogFiltersFromSearchParams(searchParams) {

  const sizeRaw = searchParams.get('size') || ''

  const sizes = sizeRaw

    ? sizeRaw.split(',').map((s) => s.trim()).filter(Boolean)

    : []



  return {

    brand: searchParams.get('brand') || '',

    size: sizes,

    color: searchParams.get('color') || '',

    gender: searchParams.get('gender') || '',

    condition: searchParams.get('condition') || '',

  }

}



export function buildCatalogFilterSearch(filters) {

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {

    if (key === 'size' && Array.isArray(value) && value.length > 0) {

      params.set('size', value.join(','))

    } else if (value) {

      params.set(key, value)

    }

  }

  const qs = params.toString()

  return qs ? `/?${qs}` : '/'

}



export function countActiveCatalogFilters(filters) {

  return Object.entries(filters).reduce((n, [key, value]) => {

    if (key === 'size') return n + (Array.isArray(value) && value.length > 0 ? 1 : 0)

    return n + (value ? 1 : 0)

  }, 0)

}



export function toggleSizeFilter(currentSizes, sizeValue) {

  const raw = sizeValue != null ? String(sizeValue).trim() : ''

  if (!raw) return currentSizes

  const set = new Set(Array.isArray(currentSizes) ? currentSizes : [])

  if (set.has(raw)) set.delete(raw)

  else set.add(raw)

  return [...set].sort((a, b) => String(a).localeCompare(String(b), 'ru', { numeric: true }))

}

export function parseChildSizes(raw) {
  if (!raw) return []
  return String(raw)
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function normalizeGender(value) {
  return String(value || '').trim().toLowerCase()
}

/** Whether auto-filter is on — profile API, user cache, or dedicated localStorage key. */
export function readAutoFilterEnabled(profile) {
  const fromProfile = profile?.autoFilterByChildren ?? profile?.AutoFilterByChildren
  if (fromProfile !== undefined && fromProfile !== null) return !!fromProfile

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const fromUser = user.autoFilterByChildren ?? user.AutoFilterByChildren
    if (fromUser !== undefined && fromUser !== null) return !!fromUser
  } catch (_) {}

  const stored = localStorage.getItem('bebochka-auto-filter-by-children')
  if (stored === '1') return true
  if (stored === '0') return false
  return false
}

export function productMatchesSizeFilter(productSize, filterSizes) {
  if (!Array.isArray(filterSizes) || filterSizes.length === 0) return true
  const productSizes = parseChildSizes(productSize)
  if (productSizes.length === 0) {
    const raw = String(productSize || '').trim()
    return raw ? filterSizes.includes(raw) : false
  }
  return productSizes.some((s) => filterSizes.includes(s))
}

export function productMatchesCatalogFilters(product, filters) {
  if (filters.brand && product.brand !== filters.brand) return false
  if (!productMatchesSizeFilter(product.size ?? product.Size, filters.size)) return false
  if (filters.color && product.color !== filters.color) return false
  if (
    filters.gender
    && normalizeGender(product.gender ?? product.Gender) !== normalizeGender(filters.gender)
  ) {
    return false
  }
  if (filters.condition && product.condition !== filters.condition) return false
  return true
}

/** Pre-fill catalog filters from saved children when auto-filter is enabled. */
export function buildFiltersFromChildren(children, enabled) {
  if (!enabled || !Array.isArray(children) || children.length === 0) return null

  const sizes = [
    ...new Set(children.flatMap((c) => parseChildSizes(c.clothingSize ?? c.ClothingSize))),
  ].sort((a, b) => String(a).localeCompare(String(b), 'ru', { numeric: true }))

  const genders = [
    ...new Set(
      children
        .map((c) => normalizeGender(c.gender ?? c.Gender))
        .filter(Boolean)
    ),
  ]

  const filters = {
    brand: '',
    size: sizes,
    color: '',
    gender: '',
    condition: '',
  }

  if (genders.length === 1) filters.gender = genders[0]

  return filters
}


