import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useCart } from '../../contexts/CartContext'
import { getSessionId } from '../../utils/sessionId'
import { toAbsoluteMediaUrl } from '../../utils/mediaUrl'
import { formatCondition } from '../../utils/formatCondition'
import ProductImage from '../../components/ProductImage'
import { usePageSeo } from '../../utils/seo'
import { showToast } from '../../utils/showToast'
import {
  CONTACT_TELEGRAM_CHANNEL_URL,
  CONTACT_TELEGRAM_URL,
  CONTACT_VK_GROUP_URL,
} from '../../constants/contactLinks'
import { setPendingCartProduct } from './pendingCartIntent'
import './Landing.css'

const LANDING_RETURN = '/welcome'

function formatGender(gender) {
  if (!gender) return ''
  return gender.charAt(0).toUpperCase() + gender.slice(1)
}

export default function Landing() {
  const navigate = useNavigate()
  const sessionId = useMemo(() => getSessionId(), [])
  const { addToCart, cartItems } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  usePageSeo({
    title: 'bebochka — качественная одежда для всей семьи с доставкой по России',
    description:
      'Секонд и сток европейских брендов для всей семьи. Честные фото, размеры в карточке, доставка по России через Авито и Ozon.',
    canonical: 'https://bebochka.ru/welcome',
    keywords:
      'одежда для всей семьи, секонд хенд, сток одежда, доставка по России, bebochka, одежда б/у',
  })

  useEffect(() => {
    let cancelled = false
    const loadCatalog = async () => {
      try {
        const data = await api.getProducts(sessionId)
        if (cancelled) return
        const visible = (data || []).filter((p) => (p.quantityInStock ?? p.QuantityInStock ?? 0) > 0)
        setProducts(visible.slice(0, 12))
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => loadCatalog(), { timeout: 2500 })
      } else {
        window.setTimeout(loadCatalog, 200)
      }
    }
    schedule()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  const isLoggedIn = !!localStorage.getItem('authToken')

  const handleBuyClick = async (product) => {
    const id = product.id ?? product.Id
    if (!id) return

    if (!isLoggedIn) {
      setPendingCartProduct(id, LANDING_RETURN)
      navigate(`/account?returnUrl=${encodeURIComponent(LANDING_RETURN)}`)
      return
    }

    setBusyId(id)
    try {
      await addToCart(product)
      navigate('/cart')
    } catch (e) {
      showToast(e.message || 'Не удалось добавить в корзину')
    } finally {
      setBusyId(null)
    }
  }

  const getInCart = (productId) =>
    cartItems.some((item) => String(item.productId ?? item.id) === String(productId))

  return (
    <div className="landing">
      <section className="landing-hero landing-hero--lcp">
        <img
          className="landing-hero-bg"
          src="/background.png"
          alt=""
          width={1200}
          height={800}
          fetchPriority="high"
          decoding="async"
        />
        <div className="landing-hero-content">
          <h1>
            <span className="landing-hero-title-line">Качественная одежда для всей семьи</span>
            <span className="landing-hero-title-line">без ущерба для стиля</span>
          </h1>
          <p className="landing-hero-lead">
            Секонд и сток европейских брендов для детей и взрослых — с честными фото и данными.
            <br />
            Бережём семейный бюджет — без ущерба для стиля.
          </p>
          <div className="landing-hero-cta">
            <a href="#catalog" className="landing-btn landing-btn--primary landing-btn--lg">
              Смотреть новинки
            </a>
          </div>
          <ul className="landing-trust">
            <li>📦 Авито и Ozon по всей России</li>
            <li>📸 Реальные фото каждой вещи</li>
            <li>
              💬 Поддержка в{' '}
              <a href={CONTACT_VK_GROUP_URL} target="_blank" rel="noopener noreferrer">
                VK
              </a>{' '}
              и{' '}
              <a href={CONTACT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </li>
          </ul>
        </div>
      </section>

      <section className="landing-benefits" aria-labelledby="benefits-title">
        <div className="landing-section-head">
          <h2 id="benefits-title">Почему bebochka</h2>
          <p className="landing-section-lead">
            Мы объединили стоковые коллекции и проверенный секонд — даём вторую жизнь качественным вещам и
            добавляем свежие поступления, чтобы семья выглядела стильно без переплат за бренд.
          </p>
        </div>
        <div className="landing-benefits-grid">
          <article className="landing-benefit-card landing-benefit-card--accent">
            <span className="landing-benefit-icon" aria-hidden="true">👨‍👩‍👧</span>
            <h3>Всё для семьи в одном месте</h3>
            <p>
              От платья для деловой встречи до удобного худи для мужа и комбинезона для малыша — не нужно
              искать в разных магазинах.
            </p>
          </article>
          <article className="landing-benefit-card landing-benefit-card--accent">
            <span className="landing-benefit-icon" aria-hidden="true">♻️</span>
            <h3>Сток и секонд хенд</h3>
            <p>
              Сток и секонд хенд
              <br className="landing-benefit-br" />
              <span className="landing-benefit-grade">«1 категория»</span>, «Экстра» и «Крем» — европейские бренды по адекватным ценам.
            </p>
          </article>
          <Link to="/reviews" className="landing-benefit-card landing-benefit-card--accent landing-benefit-card--link">
            <span className="landing-benefit-icon" aria-hidden="true">✨</span>
            <h3>Честный отбор</h3>
            <p>
              Проверяем оригинальность, состояние и актуальность моделей. Для б/у — указываем все нюансы в
              карточке, без сюрпризов при получении.
            </p>
          </Link>
          <Link to="/delivery" className="landing-benefit-card landing-benefit-card--accent landing-benefit-card--link">
            <span className="landing-benefit-icon" aria-hidden="true">🚚</span>
            <h3>Доставка по РФ</h3>
            <p>Отправляем через проверенные сервисы — удобно заказать из любого города.</p>
          </Link>
        </div>
      </section>

      <section
        id="catalog"
        className="landing-catalog landing-section--pattern"
        aria-labelledby="catalog-title"
      >
        <div className="landing-catalog-head">
          <h2 id="catalog-title">Свежие поступления</h2>
          <p>Европейские бренды с честными фото — состояние, размер и цвет указаны в каждой карточке.</p>
        </div>
        {loading ? (
          <p className="landing-muted">Загрузка товаров…</p>
        ) : products.length === 0 ? (
          <p className="landing-muted">Скоро появятся новые вещи — следите в канале.</p>
        ) : (
          <div className="landing-products">
            {products.map((product, index) => {
              const id = product.id ?? product.Id
              const inCart = getInCart(id)
              const img = product.images?.[0]
              return (
                <article key={id} className="landing-product-card">
                  <button
                    type="button"
                    className="landing-product-image-wrap"
                    onClick={() => navigate(`/product/${id}`)}
                  >
                    {img ? (
                      <ProductImage
                        src={toAbsoluteMediaUrl(img) || '/logo.jpg'}
                        alt={product.name}
                        className="landing-product-image"
                        priority={index < 4}
                      />
                    ) : (
                      <div className="landing-product-placeholder">Нет фото</div>
                    )}
                  </button>
                  <div className="landing-product-body">
                    <h3>{product.name}</h3>
                    <div className="landing-product-meta">
                      {product.size && <span>📏 {product.size}</span>}
                      {product.gender && <span>👤 {formatGender(product.gender)}</span>}
                      {product.condition && <span>✨ {formatCondition(product.condition)}</span>}
                      {product.color && <span>🎨 {product.color}</span>}
                    </div>
                    <div className="landing-product-footer">
                      <strong>{(product.price ?? 0).toLocaleString('ru-RU')} ₽</strong>
                      <button
                        type="button"
                        className="landing-btn landing-btn--primary landing-btn--sm"
                        disabled={busyId === id || inCart}
                        onClick={() => handleBuyClick(product)}
                      >
                        {inCart ? 'В корзине' : busyId === id ? '…' : 'В корзину'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
        {isLoggedIn && (
          <div className="landing-catalog-more">
            <Link to="/" className="landing-text-link">
              Весь каталог →
            </Link>
          </div>
        )}
      </section>

      <section id="how" className="landing-how" aria-labelledby="how-title">
        <h2 id="how-title" className="landing-section-title">
          Как купить
        </h2>
        <ol className="landing-steps">
          <li>
            <strong>Выберите вещь</strong>
            <span>Откройте карточку или добавьте сразу в корзину</span>
          </li>
          <li>
            <strong>Войдите через VK или телефон</strong>
            <span>Простая регистрация или вход в один клик</span>
          </li>
          <li>
            <strong>Оформите заказ</strong>
            <span>Доставка по всей России — через Авито, Ozon или другой удобный сервис по договорённости</span>
          </li>
          <li>
            <strong>Получите посылку</strong>
            <span>Оставьте честный отзыв</span>
          </li>
        </ol>
      </section>

      <section className="landing-community landing-section--pattern">
        <h2 className="landing-section-title">Мы в соцсетях</h2>
        <p className="landing-community-lead">Анонсы новых поставок — подписывайтесь:</p>
        <div className="landing-community-links">
          <a href={CONTACT_TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
            Telegram-канал
          </a>
          <a href={CONTACT_VK_GROUP_URL} target="_blank" rel="noopener noreferrer">
            ВКонтакте
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-links">
          <Link to="/about">О нас</Link>
          <Link to="/terms">Пользовательское соглашение</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contacts">Контакты</Link>
        </div>
        <span className="landing-footer-copy">© bebochka</span>
      </footer>
    </div>
  )
}
