import PageShell from '../components/PageShell'
import ContactChannelsLinks from '../components/ContactChannelsLinks'
import { Link } from 'react-router-dom'
import { usePageSeo } from '../utils/seo'
import { getPublicSiteUrl } from '../constants/siteUrl'
import './InfoPages.css'

export default function Delivery() {
  usePageSeo({
    title: 'Доставка одежды | bebochka',
    description:
      'Доставка одежды bebochka: согласование после оплаты, отправка через доступные сервисы и отслеживание заказа.',
    canonical: `${getPublicSiteUrl()}/delivery`,
    keywords:
      'доставка одежды, покупка одежды, одежда для всей семьи, секонд хенд, сэконд, сток одежда'
  })

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
            После подтверждения оплаты напишите нам в удобном вам канале связи: <ContactChannelsLinks />.
            Обсудим способ отправки.
          </li>
          <li>Мы упакуем заказ, отправим и передадим трек для отслеживания.</li>
          <li>После получения подтвердите заказ на сайте кнопкой «Получен» в профиле.</li>
        </ol>
        <p>
          Вернуться в <Link to="/">каталог</Link> и открыть нужную карточку товара можно в любой момент перед
          оформлением доставки.
        </p>
      </section>

      <section className="info-block">
        <h2>Способы доставки</h2>
      </section>

      <section className="info-block">
        <h2>Авито Доставка</h2>
        <p>Через Авито можно выбрать одного из перевозчиков:</p>
        <ul>
          <li>5post</li>
          <li>Яндекс Доставка</li>
          <li>Пункт Авито</li>
          <li>Почта России</li>
          <li>СДЭК</li>
        </ul>
        <ol>
          <li>После оплаты согласуем отправку и перевозчика в переписке.</li>
          <li>После согласования выберите удобный вариант доставки в Авито и оформите его.</li>
          <li>Всю информацию о вашем заказе вы сможете отслеживать в приложении Авито.</li>
        </ol>
      </section>

      <section className="info-block">
        <h2>Ozon</h2>
        <ol>
          <li>После оплаты согласуем отправку через Ozon.</li>
          <li>
            Для оформления доставки через Ozon нам потребуется ваш личный номер телефона, город и адрес
            удобного для вас пункта выдачи Ozon.
          </li>
          <li>После оформления в приложении Ozon у вас появится информация о заказе и штрих-код для получения.</li>
        </ol>
      </section>

      <section className="info-block">
        <h2>Важно</h2>
        <p>Перед отправкой сверяем состав заказа и данные получателя.</p>
        <p>Доставку оплачивает покупатель.</p>
        <p>Копить товары перед отправкой можно до 2 месяцев.</p>
      </section>
    </PageShell>
  )
}
