import { useCallback, useEffect, useState } from 'react'
import { toAbsoluteMediaUrl, toThumbnailMediaUrl } from '../utils/mediaUrl'
import './ProductImage.css'

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 400

/**
 * Product/catalog image with lazy loading, retry on failure, and loading placeholder.
 */
export default function ProductImage({
  src,
  alt,
  className = '',
  priority = false,
  thumbWidth,
  width,
  height,
  sizes,
  onError,
  onClick,
  title,
  fallbackSrc = '/logo.jpg',
}) {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setAttempt(0)
    setLoaded(false)
    setFailed(false)
  }, [src, thumbWidth])

  const baseSrc = thumbWidth
    ? (toThumbnailMediaUrl(src, thumbWidth) || toAbsoluteMediaUrl(src) || fallbackSrc)
    : (toAbsoluteMediaUrl(src) || src || fallbackSrc)

  const resolvedSrc = (() => {
    if (!baseSrc) return fallbackSrc
    if (attempt === 0) return baseSrc
    const sep = baseSrc.includes('?') ? '&' : '?'
    return `${baseSrc}${sep}retry=${attempt}`
  })()

  const handleLoad = useCallback(() => {
    setLoaded(true)
    setFailed(false)
  }, [])

  const handleError = useCallback(
    (e) => {
      if (attempt < MAX_RETRIES) {
        window.setTimeout(() => setAttempt((n) => n + 1), RETRY_DELAY_MS)
        return
      }
      setFailed(true)
      setLoaded(true)
      if (typeof onError === 'function') {
        onError(e)
        return
      }
      if (fallbackSrc && e.target.src !== fallbackSrc) {
        e.target.src = fallbackSrc
      }
    },
    [attempt, fallbackSrc, onError]
  )

  const showPlaceholder = !loaded && !failed

  return (
    <span
      className={`product-image-wrap${showPlaceholder ? ' product-image-wrap--loading' : ''}${className ? ` ${className}-wrap` : ''}`}
      style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      {showPlaceholder && <span className="product-image-placeholder-skeleton" aria-hidden="true" />}
      <img
        src={resolvedSrc || fallbackSrc}
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
        onLoad={handleLoad}
        onError={handleError}
        style={showPlaceholder ? { opacity: 0 } : undefined}
      />
    </span>
  )
}
