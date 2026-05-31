export function buildMailtoHref(email) {
  const trimmed = String(email || '').trim()
  return trimmed ? `mailto:${trimmed}` : null
}

export function buildTelegramContactHref(user) {
  const tgId = user?.telegramUserId ?? user?.TelegramUserId
  if (tgId) return `tg://openmessage?user_id=${tgId}`

  const phone = user?.phone ?? user?.Phone
  if (!phone) return null

  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return null

  let normalized = digits
  if (digits.length === 11 && digits.startsWith('8')) normalized = `7${digits.slice(1)}`
  else if (digits.length === 10) normalized = `7${digits}`

  return `https://t.me/+${normalized}`
}

export function AdminUserEmailLink({ email, className = '' }) {
  const value = String(email || '').trim()
  if (!value || value === '-') return value || '-'
  const href = buildMailtoHref(value)
  return href ? <a href={href} className={className}>{value}</a> : value
}

export function AdminUserPhoneLink({ user, phone, className = '' }) {
  const value = String(phone ?? user?.phone ?? user?.Phone ?? '').trim()
  if (!value || value === '-') return value || '-'
  const href = buildTelegramContactHref(user ?? { phone: value })
  return href ? (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {value}
    </a>
  ) : value
}
