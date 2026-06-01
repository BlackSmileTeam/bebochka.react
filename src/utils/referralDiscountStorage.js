const STORAGE_KEY = 'bebochka-referral-discount'
const DECLINED_KIND_KEY = 'bebochka-referral-declined-kind'

export function getReferralDiscountSelection() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.kind) return null
    return parsed
  } catch {
    return null
  }
}

export function setReferralDiscountSelection(option) {
  if (!option?.kind) return
  clearDeclinedReferralKind()
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    referralId: option.referralId ?? null,
    kind: option.kind,
    label: option.label ?? '',
    forUserName: option.forUserName ?? null,
    discountPercent: option.discountPercent ?? 10,
  }))
}

export function clearReferralDiscountSelection() {
  sessionStorage.removeItem(STORAGE_KEY)
}

/** Пользователь отменил скидку этого типа — не подставлять её снова автоматически. */
export function getDeclinedReferralKind() {
  const k = sessionStorage.getItem(DECLINED_KIND_KEY)
  return k || null
}

export function setDeclinedReferralKind(kind) {
  if (!kind) return
  sessionStorage.setItem(DECLINED_KIND_KEY, String(kind))
}

export function clearDeclinedReferralKind() {
  sessionStorage.removeItem(DECLINED_KIND_KEY)
}

export function calcDiscountedTotal(total, percent = 10) {
  const p = Number(percent) || 10
  const t = Number(total) || 0
  return Math.round(t * (100 - p)) / 100
}
