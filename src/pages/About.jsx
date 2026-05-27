import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import ContactChannelsLinks from '../components/ContactChannelsLinks'
import {
  CONTACT_TELEGRAM_CHANNEL_URL,
  CONTACT_VK_GROUP_URL,
  CONTACT_VK_URL
} from '../constants/contactLinks'
import './InfoPages.css'

export default function About() {
  return (
    <PageShell
      title="О нас"
      subtitle="bebochka — аккуратно отобранная одежда европейских брендов для всей семьи по доступным ценам."
    >
      <section className="info-block">
        <h2>Мы запустили сайт</h2>
        <p>
          Этот день настал — теперь заказы можно оформлять прямо на bebochka. Чтобы всему научиться и
          разобраться и вам, и нам, в каталоге сейчас выложены товары с максимальной скидкой — по сути,
          грандиозная распродажа на старте.
        </p>
      </section>

      <section className="info-block">
        <h2>Регистрация</h2>
        <p>
          Войти и зарегистрироваться на сайте можно через{' '}
          <a href={CONTACT_VK_URL} target="_blank" rel="noopener noreferrer">
            ВКонтакте
          </a>{' '}
          или по номеру телефона с паролем — на странице{' '}
          <Link to="/account">входа и регистрации</Link>.
        </p>
      </section>

      <section className="info-block">
        <h2>Анонсы и новинки</h2>
        <p>
          Важные объявления и «ананасы» теперь публикуем в{' '}
          <a href={CONTACT_VK_GROUP_URL} target="_blank" rel="noopener noreferrer">
            сообществе ВКонтакте
          </a>
          . Обзор новинок устроен так: накануне — анонс в{' '}
          <a href={CONTACT_VK_GROUP_URL} target="_blank" rel="noopener noreferrer">
            VK
          </a>{' '}
          и{' '}
          <a href={CONTACT_TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
            Telegram-канале
          </a>
          , затем на сайте появляются карточки товаров с таймером — кнопка «В корзину» откроется в
          указанное время.
        </p>
      </section>

      <section className="info-block">
        <h2>Связь и оплата</h2>
        <p>
          Связь со мной и оплата преимущественно через{' '}
          <a href={CONTACT_VK_URL} target="_blank" rel="noopener noreferrer">
            ВКонтакте
          </a>
          . Кому удобнее — можно держать связь и другими способами: <ContactChannelsLinks />.
        </p>
      </section>

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
