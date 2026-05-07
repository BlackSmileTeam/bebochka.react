/**
 * Человекочитаемая подпись состояния товара (как в админке и каталоге).
 * @param {string|null|undefined} c
 * @returns {string}
 */
export function formatCondition(c) {
  if (c == null || String(c).trim() === '') return '-'
  const v = String(c).trim().toLowerCase()
  if (v === 'новая' || v === 'новая вещь') return 'Новая вещь'
  if (v === 'состояние новой вещи') return 'Состояние новой вещи'
  if (v === 'очень хорошее') return 'Очень хорошее'
  if (v === 'отличное') return 'Отличное'
  if (v === 'хорошее') return 'Хорошее'
  if (v === 'недостаток') return 'Недостаток'
  return String(c).trim().charAt(0).toUpperCase() + String(c).trim().slice(1).toLowerCase()
}
