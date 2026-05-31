export function showToast(message, type = 'error') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('bebochka-toast', { detail: { type, message } }))
}
