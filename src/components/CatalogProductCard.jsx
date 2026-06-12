import ProductImage from './ProductImage'
import ProductPriceDisplay from './ProductPriceDisplay'
import ProductMetaFilter from './ProductMetaFilter'
import CatalogBuyButton from './CatalogBuyButton'
import { toAbsoluteMediaUrl } from '../utils/mediaUrl'

function getStockInfo(available, quantityInStock, inCart) {
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
  return { stockClass, stockLabel }
}

export default function CatalogProductCard({
  product,
  isFavorite = false,
  onToggleFavorite,
  onOpen,
  onFilterSelect,
  showBuyButton = false,
  available,
  inCart = 0,
  buyButtonProps = {},
}) {
  const quantityInStock = product.quantityInStock ?? product.QuantityInStock ?? 0
  const { stockClass, stockLabel } = getStockInfo(available, quantityInStock, inCart)

  const handleFavoriteClick = (event) => {
    event.stopPropagation()
    onToggleFavorite?.(product.id)
  }

  return (
    <div className="product-card">
      {onToggleFavorite && (
        <button
          type="button"
          className={`product-favorite-btn${isFavorite ? ' product-favorite-btn--active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      )}
      <div className="product-image-container" onClick={onOpen}>
        {product.images && product.images.length > 0 ? (
          <>
            <ProductImage
              src={toAbsoluteMediaUrl(product.images[0]) || '/logo.jpg'}
              alt={product.name}
              className="product-image"
              width={400}
              height={220}
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
            onClick={onOpen}
            style={{ cursor: onOpen ? 'pointer' : undefined }}
          >
            {product.name}
          </h3>
          <span className={`product-meta-item product-meta-stock product-meta-stock--${stockClass}`}>
            {stockLabel}
          </span>
        </div>
        <p className={`product-description${product.description ? '' : ' product-description--empty'}`}>
          {product.description || '\u00a0'}
        </p>
        <div className="product-meta-grid">
          <ProductMetaFilter
            field="brand"
            value={product.brand}
            onFilter={onFilterSelect}
            className="product-meta-item product-meta-brand product-meta-slot product-meta-slot--brand"
            empty={!product.brand}
          />
          <ProductMetaFilter
            field="size"
            value={product.size}
            onFilter={onFilterSelect}
            className="product-meta-item product-meta-slot product-meta-slot--size"
            empty={!product.size}
          />
          <ProductMetaFilter
            field="gender"
            value={product.gender}
            onFilter={onFilterSelect}
            className="product-meta-item product-meta-slot product-meta-slot--gender"
            empty={!product.gender}
          />
          <ProductMetaFilter
            field="condition"
            value={product.condition}
            onFilter={onFilterSelect}
            className="product-meta-item product-meta-slot product-meta-slot--condition"
            empty={!product.condition}
          />
          <ProductMetaFilter
            field="color"
            value={product.color}
            onFilter={onFilterSelect}
            className="product-meta-item product-meta-slot product-meta-slot--color"
            empty={!product.color}
          />
        </div>
        <div className={`product-footer${showBuyButton ? '' : ' product-footer--price-only'}`}>
          <div className="product-price">
            <ProductPriceDisplay product={product} />
          </div>
          {showBuyButton && (
            <CatalogBuyButton
              product={product}
              available={available}
              inCart={inCart}
              {...buyButtonProps}
            />
          )}
        </div>
      </div>
    </div>
  )
}
