/** Цвета статусов заказа (как в фильтрах админки) */
export const ORDER_STATUS_COLORS = {
  'Формирование заказа': '#a0aec0',
  'Ожидает оплату': '#4299e1',
  'В сборке': '#ed8936',
  'На доставку': '#667eea',
  'Отправлен': '#48bb78',
  'Получен': '#2f855a',
  'Отменен': '#e53e3e',
}

const FALLBACK = '#718096'

export function getOrderStatusColor(status) {
  if (!status || typeof status !== 'string') return FALLBACK
  return ORDER_STATUS_COLORS[status.trim()] || FALLBACK
}

/** Стили для нативного select статуса: фон и текст как у фильтра */
export function getOrderStatusSelectSurfaceStyle(status) {
  const bg = getOrderStatusColor(status)
  return {
    backgroundColor: bg,
    color: '#ffffff',
    borderColor: bg,
  }
}

/** Стили пунктов выпадающего списка (поддержка зависит от браузера) */
export function getOrderStatusOptionStyle(statusKey) {
  const bg = getOrderStatusColor(statusKey)
  return {
    backgroundColor: bg,
    color: '#ffffff',
  }
}
