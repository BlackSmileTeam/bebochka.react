import { useEffect } from 'react'

const SEO_TAG_ID = 'dynamic-seo-jsonld'
const DEFAULT_ROBOTS = 'index, follow'

/** Пути, которые не должны попадать в поиск. */
export const NOINDEX_PATH_PREFIXES = [
  '/admin',
  '/cart',
  '/checkout',
  '/profile',
  '/account',
  '/login',
]

export function isNoindexPath(pathname) {
  const path = String(pathname || '')
  return NOINDEX_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )
}

function ensureMeta(name, content) {
  if (!content) return
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function ensureCanonical(url) {
  if (!url) return
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

export function usePageSeo({
  title,
  description,
  keywords,
  canonical,
  robots = DEFAULT_ROBOTS,
  jsonLd,
}) {
  useEffect(() => {
    if (title) document.title = title
    ensureMeta('description', description)
    ensureMeta('keywords', keywords)
    ensureMeta('robots', robots)
    ensureCanonical(canonical)

    const old = document.getElementById(SEO_TAG_ID)
    if (old) old.remove()
    if (jsonLd) {
      const script = document.createElement('script')
      script.id = SEO_TAG_ID
      script.type = 'application/ld+json'
      script.text = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => {
      const current = document.getElementById(SEO_TAG_ID)
      if (current) current.remove()
    }
  }, [title, description, keywords, canonical, robots, jsonLd])
}

/** noindex для служебных маршрутов (корзина, профиль, админка). */
export function usePrivateRouteSeo(pathname) {
  useEffect(() => {
    if (!isNoindexPath(pathname)) return
    ensureMeta('robots', 'noindex, nofollow')
  }, [pathname])
}

export function getProductStockCount(product) {
  if (!product) return 0
  const available = product.availableQuantity ?? product.AvailableQuantity
  if (available != null) return Number(available) || 0
  const stock = product.quantityInStock ?? product.QuantityInStock
  return Number(stock) || 0
}

export function slugifyProductName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildProductPath(product) {
  const id = product?.id ?? product?.Id
  const slug = slugifyProductName(product?.name ?? product?.Name)
  return `/product/${id}${slug ? `-${slug}` : ''}`
}
