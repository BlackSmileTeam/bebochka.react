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
 * VK: открыть диалог с предзаполненным текстом.
 * — vk.com/id123 → im?sel=123&text=
 * — vk.com/i791… (типичный ник) → im?sel=791…&text=
 * — только цифры в последнем сегменте → sel
 * — иначе vk.com/write/{screen}?text=
 */
export function buildVkPaymentHref(vkBaseUrl, orderLabel) {
  const base = String(vkBaseUrl || '').trim()
  if (!base) return base
  const text = pickInvoiceRequestMessage(orderLabel)
  let pathname = ''
  try {
    const u = new URL(base)
    pathname = u.pathname.replace(/^\//, '')
  } catch {
    return base
  }

  const encodedText = encodeURIComponent(text)

  if (pathname.startsWith('im')) {
    try {
      const u = new URL(base)
      u.searchParams.set('text', text)
      return u.toString()
    } catch {
      const sep = base.includes('?') ? '&' : '?'
      return `${base}${sep}text=${encodedText}`
    }
  }

  const seg = pathname.split('/').filter(Boolean).pop() || ''
  const idMatch = seg.match(/^id(\d+)$/i)
  if (idMatch) return `https://vk.com/im?sel=${idMatch[1]}&text=${encodedText}`

  const iMatch = seg.match(/^i(\d+)$/i)
  if (iMatch) return `https://vk.com/im?sel=${iMatch[1]}&text=${encodedText}`

  if (/^\d+$/.test(seg)) return `https://vk.com/im?sel=${seg}&text=${encodedText}`

  const screen = seg || pathname
  return `https://vk.com/write/${encodeURIComponent(screen)}?text=${encodedText}`
}
