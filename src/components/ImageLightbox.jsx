import './ImageLightbox.css'

export default function ImageLightbox({ src, alt = '', onClose }) {
  if (!src) return null
  return (
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
      <div className="review-image-lightbox__frame" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className="review-image-lightbox__img" />
      </div>
    </div>
  )
}
