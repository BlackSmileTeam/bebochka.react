/**
 * Сообщения «прошу счёт по заказу» — случайный вариант из серии.
 * @param {string} orderLabel — номер заказа как показываем пользователю
 */
export function pickInvoiceRequestMessage(orderLabel) {
  const n = String(orderLabel || '').trim() || '—'
  const templates = [
    () => `Прошу выставить счёт по заказу ${n}.`,
    () => `Добрый день! Прошу выставить счёт по заказу ${n}.`,
    () => `Здравствуйте. Прошу выставить счёт по заказу ${n}.`,
    () => `Прошу выслать счёт на оплату по заказу ${n}.`,
    () => `Добрый день, прошу выставить счёт по заказу № ${n}.`,
    () => `Добрый день. Необходим счёт по заказу ${n}, спасибо.`,
  ]
  const i = Math.floor(Math.random() * templates.length)
  return templates[i]()
}

/**
 * https://t.me/username?text=… — открывает чат с черновиком сообщения (клиент / веб).
 */
export function buildTelegramPaymentHref(telegramBaseUrl, orderLabel) {
  const base = String(telegramBaseUrl || '').trim()
  if (!base) return base
  const text = pickInvoiceRequestMessage(orderLabel)
  try {
    const u = new URL(base)
    u.searchParams.set('text', text)
    return u.toString()
  } catch {
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}text=${encodeURIComponent(text)}`
  }
}

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
 * Диалог VK с черновиком: vk.com/write/{screen}?text=…
 * Для i7911729911 не используем im?sel= — на мобильном открывается список чатов.
 */
export function buildVkPaymentHref(vkBaseUrl, orderLabel) {
  const screen = extractVkScreenName(vkBaseUrl) || 'i7911729911'
  const text = pickInvoiceRequestMessage(orderLabel)
  return `https://vk.com/write/${encodeURIComponent(screen)}?text=${encodeURIComponent(text)}`
}
