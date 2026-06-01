import {
  getReferralDiscountSelection,
  setReferralDiscountSelection,
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
  if (String(a.kind) !== String(b.kind)) return false
  const idA = a.referralId
  const idB = b.referralId
  if (idA == null || idB == null) return String(a.kind).toLowerCase() === 'referred'
  return Number(idA) === Number(idB)
}

/** Можно ли применить скидку «приглашённый» по данным профиля (без cart-discounts API). */
export function isReferredDiscountEligible(referralInfo) {
  const rb = referralInfo?.referredBy
  if (!rb?.code || rb.discountUsed) return false
  if (referralInfo.hasPriorOrders === true) return false
  if (referralInfo.referredDiscountAvailable === false) return false
  return true
}

/** Собрать опцию скидки «приглашённый» из профиля. */
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

/** Автовыбор скидки: для приглашённого на первый заказ — сразу −10%. */
export function resolveReferralSelection(options, referralInfo) {
  const merged = mergeCartReferralOptions(options, referralInfo)
  const stored = getReferralDiscountSelection()

  if (stored && merged.some((o) => optionsMatch(o, stored))) {
    const official = merged.find((o) => optionsMatch(o, stored))
    setReferralDiscountSelection(official)
    return official
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

/** Итоговая скидка для отображения (если state ещё не обновился). */
export function getDisplayReferralSelection(referralSelection, referralInfo) {
  if (referralSelection) return referralSelection
  return buildReferredCartOptionFromProfile(referralInfo)
}
