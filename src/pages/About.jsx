import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { usePageSeo } from '../utils/seo'
import './InfoPages.css'

export default function About() {
  usePageSeo({
    title: 'О нас — миссия bebochka',
    description:
      'bebochka: одежда для всей семьи, секонд хенд/сэконд, сток одежда и новая одежда. Миссия — качество, честные фото и доступные цены.',
    canonical: 'https://bebochka.ru/about',
    keywords:
      'о нас, миссия, одежда для всей семьи, сток одежда, новая одежда для всей семьи, одежда для детей, покупка одежды',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'bebochka',
      url: 'https://bebochka.ru/',
      description:
        'Одежда для всей семьи: секонд хенд, сэконд, сток одежда и новая одежда по доступным ценам.'
    }
  })

  return (
    <PageShell
      title="О нас"
      subtitle="bebochka — аккуратно отобранная одежда европейских брендов для всей семьи по доступным ценам."
    >
      <section className="info-block">
        <h2>Что важно для нас</h2>
        <ul>
          <li>Качественные и чистые вещи без неприятных сюрпризов.</li>
          <li>Честные фото и понятные описания состояния.</li>
          <li>Быстрая обратная связь по размерам, замерам и наличию.</li>
          <li>Бережный подход к бюджету: стильные вещи без переплаты.</li>
        </ul>
      </section>

      <section className="info-block">
        <h2>Как мы работаем</h2>
        <p>
          Мы вручную отбираем позиции, проверяем состояние, публикуем реальные фото и обновляем остатки в
          каталоге. Если товар временно забронирован, можно встать в очередь — как только бронь освободится,
          товар попадёт в вашу корзину.
        </p>
        <p>
          Подробная пошаговая инструкция по заказу, оплате и доставке — в разделе{' '}
          <Link to="/faq">FAQ</Link>.
        </p>
      </section>
    </PageShell>
  )
}
