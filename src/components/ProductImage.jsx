import { useCallback, useEffect, useMemo, useState } from 'react'
import { toAbsoluteMediaUrl, toThumbnailMediaUrl } from '../utils/mediaUrl'
import './ProductImage.css'

const MAX_RETRIES = 1
const RETRY_DELAY_MS = 300
const THUMB_SLOW_MS = 1200

/**
 * Product/catalog image with lazy loading, thumb → full fallback, and loading spinner.
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
  showSpinner = true,
}) {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const absoluteSrc = useMemo(
    () => toAbsoluteMediaUrl(src) || src || fallbackSrc,
    [src, fallbackSrc]
  )

  const thumbSrc = useMemo(() => {
    if (!thumbWidth) return absoluteSrc
    return toThumbnailMediaUrl(src, thumbWidth) || absoluteSrc
  }, [src, thumbWidth, absoluteSrc])

  useEffect(() => {
    setAttempt(0)
    setLoaded(false)
    setFailed(false)
  }, [src, thumbWidth, thumbSrc, absoluteSrc])

  const resolvedSrc = useMemo(() => {
    if (attempt === 0) return thumbSrc
    if (attempt === 1) return absoluteSrc
    const base = absoluteSrc || fallbackSrc
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}retry=${attempt - 1}`
  }, [attempt, thumbSrc, absoluteSrc, fallbackSrc])

  useEffect(() => {
    if (!thumbWidth || thumbSrc === absoluteSrc || loaded || failed) return undefined
    const timer = window.setTimeout(() => {
      setAttempt((prev) => (prev === 0 ? 1 : prev))
    }, THUMB_SLOW_MS)
    return () => window.clearTimeout(timer)
  }, [thumbWidth, thumbSrc, absoluteSrc, loaded, failed, src])

  const handleLoad = useCallback(() => {
    setLoaded(true)
    setFailed(false)
  }, [])

  const handleError = useCallback(
    (e) => {
      if (attempt === 0 && thumbSrc !== absoluteSrc) {
        setAttempt(1)
        return
      }
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
    [attempt, thumbSrc, absoluteSrc, fallbackSrc, onError]
  )

  const showPlaceholder = !loaded && !failed

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation()
      onClick?.(event)
    },
    [onClick]
  )

  return (
    <span
      className={`product-image-wrap${showPlaceholder ? ' product-image-wrap--loading' : ''}${className ? ` ${className}-wrap` : ''}`}
      style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      {showPlaceholder && (
        <>
          <span className="product-image-placeholder-skeleton" aria-hidden="true" />
          {showSpinner && (
            <span className="product-image-spinner" role="status" aria-label="Загрузка фото" />
          )}
        </>
      )}
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
        onClick={onClick ? handleClick : undefined}
        onLoad={handleLoad}
        onError={handleError}
        style={showPlaceholder ? { opacity: 0 } : undefined}
      />
    </span>
  )
}
