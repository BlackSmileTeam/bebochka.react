import { YANDEX_METRIKA_ENABLED, YANDEX_METRIKA_ID } from '../config/analytics.js'

/** Стандартный счётчик Яндекс.Метрики. Не грузится, пока YANDEX_METRIKA_ENABLED = false. */
export function initYandexMetrika() {
  if (!YANDEX_METRIKA_ENABLED || typeof window === 'undefined') return

  ;(function (m, e, t, r, i, k, a) {
    m[i] =
      m[i] ||
      function () {
        ;(m[i].a = m[i].a || []).push(arguments)
      }
    m[i].l = 1 * new Date()
    for (var j = 0; j < document.scripts.length; j++) {
      if (document.scripts[j].src === r) return
    }
    k = e.createElement(t)
    a = e.getElementsByTagName(t)[0]
    k.async = 1
    k.src = r
    a.parentNode.insertBefore(k, a)
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym')

  window.ym(YANDEX_METRIKA_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  })
}
