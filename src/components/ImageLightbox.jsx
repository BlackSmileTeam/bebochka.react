import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSwipeGallery } from '../hooks/useSwipeGallery'
import './ImageLightbox.css'

export default function ImageLightbox({
  src,
  images,
  initialIndex = 0,
  alt = '',
  onClose,
}) {
  const gallery = Array.isArray(images) && images.length > 0
    ? images
    : (src ? [src] : [])

  const [index, setIndex] = useState(() => {
    if (!gallery.length) return 0
    return Math.min(Math.max(initialIndex, 0), gallery.length - 1)
  })

  useEffect(() => {
    if (!gallery.length) return
    setIndex(Math.min(Math.max(initialIndex, 0), gallery.length - 1))
  }, [gallery, initialIndex, src])

  useEffect(() => {
    if (!gallery.length) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [gallery.length])

  const goPrev = useCallback(() => {
    if (gallery.length <= 1) return
    setIndex((prev) => (prev - 1 + gallery.length) % gallery.length)
  }, [gallery.length])

  const goNext = useCallback(() => {
    if (gallery.length <= 1) return
    setIndex((prev) => (prev + 1) % gallery.length)
  }, [gallery.length])

  const swipeHandlers = useSwipeGallery({
    enabled: gallery.length > 1,
    onPrev: goPrev,
    onNext: goNext,
  })

  useEffect(() => {
    if (!gallery.length) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [gallery.length, goNext, goPrev, onClose])

  if (!gallery.length) return null

  const currentSrc = gallery[index]

  const content = (
    <div
      className="review-image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
      onClick={onClose}
    >
      <button
        type="button"
        className="review-image-lightbox__close"
        onClick={onClose}
        aria-label="Закрыть"
      >
        ×
      </button>
      {gallery.length > 1 && (
        <>
          <button
            type="button"
            className="review-image-lightbox__nav review-image-lightbox__nav--prev"
            onClick={(event) => {
              event.stopPropagation()
              goPrev()
            }}
            aria-label="Предыдущее фото"
          >
            ‹
          </button>
          <button
            type="button"
            className="review-image-lightbox__nav review-image-lightbox__nav--next"
            onClick={(event) => {
              event.stopPropagation()
              goNext()
            }}
            aria-label="Следующее фото"
          >
            ›
          </button>
          <div className="review-image-lightbox__counter" aria-live="polite">
            {index + 1} / {gallery.length}
          </div>
        </>
      )}
      <div
        className="review-image-lightbox__frame"
        onClick={(e) => e.stopPropagation()}
        {...swipeHandlers}
      >
        <img src={currentSrc} alt={alt} className="review-image-lightbox__img" draggable={false} />
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
