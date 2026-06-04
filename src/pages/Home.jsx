import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { useCart } from '../contexts/CartContext'
const ProductDetail = lazy(() => import('../components/ProductDetail'))
import Toast from '../components/Toast'
import PageShell from '../components/PageShell'
import FilterIcon from '../components/FilterIcon'
import { formatCondition } from '../utils/formatCondition'
import { toAbsoluteMediaUrl } from '../utils/mediaUrl'
import CatalogBuyButton from '../components/CatalogBuyButton'
import ProductImage from '../components/ProductImage'
import ProductPriceDisplay from '../components/ProductPriceDisplay'
import ProductMetaFilter from '../components/ProductMetaFilter'
import SizeMultiSelect, { parseSizeValue } from '../components/SizeMultiSelect'
import { usePageSeo } from '../utils/seo'
import { catalogFiltersFromSearchParams, countActiveCatalogFilters, toggleSizeFilter, buildFiltersFromChildren, readAutoFilterEnabled, normalizeGender } from '../utils/catalogFilters'
import { DEFAULT_CATALOG_FILTERS, readCatalogStateFromSession, saveCatalogStateToSession, hasStoredCatalogFilters } from '../utils/catalogFilterStorage'
import { readFavoriteProductIds, toggleFavoriteProductId } from '../utils/favoritesStorage'
import './Home.css'

const ITEMS_PER_PAGE = 24

const catalogIntro = (
  <div className="catalog-intro">
    <p>Недорогая и качественная одежда европейских брендов для всей семьи</p>
    <p>Бережём ваш бюджет без ущерба для стиля</p>
  </div>
)

