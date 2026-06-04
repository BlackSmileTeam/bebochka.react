import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { createPortal } from 'react-dom'

import { api } from '../services/api'

import { getSessionId } from '../utils/sessionId'

import { isKitPartInCart, normalizeKitParts, sortKitPartsForCartMenu } from '../utils/productKit'

import { useCart } from '../contexts/CartContext'

import CartCountdown, { useCartCountdown } from './CartCountdown'

import { CartButtonIcon } from './CatalogBuyButton'

import { ConfirmDialog } from './ConfirmDialog'

import './ProductKitCartControl.css'



function formatPrice(value) {

  const n = Number(value)

  if (!Number.isFinite(n)) return '—'

  return `${n.toLocaleString('ru-RU')} ₽`

}



export default function ProductKitCartControl({

  product,

  cartItems,

  onAddedToCart,

  onClose,

  cartUnlocked,

  cartAvailableRaw,

  variant = 'detail',

}) {

  const productId = product.id ?? product.Id

  const btnClass = variant === 'catalog' ? 'btn-buy' : 'btn-buy-detail'

  const [kitOptions, setKitOptions] = useState(null)

  const [loading, setLoading] = useState(true)

  const [menuOpen, setMenuOpen] = useState(false)

  const [menuStyle, setMenuStyle] = useState(null)

  const [busy, setBusy] = useState(false)

  const [confirmBundle, setConfirmBundle] = useState(false)

  const [error, setError] = useState('')

  const rootRef = useRef(null)

  const anchorRef = useRef(null)

  const menuRef = useRef(null)

  const sessionId = useMemo(() => getSessionId(), [])

  const { loadCart } = useCart()

  const { isExpired } = useCartCountdown(cartAvailableRaw)

  const unlocked = cartUnlocked || isExpired



  useEffect(() => {

    let active = true

    setLoading(true)

    api.getProductKitOptions(productId, sessionId)

      .then((data) => {

        if (active) setKitOptions(data)

      })

      .catch(() => {

        if (active) setKitOptions(null)

      })

      .finally(() => {

        if (active) setLoading(false)

      })

    return () => { active = false }

  }, [productId, sessionId, cartItems])



  const updateMenuPosition = useCallback(() => {

    const anchor = anchorRef.current

    if (!anchor) return

    const rect = anchor.getBoundingClientRect()

    const width = Math.max(rect.width, 240)

    const maxLeft = window.innerWidth - width - 8

    setMenuStyle({

      position: 'fixed',

      top: rect.bottom + 6,

      left: Math.max(8, Math.min(rect.left, maxLeft)),

      width,

      maxWidth: 320,

      zIndex: 10040,

    })

  }, [])



  useEffect(() => {

    if (!menuOpen) {

      setMenuStyle(null)

      return undefined

    }

    updateMenuPosition()

    window.addEventListener('scroll', updateMenuPosition, true)

    window.addEventListener('resize', updateMenuPosition)

    return () => {

      window.removeEventListener('scroll', updateMenuPosition, true)

      window.removeEventListener('resize', updateMenuPosition)

    }

  }, [menuOpen, updateMenuPosition])



  useEffect(() => {

    if (!menuOpen) return undefined

    const onDoc = (e) => {

      const target = e.target

      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return

      setMenuOpen(false)

    }

    document.addEventListener('mousedown', onDoc)

    return () => document.removeEventListener('mousedown', onDoc)

  }, [menuOpen])



  const inCartPartIds = useMemo(() => {

    const set = new Set()

    cartItems.forEach((item) => {

      const pid = item.productId ?? item.ProductId

      if (pid != null) set.add(Number(pid))

    })

    return set

  }, [cartItems])



  const isFullKitInCart = useMemo(() => {

    if (productId == null) return false

    if (inCartPartIds.has(Number(productId))) return true

    if (kitParts.length > 0 && kitParts.every((p) => isKitPartInCart(p, inCartPartIds))) return true

    return false

  }, [productId, inCartPartIds, kitParts])



  useEffect(() => {

    if (isFullKitInCart) setMenuOpen(false)

  }, [isFullKitInCart])



  const refreshOptions = async () => {

    const data = await api.getProductKitOptions(productId, sessionId)

    setKitOptions(data)

    return data

  }



  const kitParts = useMemo(() => {

    const fromOptions = normalizeKitParts(kitOptions?.parts ?? kitOptions?.Parts)

    if (fromOptions.length > 0) return fromOptions

    return normalizeKitParts(product?.kitParts ?? product?.KitParts)

  }, [kitOptions, product])



  const sortedKitParts = useMemo(

    () => sortKitPartsForCartMenu(kitParts, inCartPartIds),

    [kitParts, inCartPartIds],

  )



  const notifyAdded = () => {

    if (onAddedToCart) onAddedToCart()

    else if (onClose) onClose()

    else {

      window.dispatchEvent(new CustomEvent('bebochka-toast', {

        detail: { type: 'success', message: 'Добавлено в корзину' },

      }))

    }

  }



  const addPart = async (partProductId) => {

    setBusy(true)

    setError('')

    try {

      await api.addToCart(sessionId, partProductId, 1, 'part')

      await refreshOptions()

      await loadCart()

      setMenuOpen(false)

      notifyAdded()

    } catch (e) {

      setError(e.message || 'Не удалось добавить в корзину')

    } finally {

      setBusy(false)

    }

  }



  const addBundle = async () => {

    setConfirmBundle(false)

    setBusy(true)

    setError('')

    try {

      await api.addToCart(sessionId, productId, 1, 'bundle')

      await refreshOptions()

      await loadCart()

      setMenuOpen(false)

      notifyAdded()

    } catch (e) {

      setError(e.message || 'Не удалось добавить комплект')

    } finally {

      setBusy(false)

    }

  }



  const openMenu = async (event) => {

    event.stopPropagation()

    if (!unlocked || busy || isFullKitInCart) return

    if (!menuOpen) {

      try {

        await refreshOptions()

      } catch {

        /* keep cached / product kitParts fallback */

      }

    }

    setMenuOpen((v) => !v)

  }



  const handleMainClick = (event) => {

    event.stopPropagation()

    if (!unlocked || busy || !kitOptions || isFullKitInCart) return

    const canAddBundle = kitOptions.canAddFullKit ?? kitOptions.CanAddFullKit

    if (canAddBundle) {

      setConfirmBundle(true)

      return

    }

    openMenu(event)

  }



  const handleChevronClick = (event) => {

    openMenu(event)

  }



  if (loading && !kitOptions) {

    return (

      <button type="button" className={`${btnClass} btn-buy--locked`} disabled>

        Загрузка…

      </button>

    )

  }



  if (!kitOptions && kitParts.length === 0) {

    return null

  }



  if (isFullKitInCart) {

    return (

      <div

        ref={rootRef}

        className={`kit-cart-control${variant === 'catalog' ? ' kit-cart-control--catalog' : ''}`}

      >

        <button

          type="button"

          className={`${btnClass} kit-cart-control__btn kit-cart-control__btn--in-cart`}

          disabled

          title="Комплект уже в вашей корзине"

          onClick={(event) => event.stopPropagation()}

        >

          В корзине

        </button>

      </div>

    )

  }



  const partCount = kitOptions?.partCount ?? kitOptions?.PartCount ?? kitParts.length

  const bundleLabel = (kitOptions?.hasKitReservation ?? kitOptions?.HasKitReservation) ? 'бронь комплект' : 'комплект'

  const canBundle = kitOptions?.canAddFullKit ?? kitOptions?.CanAddFullKit

  const kitPrice = kitOptions?.kitPrice ?? kitOptions?.KitPrice ?? product?.kitPrice ?? product?.KitPrice ?? product?.price



  const confirmDialog = createPortal(

    <ConfirmDialog

      open={confirmBundle}

      title="Добавить комплект?"

      message={`Вы уверены, что хотите добавить в корзину комплект из ${partCount} вещей за ${formatPrice(kitPrice)}?`}

      confirmLabel="Добавить"

      cancelLabel="Отмена"

      variant="primary"

      busy={busy}

      onCancel={() => !busy && setConfirmBundle(false)}

      onConfirm={addBundle}

    />,

    document.body

  )



  const menuContent = (

    <>

      {canBundle && !isFullKitInCart && (

        <button

          type="button"

          className="kit-cart-control__option kit-cart-control__option--bundle"

          onClick={(event) => {

            event.stopPropagation()

            setConfirmBundle(true)

          }}

          disabled={busy}

        >

          <span>Весь комплект</span>

          <span className="kit-cart-control__option-price">{formatPrice(kitPrice)}</span>

        </button>

      )}

      {sortedKitParts.map((part) => {

        const partId = part.productId

        const partName = part.partName || '—'

        const inCart = isKitPartInCart(part, inCartPartIds)

        const reserved = part.isReservedByOthers

        return (

          <button

            key={partId}

            type="button"

            className={`kit-cart-control__option${inCart ? ' kit-cart-control__option--in-cart' : ''}${reserved ? ' kit-cart-control__option--reserved' : ''}`}

            disabled={busy || reserved || inCart || !partId}

            onClick={(event) => {

              event.stopPropagation()

              if (inCart) return

              addPart(partId)

            }}

          >

            <span>

              {partName}

              {inCart ? ' — в корзине' : ''}

              {reserved && !inCart ? ' — бронь' : ''}

            </span>

            <span className="kit-cart-control__option-price">{formatPrice(part.price)}</span>

          </button>

        )

      })}

      {sortedKitParts.length === 0 && (

        <p className="kit-cart-control__menu-empty">Состав комплекта не загружен</p>

      )}

    </>

  )



  const menuPortal = menuOpen && unlocked && menuStyle

    ? createPortal(

      <div

        ref={menuRef}

        className="kit-cart-control__menu kit-cart-control__menu--portal"

        style={menuStyle}

        role="listbox"

      >

        {menuContent}

      </div>,

      document.body

    )

    : null



  return (

    <div

      ref={rootRef}

      className={`kit-cart-control${variant === 'catalog' ? ' kit-cart-control--catalog' : ''}${menuOpen ? ' kit-cart-control--menu-open' : ''}`}

    >

      {error && <p className="kit-cart-control__error">{error}</p>}

      <div className="kit-cart-control__main">

        <div

          ref={anchorRef}

          className={`${btnClass} kit-cart-control__btn${!unlocked ? ' btn-buy--locked' : ''}`}

        >

          <button

            type="button"

            className="kit-cart-control__btn-main"

            disabled={!unlocked || busy}

            onClick={handleMainClick}

            title={canBundle ? 'Добавить весь комплект' : 'Выберите вещь из комплекта'}

          >

            {!unlocked ? (

              <CartCountdown cartAvailableRaw={cartAvailableRaw} />

            ) : (

              <span className="kit-cart-control__btn-inner">

                <CartButtonIcon />

                <span className="kit-cart-control__btn-label">

                  В корзину ({bundleLabel})

                </span>

              </span>

            )}

          </button>

          <button

            type="button"

            className="kit-cart-control__chevron"

            aria-label="Выбрать вещь из комплекта"

            aria-expanded={menuOpen}

            disabled={!unlocked || busy}

            onClick={handleChevronClick}

          >

            ▾

          </button>

        </div>

      </div>



      {menuOpen && unlocked && !menuStyle && (

        <div className="kit-cart-control__menu" role="listbox">

          {menuContent}

        </div>

      )}



      {menuPortal}

      {confirmDialog}

    </div>

  )

}


