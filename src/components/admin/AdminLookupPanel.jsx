import { useEffect, useMemo, useState } from 'react'
import { showToast } from '../../utils/showToast'
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, CheckIcon, CloseIcon } from './AdminBrandIcons'
import '../../pages/AdminBrands.css'

function getItemName(item) {
  return (item.name ?? item.Name ?? '').trim()
}

function getItemProductCount(item) {
  const n = item.productCount ?? item.ProductCount
  return Number.isFinite(Number(n)) ? Number(n) : 0
}

function formatProductCountShort(count) {
  const n = Number(count) || 0
  const mod10 = n % 10
  const mod100 = n % 100
  let word = 'товаров'
  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) word = 'товар'
    else if (mod10 >= 2 && mod10 <= 4) word = 'товара'
  }
  return `${n} ${word}`
}

function getLetter(name) {
  const n = (name || '').trim()
  if (!n) return '#'
  const ch = n[0].toUpperCase()
  if (/[А-ЯЁ]/.test(ch) || /[A-Z]/.test(ch)) return ch
  if (/[0-9]/.test(ch)) return '0–9'
  return '#'
}

function groupByLetter(items, getName) {
  const map = new Map()
  for (const item of items) {
    const letter = getLetter(getName(item))
    if (!map.has(letter)) map.set(letter, [])
    map.get(letter).push(item)
  }
  for (const list of map.values()) {
    list.sort((a, b) => getName(a).localeCompare(getName(b), 'ru'))
  }
  return { letters: [...map.keys()].sort((a, b) => a.localeCompare(b, 'ru')), map }
}

