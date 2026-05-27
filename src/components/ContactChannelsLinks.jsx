import { CONTACT_CHANNELS } from '../constants/contactLinks'

const linkProps = {
  target: '_blank',
  rel: 'noopener noreferrer'
}

/**
 * Ссылки на Telegram, VK и Avito через запятую и «или» перед последним.
 */
export default function ContactChannelsLinks({ className = '' }) {
  return (
    <span className={className}>
      {CONTACT_CHANNELS.map((channel, index) => (
        <span key={channel.url}>
          {index > 0 && (index === CONTACT_CHANNELS.length - 1 ? ' или ' : ', ')}
          <a href={channel.url} {...linkProps}>
            {channel.label}
          </a>
        </span>
      ))}
    </span>
  )
}
