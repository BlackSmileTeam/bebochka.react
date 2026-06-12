export const SITE_URL_RU = 'https://bebochka.ru'
export const SITE_URL_ONLINE = 'https://www.bebochka.online'

/** Канонический origin для SEO — по домену, на котором открыт сайт. */
export function getPublicSiteUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase()
    if (host === 'bebochka.online' || host === 'www.bebochka.online') return SITE_URL_ONLINE
    if (host === 'bebochka.ru' || host === 'www.bebochka.ru') return SITE_URL_RU
  }
  return SITE_URL_ONLINE
}
