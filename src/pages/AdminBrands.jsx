import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../services/api'
import PageShell from '../components/PageShell'
import { showToast } from '../utils/showToast'
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, CheckIcon, CloseIcon } from '../components/admin/AdminBrandIcons'
import './AdminBrands.css'

function getBrandName(brand) {
  return (brand.name ?? brand.Name ?? '').trim()
}

function getBrandLetter(name) {
  const n = (name || '').trim()
  if (!n) return '#'
  const ch = n[0].toUpperCase()
  if (/[А-ЯЁ]/.test(ch) || /[A-Z]/.test(ch)) return ch
  if (/[0-9]/.test(ch)) return '0–9'
  return '#'
}

function groupBrandsByLetter(brands) {
  const map = new Map()
  for (const brand of brands) {
    const letter = getBrandLetter(getBrandName(brand))
    if (!map.has(letter)) map.set(letter, [])
    map.get(letter).push(brand)
  }
  for (const items of map.values()) {
    items.sort((a, b) => getBrandName(a).localeCompare(getBrandName(b), 'ru'))
  }
  const letters = [...map.keys()].sort((a, b) => a.localeCompare(b, 'ru'))
  return { letters, map }
}

function letterSectionId(letter) {
  return `admin-brand-letter-${encodeURIComponent(letter)}`
}

