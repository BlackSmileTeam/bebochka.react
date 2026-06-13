export function buildMailtoHref(email) {
  const trimmed = String(email || '').trim()
  return trimmed ? `mailto:${trimmed}` : null
}

export function AdminUserEmailLink({ email, className = '' }) {
  const value = String(email || '').trim()
  if (!value || value === '-') return value || '-'
  const href = buildMailtoHref(value)
  return href ? <a href={href} className={className}>{value}</a> : value
}

export function AdminUserPhoneLink({ phone, className = '' }) {
  const value = String(phone ?? '').trim()
  if (!value || value === '-') return value || '-'
  const digits = value.replace(/\D/g, '')
  const href = digits ? `tel:+${digits.startsWith('7') ? digits : `7${digits}`}` : null
  return href ? <a href={href} className={className}>{value}</a> : value
}
