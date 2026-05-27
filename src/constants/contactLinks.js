/** Глобальные ссылки на каналы связи (сайт, оплата, футер). */
export const CONTACT_TELEGRAM_URL = 'https://t.me/mamka_vseya_russi'
export const CONTACT_VK_URL = 'https://vk.com/i7911729911'

const DEFAULT_CONTACT_AVITO_URL =
  'https://www.avito.ru/brands/8c3ad254fdd4134ab5f2e26821f8cba0'

export const CONTACT_AVITO_URL = (
  import.meta.env.VITE_CONTACT_AVITO_URL ||
  import.meta.env.VITE_PAYMENT_AVITO_URL ||
  DEFAULT_CONTACT_AVITO_URL
).trim()

export const CONTACT_TELEGRAM_LABEL = 'Telegram'
export const CONTACT_VK_LABEL = 'VK'
export const CONTACT_AVITO_LABEL = 'Avito'

export const CONTACT_CHANNELS = [
  { url: CONTACT_TELEGRAM_URL, label: CONTACT_TELEGRAM_LABEL },
  { url: CONTACT_VK_URL, label: CONTACT_VK_LABEL },
  { url: CONTACT_AVITO_URL, label: CONTACT_AVITO_LABEL }
]
