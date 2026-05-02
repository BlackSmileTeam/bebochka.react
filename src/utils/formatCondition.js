/**
 * Человекочитаемая подпись состояния товара (как в админке и каталоге).
 * @param {string|null|undefined} c
 * @returns {string}
 */
export function formatCondition(c) {
  if (c == null || String(c).trim() === '') return '-'
  const v = String(c).trim()
  if (v === 'новая' || v === 'новая вещь') return 'Новая вещь'
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
}
