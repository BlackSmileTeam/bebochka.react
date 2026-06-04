import { parseSizeValue } from './SizeMultiSelect'
import { formatChildAge, formatChildGender } from '../utils/adminUserChildren'
import './AdminUserChildrenPanel.css'

export default function AdminUserChildrenPanel({ loading, error, children = [], title = 'Дети' }) {
  return (
    <section className="admin-user-children-panel">
      {title ? <h3 className="admin-user-children-panel__title">{title}</h3> : null}
      {loading ? (
        <p className="admin-user-children-panel__muted">Загрузка…</p>
      ) : error ? (
        <p className="admin-user-children-panel__error">{error}</p>
      ) : children.length === 0 ? (
        <p className="admin-user-children-panel__muted">Данные о детях отсутствуют</p>
      ) : (
        <div className="admin-children-table-wrap">
          <table className="admin-children-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Пол</th>
                <th>Возраст</th>
                <th>Размер</th>
                <th>Дата рождения</th>
              </tr>
            </thead>
            <tbody>
              {children.map((c) => {
                const dob = c.dateOfBirth
                const sizes = parseSizeValue(c.clothingSize).join(', ')
                return (
                  <tr key={c.id}>
                    <td data-label="Имя">{c.name || '—'}</td>
                    <td data-label="Пол">{formatChildGender(c.gender)}</td>
                    <td data-label="Возраст">{formatChildAge(dob)}</td>
                    <td data-label="Размер">{sizes || '—'}</td>
                    <td data-label="Дата рождения">
                      {dob ? new Date(dob).toLocaleDateString('ru-RU') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
