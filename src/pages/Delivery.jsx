import PageShell from '../components/PageShell'
import ContactChannelsLinks from '../components/ContactChannelsLinks'
import './InfoPages.css'

export default function Delivery() {
  return (
    <PageShell
      title="Доставка"
      subtitle="Выберите удобный способ: 5Post, Авито Доставка или Почта России."
    >
      <section className="info-block">
        <h2>5Post</h2>
        <ol>
          <li>
            Напишите нам в удобном для вас канале связи (<ContactChannelsLinks />
            ).
          </li>
          <li>Мы подтвердим наличие, рассчитаем сумму и согласуем отправку.</li>
          <li>После оплаты оформим отправление через 5Post и передадим трек-данные.</li>
        </ol>
      </section>

      <section className="info-block">
        <h2>Авито Доставка</h2>
        <ol>
          <li>Для оформления через Авито сделайте заказ одной из позиций в вашем профиле.</li>
          <li>Отправьте нам ссылку/детали заказа, чтобы мы быстро сопоставили товары.</li>
          <li>Далее мы подтвердим заказ и отправим его по правилам Авито Доставки.</li>
        </ol>
      </section>

      <section className="info-block">
        <h2>Почта России по коду</h2>
        <ol>
          <li>Вы оформляете отправку на своей стороне и передаёте нам код отправления.</li>
          <li>Мы упаковываем заказ и отправляем товар по полученному коду.</li>
          <li>После отправки подтверждаем статус и передаём всю информацию по заказу.</li>
        </ol>
      </section>

      <section className="info-block">
        <h2>Важно</h2>
        <p>
          Перед отправкой всегда сверяем состав заказа и данные получателя. Если нужно объединить несколько позиций
          в одну посылку — просто напишите об этом заранее.
        </p>
      </section>
    </PageShell>
  )
}
