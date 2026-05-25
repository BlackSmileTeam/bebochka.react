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
 * @param {string} telegramBaseUrl — например https://t.me/mamka_vseya_russi
 * @param {string} orderLabel
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

/**
 * Короткое имя VK (например i7911729911) из URL профиля или write/im.
 * @param {string} vkBaseUrl
 * @returns {string}
 */
export function extractVkScreenName(vkBaseUrl) {
  const raw = String(vkBaseUrl || '').trim()
  if (!raw) return ''

  try {
    const u = new URL(raw)
    const parts = u.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1] || ''
    if (!last) return ''
    if (last === 'write' || last === 'im') {
      return parts[parts.length - 2] || ''
    }
    return last
  } catch {
    const m = raw.match(/vk\.com\/(?:write\/)?([^\/?#]+)/i)
    return m ? m[1] : ''
  }
}

/**
 * Диалог VK с черновиком: vk.com/write/{screen}?text=…
 * Для коротких имён (i7911729911) не используем im?sel= — иначе открывается список чатов.
 * @param {string} vkBaseUrl — профиль, например https://vk.com/i7911729911
 * @param {string} orderLabel
 */
export function buildVkPaymentHref(vkBaseUrl, orderLabel) {
  const screen = extractVkScreenName(vkBaseUrl)
  if (!screen) return String(vkBaseUrl || '').trim()

  const text = pickInvoiceRequestMessage(orderLabel)
  const encodedText = encodeURIComponent(text)
  const encodedScreen = encodeURIComponent(screen)

  return `https://vk.com/write/${encodedScreen}?text=${encodedText}`
}
