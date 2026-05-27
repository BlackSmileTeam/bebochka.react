import PageShell from '../components/PageShell'
import ContactChannelsLinks from '../components/ContactChannelsLinks'
import { CONTACT_VK_URL } from '../constants/contactLinks'
import './InfoPages.css'

export default function Delivery() {
  return (
    <PageShell
      title="Доставка"
      subtitle="Способ доставки согласуем после оплаты заказа — в переписке с вами."
    >
      <section className="info-block">
        <h2>Общий порядок</h2>
        <ol>
          <li>Оформите заказ на сайте и оплатите его (см. раздел FAQ).</li>
          <li>
            После подтверждения оплаты напишите нам в{' '}
            <a href={CONTACT_VK_URL} target="_blank" rel="noopener noreferrer">
              ВКонтакте
            </a>{' '}
            или в другом удобном канале (<ContactChannelsLinks />) — обсудим способ отправки.
          </li>
          <li>Мы упакуем заказ, отправим и передадим трек для отслеживания.</li>
          <li>После получения подтвердите заказ на сайте кнопкой «Получен» в профиле.</li>
        </ol>
      </section>

      <section className="info-block">
        <h2>Авито Доставка</h2>
        <ol>
          <li>После оплаты согласуем отправку через Авито.</li>
          <li>При необходимости оформите заказ на Авито по нашей подсказке — мы сопоставим его с заказом на сайте.</li>
          <li>Отправим посылку по правилам Авито Доставки и сообщим статус.</li>
        </ol>
      </section>

      <section className="info-block">
        <h2>Ozon Доставка</h2>
        <ol>
          <li>После оплаты согласуем отправку через Ozon.</li>
          <li>При необходимости оформите заказ в Ozon по нашей подсказке, чтобы привязать его к заказу с сайта.</li>
          <li>После отправки передадим вам данные для отслеживания.</li>
        </ol>
      </section>

      <section className="info-block">
        <h2>Важно</h2>
        <p>
          Перед отправкой сверяем состав заказа и данные получателя. Несколько позиций из одного заказа можно
          объединить в одну посылку — напишите об этом при согласовании доставки.
        </p>
        <p>Доставку оплачивает покупатель.</p>
        <p>Копить товары перед отправкой можно до 2 месяцев.</p>
      </section>
    </PageShell>
  )
}
