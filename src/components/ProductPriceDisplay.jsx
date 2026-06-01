import { getProductPriceInfo, formatRub } from '../utils/productPrice'
import './ProductPriceDisplay.css'

export default function ProductPriceDisplay({ product, className = '' }) {
  const { price, finalPrice, hasDiscount } = getProductPriceInfo(product)

  if (!hasDiscount) {
    return <span className={className}>{formatRub(price)}</span>
  }

  return (
    <span className={`product-price-display product-price-display--sale ${className}`.trim()}>
      <span className="product-price-display__old">{formatRub(price)}</span>
      <span className="product-price-display__new">{formatRub(finalPrice)}</span>
    </span>
  )
}
