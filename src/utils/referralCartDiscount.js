import {
  getReferralDiscountSelection,
  setReferralDiscountSelection,
  getDeclinedReferralKind,
} from './referralDiscountStorage'

function buildReferredOption(rb) {
  const referralId = rb.referralId ?? rb.id ?? null
  return {
    referralId,
    kind: 'Referred',
    label: 'Скидка 10% — первый заказ по приглашению',
    forUserName: rb.referrerName ?? null,
    discountPercent: 10,
  }
}

function optionsMatch(a, b) {
  if (!a || !b) return false
  if (String(a.kind).toLowerCase() !== String(b.kind).toLowerCase()) return false
  const idA = a.referralId
  const idB = b.referralId
  if (idA == null || idB == null) return true
  return Number(idA) === Number(idB)
}

/** Можно ли применить скидку «приглашённый» по данным профиля. */
export function isReferredDiscountEligible(referralInfo) {
  const rb = referralInfo?.referredBy
  if (!rb?.code || rb.discountUsed) return false
  if (referralInfo.hasPriorOrders === true) return false
  if (referralInfo.referredDiscountAvailable === false) return false
  return true
}

export function buildReferredCartOptionFromProfile(referralInfo) {
  if (!isReferredDiscountEligible(referralInfo)) return null
  return buildReferredOption(referralInfo.referredBy)
}

export function mergeCartReferralOptions(apiOptions, referralInfo) {
  const list = Array.isArray(apiOptions) ? [...apiOptions] : []
  const fallback = buildReferredCartOptionFromProfile(referralInfo)
  if (!fallback) return list
  if (list.some((o) => String(o.kind).toLowerCase() === 'referred')) return list
  return [fallback, ...list]
}

/**
 * Автовыбор: по умолчанию скидка «приглашённый», если пользователь её не отменял.
 * После отмены — null, чтобы выбрать скидку «за приглашение» или оформить без скидки.
 */
export function resolveReferralSelection(options, referralInfo) {
  const merged = mergeCartReferralOptions(options, referralInfo)
  const stored = getReferralDiscountSelection()
  const declined = getDeclinedReferralKind()

  if (stored && merged.some((o) => optionsMatch(o, stored))) {
    const official = merged.find((o) => optionsMatch(o, stored))
    setReferralDiscountSelection(official)
    return official
  }

  if (declined) {
    return null
  }

  const referred = merged.find((o) => String(o.kind).toLowerCase() === 'referred')
  if (referred && isReferredDiscountEligible(referralInfo)) {
    setReferralDiscountSelection(referred)
    return referred
  }

  if (merged.length === 1) {
    setReferralDiscountSelection(merged[0])
    return merged[0]
  }

  return null
}
