import { useEffect, useState } from 'react'
import { api } from '../services/api'
import PageShell from '../components/PageShell'
import './AdminReferrals.css'

function formatDateTime(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('ru-RU')
  } catch {
    return String(value)
  }
}

export default function AdminReferrals() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getAdminReferrals(search.trim(), status)
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Не удалось загрузить рефералов')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <PageShell title="Реферальная программа">
      <div className="admin-referrals-toolbar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск: код, имя, телефон"
          className="admin-referrals-search"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-referrals-status">
          <option value="">Все статусы</option>
          <option value="Registered">Зарегистрирован</option>
          <option value="RewardGranted">Скидка начислена</option>
        </select>
        <button type="button" className="admin-referrals-btn" onClick={load}>
          Найти
        </button>
      </div>

      {loading && <p>Загрузка…</p>}
      {error && <p className="admin-referrals-error">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="admin-referrals-empty">Рефералы не найдены.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="admin-referrals-table-wrap">
          <table className="admin-referrals-table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Пригласивший</th>
                <th>Приглашённый</th>
                <th>Статус</th>
                <th>Создан</th>
                <th>Регистрация</th>
                <th>Заказ</th>
                <th>Награды</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id ?? row.Id}>
                  <td><code>{row.code ?? row.Code}</code></td>
                  <td>
                    <div>{row.referrerName ?? row.ReferrerName ?? '—'}</div>
                    <div className="admin-referrals-sub">{row.referrerPhone ?? row.ReferrerPhone ?? ''}</div>
                  </td>
                  <td>
                    <div>{row.referredName ?? row.ReferredName ?? '—'}</div>
                    <div className="admin-referrals-sub">{row.referredPhone ?? row.ReferredPhone ?? ''}</div>
                  </td>
                  <td>{row.status ?? row.Status}</td>
                  <td>{formatDateTime(row.createdAt ?? row.CreatedAt)}</td>
                  <td>{formatDateTime(row.registeredAt ?? row.RegisteredAt)}</td>
                  <td>{row.firstOrderNumber ?? row.FirstOrderNumber ?? '—'}</td>
                  <td>
                    {(row.referrerRewardAmount ?? row.ReferrerRewardAmount) != null && (
                      <span>Пригласивший: {row.referrerRewardAmount ?? row.ReferrerRewardAmount} ₽</span>
                    )}
                    {(row.referredRewardAmount ?? row.ReferredRewardAmount) != null && (
                      <span className="admin-referrals-sub">
                        Приглашённый: {row.referredRewardAmount ?? row.ReferredRewardAmount} ₽
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  )
}
