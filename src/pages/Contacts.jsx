import PageShell from '../components/PageShell'
import './Contacts.css'

export default function Contacts() {
  return (
    <PageShell
      title="Контакты"
      subtitle="Вопросы по заказам, размерам и наличию — пишите в Telegram, мы отвечаем как можно быстрее."
    >
      <section className="contacts-block">
        <h2>Telegram</h2>
        <p>
          <a href="https://t.me/mamka_vseya_russi" target="_blank" rel="noopener noreferrer">
            bebochkaa
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
    </PageShell>
  )
}
