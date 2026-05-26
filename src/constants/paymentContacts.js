/** Контакты для оплаты в модалке «К оплате» (профиль). */
export const PAYMENT_TELEGRAM_URL = 'https://t.me/mamka_vseya_russi'
/** Профиль администратора: vk.com/i7911729911 */
export const PAYMENT_VK_URL = 'https://vk.com/i7911729911'


const DEFAULT_PAYMENT_AVITO_URL =
  'https://www.avito.ru/brands/8c3ad254fdd4134ab5f2e26821f8cba0'

export const PAYMENT_AVITO_URL = (
  import.meta.env.VITE_PAYMENT_AVITO_URL || DEFAULT_PAYMENT_AVITO_URL
).trim()
