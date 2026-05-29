const METRIKA_ID = 109494790

let initialized = false

/**
 * Loads Yandex.Metrika after cookie notice acceptance (or if already accepted).
 */
export function initYandexMetrika() {
  if (typeof window === 'undefined' || initialized) return
  initialized = true

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
  })(window, document, 'script', `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`, 'ym')

  window.ym(METRIKA_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  })
}

export { METRIKA_ID }
