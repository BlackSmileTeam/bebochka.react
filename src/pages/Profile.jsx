import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { getOrderStatusColor } from '../constants/orderStatusColors'
import { useCart } from '../contexts/CartContext'
import ProductDetail from '../components/ProductDetail'
import CatalogProductCard from '../components/CatalogProductCard'
import PageShell from '../components/PageShell'
import SizeMultiSelect, { parseSizeValue, joinSizeValue } from '../components/SizeMultiSelect'
import { buildCatalogFilterSearch, readAutoFilterEnabled } from '../utils/catalogFilters'
import { showToast } from '../utils/showToast'
import { buildTelegramPaymentHref, buildVkPaymentHref } from '../utils/paymentMessengerLinks'
import {
  PAYMENT_AVITO_URL,
  PAYMENT_TELEGRAM_URL,
  PAYMENT_VK_URL
} from '../constants/paymentContacts'
import { readFavoriteProductIds, toggleFavoriteProductId } from '../utils/favoritesStorage'
import { readProfileTab, saveProfileTab } from '../utils/profileTabStorage'
import './Profile.css'
import './Home.css'

const payAvitoHref = PAYMENT_AVITO_URL

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
      />
    </svg>
  )
}

function formatReferralInviteDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU')
}

function ReferralInvitedTable({ rows }) {
  if (!rows?.length) return null
  return (
    <div className="profile-referral-invited-table-wrap">
      <table className="profile-referral-invited-table">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Дата</th>
            <th>Скидка</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.referredName?.trim() || '—'}</td>
              <td>{formatReferralInviteDate(row.registeredAt ?? row.createdAt)}</td>
              <td>
                {row.referrerDiscountUsed ? 'недоступна' : 'доступна'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReferralMyCodeBlock({ code, onCopyCode, showHint = true }) {
  if (!code) return null
  return (
    <div className="profile-my-referral-code">
      <span className="profile-my-referral-code__label">Ваш код приглашения</span>
      <div className="profile-referral-code-wrap">
        <code className="profile-referral-code">{code}</code>
        <button
          type="button"
          className="profile-referral-copy-btn"
          onClick={() => onCopyCode(code)}
          title="Скопировать код"
          aria-label="Скопировать код"
        >
          <CopyIcon />
        </button>
      </div>
      {showHint && (
        <p className="profile-referral-share-hint">
          Передайте код любым удобным способом — получатель вставит его в поле «Код пригласившего» в своём профиле.
        </p>
      )}
    </div>
  )
}

function ProfileBtnIcon({ children }) {
  return (
    <span className="profile-btn-icon" aria-hidden="true">
      {children}
    </span>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path
        fill="currentColor"
        d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-7 8.73V17h2v-.27a2 2 0 1 0-2 0zM9 8V6a3 3 0 0 1 6 0v2H9z"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path
        fill="currentColor"
        d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z"
      />
    </svg>
  )
}

function ProfileSectionHint({ text }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const btnRef = useRef(null)
  const [popoverStyle, setPopoverStyle] = useState(null)

  const updatePopoverPosition = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.min(18 * 16, window.innerWidth - 32)
    const left = Math.max(16, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 16))
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const openUp = spaceBelow < 120 && rect.top > spaceBelow
    setPopoverStyle({
      top: openUp ? rect.top - 8 : rect.bottom + 8,
      left,
      width,
      transform: openUp ? 'translateY(-100%)' : undefined,
    })
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    if (!open) {
      setPopoverStyle(null)
      return undefined
    }
    updatePopoverPosition()
    window.addEventListener('scroll', updatePopoverPosition, true)
    window.addEventListener('resize', updatePopoverPosition)
    return () => {
      window.removeEventListener('scroll', updatePopoverPosition, true)
      window.removeEventListener('resize', updatePopoverPosition)
    }
  }, [open, updatePopoverPosition])

  const popoverNode = open && popoverStyle && typeof document !== 'undefined'
    ? createPortal(
        <span
          className="profile-section-hint__popover profile-section-hint__popover--portal"
          style={popoverStyle}
          role="tooltip"
        >
          {text}
        </span>,
        document.body
      )
    : null

  return (
    <span className="profile-section-hint" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className="profile-section-hint__btn"
        aria-label="Показать подсказку"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {popoverNode}
    </span>
  )
}

function getOrderItems(o) {
  return o.orderItems || o.OrderItems || []
}

function getStatusHistory(o) {
  const h = o.statusHistory || o.StatusHistory
  return Array.isArray(h) ? h : []
}

