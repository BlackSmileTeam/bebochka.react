import { formatCondition } from '../utils/formatCondition'
import './ProductMetaFilter.css'

const FIELD_META = {
  brand: { icon: '🏷️', label: 'Бренд' },
  size: { icon: '📏', label: 'Размер' },
  color: { icon: '🎨', label: 'Цвет' },
  gender: { icon: '👤', label: 'Пол' },
  condition: { icon: '✨', label: 'Состояние' },
}

function formatGender(gender) {
  if (!gender) return ''
  return gender.charAt(0).toUpperCase() + gender.slice(1)
}

export function formatMetaDisplay(field, value) {
  if (!value) return ''
  if (field === 'gender') return formatGender(value)
  if (field === 'condition') return formatCondition(value)
  return String(value)
}

/**
 * @param {'brand'|'size'|'color'|'gender'|'condition'} field
 * @param {string} [className]
 * @param {boolean} [empty] — placeholder slot in catalog grid
 */
export default function ProductMetaFilter({
  field,
  value,
  displayValue,
  onFilter,
  className = '',
  empty = false,
}) {
  const meta = FIELD_META[field]
  const raw = value != null ? String(value).trim() : ''
  const isEmpty = empty || !raw || raw === '-'

  if (isEmpty) {
    if (!empty) return null
    return (
      <span
        className={`product-meta-filter product-meta-filter--empty product-meta-item--empty ${className}`.trim()}
        aria-hidden="true"
      >
        {'\u00a0'}
      </span>
    )
  }

  const display = displayValue ?? formatMetaDisplay(field, raw)
  const content = (
    <>
      <span className="product-meta-filter__icon" aria-hidden="true">
        {meta.icon}
      </span>
      <span className="product-meta-filter__label">{meta.label}:</span>
      <span className="product-meta-filter__value">{display}</span>
    </>
  )

  if (onFilter) {
    return (
      <button
        type="button"
        className={`product-meta-filter product-meta-filter--clickable ${className}`.trim()}
        onClick={(e) => {
          e.stopPropagation()
          onFilter(field, raw)
        }}
        title={`Показать товары: ${display}`}
      >
        {content}
      </button>
    )
  }

  return <span className={`product-meta-filter ${className}`.trim()}>{content}</span>
}
