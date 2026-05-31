import PageShell from '../components/PageShell'
import ContactChannelIcons from '../components/ContactChannelIcons'

export default function Contacts() {
  return (
    <PageShell
      title="Контакты"
      subtitle="Мы на связи в Telegram, ВКонтакте и на Avito — выберите удобный способ."
    >
      <ContactChannelIcons />
    </PageShell>
  )
}
