import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorPageLayout from '../components/ErrorPageLayout'
import PageShell from '../components/PageShell'
import ProductDetail from '../components/ProductDetail'
import RouteFallback from '../components/RouteFallback'
import { api } from '../services/api'
import { formatCondition } from '../utils/formatCondition'
import { toAbsoluteMediaUrl } from '../utils/mediaUrl'
import { getSessionId } from '../utils/sessionId'
import { usePageSeo, getProductStockCount } from '../utils/seo'
import { getPublicSiteUrl } from '../constants/siteUrl'
import { buildCatalogFilterSearch } from '../utils/catalogFilters'
import { DEFAULT_CATALOG_FILTERS } from '../utils/catalogFilterStorage'
import './ProductPage.css'

function extractProductId(raw) {
  const m = String(raw || '').match(/^(\d+)/)
  return m ? Number(m[1]) : null
}

function getAvailableQuantity(product) {
  const stock = product.quantityInStock ?? product.QuantityInStock ?? 0
  if (product.availableQuantity !== undefined) return product.availableQuantity
  if (product.AvailableQuantity !== undefined) return product.AvailableQuantity
  return stock
}

function catalogHomePath() {
  return localStorage.getItem('authToken') ? '/' : '/welcome'
}

export default function ProductPage() {
  const navigate = useNavigate()
  const { productIdSlug } = useParams()
  const productId = extractProductId(productIdSlug)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!productId) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setLoading(true)
      setNotFound(false)
      try {
        const p = await api.getProduct(productId, getSessionId())
        if (!active) return
        setProduct(p)
      } catch (err) {
        if (!active) return
        setProduct(null)
        const status = err?.response?.status
        setNotFound(status === 404 || status === 410)
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [productId])

  const inStock = product ? getProductStockCount(product) > 0 : false
  const isIndexable = Boolean(!loading && product && inStock && !notFound)

  const canonical = useMemo(
    () => `${getPublicSiteUrl()}/product/${productIdSlug || ''}`,
    [productIdSlug]
  )

  const seoTitle = product
    ? `${product.name} — купить одежду для всей семьи | bebochka`
    : notFound
      ? 'Товар не найден | bebochka'
      : 'Карточка товара | bebochka'
  const seoDescription = product
    ? `${product.name}. Бренд: ${product.brand || 'без бренда'}, размер: ${product.size || 'не указан'}, состояние: ${formatCondition(product.condition)}. Секонд хенд, сэконд, сток одежда, новая одежда для всей семьи.`
    : 'Карточка товара bebochka: бренд, размер, состояние, цвет, доставка одежды.'

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    canonical,
    robots: loading
      ? 'index, follow'
      : isIndexable
        ? 'index, follow'
        : 'noindex, nofollow',
    keywords:
      'секонд хенд, сэконд, сток одежда, одежда для всей семьи, новая одежда, новая одежда для всей семьи, одежда для детей, для детей секонд, доставка одежды, покупка одежды',
    jsonLd: product && isIndexable
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: (product.images || []).map((img) => toAbsoluteMediaUrl(img)).filter(Boolean),
          description: product.description || `Одежда для всей семьи: ${product.name}`,
          brand: product.brand || 'bebochka',
          category: 'Clothing',
          color: product.color || undefined,
          size: product.size || undefined,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'RUB',
            price: Number(product.price || 0),
            availability: 'https://schema.org/InStock',
            url: canonical,
          },
        }
      : null,
  })

  const handleFilterSelect = useCallback(
    (field, value) => {
      const filters = { ...DEFAULT_CATALOG_FILTERS }
      if (field === 'size') {
        filters.size = value ? [String(value).trim()] : []
      } else if (field in filters) {
        filters[field] = value || ''
      }
      const target = buildCatalogFilterSearch(filters)
      navigate(localStorage.getItem('authToken') ? target : catalogHomePath())
    },
    [navigate]
  )

  if (!loading && notFound) {
    return (
      <ErrorPageLayout
        className="page-shell--product-page"
        title="Товар не найден"
        code="404"
        text="Такой страницы нет или товар уже снят с продажи."
        actions={(
          <Link to={catalogHomePath()} className="error-page__btn error-page__btn--primary">
            Перейти в каталог
          </Link>
        )}
      />
    )
  }

  return (
    <PageShell className="page-shell--product-page">
      <nav className="product-page-nav" aria-label="Навигация">
        <Link to={catalogHomePath()} className="product-page-back">
          ← В каталог
        </Link>
      </nav>

      {loading && <RouteFallback />}

      {!loading && !notFound && product && (
        <ProductDetail
          variant="page"
          product={product}
          onClose={() => navigate(catalogHomePath())}
          onAddedToCart={() => navigate('/cart')}
          getAvailableQuantity={getAvailableQuantity}
          onFilterSelect={handleFilterSelect}
        />
      )}
    </PageShell>
  )
}
