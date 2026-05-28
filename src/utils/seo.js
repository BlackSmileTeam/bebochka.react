import { useEffect } from 'react'

const SEO_TAG_ID = 'dynamic-seo-jsonld'

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

export function usePageSeo({ title, description, keywords, canonical, jsonLd }) {
  useEffect(() => {
    if (title) document.title = title
    ensureMeta('description', description)
    ensureMeta('keywords', keywords)
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
  }, [title, description, keywords, canonical, jsonLd])
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
