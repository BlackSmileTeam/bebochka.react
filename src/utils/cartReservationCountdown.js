export const CART_RESERVE_MS = 24 * 60 * 60 * 1000

export function parseCartItemCreatedAt(raw) {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Earliest cart line `createdAt` → deadline = +24h */
export function getCartReservationDeadline(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return null
  let earliest = null
  for (const item of cartItems) {
    const d = parseCartItemCreatedAt(item.createdAt ?? item.CreatedAt)
    if (!d) continue
    if (!earliest || d.getTime() < earliest.getTime()) earliest = d
  }
  if (!earliest) return null
  return new Date(earliest.getTime() + CART_RESERVE_MS)
}

export function getCartReservationRemainingMs(deadline) {
  if (!(deadline instanceof Date) || Number.isNaN(deadline.getTime())) return null
  return deadline.getTime() - Date.now()
}

export function formatReservationCountdown(remainingMs) {
  if (remainingMs == null) return '—'
  if (remainingMs <= 0) return 'Время истекло'

  const totalSec = Math.floor(remainingMs / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Уровень срочности для цвета таймера (чем меньше времени, тем «краснее»). */
export function getReservationUrgencyLevel(remainingMs) {
  if (remainingMs == null || remainingMs <= 0) return 'expired'
  const ratio = remainingMs / CART_RESERVE_MS
  if (ratio > 0.25) return 'calm'
  if (ratio > 0.1) return 'warning'
  if (ratio > 1 / 48) return 'urgent' // ~30 мин при 24ч брони
  return 'critical'
}
