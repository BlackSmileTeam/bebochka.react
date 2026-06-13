/** id7911729911 в ссылке часто опечатка вместо короткого имени i7911729911 */
function normalizeVkPaymentScreen(screen) {
  const s = String(screen || '').trim()
  const typo = s.match(/^id(7\d{10})$/i)
  if (typo) return `i${typo[1]}`
  return s
}

/**
 * Короткое имя VK (например i7911729911) из URL профиля или write/im.
 */
export function extractVkScreenName(vkBaseUrl) {
  const raw = String(vkBaseUrl || '').trim()
  if (!raw) return ''

  try {
    const u = new URL(raw.split('?')[0])
    const parts = u.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1] || ''
    if (!last) return ''
    if (last === 'write' || last === 'im') {
      return normalizeVkPaymentScreen(parts[parts.length - 2] || '')
    }
    return normalizeVkPaymentScreen(last)
  } catch {
    const m = raw.match(/vk\.com\/(?:write\/)?([^\/?#&]+)/i)
    return m ? normalizeVkPaymentScreen(m[1]) : ''
  }
}

/**
 * Профиль VK: vk.com/{screen}
 */
export function buildVkPaymentHref(vkBaseUrl) {
  const screen = extractVkScreenName(vkBaseUrl) || 'bebochkaclub'
  return `https://vk.com/${encodeURIComponent(screen)}`
}
