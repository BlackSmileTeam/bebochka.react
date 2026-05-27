export function parseCartAvailableAt(raw) {
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getCartUnlockRemainingMs(cartAvailableAt) {
  if (!cartAvailableAt) return null
  return Math.max(0, cartAvailableAt.getTime() - Date.now())
}

export function formatCartCountdown(ms) {
  if (ms == null) return '—'
  if (ms <= 0) return '00:00:00'

  const totalSec = Math.ceil(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const pad = (n) => String(n).padStart(2, '0')
  const time = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  if (days > 0) return `${days}д ${time}`
  return time
}
