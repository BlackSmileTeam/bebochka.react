import PageShell from '../components/PageShell'
import ContactChannelsLinks from '../components/ContactChannelsLinks'
import { CONTACT_TELEGRAM_URL } from '../constants/contactLinks'
import './InfoPages.css'

export default function Faq() {
  return (
    <PageShell
      title="FAQ"
      subtitle="Ответы на самые частые вопросы по заказу, оплате, брони и доставке."
    >
      <section className="info-block">
        <h2>Как оформить заказ?</h2>
        <p>
          Добавьте товары в корзину и оформите заказ на сайте. Если нужна помощь с размером, состоянием или подбором —
          напишите нам в удобном для вас канале связи (<ContactChannelsLinks />
          ).
        </p>
      </section>

      <section className="info-block">
        <h2>Товар забронирован. Что делать?</h2>
        <p>
          Если товар временно занят другим покупателем, вы можете встать в очередь. Как только бронь освободится,
          товар можно будет забрать в порядке очереди.
        </p>
      </section>

      <section className="info-block">
        <h2>Какие способы доставки доступны?</h2>
        <p>
          Сейчас доступны 5Post, Авито Доставка и отправка через Почту России по коду. Подробные шаги — в разделе
          «Доставка».
        </p>
      </section>

      <section className="info-block">
        <h2>Можно объединить несколько вещей в одну отправку?</h2>
        <p>
          Да, конечно. Сообщите нам заранее, что нужно объединить позиции, и мы оформим всё одной посылкой.
        </p>
      </section>

      <section className="info-block">
        <h2>Где быстрее всего получить ответ?</h2>
        <p>
          Пишите в удобном канале связи (<ContactChannelsLinks />
          ). Чаще всего отвечаем в{' '}
          <a href={CONTACT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
            Telegram
          </a>
          .
        </p>
      </section>
    </PageShell>
  )
}
