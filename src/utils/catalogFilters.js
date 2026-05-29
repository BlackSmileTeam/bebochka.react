/** Read catalog filter values from URL search params (/?brand=...&size=...) */
export function catalogFiltersFromSearchParams(searchParams) {
  return {
    brand: searchParams.get('brand') || '',
    size: searchParams.get('size') || '',
    color: searchParams.get('color') || '',
    gender: searchParams.get('gender') || '',
    condition: searchParams.get('condition') || '',
  }
}

export function buildCatalogFilterSearch(filters) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `/?${qs}` : '/'
}
