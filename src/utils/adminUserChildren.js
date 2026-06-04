export function userDisplayName(user) {
  if (!user) return '—'
  return user.fullName || user.FullName || user.username || user.Username || '—'
}

export function normalizeUserChildren(data) {
  const rows = Array.isArray(data) ? data : []
  return rows.map((c) => ({
    id: c.id ?? c.Id,
    name: c.name ?? c.Name ?? '',
    dateOfBirth: c.dateOfBirth ?? c.DateOfBirth ?? null,
    clothingSize: c.clothingSize ?? c.ClothingSize ?? '',
    gender: c.gender ?? c.Gender ?? '',
    createdAt: c.createdAt ?? c.CreatedAt ?? null,
    updatedAt: c.updatedAt ?? c.UpdatedAt ?? null,
  }))
}

export function formatChildGender(g) {
  if (!g) return '—'
  const s = String(g).trim().toLowerCase()
  if (s === 'мальчик') return 'Мальчик'
  if (s === 'девочка') return 'Девочка'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatChildAge(dateOfBirth) {
  if (!dateOfBirth) return '—'
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return '—'
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years -= 1
  if (years < 0) return '—'
  if (years === 0) return 'до 1 года'
  if (years >= 5 && years % 10 === 1 && years % 100 !== 11) return `${years} год`
  if (years >= 2 && years <= 4) return `${years} года`
  if (years >= 2 && years % 10 >= 2 && years % 10 <= 4 && (years % 100 < 10 || years % 100 >= 20)) {
    return `${years} года`
  }
  return `${years} лет`
}
