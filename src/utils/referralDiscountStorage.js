const STORAGE_KEY = 'bebochka-referral-discount'

export function getReferralDiscountSelection() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.referralId || !parsed?.kind) return null
    return parsed
  } catch {
    return null
  }
}

export function setReferralDiscountSelection(option) {
  if (!option?.referralId || !option?.kind) return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    referralId: option.referralId,
    kind: option.kind,
    label: option.label ?? '',
    forUserName: option.forUserName ?? null,
    discountPercent: option.discountPercent ?? 10,
  }))
}

export function clearReferralDiscountSelection() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function calcDiscountedTotal(total, percent = 10) {
  const p = Number(percent) || 10
  const t = Number(total) || 0
  return Math.round(t * (100 - p)) / 100
}
