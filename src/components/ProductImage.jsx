/**
 * Product/catalog image with lazy loading and sensible defaults for Lighthouse.
 */
export default function ProductImage({
  src,
  alt,
  className,
  priority = false,
  width,
  height,
  sizes,
  onError,
  onClick,
  title,
}) {
  return (
    <img
      src={src}
      alt={alt || 'Фото товара'}
      className={className}
      width={width}
      height={height}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchpriority={priority ? 'high' : undefined}
      title={title}
      onClick={onClick}
      onError={onError}
    />
  )
}
