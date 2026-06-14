const METRIKA_ID_RU = 109494790
const METRIKA_ID_ONLINE = 109848412

let initialized = false

function getMetrikaId() {
  if (typeof window === 'undefined') return METRIKA_ID_ONLINE
  const host = window.location.hostname.toLowerCase()
  if (host === 'bebochka.ru' || host === 'www.bebochka.ru') return METRIKA_ID_RU
  return METRIKA_ID_ONLINE
}

function getMetrikaInitOptions(id) {
  if (id === METRIKA_ID_ONLINE) {
    return {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true,
    }
  }
  return {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  }
}

/** Яндекс.Метрика — только после принятия cookie (см. CookieNotice). */
export function initYandexMetrika() {
  if (typeof window === 'undefined' || initialized) return
  initialized = true

  const metrikaId = getMetrikaId()
  const initOptions = getMetrikaInitOptions(metrikaId)
  if (initOptions.ecommerce === 'dataLayer') {
    window.dataLayer = window.dataLayer || []
  }

  ;(function (m, e, t, r, i, k, a) {
    m[i] =
      m[i] ||
      function () {
        ;(m[i].a = m[i].a || []).push(arguments)
      }
    m[i].l = 1 * new Date()
    for (let j = 0; j < document.scripts.length; j++) {
      if (document.scripts[j].src === r) return
    }
    k = e.createElement(t)
    a = e.getElementsByTagName(t)[0]
    k.async = 1
    k.src = r
    a.parentNode.insertBefore(k, a)
  })(window, document, 'script', `https://mc.yandex.ru/metrika/tag.js?id=${metrikaId}`, 'ym')

  window.ym(metrikaId, 'init', initOptions)
}

export { METRIKA_ID_RU, METRIKA_ID_ONLINE, getMetrikaId }
