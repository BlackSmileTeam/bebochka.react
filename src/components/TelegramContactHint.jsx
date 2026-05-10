import './TelegramContactHint.css'

const TELEGRAM_SUPPORT_URL = 'https://t.me/mamka_vseya_russi'

/**
 * Текст для посетителей: вопросы в Telegram, без отображения @username — только бренд и ссылка.
 */
export default function TelegramContactHint() {
  return (
    <p className="telegram-contact-hint">
      По всем вопросам —{' '}
      <a href={TELEGRAM_SUPPORT_URL} target="_blank" rel="noopener noreferrer">
        Bebochka
      </a>
      {' '}в Telegram.
    </p>
  )
}
