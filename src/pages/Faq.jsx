import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import ContactChannelsLinks from '../components/ContactChannelsLinks'
import {
  CONTACT_TELEGRAM_CHANNEL_URL,
  CONTACT_VK_GROUP_URL,
  CONTACT_VK_URL
} from '../constants/contactLinks'
import './InfoPages.css'

export default function Faq() {
  return (
    <PageShell
      title="FAQ"
      subtitle="Как зарегистрироваться, оформить заказ, оплатить, получить посылку и оставить отзыв."
    >
      <section className="info-block">
        <h2>Как зарегистрироваться?</h2>
        <p>
          Перейдите на страницу{' '}
          <Link to="/account">входа и регистрации</Link> и войдите через{' '}
          <a href={CONTACT_VK_URL} target="_blank" rel="noopener noreferrer">
            ВКонтакте
          </a>{' '}
          или зарегистрируйтесь по номеру телефона с паролем. Без аккаунта оформить заказ не получится — так мы
          видим ваши заказы и статусы в личном кабинете.
        </p>
      </section>

      <section className="info-block">
        <h2>Как оформить заказ на сайте?</h2>
        <ol>
          <li>Добавьте нужные товары в корзину (кнопка «В корзину» на карточке).</li>
          <li>Откройте корзину, проверьте состав и перейдите к оформлению.</li>
          <li>Заполните контактные данные и нажмите кнопку оформления заказа.</li>
          <li>
            Заказ появится в профиле со статусом. Дальше — оплата и согласование доставки (см. ниже).
          </li>
        </ol>
        <p>
          Если кнопка «В корзину» ещё неактивна — на карточке идёт обратный отсчёт до открытия продажи.
          Следите за анонсами в{' '}
          <a href={CONTACT_VK_GROUP_URL} target="_blank" rel="noopener noreferrer">
            сообществе VK
          </a>{' '}
          и{' '}
          <a href={CONTACT_TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
            Telegram-канале
          </a>
          .
        </p>
      </section>

      <section className="info-block">
        <h2>Как оплатить заказ?</h2>
        <ol>
          <li>Откройте «Профиль» и найдите заказ со статусом «Ожидает оплату».</li>
          <li>
            Нажмите кнопку <strong>«К оплате»</strong> — откроется подсказка со способами связи.
          </li>
          <li>
            Напишите нам преимущественно в{' '}
            <a href={CONTACT_VK_URL} target="_blank" rel="noopener noreferrer">
              ВКонтакте
            </a>{' '}
            (укажите номер заказа с сайта). Кому удобнее — также <ContactChannelsLinks />.
          </li>
          <li>Мы пришлём реквизиты и подтвердим оплату — статус заказа обновится в профиле.</li>
        </ol>
      </section>

      <section className="info-block">
        <h2>Как согласовать доставку?</h2>
        <p>
          Способ доставки обсуждаем <strong>после оплаты</strong> в переписке. Доступны, в частности, Авито
          Доставка и отправка через Почту России по коду. Подробнее — в разделе{' '}
          <Link to="/delivery">Доставка</Link>.
        </p>
        <p>
          Несколько позиций из одного заказа можно объединить в одну посылку — напишите об этом при
          согласовании отправки.
        </p>
      </section>

      <section className="info-block">
        <h2>Как отслеживать заказ?</h2>
        <p>
          В профиле на сайте отображается текущий статус заказа. Раскройте блок{' '}
          <strong>«История статусов»</strong>, чтобы видеть все этапы: оформление, ожидание оплаты, оплата,
          отправка и т.д. При отправке передадим трек-номер или ссылку для отслеживания в удобном канале
          связи.
        </p>
      </section>

      <section className="info-block">
        <h2>Что сделать после получения посылки?</h2>
        <ol>
          <li>Когда заказ у вас на руках, зайдите в профиль на сайте.</li>
          <li>
            Нажмите кнопку <strong>«Получен»</strong> у соответствующего заказа.
          </li>
          <li>По желанию оставьте оценку и отзыв — это необязательно, но нам очень помогает.</li>
        </ol>
      </section>

      <section className="info-block">
        <h2>Товар забронирован. Что делать?</h2>
        <p>
          Если товар временно занят другим покупателем, нажмите «В очередь». Как только бронь освободится,
          товар автоматически попадёт в вашу корзину.
        </p>
      </section>

      <section className="info-block">
        <h2>Где смотреть анонсы новинок?</h2>
        <p>
          Накануне выкладки — анонс в{' '}
          <a href={CONTACT_VK_GROUP_URL} target="_blank" rel="noopener noreferrer">
            сообществе ВКонтакте
          </a>{' '}
          и{' '}
          <a href={CONTACT_TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
            Telegram-канале
          </a>
          . Затем на сайте появляются карточки с таймером до открытия кнопки заказа.
        </p>
      </section>

      <section className="info-block">
        <h2>Остались вопросы?</h2>
        <p>
          Если что-то непонятно — пишите, поможем и ответим. Удобнее всего в{' '}
          <a href={CONTACT_VK_URL} target="_blank" rel="noopener noreferrer">
            ВКонтакте
          </a>
          , также доступны <ContactChannelsLinks />.
        </p>
      </section>
    </PageShell>
  )
}
