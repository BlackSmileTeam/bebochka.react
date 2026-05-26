import { useEffect, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import { api } from '../services/api'
import './AdminIncomingShipments.css'

const initialShipmentForm = {
  name: '',
  weightKg: '',
  itemCount: '',
  orderedAmount: '',
  notes: ''
}

const initialExpenseForm = {
  name: '',
  amount: ''
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ru-RU')
}

function AdminIncomingShipments() {
  const [rows, setRows] = useState([])
  const [expenses, setExpenses] = useState([])
  const [form, setForm] = useState(initialShipmentForm)
  const [expenseForm, setExpenseForm] = useState(initialExpenseForm)
  const [editingId, setEditingId] = useState(null)
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingExpense, setSavingExpense] = useState(false)
  const [shipmentError, setShipmentError] = useState('')
  const [expenseError, setExpenseError] = useState('')
  const [actionMenu, setActionMenu] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [shipments, misc] = await Promise.all([
        api.getIncomingShipments(),
        api.getMiscExpenses()
      ])
      setRows(Array.isArray(shipments) ? shipments : [])
      setExpenses(Array.isArray(misc) ? misc : [])
    } catch (e) {
      setShipmentError(e.message || 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!actionMenu) return undefined

    const closeMenu = () => setActionMenu(null)
    const onDocClick = (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.incoming-floating-menu') || target.closest('.btn-icon-dots')) return
      setActionMenu(null)
    }
    const onEsc = (event) => {
      if (event.key === 'Escape') setActionMenu(null)
    }

    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('resize', closeMenu)
    window.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('scroll', closeMenu, true)
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('keydown', onEsc)
    }
  }, [actionMenu])

  const openActionMenu = (event, type, id) => {
    event.preventDefault()
    event.stopPropagation()
    if (actionMenu?.type === type && actionMenu.id === id) {
      setActionMenu(null)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 180
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const left = Math.max(8, Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 8))
    const top = Math.max(8, Math.min(rect.bottom + 6, viewportHeight - 110))
    setActionMenu({ type, id, left, top })
  }

  const onShipmentChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onExpenseChange = (e) => {
    const { name, value } = e.target
    setExpenseForm((prev) => ({ ...prev, [name]: value }))
  }

  const editShipment = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      weightKg: row.weightKg ?? '',
      itemCount: row.itemCount ?? '',
      orderedAmount: row.orderedAmount ?? '',
      notes: row.notes || ''
    })
    setShipmentError('')
    setActionMenu(null)
  }

  const resetShipment = () => {
    setEditingId(null)
    setForm(initialShipmentForm)
    setShipmentError('')
  }

  const submitShipment = async (e) => {
    e.preventDefault()
    setSaving(true)
    setShipmentError('')
    try {
      const payload = {
        name: String(form.name || '').trim(),
        weightKg: Number(form.weightKg || 0),
        itemCount: Number(form.itemCount || 0),
        orderedAmount: Number(form.orderedAmount || 0),
        notes: form.notes || null
      }
      if (!payload.name) throw new Error('Введите название/код посылки')
      if (editingId) await api.updateIncomingShipment(editingId, payload)
      else await api.createIncomingShipment(payload)
      await load()
      resetShipment()
    } catch (e2) {
      setShipmentError(e2.message || 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const removeShipment = async (id) => {
    if (!window.confirm('Удалить поступление?')) return
    setActionMenu(null)
    try {
      await api.deleteIncomingShipment(id)
      if (editingId === id) resetShipment()
      await load()
    } catch (e) {
      setShipmentError(e.message || 'Не удалось удалить')
    }
  }

  const editExpense = (row) => {
    setEditingExpenseId(row.id)
    setExpenseForm({
      name: row.name || '',
      amount: row.amount ?? ''
    })
    setExpenseError('')
    setActionMenu(null)
  }

  const resetExpense = () => {
    setEditingExpenseId(null)
    setExpenseForm(initialExpenseForm)
    setExpenseError('')
  }

  const submitExpense = async (e) => {
    e.preventDefault()
    setSavingExpense(true)
    setExpenseError('')
    try {
      const payload = {
        name: String(expenseForm.name || '').trim(),
        amount: Number(expenseForm.amount || 0)
      }
      if (!payload.name) throw new Error('Введите название расхода')
      if (payload.amount <= 0) throw new Error('Сумма должна быть больше нуля')
      if (editingExpenseId) await api.updateMiscExpense(editingExpenseId, payload)
      else await api.createMiscExpense(payload)
      await load()
      resetExpense()
    } catch (e2) {
      setExpenseError(e2.message || 'Не удалось сохранить')
    } finally {
      setSavingExpense(false)
    }
  }

  const removeExpense = async (id) => {
    if (!window.confirm('Удалить расход?')) return
    setActionMenu(null)
    try {
      await api.deleteMiscExpense(id)
      if (editingExpenseId === id) resetExpense()
      await load()
    } catch (e) {
      setExpenseError(e.message || 'Не удалось удалить')
    }
  }

  const miscTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const activeShipment = useMemo(
    () => (actionMenu?.type === 'shipment' ? rows.find((r) => r.id === actionMenu.id) : null),
    [actionMenu, rows]
  )
  const activeExpense = useMemo(
    () => (actionMenu?.type === 'expense' ? expenses.find((e) => e.id === actionMenu.id) : null),
    [actionMenu, expenses]
  )

  return (
    <PageShell title="Поступления">
      <div className="incoming-page">
        <form className="incoming-form card-surface" onSubmit={submitShipment}>
          <h3 className="incoming-title">{editingId ? 'Редактировать поступление' : 'Новое поступление'}</h3>
          {shipmentError && <div className="incoming-error">{shipmentError}</div>}
          <div className="form-group">
            <label htmlFor="shipment-name">Название/код посылки</label>
            <input id="shipment-name" name="name" value={form.name} onChange={onShipmentChange} placeholder="Например: CN-2026-04-15" />
          </div>
          <div className="incoming-grid">
            <div className="form-group">
              <label htmlFor="shipment-weight">Вес (кг)</label>
              <input id="shipment-weight" name="weightKg" type="number" step="0.001" value={form.weightKg} onChange={onShipmentChange} placeholder="0.000" />
            </div>
            <div className="form-group">
              <label htmlFor="shipment-count">Количество позиций</label>
              <input id="shipment-count" name="itemCount" type="number" value={form.itemCount} onChange={onShipmentChange} placeholder="0" />
            </div>
            <div className="form-group">
              <label htmlFor="shipment-ordered">Сумма закупки (₽)</label>
              <input id="shipment-ordered" name="orderedAmount" type="number" step="0.01" value={form.orderedAmount} onChange={onShipmentChange} placeholder="0.00" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="shipment-notes">Комментарий</label>
            <textarea id="shipment-notes" name="notes" value={form.notes} onChange={onShipmentChange} placeholder="Комментарий" rows={3} />
          </div>
          <div className="incoming-actions">
            {editingId && <button type="button" className="btn btn-secondary" onClick={resetShipment}>Отмена</button>}
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
          </div>
        </form>

        <div className="incoming-table-wrap">
          <div className="incoming-table-scroll">
            {loading ? <div className="incoming-loading">Загрузка...</div> : (
              <table className="incoming-table">
                <thead>
                  <tr>
                    <th>Посылка</th>
                    <th>Вес</th>
                    <th>Кол-во позиций</th>
                    <th>Закупка</th>
                    <th>Себестоимость позиции</th>
                    <th>Продано</th>
                    <th>Итог</th>
                    <th className="incoming-actions-col" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{Number(r.weightKg || 0).toFixed(3)} кг</td>
                      <td>{r.itemCount || 0}</td>
                      <td>{Number(r.orderedAmount || 0).toLocaleString('ru-RU')} ₽</td>
                      <td>
                        {(() => {
                          const cnt = Number(r.itemCount || 0)
                          const ordered = Number(r.orderedAmount || 0)
                          if (!Number.isFinite(cnt) || cnt <= 0) return '—'
                          const v = ordered / cnt
                          return `${v.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`
                        })()}
                      </td>
                      <td>{r.revenue == null ? '—' : `${Number(r.revenue).toLocaleString('ru-RU')} ₽`}</td>
                      <td title="Формула: Продано − закупка">
                        {r.actualMargin == null ? '—' : `${Number(r.actualMargin).toLocaleString('ru-RU')} ₽`}
                      </td>
                      <td className="incoming-actions-cell">
                        <div className="actions-menu-desktop">
                          <button
                            type="button"
                            className="btn btn-icon-dots"
                            aria-label="Действия"
                            onClick={(e) => openActionMenu(e, 'shipment', r.id)}
                          >
                            ⋯
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <form className="incoming-form card-surface" onSubmit={submitExpense}>
          <h3 className="incoming-title">{editingExpenseId ? 'Редактировать мелкий расход' : 'Новый мелкий расход'}</h3>
          {expenseError && <div className="incoming-error">{expenseError}</div>}
          <div className="incoming-grid incoming-grid--expense">
            <div className="form-group">
              <label htmlFor="expense-name">Название</label>
              <input
                id="expense-name"
                name="name"
                value={expenseForm.name}
                onChange={onExpenseChange}
                placeholder="Стикеры, зип-пакеты..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="expense-amount">Сумма (₽)</label>
              <input
                id="expense-amount"
                name="amount"
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={onExpenseChange}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="incoming-actions">
            {editingExpenseId && <button type="button" className="btn btn-secondary" onClick={resetExpense}>Отмена</button>}
            <button type="submit" className="btn btn-primary" disabled={savingExpense}>
              {savingExpense ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>

        <div className="incoming-table-wrap">
          <h3 className="incoming-section-title">Мелкие расходы</h3>
          {loading ? (
            <div className="incoming-loading">Загрузка...</div>
          ) : (
            <>
              <p className="incoming-misc-summary">
                Всего: {miscTotal.toLocaleString('ru-RU')} ₽ · {expenses.length} {expenses.length === 1 ? 'запись' : expenses.length < 5 ? 'записи' : 'записей'}
              </p>
              <div className="incoming-table-scroll">
                <table className="incoming-table incoming-table--misc">
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Сумма</th>
                      <th>Дата</th>
                      <th className="incoming-actions-col" />
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="incoming-empty">Нет мелких расходов</td>
                      </tr>
                    ) : expenses.map((ex) => (
                      <tr key={ex.id}>
                        <td>{ex.name}</td>
                        <td>{Number(ex.amount || 0).toLocaleString('ru-RU')} ₽</td>
                        <td>{formatDate(ex.createdAt)}</td>
                        <td className="incoming-actions-cell">
                          <div className="actions-menu-desktop">
                            <button
                              type="button"
                              className="btn btn-icon-dots"
                              aria-label="Действия"
                              onClick={(e) => openActionMenu(e, 'expense', ex.id)}
                            >
                              ⋯
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      {actionMenu && (
        <div
          className="incoming-floating-menu"
          style={{ top: `${actionMenu.top}px`, left: `${actionMenu.left}px` }}
        >
          {actionMenu.type === 'shipment' && activeShipment && (
            <>
              <button
                type="button"
                className="incoming-floating-menu-item"
                onClick={() => {
                  editShipment(activeShipment)
                  setActionMenu(null)
                }}
              >
                Изменить
              </button>
              <button
                type="button"
                className="incoming-floating-menu-item incoming-floating-menu-item--danger"
                onClick={() => {
                  removeShipment(activeShipment.id)
                  setActionMenu(null)
                }}
              >
                Удалить
              </button>
            </>
          )}
          {actionMenu.type === 'expense' && activeExpense && (
            <>
              <button
                type="button"
                className="incoming-floating-menu-item"
                onClick={() => {
                  editExpense(activeExpense)
                  setActionMenu(null)
                }}
              >
                Изменить
              </button>
              <button
                type="button"
                className="incoming-floating-menu-item incoming-floating-menu-item--danger"
                onClick={() => {
                  removeExpense(activeExpense.id)
                  setActionMenu(null)
                }}
              >
                Удалить
              </button>
            </>
          )}
        </div>
      )}
    </PageShell>
  )
}

export default AdminIncomingShipments