export default function AdminBrands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [collapsedLetters, setCollapsedLetters] = useState(() => new Set())
  const [openMenuId, setOpenMenuId] = useState(null)
  const listRef = useRef(null)

  const { letters, map: brandsByLetter } = useMemo(() => groupBrandsByLetter(brands), [brands])

  const load = async (term = search) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getBrands(term.trim() || null)
      setBrands(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Не удалось загрузить бренды')
      setBrands([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('')
  }, [])

  useEffect(() => {
    const closeMenu = (e) => {
      if (!e.target.closest('.admin-brands-menu-wrap')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [])

  const toggleLetter = (letter) => {
    setCollapsedLetters((prev) => {
      const next = new Set(prev)
      if (next.has(letter)) next.delete(letter)
      else next.add(letter)
      return next
    })
  }

  const scrollToLetter = (letter) => {
    setCollapsedLetters((prev) => {
      if (!prev.has(letter)) return prev
      const next = new Set(prev)
      next.delete(letter)
      return next
    })
    requestAnimationFrame(() => {
      const el = document.getElementById(letterSectionId(letter))
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) {
      showToast('Укажите название бренда')
      return
    }
    setSaving(true)
    try {
      await api.createBrand({ name })
      setNewName('')
      await load()
      showToast('Бренд добавлен', 'success')
    } catch (err) {
      showToast(err.message || 'Не удалось добавить бренд')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (brand) => {
    setOpenMenuId(null)
    setEditingId(brand.id ?? brand.Id)
    setEditName(getBrandName(brand))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveEdit = async () => {
    const name = editName.trim()
    if (!name) {
      showToast('Укажите название бренда')
      return
    }
    setSaving(true)
    try {
      await api.updateBrand(editingId, { name })
      cancelEdit()
      await load()
      showToast('Бренд сохранён', 'success')
    } catch (err) {
      showToast(err.message || 'Не удалось сохранить бренд')
    } finally {
      setSaving(false)
    }
  }

  const removeBrand = async (brand) => {
    const id = brand.id ?? brand.Id
    const name = getBrandName(brand)
    setOpenMenuId(null)
    if (!window.confirm(`Удалить бренд «${name}»?`)) return
    setSaving(true)
    try {
      await api.deleteBrand(id)
      if (editingId === id) cancelEdit()
      await load()
      showToast('Бренд удалён', 'success')
    } catch (err) {
      showToast(err.message || 'Не удалось удалить бренд')
    } finally {
      setSaving(false)
    }
  }

  const renderBrandRow = (brand) => {
    const id = brand.id ?? brand.Id
    const isEditing = editingId === id
    return (
      <tr key={id}>
        <td>{id}</td>
        <td>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="admin-brands-edit-input"
              disabled={saving}
            />
          ) : (
            getBrandName(brand)
          )}
        </td>
        <td className="admin-brands-actions">
          {isEditing ? (
            <div className="admin-brands-inline-actions">
              <button type="button" className="admin-brands-btn admin-brands-btn--sm" onClick={saveEdit} disabled={saving}>
                <CheckIcon />
                <span>Сохранить</span>
              </button>
              <button type="button" className="admin-brands-btn admin-brands-btn--sm admin-brands-btn--muted" onClick={cancelEdit} disabled={saving}>
                <CloseIcon />
                <span>Отмена</span>
              </button>
            </div>
          ) : (
            <div className="admin-brands-menu-wrap">
              <button
                type="button"
                className="admin-brands-menu-trigger"
                aria-label="Действия"
                aria-expanded={openMenuId === id}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenuId(openMenuId === id ? null : id)
                }}
                disabled={saving}
              >
                ⋮
              </button>
              {openMenuId === id && (
                <div className="admin-brands-menu" role="menu">
                  <button type="button" className="admin-brands-menu-item" role="menuitem" onClick={() => startEdit(brand)} disabled={saving}>
                    <EditIcon />
                    <span>Изменить</span>
                  </button>
                  <button type="button" className="admin-brands-menu-item admin-brands-menu-item--danger" role="menuitem" onClick={() => removeBrand(brand)} disabled={saving}>
                    <TrashIcon />
                    <span>Удалить</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </td>
      </tr>
    )
  }

  return (
    <PageShell title="Бренды">
      <div className="admin-brands-toolbar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск бренда"
          className="admin-brands-search"
        />
        <button type="button" className="admin-brands-btn" onClick={() => load()} disabled={loading}>
          <SearchIcon />
          <span>Найти</span>
        </button>
      </div>

      <form className="admin-brands-add" onSubmit={handleCreate}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Новый бренд"
          className="admin-brands-search"
          disabled={saving}
        />
        <button type="submit" className="admin-brands-btn admin-brands-btn--primary" disabled={saving}>
          <PlusIcon />
          <span>{saving ? '…' : 'Добавить'}</span>
        </button>
      </form>

      {loading && <p>Загрузка…</p>}
      {error && <p className="admin-brands-error">{error}</p>}
      {!loading && !error && brands.length === 0 && (
        <p className="admin-brands-empty">Бренды не найдены.</p>
      )}

      {!loading && brands.length > 0 && (
        <div className="admin-brands-list" ref={listRef}>
          <nav className="admin-brands-alpha-nav" aria-label="Буквы алфавита">
            {letters.map((letter) => (
              <button
                key={letter}
                type="button"
                className="admin-brands-alpha-nav__btn"
                onClick={() => scrollToLetter(letter)}
                title={`К букве ${letter}`}
              >
                {letter}
              </button>
            ))}
          </nav>

          {letters.map((letter) => {
            const items = brandsByLetter.get(letter) ?? []
            const collapsed = collapsedLetters.has(letter)
            return (
              <section
                key={letter}
                id={letterSectionId(letter)}
                className="admin-brands-letter-section"
              >
                <button
                  type="button"
                  className="admin-brands-letter-header"
                  onClick={() => toggleLetter(letter)}
                  aria-expanded={!collapsed}
                >
                  <span className={`admin-brands-letter-header__chevron${collapsed ? ' admin-brands-letter-header__chevron--collapsed' : ''}`} aria-hidden="true">
                    ▼
                  </span>
                  <span className="admin-brands-letter-header__letter">{letter}</span>
                  <span className="admin-brands-letter-header__count">{items.length}</span>
                </button>

                {!collapsed && (
                  <div className="admin-brands-table-wrap">
                    <table className="admin-brands-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Название</th>
                          <th aria-label="Действия" />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(renderBrandRow)}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
