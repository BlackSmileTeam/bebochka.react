import { useEffect, useState } from 'react'
import PageShell from '../components/PageShell'
import { api } from '../services/api'
import './AdminIncomingShipments.css'

const initialForm = {
  name: '',
  weightKg: '',
  itemCount: '',
  orderedAmount: '',
  notes: '',
  expenses: [{ name: '', amount: '' }]
}

function AdminIncomingShipments() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.getIncomingShipments()
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Не удалось загрузить поступления')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const edit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      weightKg: row.weightKg ?? '',
      itemCount: row.itemCount ?? '',
      orderedAmount: row.orderedAmount ?? '',
      notes: row.notes || '',
      expenses: Array.isArray(row.expenses) && row.expenses.length > 0
        ? row.expenses.map((e) => ({ name: e.name || '', amount: e.amount ?? '' }))
        : [{ name: '', amount: '' }]
    })
    setError('')
  }

  const reset = () => {
    setEditingId(null)
    setForm(initialForm)
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: String(form.name || '').trim(),
        weightKg: Number(form.weightKg || 0),
        itemCount: Number(form.itemCount || 0),
        orderedAmount: Number(form.orderedAmount || 0),
        notes: form.notes || null,
        expenses: (form.expenses || [])
          .map((e) => ({
            name: String(e.name || '').trim(),
            amount: Number(e.amount || 0)
          }))
          .filter((e) => e.name && e.amount > 0)
      }
      if (!payload.name) throw new Error('Введите название/код посылки')
      if (editingId) await api.updateIncomingShipment(editingId, payload)
      else await api.createIncomingShipment(payload)
      await load()
      reset()
    } catch (e2) {
      setError(e2.message || 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Удалить поступление?')) return
    try {
      await api.deleteIncomingShipment(id)
      await load()
    } catch (e) {
      setError(e.message || 'Не удалось удалить')
    }
  }

  const changeExpense = (index, field, value) => {
    setForm((prev) => {
      const next = [...(prev.expenses || [])]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, expenses: next }
    })
  }

  const addExpense = () => {
    setForm((prev) => ({ ...prev, expenses: [...(prev.expenses || []), { name: '', amount: '' }] }))
  }

  const removeExpense = (index) => {
    setForm((prev) => {
      const next = (prev.expenses || []).filter((_, i) => i !== index)
      return { ...prev, expenses: next.length > 0 ? next : [{ name: '', amount: '' }] }
    })
  }

  return (
    <PageShell title="Поступления">
      <div className="incoming-page">
        <form className="incoming-form card-surface" onSubmit={submit}>
          <h3 className="incoming-title">{editingId ? 'Редактировать поступление' : 'Новое поступление'}</h3>
          {error && <div className="incoming-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="shipment-name">Название/код посылки</label>
            <input id="shipment-name" name="name" value={form.name} onChange={onChange} placeholder="Например: CN-2026-04-15" />
          </div>
          <div className="incoming-grid">
            <div className="form-group">
              <label htmlFor="shipment-weight">Вес (кг)</label>
              <input id="shipment-weight" name="weightKg" type="number" step="0.001" value={form.weightKg} onChange={onChange} placeholder="0.000" />
            </div>
            <div className="form-group">
              <label htmlFor="shipment-count">Количество вещей</label>
              <input id="shipment-count" name="itemCount" type="number" value={form.itemCount} onChange={onChange} placeholder="0" />
            </div>
            <div className="form-group">
              <label htmlFor="shipment-ordered">Сумма закупки (₽)</label>
              <input id="shipment-ordered" name="orderedAmount" type="number" step="0.01" value={form.orderedAmount} onChange={onChange} placeholder="0.00" />
            </div>
          </div>

          <div className="incoming-expenses-block">
            <div className="incoming-expenses-header">
              <span>Мелкие расходы (стикеры, конфетки, зип-пакеты и т.п.)</span>
              <button type="button" className="btn btn-secondary btn-small" onClick={addExpense}>+ Добавить</button>
            </div>
            {(form.expenses || []).map((expense, index) => (
              <div className="incoming-expense-row" key={`expense-${index}`}>
                <input
                  type="text"
                  value={expense.name}
                  onChange={(e) => changeExpense(index, 'name', e.target.value)}
                  placeholder="Название расхода"
                />
                <input
                  type="number"
                  step="0.01"
                  value={expense.amount}
                  onChange={(e) => changeExpense(index, 'amount', e.target.value)}
                  placeholder="Сумма (₽)"
                />
                <button type="button" className="btn btn-danger btn-small" onClick={() => removeExpense(index)}>Удалить</button>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="shipment-notes">Комментарий</label>
            <textarea id="shipment-notes" name="notes" value={form.notes} onChange={onChange} placeholder="Комментарий" rows={3} />
          </div>
          <div className="incoming-actions">
            {editingId && <button type="button" className="btn btn-secondary" onClick={reset}>Отмена</button>}
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
          </div>
        </form>

        <div className="incoming-table-wrap">
          {loading ? <div>Загрузка...</div> : (
            <table className="incoming-table">
              <thead>
                <tr>
                  <th>Посылка</th><th>Вес</th><th>Кол-во</th><th>Закупка</th><th>Мелкие</th><th>Расходы</th><th>Продано</th><th>Итог</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{Number(r.weightKg || 0).toFixed(3)} кг</td>
                    <td>{r.itemCount || 0}</td>
                    <td>{Number(r.orderedAmount || 0).toLocaleString('ru-RU')} ₽</td>
                    <td>{Number(r.miscExpensesTotal || 0).toLocaleString('ru-RU')} ₽</td>
                    <td>{Number(r.totalExpenses || 0).toLocaleString('ru-RU')} ₽</td>
                    <td>{r.revenue == null ? '-' : `${Number(r.revenue).toLocaleString('ru-RU')} ₽`}</td>
                    <td title="Формула: закупка - продано + мелкие">
                      {r.actualMargin == null ? '-' : `${Number(r.actualMargin).toLocaleString('ru-RU')} ₽`}
                    </td>
                    <td>
                      <button className="btn btn-secondary" onClick={() => edit(r)}>Изм.</button>
                      <button className="btn btn-danger" onClick={() => remove(r.id)}>Удал.</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageShell>
  )
}

export default AdminIncomingShipments
