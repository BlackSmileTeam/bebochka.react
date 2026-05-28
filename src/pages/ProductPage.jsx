import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api } from '../services/api'
import { formatCondition } from '../utils/formatCondition'
import { toAbsoluteMediaUrl } from '../utils/mediaUrl'
import { getSessionId } from '../utils/sessionId'
import { usePageSeo } from '../utils/seo'
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
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!productId) {
        setError('Некорректный ID товара')
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const p = await api.getProduct(productId, getSessionId())
        if (!active) return
        setProduct(p)
        setError('')
      } catch {
        if (!active) return
        setError('Товар не найден или недоступен')
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [productId])

  const canonical = useMemo(
    () => `${SITE_URL}/product/${productIdSlug || ''}`,
    [productIdSlug]
  )

  const seoTitle = product
    ? `${product.name} — купить одежду для всей семьи | bebochka`
    : 'Карточка товара | bebochka'
  const seoDescription = product
    ? `${product.name}. Бренд: ${product.brand || 'без бренда'}, размер: ${product.size || 'не указан'}, состояние: ${formatCondition(product.condition)}. Секонд хенд, сэконд, сток одежда, новая одежда для всей семьи.`
    : 'Карточка товара bebochka: бренд, размер, состояние, цвет, доставка одежды.'

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    canonical,
    keywords:
      'секонд хенд, сэконд, сток одежда, одежда для всей семьи, новая одежда, новая одежда для всей семьи, одежда для детей, для детей секонд, доставка одежды, покупка одежды',
    jsonLd: product
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
            availability:
              (product.availableQuantity ?? product.quantityInStock ?? 0) > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: canonical
          }
        }
      : null
  })

  return (
    <PageShell title={product?.name || 'Карточка товара'} subtitle="Описание товара, характеристики и условия заказа">
      <section className="info-block">
        <p>
          <Link to="/">В каталог</Link> · <Link to="/faq">FAQ</Link> · <Link to="/delivery">Доставка</Link>
        </p>
      </section>

      {loading && <section className="info-block"><p>Загрузка товара...</p></section>}
      {!loading && error && <section className="info-block"><p>{error}</p></section>}

      {!loading && !error && product && (
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
            <p><strong>Цена:</strong> {(product.price ?? 0).toLocaleString('ru-RU')} ₽</p>
          </section>
        </>
      )}
    </PageShell>
  )
}
