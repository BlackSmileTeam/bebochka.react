import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api } from '../services/api'
import { formatCondition } from '../utils/formatCondition'
import { toAbsoluteMediaUrl } from '../utils/mediaUrl'
import { getSessionId } from '../utils/sessionId'
import { usePageSeo, getProductStockCount } from '../utils/seo'
import ProductPriceDisplay from '../components/ProductPriceDisplay'
import './InfoPages.css'

const SITE_URL = 'https://bebochka.ru'

function extractProductId(raw) {
  const m = String(raw || '').match(/^(\d+)/)
  return m ? Number(m[1]) : null
}

export default function ProductPage() {
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
  const isIndexable = Boolean(product && inStock && !notFound)

  const canonical = useMemo(
    () => `${SITE_URL}/product/${productIdSlug || ''}`,
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
    robots: isIndexable ? 'index, follow' : 'noindex, nofollow',
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
            url: canonical
          }
        }
      : null
  })

  return (
    <PageShell title={product?.name || 'Карточка товара'} subtitle="Описание товара, характеристики и условия заказа">
      <section className="info-block">
        <p>
          <Link to="/welcome">В каталог</Link> · <Link to="/faq">FAQ</Link> · <Link to="/delivery">Доставка</Link>
        </p>
      </section>

      {loading && <section className="info-block"><p>Загрузка товара…</p></section>}

      {!loading && notFound && (
        <section className="info-block">
          <h2>Товар не найден</h2>
          <p>Такой страницы нет или товар уже снят с продажи.</p>
        </section>
      )}

      {!loading && !notFound && product && !inStock && (
        <section className="info-block">
          <h2>Товар продан</h2>
          <p>Эта вещь уже куплена. Посмотрите актуальные поступления на главной.</p>
          <p><Link to="/welcome">Перейти к каталогу</Link></p>
        </section>
      )}

      {!loading && !notFound && product && inStock && (
        <>
          <section className="info-block">
            <h2>О товаре</h2>
            {product.description && <p>{product.description}</p>}
            <p>
              Этот товар относится к категории «одежда для всей семьи»: секонд хенд/сэконд, сток одежда и
              новая одежда для детей и взрослых.
            </p>
          </section>
          <section className="info-block">
            <h2>Характеристики</h2>
            <p><strong>Бренд:</strong> {product.brand || '—'}</p>
            <p><strong>Размер:</strong> {product.size || '—'}</p>
            <p><strong>Состояние:</strong> {formatCondition(product.condition)}</p>
            <p><strong>Цвет:</strong> {product.color || '—'}</p>
            {product.nuance && (
              <p><strong>Нюанс:</strong> {product.nuance}</p>
            )}
            <p><strong>Цена:</strong> <ProductPriceDisplay product={product} /></p>
          </section>
        </>
      )}
    </PageShell>
  )
}
