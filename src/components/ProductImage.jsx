export default function ProductImage({
  src,
  alt,
  className,
  width,
  height,
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
      title={title}
      onClick={onClick}
      onError={onError}
    />
  )
}