function Home() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [addingToCart, setAddingToCart] = useState(new Set()) // Track which products are being added
  const [joiningQueue, setJoiningQueue] = useState(new Set())
  const [myQueueProductIds, setMyQueueProductIds] = useState(new Set())
  const [toast, setToast] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    sizes: [],
    colors: [],
    genders: [],
    conditions: [],
  })
  const loadMoreRef = useRef(null)
  const [filters, setFilters] = useState(() => {
    const stored = readCatalogStateFromSession()
    return stored?.filters ?? { ...DEFAULT_CATALOG_FILTERS }
  })
  const [priceSort, setPriceSort] = useState(() => {
    const stored = readCatalogStateFromSession()
    return stored?.priceSort ?? ''
  })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [favoriteProductIds, setFavoriteProductIds] = useState(() => new Set(readFavoriteProductIds()))
  const { addToCart, sessionId, cartItems } = useCart()

  usePageSeo({
    title: 'Каталог одежды для всей семьи | bebochka',
    description:
      'Каталог bebochka: секонд хенд, сэконд, сток одежда и новая одежда для всей семьи и детей. Покупка одежды онлайн, доставка одежды по России.',
    canonical: 'https://bebochka.ru/',
    keywords:
      'одежда для всей семьи, сток одежда, новая одежда, новая одежда для всей семьи, одежда для детей, для детей секонд, секонд хенд, сэконд, доставка одежды, покупка одежды'
  })

  const activeFilterCount = useMemo(
    () => countActiveCatalogFilters(filters),
    [filters]
  )

  const resetCatalogFilters = () => {
    setFilters({ ...DEFAULT_CATALOG_FILTERS })
    setPriceSort('')
  }

  const applyCatalogFilter = (key, value) => {
    setFilters((prev) => {
      if (key === 'size') {
        return { ...prev, size: toggleSizeFilter(prev.size, value) }
      }
      if (key === 'gender') {
        return { ...prev, gender: normalizeGender(value) }
      }
      return { ...prev, [key]: value }
    })
    setSelectedProduct(null)
    setPage(1)
  }

  useEffect(() => {
    const fromUrl = catalogFiltersFromSearchParams(searchParams)
    if (countActiveCatalogFilters(fromUrl) > 0) {
      setFilters(fromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    saveCatalogStateToSession({ filters, priceSort })
  }, [filters, priceSort])

  const applyAutoFilterFromChildren = useCallback(async () => {
    if (countActiveCatalogFilters(catalogFiltersFromSearchParams(searchParams)) > 0) return
    if (hasStoredCatalogFilters()) return
    const token = localStorage.getItem('authToken')
    if (!token) return

    try {
      const [profile, childList] = await Promise.all([
        api.getMyProfile(),
        api.getMyChildren(),
      ])
      const enabled = readAutoFilterEnabled(profile)
      const childFilters = buildFiltersFromChildren(childList, enabled)
      if (childFilters) setFilters(childFilters)
    } catch {
      /* ignore — catalog works without auto-filter */
    }
  }, [searchParams])

  useEffect(() => {
    applyAutoFilterFromChildren()
  }, [applyAutoFilterFromChildren])

  useEffect(() => {
    const onProfileChange = () => { applyAutoFilterFromChildren() }
    window.addEventListener('bebochka-auth', onProfileChange)
    return () => window.removeEventListener('bebochka-auth', onProfileChange)
  }, [applyAutoFilterFromChildren])
  
  // Используем availableQuantity из сервера (уже учитывает резервы всех пользователей)
  const getAvailableQuantity = (product) => {
    return product.availableQuantity !== undefined ? product.availableQuantity : (product.quantityInStock || 0)
  }
  
  // Получаем количество товара в корзине
  const getCartQuantity = (productId) => {
    const cartItem = cartItems.find(item => item.productId === productId)
    return cartItem ? cartItem.quantity : 0
  }

  const filtersKey = useMemo(
    () => JSON.stringify({ filters, priceSort }),
    [filters, priceSort]
  )

  useEffect(() => {
    loadMyQueue()
  }, [])

  useEffect(() => {
    let cancelled = false
    setPage(1)

    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getCatalogProducts({
          page: 1,
          pageSize: ITEMS_PER_PAGE,
          sessionId,
          filters,
          priceSort,
          includeFacets: true,
        })
        if (cancelled) return
        setProducts(data.items)
        setHasMore(data.hasMore)
        if (data.facets) setFilterOptions(data.facets)
      } catch (err) {
        if (cancelled) return
        setError('Не удалось загрузить товары')
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [sessionId, filtersKey])

  useEffect(() => {
    if (page <= 1 || loading) return undefined

    let cancelled = false
    ;(async () => {
      try {
        setLoadingMore(true)
        const data = await api.getCatalogProducts({
          page,
          pageSize: ITEMS_PER_PAGE,
          sessionId,
          filters,
          priceSort,
          includeFacets: false,
        })
        if (cancelled) return
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => p.id))
          const next = [...prev]
          for (const item of data.items) {
            if (!seen.has(item.id)) next.push(item)
          }
          return next
        })
        setHasMore(data.hasMore)
      } catch (err) {
        if (!cancelled) console.error(err)
      } finally {
        if (!cancelled) setLoadingMore(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [page, sessionId, filtersKey, loading])

  const loadMyQueue = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setMyQueueProductIds(new Set())
      return
    }
    try {
      const data = await api.getMyCartQueue()
      const ids = new Set(data.map((x) => x.productId ?? x.ProductId))
      setMyQueueProductIds(ids)
    } catch {
      setMyQueueProductIds(new Set())
    }
  }

  const handleAddToCart = async (product) => {
    // Проверяем доступное количество перед добавлением
    const available = getAvailableQuantity(product)
    const inCart = getCartQuantity(product.id)
    
    if (available <= 0 || inCart >= available) {
      return // Не добавляем, если товар закончился или уже в корзине в максимальном количестве
    }
    
    // Блокируем кнопку для этого товара
    setAddingToCart(prev => new Set(prev).add(product.id))
    
    try {
      await addToCart(product)
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== product.id) return p
          const stock = p.quantityInStock ?? p.QuantityInStock ?? 0
          const avail =
            p.availableQuantity !== undefined ? p.availableQuantity : stock
          return { ...p, availableQuantity: Math.max(0, avail - 1) }
        })
      )
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Не удалось добавить товар в корзину' })
      console.error('Error in handleAddToCart:', error)
    } finally {
      // Разблокируем кнопку
      setAddingToCart(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }
  }

  const handleJoinQueue = async (productId) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setToast({ type: 'warning', message: 'Войдите в аккаунт, чтобы встать в очередь' })
      return
    }

    setJoiningQueue(prev => new Set(prev).add(productId))
    try {
      await api.joinCartQueue(productId)
      setMyQueueProductIds(prev => {
        const next = new Set(prev)
        next.add(productId)
        return next
      })
      setToast({
        type: 'success',
        message: 'Вы в очереди. Как только товар освободится, он автоматически попадет в вашу корзину.'
      })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Не удалось встать в очередь' })
    } finally {
      setJoiningQueue(prev => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const handleToggleFavorite = (productId) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      const { ids, isFavorite } = toggleFavoriteProductId(productId)
      setFavoriteProductIds(new Set(ids))
      setToast({
        type: 'success',
        message: isFavorite ? 'Товар добавлен в избранное' : 'Товар убран из избранного'
      })
      return
    }

    const isFavoriteNow = favoriteProductIds.has(productId)
    ;(async () => {
      try {
        if (isFavoriteNow) {
          await api.removeProductFromFavorites(productId)
          setFavoriteProductIds((prev) => {
            const next = new Set(prev)
            next.delete(productId)
            return next
          })
          setToast({ type: 'success', message: 'Товар убран из избранного' })
        } else {
          await api.addProductToFavorites(productId)
          setFavoriteProductIds((prev) => new Set([...prev, productId]))
          setToast({ type: 'success', message: 'Товар добавлен в избранное' })
        }
      } catch (error) {
        setToast({ type: 'error', message: error.message || 'Не удалось обновить избранное' })
      }
    })()
  }

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setFavoriteProductIds(new Set(readFavoriteProductIds()))
      return
    }
    ;(async () => {
      try {
        const ids = await api.getMyFavoriteProductIds()
        setFavoriteProductIds(new Set(ids))
      } catch {
        setFavoriteProductIds(new Set())
      }
    })()
  }, [])

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return undefined
    const el = loadMoreRef.current
    if (!el) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((prev) => prev + 1)
        }
      },
      { root: null, rootMargin: '400px 0px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, products.length])

  const formatGender = (gender) => {
    if (!gender) return ''
    return gender.charAt(0).toUpperCase() + gender.slice(1)
  }

  if (loading) {
    return (
      <PageShell
        title={null}
        className="page-shell--catalog"
        subtitle={catalogIntro}
      >
        <div className="loading">Загрузка...</div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell
        title={null}
        className="page-shell--catalog"
        subtitle={catalogIntro}
      >
        <div className="error">{error}</div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={null}
      className="page-shell--catalog"
      subtitle={catalogIntro}
    >
      <div className="catalog-filters-wrap">
        <div className="catalog-toolbar">
          <h2 className="catalog-toolbar-title">Каталог товаров</h2>
          <div className="catalog-filters-mobile-bar">
            <button
              type="button"
              className={`catalog-filters-toggle${filtersOpen ? ' catalog-filters-toggle--open' : ''}`}
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="catalog-filters-panel"
              aria-label={filtersOpen ? 'Свернуть фильтры' : 'Фильтры'}
            >
              <FilterIcon className="catalog-filters-toggle__icon" />
              {activeFilterCount > 0 && (
                <span className="catalog-filters-badge" aria-hidden="true">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="catalog-filters-reset"
                onClick={resetCatalogFilters}
              >
                Сбросить
              </button>
            )}
          </div>
        </div>
        <div
          id="catalog-filters-panel"
          className={`catalog-filters ${filtersOpen ? 'catalog-filters--open' : ''}`}
        >
          <select value={filters.brand} onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))}>
            <option value="">Все бренды</option>
            {filterOptions.brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <SizeMultiSelect
              className="catalog-filter-size-select"
              value={filters.size.join(',')}
              onChange={(val) => setFilters((prev) => ({ ...prev, size: parseSizeValue(val) }))}
              options={filterOptions.sizes}
              placeholder="Все размеры"
            />
          <select value={filters.color} onChange={(e) => setFilters((prev) => ({ ...prev, color: e.target.value }))}>
            <option value="">Все цвета</option>
            {filterOptions.colors.map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
          <select value={filters.gender} onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}>
            <option value="">Любой пол</option>
            {filterOptions.genders.map((gender) => (
              <option key={gender} value={normalizeGender(gender)}>{formatGender(gender)}</option>
            ))}
          </select>
          <select value={filters.condition} onChange={(e) => setFilters((prev) => ({ ...prev, condition: e.target.value }))}>
            <option value="">Любое состояние</option>
            {filterOptions.conditions.map((condition) => (
              <option key={condition} value={condition}>
                {formatCondition(condition)}
              </option>
            ))}
          </select>
          <select
            className="catalog-filter-price-sort"
            value={priceSort}
            onChange={(e) => setPriceSort(e.target.value)}
            aria-label="Сортировка по цене"
            title="Сортировка по цене"
          >
            <option value="">Цена</option>
            <option value="asc">↑ Дешевле</option>
            <option value="desc">↓ Дороже</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>{activeFilterCount > 0 ? 'По фильтрам ничего не найдено' : 'Товары пока не добавлены'}</p>
        </div>
      ) : (
        <div className="catalog-main">
        <div className="products-grid">
          {products.map((product, index) => {
            const available = getAvailableQuantity(product)
            const quantityInStock = product.quantityInStock ?? product.QuantityInStock ?? 0
            const inCart = getCartQuantity(product.id)
            const isInMyCart = inCart > 0
            const isReservedByAnotherUser = available <= 0 && quantityInStock > 0 && !isInMyCart
            let stockClass = 'available'
            let stockLabel = '✓ В наличии'
            if (isInMyCart) {
              stockClass = 'cart'
              stockLabel = '🛒 В корзине'
            } else if (isReservedByAnotherUser) {
              stockClass = 'reserved'
              stockLabel = '⏳ Забронирован'
            } else if (available <= 0) {
              stockClass = 'out'
              stockLabel = '❌ Нет в наличии'
            }

            return (
            <div 
              key={product.id} 
              className="product-card"
            >
              <button
                type="button"
                className={`product-favorite-btn${favoriteProductIds.has(product.id) ? ' product-favorite-btn--active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleFavorite(product.id)
                }}
                aria-label={favoriteProductIds.has(product.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
                title={favoriteProductIds.has(product.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
              >
                {favoriteProductIds.has(product.id) ? '♥' : '♡'}
              </button>
              <div 
                className="product-image-container"
                onClick={() => setSelectedProduct(product)}
              >
                {product.images && product.images.length > 0 ? (
                  <>
                    <ProductImage
                      src={toAbsoluteMediaUrl(product.images[0]) || '/logo.jpg'}
                      alt={product.name}
                      className="product-image"
                      priority={index < 4}
                      width={400}
                      height={220}
                      sizes="(max-width: 480px) 46vw, (max-width: 768px) 31vw, 280px"
                      onError={(e) => {
                        e.target.src = '/logo.jpg'
                      }}
                    />
                    {product.images.length > 1 && (
                      <div className="product-images-badge">
                        +{product.images.length - 1} фото
                      </div>
                    )}
                  </>
                ) : (
                  <div className="product-image-placeholder">
                    <span>Нет фото</span>
                  </div>
                )}
              </div>
              <div className="product-info">
                <div className="product-title-row">
                  <h3
                    className="product-name"
                    onClick={() => setSelectedProduct(product)}
                    style={{ cursor: 'pointer' }}
                  >
                    {product.name}
                  </h3>
                  <span className={`product-meta-item product-meta-stock product-meta-stock--${stockClass}`}>
                    {stockLabel}
                  </span>
                </div>
                <p
                  className={`product-description${product.description ? '' : ' product-description--empty'}`}
                >
                  {product.description || '\u00a0'}
                </p>
                <div className="product-meta-grid">
                  <ProductMetaFilter
                    field="brand"
                    value={product.brand}
                    onFilter={applyCatalogFilter}
                    className="product-meta-item product-meta-brand product-meta-slot product-meta-slot--brand"
                    empty={!product.brand}
                  />
                  <ProductMetaFilter
                    field="size"
                    value={product.size}
                    onFilter={applyCatalogFilter}
                    className="product-meta-item product-meta-slot product-meta-slot--size"
                    empty={!product.size}
                  />
                  <ProductMetaFilter
                    field="gender"
                    value={product.gender}
                    onFilter={applyCatalogFilter}
                    className="product-meta-item product-meta-slot product-meta-slot--gender"
                    empty={!product.gender}
                  />
                  <ProductMetaFilter
                    field="condition"
                    value={product.condition}
                    onFilter={applyCatalogFilter}
                    className="product-meta-item product-meta-slot product-meta-slot--condition"
                    empty={!product.condition}
                  />
                  <ProductMetaFilter
                    field="color"
                    value={product.color}
                    onFilter={applyCatalogFilter}
                    className="product-meta-item product-meta-slot product-meta-slot--color"
                    empty={!product.color}
                  />
                </div>
                <div className="product-footer">
                  <div className="product-price">
                    <ProductPriceDisplay product={product} />
                  </div>
                <CatalogBuyButton
                  product={product}
                  available={getAvailableQuantity(product)}
                  inCart={getCartQuantity(product.id)}
                  isAdding={addingToCart.has(product.id)}
                  isJoiningQueue={joiningQueue.has(product.id)}
                  isInQueue={myQueueProductIds.has(product.id)}
                  onAddToCart={handleAddToCart}
                  onJoinQueue={handleJoinQueue}
                />
                </div>
              </div>
            </div>
            )
          })}
        </div>
        {hasMore && (
          <div ref={loadMoreRef} className="catalog-load-sentinel" aria-hidden="true">
            {loadingMore && <p className="catalog-load-more-hint">Загрузка…</p>}
          </div>
        )}
        </div>
      )}
      
      {selectedProduct && (
        <Suspense fallback={null}>
          <ProductDetail
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            getAvailableQuantity={getAvailableQuantity}
            onFilterSelect={applyCatalogFilter}
          />
        </Suspense>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </PageShell>
  )
}

export default Home