function formatPhoneDisplay(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`
  }
  const trimmed = String(phone || '').trim()
  return trimmed || ''
}

function getUserPhone(user) {
  const fromField = formatPhoneDisplay(user.phone || user.Phone || '')
  if (fromField) return fromField
  const username = String(user.username || user.Username || '').trim()
  const m = username.match(/^u_(\d{11})$/)
  if (m?.[1]?.startsWith('7')) return formatPhoneDisplay(`+${m[1]}`)
  return ''
}

function formatChildGender(g) {
  if (!g) return '—'
  const s = String(g).trim().toLowerCase()
  if (s === 'мальчик') return 'Мальчик'
  if (s === 'девочка') return 'Девочка'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatChildAge(dateOfBirth) {
  if (!dateOfBirth) return ''
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return ''
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years -= 1
  if (years < 0) return ''
  if (years === 0) return 'до 1 года'
  if (years >= 5 && years % 10 === 1 && years % 100 !== 11) return `${years} год`
  if (years >= 2 && years <= 4) return `${years} года`
  if (years >= 2 && years % 10 >= 2 && years % 10 <= 4 && (years % 100 < 10 || years % 100 >= 20)) return `${years} года`
  return `${years} лет`
}

function toDateInputValue(raw) {
  if (!raw) return ''
  const s = String(raw).trim()
  const dateOnly = s.match(/^(\d{4}-\d{2}-\d{2})/)
  if (dateOnly) return dateOnly[1]
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const EMPTY_CHILD_FORM = { name: '', dateOfBirth: '', clothingSize: '', gender: 'мальчик' }

const REFERRAL_RULES_FALLBACK =
  'Пригласи друга — получи скидку 10%. Поделитесь своим личным кодом. И вы, и тот, кого вы пригласили, получите скидку 10% от всей суммы заказа.'

function ReferralRulesContent() {
  return (
    <div className="profile-referral-rules">
      <p className="profile-referral-rules__lead">
        <strong>Пригласи друга — получи скидку 10%</strong>
      </p>
      <p className="profile-referral-rules__text">
        Поделитесь своим личным кодом. И вы, и тот, кого вы пригласили, получите скидку 10% от всей
        суммы заказа.
      </p>
      <p className="profile-referral-rules__heading">Как это работает:</p>
      <ul className="profile-referral-rules__list">
        <li>
          Вы получаете 10% за каждого приглашённого друга. Количество друзей не ограничено.
        </li>
        <li>
          Скидки не суммируются в одном заказе (но каждый следующий заказ можно оформлять с новой
          скидкой за другого друга).
        </li>
        <li>
          Условие: приглашённым может быть только новый пользователь, у которого нет ранее совершённых
          заказов и который не был нашим покупателем в Telegram-канале
        </li>
      </ul>
    </div>
  )
}

function Profile() {
  const location = useLocation()
  const navigate = useNavigate()
  const orderPlacedState = location.state?.orderPlaced ? location.state : null
  const { sessionId, cartItems } = useCart()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailProduct, setDetailProduct] = useState(null)
  const [detailLoadingId, setDetailLoadingId] = useState(null)
  const [receiveFormOrderId, setReceiveFormOrderId] = useState(null)
  const [formRating, setFormRating] = useState('')
  const [formComment, setFormComment] = useState('')
  const [markSubmittingId, setMarkSubmittingId] = useState(null)
  const [thankYouByOrderId, setThankYouByOrderId] = useState({})
  const [expandedItemsOrderIds, setExpandedItemsOrderIds] = useState(new Set())
  const [expandedHistoryOrderIds, setExpandedHistoryOrderIds] = useState(new Set())
  const [paymentHintOrderId, setPaymentHintOrderId] = useState(null)
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', phone: '', dateOfBirth: '' })
  const [autoFilterByChildren, setAutoFilterByChildren] = useState(false)
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [hasVkLogin, setHasVkLogin] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [children, setChildren] = useState([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [childFormOpen, setChildFormOpen] = useState(false)
  const [editingChildId, setEditingChildId] = useState(null)
  const [childForm, setChildForm] = useState(EMPTY_CHILD_FORM)
  const [childSaving, setChildSaving] = useState(false)
  const [childDeleteTarget, setChildDeleteTarget] = useState(null)
  const [childDeleting, setChildDeleting] = useState(false)
  const [sizeOptions, setSizeOptions] = useState([])
  const [referralModalOpen, setReferralModalOpen] = useState(false)
  const [referralInfo, setReferralInfo] = useState(null)
  const [referralLoading, setReferralLoading] = useState(false)
  const [referrerCodeInput, setReferrerCodeInput] = useState('')
  const [referralBusy, setReferralBusy] = useState(false)
  const [activeTab, setActiveTab] = useState(() => readProfileTab())
  const [favoriteProductIds, setFavoriteProductIds] = useState(() => readFavoriteProductIds())
  const [favoriteProducts, setFavoriteProducts] = useState([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const syncProfileFormFromUser = (u) => {
    setProfileForm({
      fullName: String(u?.fullName ?? u?.FullName ?? '').trim(),
      email: String(u?.email ?? u?.Email ?? '').trim(),
      phone: getUserPhone(u || {}),
      dateOfBirth: toDateInputValue(u?.dateOfBirth ?? u?.DateOfBirth),
    })
  }

  const loadProfile = async () => {
    try {
      const p = await api.getMyProfile()
      syncProfileFormFromUser(p)
      setHasVkLogin(!!(p.hasVkLogin ?? p.HasVkLogin))
      setAutoFilterByChildren(readAutoFilterEnabled(p))
    } catch {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}')
        syncProfileFormFromUser(u)
        setHasVkLogin(!!(u.vkUserId ?? u.VkUserId))
        setAutoFilterByChildren(readAutoFilterEnabled(u))
      } catch (_) {}
    }
  }

  const loadChildren = async () => {
    setChildrenLoading(true)
    try {
      const list = await api.getMyChildren()
      setChildren(Array.isArray(list) ? list : [])
    } catch {
      setChildren([])
    } finally {
      setChildrenLoading(false)
    }
  }

  const loadOrders = async () => {
    const data = await api.getMyOrders()
    setOrders(Array.isArray(data) ? data : [])
  }

  const loadFavoriteProducts = useCallback(async () => {
    const token = localStorage.getItem('authToken')
    const ids = token ? await api.getMyFavoriteProductIds() : readFavoriteProductIds()
    setFavoriteProductIds(ids)
    if (!ids.length) {
      setFavoriteProducts([])
      return
    }
    setFavoritesLoading(true)
    try {
      const allProducts = await api.getProducts(sessionId)
      const byId = new Map((Array.isArray(allProducts) ? allProducts : []).map((p) => [p.id, p]))
      const list = ids
        .map((id) => byId.get(id))
        .filter(Boolean)
      setFavoriteProducts(list)
    } catch {
      setFavoriteProducts([])
    } finally {
      setFavoritesLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await Promise.all([loadOrders(), loadProfile(), loadChildren(), loadReferralInfo()])
      } catch (e) {
        if (!cancelled) setError(e.message || 'Не удалось загрузить заказы')
      } finally {
        if (!cancelled) setLoading(false)
      }
      if (!cancelled) {
        loadFavoriteProducts().catch(() => {})
      }
    })()
    return () => { cancelled = true }
  }, [loadFavoriteProducts])

  useEffect(() => {
    saveProfileTab(activeTab)
  }, [activeTab])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const products = await api.getProducts(sessionId)
        if (cancelled) return
        const sizes = [...new Set((Array.isArray(products) ? products : []).map((p) => p.size).filter(Boolean))]
          .sort((a, b) => String(a).localeCompare(String(b), 'ru', { numeric: true }))
        setSizeOptions(sizes)
      } catch {
        if (!cancelled) setSizeOptions([])
      }
    })()
    return () => { cancelled = true }
  }, [sessionId])

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/logo.jpg'
    if (imagePath.startsWith('http')) return imagePath
    return `${apiUrl}${imagePath}`
  }

  const openProductDetail = async (productId) => {
    if (productId == null) return
    setDetailLoadingId(productId)
    try {
      const p = await api.getProduct(productId, sessionId)
      setDetailProduct(p)
    } catch (e) {
      showToast(e?.message || 'Не удалось загрузить карточку товара')
    } finally {
      setDetailLoadingId(null)
    }
  }

  const goToCatalogFilter = (key, value) => {
    navigate(buildCatalogFilterSearch({ [key]: key === 'size' ? [value] : value }))
    setDetailProduct(null)
  }

  const getAvailableQuantity = (product) =>
    product.availableQuantity !== undefined ? product.availableQuantity : (product.quantityInStock || 0)

  const getCartQuantity = (productId) => {
    const cartItem = cartItems.find((item) => item.productId === productId)
    return cartItem ? cartItem.quantity : 0
  }

  const startReceiveFlow = (orderId) => {
    setReceiveFormOrderId(orderId)
    setFormRating('')
    setFormComment('')
  }

  const cancelReceiveFlow = () => {
    setReceiveFormOrderId(null)
    setFormRating('')
    setFormComment('')
  }

  const toggleOrderItems = (orderId) => {
    setExpandedItemsOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const toggleStatusHistory = (orderId) => {
    setExpandedHistoryOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const submitMarkReceived = async (orderId) => {
    const hadFeedback =
      (formRating !== '' && formRating != null) ||
      (formComment && String(formComment).trim().length > 0)
    try {
      setMarkSubmittingId(orderId)
      const updated = await api.markMyOrderReceived(orderId, {
        rating: formRating === '' ? null : formRating,
        comment: formComment
      })
      setOrders((prev) =>
        prev.map((row) => {
          const id = row.id ?? row.Id
          const newId = updated?.id ?? updated?.Id
          if (id === orderId && newId != null) return { ...row, ...updated }
          return row
        })
      )
      cancelReceiveFlow()
      setThankYouByOrderId((prev) => ({
        ...prev,
        [orderId]: { hadFeedback }
      }))
    } catch (e) {
      showToast(e?.message || 'Не удалось подтвердить получение')
    } finally {
      setMarkSubmittingId(null)
    }
  }

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()

  const saveProfile = async () => {
    setProfileSaving(true)
    setProfileMsg('')
    const savedAutoFilter = autoFilterByChildren
    try {
      const updated = await api.updateMyProfile({
        fullName: profileForm.fullName.trim() || null,
        email: profileForm.email.trim() || null,
        phone: profileForm.phone.trim() || null,
        autoFilterByChildren: savedAutoFilter,
        dateOfBirth: profileForm.dateOfBirth.trim() || null,
      })
      const af = updated.autoFilterByChildren ?? updated.AutoFilterByChildren
      setAutoFilterByChildren(af !== undefined ? !!af : savedAutoFilter)
      if (savedAutoFilter !== undefined) {
        localStorage.setItem('bebochka-auto-filter-by-children', savedAutoFilter ? '1' : '0')
      }
      syncProfileFormFromUser(updated)
      setProfileEditing(false)
      setProfileMsg('Данные сохранены')
      await loadProfile()
    } catch (e) {
      const msg = e.message || 'Не удалось сохранить'
      setProfileMsg(msg)
      showToast(msg)
    } finally {
      setProfileSaving(false)
    }
  }

  const openPasswordModal = () => {
    setPasswordForm({ current: '', next: '', confirm: '' })
    setPasswordModalOpen(true)
  }

  const closePasswordModal = () => {
    setPasswordModalOpen(false)
    setPasswordForm({ current: '', next: '', confirm: '' })
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (!passwordForm.current || !passwordForm.next) {
      showToast('Заполните текущий и новый пароль')
      return
    }
    if (passwordForm.next.length < 6) {
      showToast('Новый пароль должен быть не короче 6 символов')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      showToast('Новый пароль и подтверждение не совпадают')
      return
    }
    setPasswordSaving(true)
    try {
      await api.changeMyPassword(passwordForm.current, passwordForm.next)
      closePasswordModal()
      showToast('Пароль изменён', 'success')
    } catch (err) {
      showToast(err.message || 'Не удалось сменить пароль')
    } finally {
      setPasswordSaving(false)
    }
  }

  const openChildForm = (child = null) => {
    if (child) {
      setEditingChildId(child.id ?? child.Id)
      setChildForm({
        name: child.name ?? child.Name ?? '',
        dateOfBirth: toDateInputValue(child.dateOfBirth ?? child.DateOfBirth),
        clothingSize: child.clothingSize ?? child.ClothingSize ?? '',
        gender: (child.gender ?? child.Gender ?? 'мальчик').toLowerCase(),
      })
    } else {
      setEditingChildId(null)
      setChildForm(EMPTY_CHILD_FORM)
    }
    setChildFormOpen(true)
  }

  const closeChildForm = () => {
    setChildFormOpen(false)
    setEditingChildId(null)
    setChildForm(EMPTY_CHILD_FORM)
  }

  const saveChild = async (e) => {
    e.preventDefault()
    if (!childForm.name.trim() || !parseSizeValue(childForm.clothingSize).length || !childForm.dateOfBirth) {
      showToast('Заполните имя, дату рождения и размер')
      return
    }
    const todayLocal = new Date()
    const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`
    if (childForm.dateOfBirth > todayStr) {
      showToast('Дата рождения не может быть в будущем')
      return
    }
    if (profileForm.dateOfBirth && childForm.dateOfBirth <= profileForm.dateOfBirth) {
      showToast('Ребёнок не может быть старше родителя — укажите вашу дату рождения в «Мои данные»')
      return
    }
    setChildSaving(true)
    try {
      const payload = {
        name: childForm.name.trim(),
        dateOfBirth: childForm.dateOfBirth,
        clothingSize: joinSizeValue(parseSizeValue(childForm.clothingSize)),
        gender: childForm.gender,
      }
      if (editingChildId != null) {
        await api.updateMyChild(editingChildId, payload)
      } else {
        await api.createMyChild(payload)
      }
      closeChildForm()
      await loadChildren()
    } catch (err) {
      showToast(err.message || 'Не удалось сохранить')
    } finally {
      setChildSaving(false)
    }
  }

  const openChildDeleteConfirm = (child) => {
    const id = child.id ?? child.Id
    const name = (child.name ?? child.Name ?? '').trim() || 'ребёнка'
    setChildDeleteTarget({ id, name })
  }

  const closeChildDeleteConfirm = () => {
    if (childDeleting) return
    setChildDeleteTarget(null)
  }

  const confirmRemoveChild = async () => {
    if (!childDeleteTarget?.id) return
    setChildDeleting(true)
    try {
      await api.deleteMyChild(childDeleteTarget.id)
      setChildDeleteTarget(null)
      await loadChildren()
      showToast('Ребёнок удалён', 'success')
    } catch (err) {
      showToast(err.message || 'Не удалось удалить')
    } finally {
      setChildDeleting(false)
    }
  }

  const loadReferralInfo = async () => {
    setReferralLoading(true)
    try {
      const info = await api.getMyReferralInfo()
      setReferralInfo(info)
    } catch (err) {
      setReferralInfo((prev) => prev ?? {
        rules: REFERRAL_RULES_FALLBACK,
        canApplyReferrerCode: orders.length === 0,
        referredBy: null,
        myCode: null,
      })
      if (!referralModalOpen) {
        // silent on initial load if backend not deployed yet
      } else {
        showToast(err.message || 'Не удалось загрузить реферальную программу')
      }
    } finally {
      setReferralLoading(false)
    }
  }

  const openReferralModal = async () => {
    setReferralModalOpen(true)
    setReferrerCodeInput('')
    await loadReferralInfo()
  }

  const closeReferralModal = () => {
    setReferralModalOpen(false)
    setReferrerCodeInput('')
  }

  const handleGenerateReferralCode = async () => {
    setReferralBusy(true)
    try {
      const { code } = await api.generateMyReferralCode()
      if (code) {
        setReferralInfo((prev) => ({
          ...(prev || {}),
          myCode: code,
          canGenerateCode: false,
        }))
      }
      await loadReferralInfo()
      showToast('Код приглашения создан', 'success')
    } catch (err) {
      showToast(err.message || 'Не удалось создать код')
    } finally {
      setReferralBusy(false)
    }
  }

  const handleApplyReferrerCode = async (e) => {
    e.preventDefault()
    if (!referrerCodeInput.trim()) {
      showToast('Введите код пригласившего')
      return
    }
    setReferralBusy(true)
    try {
      await api.applyReferrerCode(referrerCodeInput.trim())
      setReferrerCodeInput('')
      await loadReferralInfo()
      showToast('Код пригласившего сохранён', 'success')
    } catch (err) {
      showToast(err.message || 'Не удалось применить код')
    } finally {
      setReferralBusy(false)
    }
  }

  const copyReferralCode = async (code) => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      showToast('Код скопирован', 'success')
    } catch {
      showToast('Не удалось скопировать код')
    }
  }

  const displayName = (() => {
    const fullName = (profileForm.fullName || user.fullName || user.FullName || '').trim()
    if (fullName) return fullName
    const username = (user.username || user.Username || '').trim()
    if (username && !username.startsWith('u_')) return username
    return ''
  })()
  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('bebochka-auth'))
    window.location.href = '/'
  }

  const profileEmail = profileForm.email || String(user.email || user.Email || '').trim()
  const profilePhone = profileForm.phone || getUserPhone(user)
  const profileUserInfo = (
    <div className="profile-user-info">
      {displayName && <p className="profile-user-name">{displayName}</p>}
      {profileEmail && <p className="profile-user-email">{profileEmail}</p>}
      {profilePhone && <p className="profile-user-phone">{profilePhone}</p>}
    </div>
  )

  const paymentHintOrder =
    paymentHintOrderId == null
      ? null
      : orders.find((row) => (row.id ?? row.Id) === paymentHintOrderId)
  const paymentHintOrderNumber =
    paymentHintOrder != null
      ? (paymentHintOrder.orderNumber ?? paymentHintOrder.OrderNumber ?? String(paymentHintOrderId))
      : ''

  const paymentContactOrderLabel =
    String(paymentHintOrderNumber || '').trim() ||
    (paymentHintOrderId != null ? String(paymentHintOrderId) : '')
  const paymentTelegramHrefWithDraft =
    paymentHintOrderId != null
      ? buildTelegramPaymentHref(PAYMENT_TELEGRAM_URL, paymentContactOrderLabel)
      : PAYMENT_TELEGRAM_URL
  const paymentVkHrefWithDraft =
    paymentHintOrderId != null
      ? buildVkPaymentHref(PAYMENT_VK_URL, paymentContactOrderLabel)
      : PAYMENT_VK_URL

  const showReferrerInput =
    orders.length === 0
    && !referralInfo?.referredBy
    && referralInfo?.canApplyReferrerCode !== false

  const copyPaymentOrderNumber = async () => {
    const text = String(paymentHintOrderNumber || '').trim()
    if (!text) return
    const notify = (type, message) => {
      window.dispatchEvent(new CustomEvent('bebochka-toast', { detail: { type, message } }))
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      notify('success', 'Номер заказа скопирован')
    } catch {
      notify('error', 'Не удалось скопировать номер')
    }
  }

  const handleToggleFavorite = (productId) => {
    const token = localStorage.getItem('authToken')
    ;(async () => {
      try {
        if (token) {
          await api.removeProductFromFavorites(productId)
          setFavoriteProductIds((prev) => prev.filter((id) => id !== productId))
        } else {
          const { ids } = toggleFavoriteProductId(productId)
          setFavoriteProductIds(ids)
        }
        setFavoriteProducts((prev) => prev.filter((p) => p.id !== productId))
        showToast('Товар убран из избранного', 'success')
      } catch (error) {
        showToast(error?.message || 'Не удалось обновить избранное')
      }
    })()
  }

  const profileTabs = useMemo(() => ([
    { key: 'orders', label: `Заказы${orders.length ? ` (${orders.length})` : ''}` },
    { key: 'favorites', label: `Избранное${favoriteProductIds.length ? ` (${favoriteProductIds.length})` : ''}` },
    { key: 'settings', label: 'Профиль' },
  ]), [orders.length, favoriteProductIds.length])

  return (
    <>
      <PageShell title="Профиль" className="page-shell--catalog" subtitle={profileUserInfo}>
        <div className="profile-modern-tabs" role="tablist" aria-label="Разделы профиля">
          {profileTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`profile-modern-tab${activeTab === tab.key ? ' profile-modern-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'settings' && (
        <div className="profile-top-grid">
          <section className="profile-panel profile-panel--children">
            <div className="profile-panel-head">
              <div className="profile-section-title-wrap">
                <h2 className="profile-section-title">Дети</h2>
                <ProfileSectionHint text="Сохраните размер и пол ребёнка — так проще подбирать одежду в каталоге." />
              </div>
              <button type="button" className="profile-btn-secondary profile-btn-with-icon" onClick={() => openChildForm()}>
                <ProfileBtnIcon><PlusIcon /></ProfileBtnIcon>
                Добавить
              </button>
            </div>
            <p className="profile-panel-hint profile-panel-hint--desktop">
              Сохраните размер и пол ребёнка — так проще подбирать одежду в каталоге.
            </p>
            {childrenLoading ? (
              <p className="profile-muted">Загрузка…</p>
            ) : children.length === 0 ? (
              <p className="profile-muted">Пока нет сохранённых детей.</p>
            ) : (
              <ul className="profile-children-list">
                {children.map((c) => {
                  const id = c.id ?? c.Id
                  const dob = c.dateOfBirth ?? c.DateOfBirth
                  return (
                    <li key={id} className="profile-child-card">
                      <div className="profile-child-main">
                        <strong>{c.name ?? c.Name}</strong>
                        <span>
                          {formatChildGender(c.gender ?? c.Gender)}
                          {dob ? ` · ${formatChildAge(dob)}` : ''}
                        </span>
                        <span>Размер: {parseSizeValue(c.clothingSize ?? c.ClothingSize).join(', ') || '—'}</span>
                        {dob && (
                          <span className="profile-child-dob">
                            Дата рождения: {new Date(dob).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                      <div className="profile-child-actions profile-child-actions--stack">
                        <button type="button" className="profile-btn-icon-action" onClick={() => openChildForm(c)}>
                          <ProfileBtnIcon><EditIcon /></ProfileBtnIcon>
                          Изменить
                        </button>
                        <button
                          type="button"
                          className="profile-btn-icon-action profile-btn-icon-action--danger"
                          onClick={() => openChildDeleteConfirm(c)}
                        >
                          <ProfileBtnIcon><TrashIcon /></ProfileBtnIcon>
                          Удалить
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="profile-panel profile-panel--me">
            <div className="profile-panel-head">
              <div className="profile-section-title-wrap">
                <h2 className="profile-section-title">Мои данные</h2>
                <ProfileSectionHint text="Имя, email и телефон используются при оформлении заказов и связи с вами." />
              </div>
              {!profileEditing && (
                <button type="button" className="profile-btn-secondary profile-panel-btn-fixed profile-btn-with-icon" onClick={() => setProfileEditing(true)}>
                  <ProfileBtnIcon><EditIcon /></ProfileBtnIcon>
                  Редактировать
                </button>
              )}
            </div>
            <div className="profile-panel-body">
              {profileMsg && <p className="profile-inline-msg">{profileMsg}</p>}
              {profileEditing ? (
                <form className="profile-edit-form" onSubmit={(e) => { e.preventDefault(); saveProfile() }}>
                  <label className="profile-field">
                    <span>Имя</span>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                      placeholder="Как к вам обращаться"
                    />
                  </label>
                  <label className="profile-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                    />
                  </label>
                  <label className="profile-field">
                    <span>Телефон</span>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+7 900 000 00 00"
                    />
                  </label>
                  <label className="profile-field">
                    <span>Ваша дата рождения</span>
                    <input
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={(e) => setProfileForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    />
                  </label>
                  <p className="profile-field-note">Нужна для проверки, что ребёнок младше родителя.</p>
                  <label className="profile-field profile-field--checkbox">
                    <span className="profile-field-label-row">
                      Автоматически фильтровать товары по детям
                      <ProfileSectionHint text="Будет автоматически применён фильтр при поиске товаров по размерам и полу ребёнка (если детей несколько и пол одинаковый) — для удобного подбора одежды." />
                    </span>
                    <input
                      type="checkbox"
                      checked={autoFilterByChildren}
                      onChange={(e) => setAutoFilterByChildren(e.target.checked)}
                    />
                  </label>
                  <div className="profile-form-actions">
                    <button type="submit" className="profile-btn-primary" disabled={profileSaving}>
                      {profileSaving ? 'Сохранение…' : 'Сохранить'}
                    </button>
                    <button
                      type="button"
                      className="profile-btn-secondary"
                      disabled={profileSaving}
                      onClick={() => {
                        setProfileEditing(false)
                        setProfileMsg('')
                        loadProfile()
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="profile-panel-subrow">
                    <p className="profile-panel-hint profile-panel-hint--inline profile-panel-hint--desktop">
                      Имя, email и телефон используются при оформлении заказов и связи с вами.
                    </p>
                    {!hasVkLogin && (
                      <button type="button" className="profile-btn-secondary profile-panel-btn-fixed profile-btn-with-icon" onClick={openPasswordModal}>
                        <ProfileBtnIcon><LockIcon /></ProfileBtnIcon>
                        Сменить пароль
                      </button>
                    )}
                  </div>
                  {profileForm.dateOfBirth && (
                    <div className="profile-setting-row">
                      <span className="profile-setting-row__label">Ваша дата рождения</span>
                      <span className="profile-setting-row__value">
                        {new Date(`${profileForm.dateOfBirth}T12:00:00`).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}
                  <div className="profile-setting-row">
                    <span className="profile-setting-row__label">
                      Автоматически фильтровать товары по детям
                      <ProfileSectionHint text="Будет автоматически применён фильтр при поиске товаров по размерам и полу ребёнка (если детей несколько и пол одинаковый) — для удобного подбора одежды." />
                    </span>
                    <span className="profile-setting-row__value">{autoFilterByChildren ? 'Да' : 'Нет'}</span>
                  </div>
                  {showReferrerInput && (
                    <div className="profile-referrer-inline">
                      <span className="profile-referrer-inline__label">Код пригласившего</span>
                      <form className="profile-referral-apply" onSubmit={handleApplyReferrerCode}>
                        <input
                          type="text"
                          value={referrerCodeInput}
                          onChange={(e) => setReferrerCodeInput(e.target.value)}
                          placeholder="BEBO-XXXXXX"
                          className="profile-referral-input"
                        />
                        <button type="submit" className="profile-btn-primary profile-btn-primary--sm" disabled={referralBusy}>
                          {referralBusy ? '…' : 'Сохранить'}
                        </button>
                      </form>
                    </div>
                  )}
                  {referralInfo?.referredBy && (
                    <>
                      <div className="profile-setting-row">
                        <span className="profile-setting-row__label">Код пригласившего</span>
                        <span className="profile-setting-row__value">{referralInfo.referredBy.code}</span>
                      </div>
                      {referralInfo.referredBy.discountUsed && (
                        <p className="profile-referral-used-inline">
                          <span className="profile-referral-used-mark" title="Скидка по приглашению использована">
                            скидка
                          </span>
                          {' '}уже использована
                        </p>
                      )}
                      {!referralInfo.referredBy.discountUsed
                        && orders.length === 0
                        && referralInfo.referredDiscountAvailable !== false && (
                        <p className="profile-referral-first-order-hint">
                          Скидка −10% действует на ваш первый заказ.
                        </p>
                      )}
                    </>
                  )}
                  {referralInfo?.myCode && !profileEditing && (
                    <ReferralMyCodeBlock
                      code={referralInfo.myCode}
                      onCopyCode={copyReferralCode}
                    />
                  )}
                  {referralInfo?.invited?.length > 0 && !profileEditing && (
                    <div className="profile-my-referral-invited">
                      <span className="profile-my-referral-code__label">
                        Кого вы пригласили ({referralInfo.invitedCount})
                      </span>
                      <ReferralInvitedTable rows={referralInfo.invited} />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="profile-panel-footer">
              {!profileEditing && (
                <button type="button" className="profile-btn-secondary profile-btn-with-icon" onClick={openReferralModal}>
                  <ProfileBtnIcon><GiftIcon /></ProfileBtnIcon>
                  Реферальная программа
                </button>
              )}
              <Link to="/terms#privacy" className="profile-privacy-link">
                Политика конфиденциальности
              </Link>
            </div>
          </section>
        </div>
        )}

        {activeTab === 'orders' && (
        <>
        <h2 className="profile-section-title">История заказов</h2>
        {orderPlacedState?.orderNumber && (
          <div className="profile-order-placed" role="status">
            <p>Заказ №{orderPlacedState.orderNumber} оформлен.</p>
          </div>
        )}
        {loading && <p>Загрузка…</p>}
        {error && <p className="profile-error">{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <p className="profile-orders-empty">Пока нет заказов.</p>
        )}
        {!loading && orders.length > 0 && (
          <ul className="profile-orders">
            {orders.map((o) => {
              const oid = o.id ?? o.Id
              const statusText = (o.status || o.Status || '').trim() || '—'
              const items = getOrderItems(o)
              const history = getStatusHistory(o)
              const totalAmount = Number(o.totalAmount ?? o.TotalAmount ?? 0)
              const finalAmount = Number(o.finalAmount ?? o.FinalAmount ?? totalAmount)
              const hasDiscount = finalAmount < totalAmount
              const thank = thankYouByOrderId[oid]
              const hasReviewFlag = !!(o.hasCustomerReview ?? o.HasCustomerReview)
              const showReceiveBtn = statusText === 'Отправлен' && receiveFormOrderId !== oid
              const isItemsExpanded = expandedItemsOrderIds.has(oid)
              const isHistoryExpanded = expandedHistoryOrderIds.has(oid)
              const statusColor = getOrderStatusColor(statusText)
              const showPaymentHintBtn = statusText === 'Ожидает оплату'
              return (
                <li key={oid} className="profile-order-card">
                  <div className="profile-order-head">
                    <strong>{o.orderNumber || o.OrderNumber}</strong>
                    <span className="profile-order-amount">
                      <span className="profile-order-amount-current">
                        {finalAmount.toLocaleString('ru-RU')}
                        {'\u00a0'}
                        {'\u20bd'}
                      </span>
                      {hasDiscount && (
                        <span className="profile-order-amount-old">
                          {totalAmount.toLocaleString('ru-RU')}
                          {'\u00a0'}
                          {'\u20bd'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="profile-order-meta">
                    <span
                      className="profile-order-status-badge"
                      style={{ borderColor: statusColor, color: statusColor }}
                    >
                      {statusText}
                    </span>
                    {(o.createdAt || o.CreatedAt) && (
                      <time className="profile-order-date" dateTime={new Date(o.createdAt || o.CreatedAt).toISOString()}>
                        {new Date(o.createdAt || o.CreatedAt).toLocaleString('ru-RU')}
                      </time>
                    )}
                  </div>

                  {thank && (
                    <div className="profile-thank-you" role="status">
                      <p>Заказ отмечен как получен. Спасибо!</p>
                      {thank.hadFeedback && (
                        <p className="profile-thank-you-review">
                          Благодарим за оставленный отзыв — он помогает нам делать сервис лучше.
                        </p>
                      )}
                    </div>
                  )}

                  {statusText === 'Получен' && hasReviewFlag && !thank && (
                    <p className="profile-review-note">Спасибо за ваш отзыв по этому заказу.</p>
                  )}

                  {history.length > 0 && (
                    <div className="profile-status-history">
                      <button
                        type="button"
                        className="profile-status-history-toggle"
                        onClick={() => toggleStatusHistory(oid)}
                        aria-expanded={isHistoryExpanded}
                      >
                        {isHistoryExpanded
                          ? '▼ Скрыть историю статусов'
                          : `▶ История статусов (${history.length})`}
                      </button>
                      {isHistoryExpanded && (
                        <ul className="profile-status-history-list">
                          {history.map((row, idx) => {
                            const st = row.status || row.Status || '—'
                            const at = row.changedAtUtc || row.ChangedAtUtc
                            const label = at ? new Date(at).toLocaleString('ru-RU') : '—'
                            return (
                              <li key={`${oid}-h-${idx}`}>
                                <span className="profile-sh-status">{st}</span>
                                <span className="profile-sh-meta">{label}</span>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}

                  {items.length > 0 && (
                    <div className="profile-order-items">
                      <button
                        type="button"
                        className="profile-order-items-toggle"
                        onClick={() => toggleOrderItems(oid)}
                        aria-expanded={isItemsExpanded}
                      >
                        {isItemsExpanded ? '▼ Скрыть состав заказа' : `▶ Состав заказа (${items.length})`}
                      </button>
                      {isItemsExpanded && (
                        <ul className="profile-order-items-list">
                          {items.map((it) => {
                            const pid = it.productId ?? it.ProductId
                            const name = it.productName ?? it.ProductName ?? 'Товар'
                            const imgRaw = it.imageUrl ?? it.ImageUrl
                            const quantity = Number(it.quantity ?? it.Quantity ?? 1) || 1
                            const unitPrice = Number(it.productPrice ?? it.ProductPrice ?? 0) || 0
                            const lineTotal = unitPrice * quantity
                            return (
                              <li key={it.id ?? it.Id} className="profile-order-item-row">
                                <button
                                  type="button"
                                  className="profile-order-item-thumb"
                                  onClick={() => openProductDetail(pid)}
                                  disabled={detailLoadingId === pid}
                                  title="Открыть карточку товара"
                                >
                                  <img src={getImageUrl(imgRaw)} alt={name} loading="lazy" decoding="async" onError={(e) => { e.target.src = '/logo.jpg' }} />
                                </button>
                                <div className="profile-order-item-text">
                                  <span className="profile-order-item-name">{name}</span>
                                  <span className="profile-order-item-qty">
                                    {quantity > 1
                                      ? `${unitPrice.toLocaleString('ru-RU')} ₽ × ${quantity} = ${lineTotal.toLocaleString('ru-RU')} ₽`
                                      : `${lineTotal.toLocaleString('ru-RU')} ₽`}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="profile-order-item-open"
                                  onClick={() => openProductDetail(pid)}
                                  disabled={detailLoadingId === pid}
                                >
                                  {detailLoadingId === pid ? '…' : 'Смотреть'}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}

                  {showPaymentHintBtn && (
                    <div className="profile-pay-hint">
                      <button
                        type="button"
                        className="profile-btn-pay"
                        onClick={() => setPaymentHintOrderId(oid)}
                      >
                        К оплате{' '}
                        {finalAmount.toLocaleString('ru-RU')}
                        {'\u00a0'}
                        {'\u20bd'}
                      </button>
                    </div>
                  )}

                  {showReceiveBtn && (
                    <div className="profile-receive-actions">
                      <button
                        type="button"
                        className="profile-btn-received"
                        onClick={() => startReceiveFlow(oid)}
                      >
                        Получен
                      </button>
                    </div>
                  )}

                </li>
              )
            })}
          </ul>
        )}
        </>
        )}

        {activeTab === 'favorites' && (
          <section className="profile-panel profile-panel--favorites">
            <div className="profile-panel-head">
              <h2 className="profile-section-title">Избранное</h2>
            </div>
            {favoritesLoading ? (
              <p className="profile-muted">Загрузка…</p>
            ) : favoriteProductIds.length === 0 ? (
              <p className="profile-muted">Пока ничего нет. Нажмите сердечко на карточке товара в каталоге.</p>
            ) : favoriteProducts.length === 0 ? (
              <p className="profile-muted">Товары из избранного сейчас недоступны.</p>
            ) : (
              <div className="products-grid profile-favorites-grid">
                {favoriteProducts.map((p, index) => (
                  <CatalogProductCard
                    key={p.id}
                    product={p}
                    isFavorite
                    onToggleFavorite={handleToggleFavorite}
                    onOpen={() => openProductDetail(p.id)}
                    onFilterSelect={goToCatalogFilter}
                    showBuyButton={false}
                    available={getAvailableQuantity(p)}
                    inCart={getCartQuantity(p.id)}
                    imagePriority={index === 0}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'settings' && (
        <div className="profile-actions profile-actions--bottom">
          <button
            type="button"
            className="profile-logout-btn"
            onClick={handleLogout}
          >
            Выйти из профиля
          </button>
        </div>
        )}
      </PageShell>

      {detailProduct && (
        <ProductDetail
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onFilterSelect={goToCatalogFilter}
        />
      )}

      {paymentHintOrderId != null && (
        <div
          className="profile-receive-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-pay-hint-title"
          onClick={() => setPaymentHintOrderId(null)}
        >
          <div className="profile-receive-modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="profile-pay-hint-title" className="profile-receive-modal-title">
              Оплата заказа
            </h3>
            <div className="profile-pay-hint-body">
              <p className="profile-pay-hint-text">
                Чтобы получить реквизиты и пошаговую инструкцию по оплате, свяжитесь с администратором магазина
                одним из способов:
              </p>
              <ul className="profile-pay-contact-list">
                <li>
                  <a
                    className="profile-pay-contact-row"
                    href={paymentTelegramHrefWithDraft}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Telegram
                  </a>
                </li>
                <li>
                  <a
                    className="profile-pay-contact-row"
                    href={paymentVkHrefWithDraft}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ВКонтакте
                  </a>
                </li>
                <li>
                  <a
                    className="profile-pay-contact-row"
                    href={payAvitoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Авито
                  </a>
                </li>
              </ul>
              <p className="profile-pay-hint-text profile-pay-hint-text--footer">
                {paymentHintOrderNumber ? (
                  <>
                    Укажите номер заказа{' '}
                    <button
                      type="button"
                      className="profile-pay-order-number-btn"
                      onClick={copyPaymentOrderNumber}
                      title="Скопировать номер заказа"
                    >
                      {paymentHintOrderNumber}
                    </button>
                    {' '}- вам подскажут, как оплатить удобным способом.
                  </>
                ) : (
                  'Сообщите номер заказа - вам подскажут, как оплатить удобным способом.'
                )}
              </p>
            </div>
            <button
              type="button"
              className="profile-btn-pay-modal-ok"
              onClick={() => setPaymentHintOrderId(null)}
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {passwordModalOpen && (
        <div className="profile-receive-modal-overlay" onClick={closePasswordModal}>
          <div className="profile-receive-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="profile-receive-modal-title">Сменить пароль</h3>
            <p className="profile-panel-hint">
              Новый пароль будет использоваться для входа по телефону или email.
            </p>
            <form className="profile-edit-form" onSubmit={savePassword}>
              <label className="profile-field">
                <span>Текущий пароль</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                  autoFocus
                />
              </label>
              <label className="profile-field">
                <span>Новый пароль</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.next}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
                  minLength={6}
                />
              </label>
              <label className="profile-field">
                <span>Подтверждение</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                  minLength={6}
                />
              </label>
              <div className="profile-form-actions">
                <button type="submit" className="profile-btn-primary" disabled={passwordSaving}>
                  {passwordSaving ? 'Сохранение…' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  className="profile-btn-secondary"
                  disabled={passwordSaving}
                  onClick={closePasswordModal}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {childDeleteTarget && (
        <div className="profile-receive-modal-overlay" onClick={closeChildDeleteConfirm}>
          <div className="profile-receive-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="profile-receive-modal-title">Удалить ребёнка?</h3>
            <p className="profile-receive-form-hint">
              {childDeleteTarget.name} будет удалён из профиля. Это действие нельзя отменить.
            </p>
            <div className="profile-receive-form-buttons">
              <button
                type="button"
                className="profile-btn-received-submit profile-btn-received-submit--danger"
                onClick={confirmRemoveChild}
                disabled={childDeleting}
              >
                {childDeleting ? 'Удаление…' : 'Удалить'}
              </button>
              <button
                type="button"
                className="profile-btn-received-cancel"
                onClick={closeChildDeleteConfirm}
                disabled={childDeleting}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {childFormOpen && (
        <div className="profile-receive-modal-overlay" onClick={closeChildForm}>
          <div className="profile-receive-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="profile-receive-modal-title">
              {editingChildId != null ? 'Редактировать ребёнка' : 'Добавить ребёнка'}
            </h3>
            <form className="profile-child-form" onSubmit={saveChild}>
              <label className="profile-field">
                <span>Имя *</span>
                <input
                  type="text"
                  value={childForm.name}
                  onChange={(e) => setChildForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </label>
              <label className="profile-field">
                <span>Дата рождения *</span>
                <input
                  type="date"
                  value={childForm.dateOfBirth}
                  onChange={(e) => setChildForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  required
                />
              </label>
              <label className="profile-field">
                <span>Размер одежды *</span>
                <SizeMultiSelect
                  value={childForm.clothingSize}
                  onChange={(clothingSize) => setChildForm((p) => ({ ...p, clothingSize }))}
                  options={sizeOptions}
                  placeholder="Выберите один или несколько размеров"
                  required
                />
              </label>
              <label className="profile-field">
                <span>Пол *</span>
                <select
                  value={childForm.gender}
                  onChange={(e) => setChildForm((p) => ({ ...p, gender: e.target.value }))}
                >
                  <option value="мальчик">Мальчик</option>
                  <option value="девочка">Девочка</option>
                </select>
              </label>
              <div className="profile-form-actions">
                <button type="submit" className="profile-btn-primary" disabled={childSaving}>
                  {childSaving ? 'Сохранение…' : 'Сохранить'}
                </button>
                <button type="button" className="profile-btn-secondary" onClick={closeChildForm} disabled={childSaving}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {referralModalOpen && (
        <div className="profile-receive-modal-overlay" onClick={closeReferralModal}>
          <div className="profile-receive-modal profile-referral-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="profile-receive-modal-title">Реферальная программа</h3>
            {referralLoading ? (
              <p className="profile-muted">Загрузка…</p>
            ) : (
              <>
                <ReferralRulesContent />

                <div className="profile-referral-block">
                  <h4>Ваш код приглашения</h4>
                  {referralInfo?.myCode ? (
                    <ReferralMyCodeBlock
                      code={referralInfo.myCode}
                      onCopyCode={copyReferralCode}
                    />
                  ) : (
                    <>
                      <p className="profile-muted profile-referral-share-hint">
                        Сгенерируйте личный код и отправьте его другу — вы оба получите скидку 10% на заказ.
                      </p>
                      <button
                        type="button"
                        className="profile-btn-primary"
                        disabled={referralBusy}
                        onClick={handleGenerateReferralCode}
                      >
                        {referralBusy ? '…' : 'Сгенерировать код'}
                      </button>
                    </>
                  )}
                </div>

                <div className="profile-referral-block">
                  <h4>Кто вас пригласил</h4>
                  {referralInfo?.referredBy ? (
                    <p className="profile-referral-applied">
                      Код: <strong>{referralInfo.referredBy.code}</strong>
                      {referralInfo.referredBy.referrerName && (
                        <> · {referralInfo.referredBy.referrerName}</>
                      )}
                      <br />
                      Статус: {referralInfo.referredBy.status}
                      {referralInfo.referredBy.discountUsed && (
                        <>
                          <br />
                          <span className="profile-referral-used-mark" title="Скидка по приглашению использована">
                            скидка
                          </span>
                          {' '}использована
                        </>
                      )}
                    </p>
                  ) : showReferrerInput ? (
                    <form className="profile-referral-apply" onSubmit={handleApplyReferrerCode}>
                      <input
                        type="text"
                        value={referrerCodeInput}
                        onChange={(e) => setReferrerCodeInput(e.target.value)}
                        placeholder="BEBO-XXXXXX"
                        className="profile-referral-input"
                      />
                      <button type="submit" className="profile-btn-primary" disabled={referralBusy}>
                        {referralBusy ? '…' : 'Сохранить'}
                      </button>
                    </form>
                  ) : orders.length === 0 ? (
                    <p className="profile-muted">Код можно указать только до первого заказа, если вы ещё не пользовались сервисом.</p>
                  ) : null}
                </div>

                {referralInfo?.invited?.length > 0 && (
                  <div className="profile-referral-block">
                    <h4>Кого вы пригласили ({referralInfo.invitedCount})</h4>
                    <ReferralInvitedTable rows={referralInfo.invited} />
                  </div>
                )}
              </>
            )}
            <button type="button" className="profile-btn-secondary profile-referral-close" onClick={closeReferralModal}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {receiveFormOrderId != null && (
        <div className="profile-receive-modal-overlay" onClick={cancelReceiveFlow}>
          <div className="profile-receive-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="profile-receive-modal-title">Подтвердите получение заказа</h3>
            <p className="profile-receive-form-hint">
              Оценку и отзыв можно не заполнять.
            </p>

            <label className="profile-receive-label">
              Оценка (необязательно)
            </label>
            <div className="profile-receive-stars" role="radiogroup" aria-label="Оценка заказа">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = Number(formRating || 0) >= n
                return (
                  <button
                    key={n}
                    type="button"
                    className={`profile-receive-star${active ? ' is-active' : ''}`}
                    onClick={() => setFormRating((prev) => (Number(prev || 0) === n ? '' : String(n)))}
                    aria-label={`Оценка ${n}`}
                    aria-pressed={active}
                  >
                    ★
                  </button>
                )
              })}
            </div>

            <label className="profile-receive-label">
              Отзыв (необязательно)
              <textarea
                className="profile-receive-textarea"
                rows={3}
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Поделитесь впечатлениями"
              />
            </label>

            <div className="profile-receive-form-buttons">
              <button
                type="button"
                className="profile-btn-received-submit"
                onClick={() => submitMarkReceived(receiveFormOrderId)}
                disabled={markSubmittingId === receiveFormOrderId}
              >
                {markSubmittingId === receiveFormOrderId ? 'Отправка…' : 'Подтвердить получение'}
              </button>
              <button
                type="button"
                className="profile-btn-received-cancel"
                onClick={cancelReceiveFlow}
                disabled={markSubmittingId === receiveFormOrderId}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Profile
