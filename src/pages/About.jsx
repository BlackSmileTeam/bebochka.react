import PageShell from '../components/PageShell'
import ContactChannelsLinks from '../components/ContactChannelsLinks'
import './InfoPages.css'

export default function About() {
  return (
    <PageShell
      title="О нас"
      subtitle="bebochka - аккуратно отобранная одежда европейских брендов для всей семьи по доступным ценам."
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
          Мы вручную отбираем позиции, проверяем состояние, публикуем реальные фото и обновляем остатки в каталоге.
          Если товар временно забронирован, можно встать в очередь.
        </p>
      </section>

      <section className="info-block">
        <h2>Контакты</h2>
        <p>
          По любым вопросам пишите в удобном для вас канале связи (<ContactChannelsLinks />
          ).
        </p>
      </section>
    </PageShell>
  )
}