export default function AdminLookupPanel({
  loadItems,
  createItem,
  updateItem,
  deleteItem,
  addPlaceholder = 'Новое значение',
  emptyMessage = 'Ничего не найдено',
  loadErrorMessage = 'Не удалось загрузить список',
  idPrefix = 'lookup',
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [collapsedLetters, setCollapsedLetters] = useState(() => new Set())
  const [openMenuId, setOpenMenuId] = useState(null)

  const { letters, map: byLetter } = useMemo(
    () => groupByLetter(items, getItemName),
    [items]
  )

  useEffect(() => {
    if (!loading && letters.length > 0) {
      setCollapsedLetters(new Set(letters))
    }
  }, [loading, letters])

  const load = async (term = search) => {
    setLoading(true)
    setError('')
    try {
      const data = await loadItems(term.trim() || null)
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || loadErrorMessage)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('')
  }, [])

  useEffect(() => {
    const closeMenu = (e) => {
      if (!e.target.closest('.admin-brands-menu-wrap')) setOpenMenuId(null)
    }
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [])

  const sectionId = (letter) => `${idPrefix}-letter-${encodeURIComponent(letter)}`

  const handleCreate = async (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) {
      showToast('Укажите название')
      return
    }
    setSaving(true)
    try {
      await createItem(name)
      setNewName('')
      await load()
      showToast('Добавлено', 'success')
    } catch (err) {
      showToast(err.message || 'Не удалось добавить')
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async () => {
    const name = editName.trim()
    if (!name) {
      showToast('Укажите название')
      return
    }
    setSaving(true)
    try {
      await updateItem(editingId, name)
      setEditingId(null)
      setEditName('')
      await load()
      showToast('Сохранено', 'success')
    } catch (err) {
      showToast(err.message || 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    const id = item.id ?? item.Id
    const name = getItemName(item)
    setOpenMenuId(null)
    if (!window.confirm(`Удалить «${name}»?`)) return
    setSaving(true)
    try {
      await deleteItem(id)
      if (editingId === id) {
        setEditingId(null)
        setEditName('')
      }
      await load()
      showToast('Удалено', 'success')
    } catch (err) {
      showToast(err.message || 'Не удалось удалить')
    } finally {
      setSaving(false)
    }
  }

  const renderRow = (item) => {
    const id = item.id ?? item.Id
    const menuOpen = openMenuId === id
    return (
      <li key={id} className={`admin-brands-row${menuOpen ? ' admin-brands-row--menu-open' : ''}`}>
        <span className="admin-brands-row__id">{id}</span>
        <div className="admin-brands-row__name">
          {editingId === id ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="admin-brands-edit-input"
              disabled={saving}
            />
          ) : (
            <>
              <span className="admin-brands-row__title">{getItemName(item)}</span>
              <span className="admin-brands-row__products">
                ({formatProductCountShort(getItemProductCount(item))})
              </span>
            </>
          )}
        </div>
        <div className="admin-brands-row__actions">
          {editingId === id ? (
            <div className="admin-brands-inline-actions">
              <button type="button" className="admin-brands-btn admin-brands-btn--sm" onClick={saveEdit} disabled={saving}>
                <CheckIcon /><span>Сохранить</span>
              </button>
              <button type="button" className="admin-brands-btn admin-brands-btn--sm admin-brands-btn--muted" onClick={() => { setEditingId(null); setEditName('') }} disabled={saving}>
                <CloseIcon /><span>Отмена</span>
              </button>
            </div>
          ) : (
            <div className={`admin-brands-menu-wrap${menuOpen ? ' admin-brands-menu-wrap--open' : ''}`}>
              <button type="button" className="admin-brands-menu-trigger" aria-label="Действия" onClick={(e) => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : id) }} disabled={saving}>⋮</button>
              {menuOpen && (
                <div className="admin-brands-menu" role="menu">
                  <button type="button" className="admin-brands-menu-item" onClick={() => { setEditingId(id); setEditName(getItemName(item)); setOpenMenuId(null) }} disabled={saving}>
                    <EditIcon /><span>Изменить</span>
                  </button>
                  <button type="button" className="admin-brands-menu-item admin-brands-menu-item--danger" onClick={() => remove(item)} disabled={saving}>
                    <TrashIcon /><span>Удалить</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </li>
    )
  }

  return (
    <>
      <div className="admin-brands-toolbar">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск" className="admin-brands-search" />
        <button type="button" className="admin-brands-btn" onClick={() => load()} disabled={loading}>
          <SearchIcon /><span>Найти</span>
        </button>
      </div>
      <form className="admin-brands-add" onSubmit={handleCreate}>
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={addPlaceholder} className="admin-brands-search" disabled={saving} />
        <button type="submit" className="admin-brands-btn admin-brands-btn--primary" disabled={saving}>
          <PlusIcon /><span>{saving ? '…' : 'Добавить'}</span>
        </button>
      </form>
      {loading && <p>Загрузка…</p>}
      {error && <p className="admin-brands-error">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="admin-brands-empty">{emptyMessage}</p>}
      {!loading && items.length > 0 && (
        <div className="admin-brands-list">
          <nav className="admin-brands-alpha-nav" aria-label="Буквы">
            {letters.map((letter) => (
              <button key={letter} type="button" className="admin-brands-alpha-nav__btn" onClick={() => {
                setCollapsedLetters((prev) => {
                  const next = new Set(prev)
                  next.delete(letter)
                  return next
                })
                requestAnimationFrame(() => document.getElementById(sectionId(letter))?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
              }}>{letter}</button>
            ))}
          </nav>
          {letters.map((letter) => {
            const list = byLetter.get(letter) ?? []
            const collapsed = collapsedLetters.has(letter)
            return (
              <section key={letter} id={sectionId(letter)} className="admin-brands-letter-section">
                <button type="button" className="admin-brands-letter-header" onClick={() => setCollapsedLetters((prev) => {
                  const next = new Set(prev)
                  if (next.has(letter)) next.delete(letter)
                  else next.add(letter)
                  return next
                })} aria-expanded={!collapsed}>
                  <span className={`admin-brands-letter-header__chevron${collapsed ? ' admin-brands-letter-header__chevron--collapsed' : ''}`}>▼</span>
                  <span className="admin-brands-letter-header__letter">{letter}</span>
                  <span className="admin-brands-letter-header__count">{list.length}</span>
                </button>
                {!collapsed && <ul className="admin-brands-rows">{list.map(renderRow)}</ul>}
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
