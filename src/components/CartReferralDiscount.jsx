import {
  getReferralDiscountSelection,
  setReferralDiscountSelection,
  clearReferralDiscountSelection,
  calcDiscountedTotal,
} from '../utils/referralDiscountStorage'
import './CartReferralDiscount.css'

function formatRub(amount) {
  return `${Number(amount).toLocaleString('ru-RU')} ₽`
}

export function referralDiscountHint(option) {
  if (!option) return null
  if (option.kind === 'Referrer' && option.forUserName) {
    return `Скидка за приглашение: ${option.forUserName}`
  }
  if (option.kind === 'Referred' && option.forUserName) {
    return `По приглашению от ${option.forUserName}`
  }
  return null
}

export function ReferralDiscountTotals({ total, selection, className = '' }) {
  if (!selection) {
    return (
      <div className={`cart-referral-totals ${className}`.trim()}>
        <span>{formatRub(total)}</span>
      </div>
    )
  }
  const pct = selection.discountPercent ?? 10
  const finalTotal = calcDiscountedTotal(total, pct)
  return (
    <div className={`cart-referral-totals cart-referral-totals--discounted ${className}`.trim()}>
      <span className="cart-referral-totals__old">{formatRub(total)}</span>
      <span className="cart-referral-totals__new">{formatRub(finalTotal)}</span>
    </div>
  )
}

export default function CartReferralDiscountPanel({
  options,
  loading,
  total,
  selection: selectionProp,
  onSelectionChange,
  isAuthenticated = true,
  loadError = null,
  referredBy = null,
  referredDiscountAvailable = null,
  hasPriorOrders = false,
  loginHref = '/account?returnUrl=%2Fcart',
}) {
  const selection = selectionProp ?? getReferralDiscountSelection()

  const handleApply = (option) => {
    setReferralDiscountSelection(option)
    onSelectionChange?.(option)
  }

  const handleClear = () => {
    clearReferralDiscountSelection()
    onSelectionChange?.(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="cart-referral-panel cart-referral-panel--hint">
        <p className="cart-referral-panel__lead">
          Реферальная скидка −10% доступна после входа в аккаунт.
        </p>
        <a href={loginHref} className="btn btn-secondary cart-referral-panel__login-link">
          Войти в аккаунт
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="cart-referral-panel cart-referral-panel--hint">
        <p className="cart-referral-panel__lead">Проверяем доступные реферальные скидки…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="cart-referral-panel cart-referral-panel--hint">
        <p className="cart-referral-panel__lead cart-referral-panel__lead--error">{loadError}</p>
      </div>
    )
  }

  if (!options?.length && !selection) {
    if (referredBy?.code) {
      if (referredBy.discountUsed) {
        return (
          <div className="cart-referral-panel cart-referral-panel--hint">
            <p className="cart-referral-panel__lead">
              Код пригласившего <strong>{referredBy.code}</strong> уже использован — скидка −10% была применена в заказе.
            </p>
          </div>
        )
      }
      if (hasPriorOrders === true || referredDiscountAvailable === false) {
        return (
          <div className="cart-referral-panel cart-referral-panel--hint">
            <p className="cart-referral-panel__lead">
              Код <strong>{referredBy.code}</strong> сохранён в профиле. Скидка −10% на первый заказ — один раз.
              {hasPriorOrders
                ? ' В профиле уже есть заказ (даже «ожидает оплату») — эта скидка больше не применяется.'
                : ' Сейчас скидку применить нельзя — обновите страницу или напишите в поддержку.'}
            </p>
          </div>
        )
      }
      return null
    }
    return (
      <div className="cart-referral-panel cart-referral-panel--hint">
        <p className="cart-referral-panel__lead">
          Сейчас нет доступных реферальных скидок. Укажите код приглашения в профиле или пригласите друга.
        </p>
        <a href="/profile" className="cart-referral-panel__profile-link">
          Открыть профиль
        </a>
      </div>
    )
  }

  if (!options?.length && selection) {
    return (
      <div className="cart-referral-panel">
        <div className="cart-referral-panel__applied">
          <p className="cart-referral-panel__applied-title">Реферальный бонус −10% применён</p>
          {referralDiscountHint(selection) && (
            <p className="cart-referral-panel__applied-hint">{referralDiscountHint(selection)}</p>
          )}
          <ReferralDiscountTotals total={total} selection={selection} />
          <button type="button" className="cart-referral-panel__cancel" onClick={handleClear}>
            Отменить скидку
          </button>
        </div>
      </div>
    )
  }

  if (!options?.length) return null

  const hint = referralDiscountHint(selection)

  return (
    <div className="cart-referral-panel">
      {!selection ? (
        <>
          <p className="cart-referral-panel__lead">
            Выберите реферальную скидку −10% (в одном заказе — одна).
          </p>
          <div className="cart-referral-panel__options">
            {options.map((opt) => {
              const optHint = referralDiscountHint(opt)
              return (
                <button
                  key={`${opt.kind}-${opt.referralId}`}
                  type="button"
                  className="btn btn-secondary cart-referral-panel__apply-btn"
                  onClick={() => handleApply(opt)}
                >
                  <span className="cart-referral-panel__apply-label">{opt.label || 'Скидка −10%'}</span>
                  {optHint && (
                    <span className="cart-referral-panel__apply-hint">{optHint}</span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="cart-referral-panel__applied">
          <p className="cart-referral-panel__applied-title">Реферальный бонус −10% применён</p>
          {hint && <p className="cart-referral-panel__applied-hint">{hint}</p>}
          <ReferralDiscountTotals total={total} selection={selection} />
          <button type="button" className="cart-referral-panel__cancel" onClick={handleClear}>
            Отменить скидку
          </button>
        </div>
      )}
    </div>
  )
}
