import PageShell from '../components/PageShell'
import ContactChannelIcons from '../components/ContactChannelIcons'
import { usePageSeo } from '../utils/seo'
import { getPublicSiteUrl } from '../constants/siteUrl'

export default function Contacts() {
  usePageSeo({
    title: 'Контакты — bebochka',
    description:
      'Связаться с bebochka: Telegram, ВКонтакте, Avito. Поможем с заказом, размером и доставкой одежды для всей семьи.',
    canonical: `${getPublicSiteUrl()}/contacts`,
  })

  return (
    <PageShell
      title="Контакты"
      subtitle="Мы на связи в Telegram, ВКонтакте и на Avito — выберите удобный способ."
    >
      <ContactChannelIcons />
    </PageShell>
  )
}
