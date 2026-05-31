import { useEffect, useState } from 'react'
import { api } from '../services/api'
import PageShell from '../components/PageShell'
import { showToast } from '../utils/showToast'
import './AdminBrands.css'

export default function AdminBrands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

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
    setEditingId(brand.id ?? brand.Id)
    setEditName(brand.name ?? brand.Name ?? '')
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
    const name = brand.name ?? brand.Name
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
          Найти
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
          {saving ? '…' : 'Добавить'}
        </button>
      </form>

      {loading && <p>Загрузка…</p>}
      {error && <p className="admin-brands-error">{error}</p>}
      {!loading && !error && brands.length === 0 && (
        <p className="admin-brands-empty">Бренды не найдены.</p>
      )}

      {!loading && brands.length > 0 && (
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
              {brands.map((brand) => {
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
                        brand.name ?? brand.Name
                      )}
                    </td>
                    <td className="admin-brands-actions">
                      {isEditing ? (
                        <>
                          <button type="button" className="admin-brands-link" onClick={saveEdit} disabled={saving}>
                            Сохранить
                          </button>
                          <button type="button" className="admin-brands-link admin-brands-link--muted" onClick={cancelEdit} disabled={saving}>
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="admin-brands-link" onClick={() => startEdit(brand)} disabled={saving}>
                            Изменить
                          </button>
                          <button type="button" className="admin-brands-link admin-brands-link--danger" onClick={() => removeBrand(brand)} disabled={saving}>
                            Удалить
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  )
}
