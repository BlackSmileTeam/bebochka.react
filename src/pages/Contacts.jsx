import './Contacts.css'

export default function Contacts() {
  return (
    <div className="contacts-page">
      <div className="contacts-inner">
        <h1>Контакты</h1>
        <p className="contacts-lead">
          Вопросы по заказам, размерам и наличию — пишите в Telegram, мы отвечаем как можно быстрее.
        </p>

        <section className="contacts-block">
          <h2>Telegram</h2>
          <p>
            <a href="https://t.me/bebochkaa" target="_blank" rel="noopener noreferrer">
              @bebochkaa
            </a>
          </p>
        </section>

        <section className="contacts-block">
          <h2>Канал с новинками</h2>
          <p>
            <a href="https://t.me/bebochkasekond" target="_blank" rel="noopener noreferrer">
              t.me/bebochkasekond
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
