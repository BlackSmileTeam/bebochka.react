import { useState } from 'react'
import PageShell from '../components/PageShell'
import './AdminBackup.css'

function getToken() {
  return localStorage.getItem('authToken') || ''
}

async function downloadBackup() {
  const token = getToken()
  const resp = await fetch('/api/admin/backup/download', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  })
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error(txt || 'Не удалось скачать бэкап')
  }
  const blob = await resp.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bebochka-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.zip`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function restoreBackup(file) {
  const token = getToken()
  const fd = new FormData()
  fd.append('file', file)
  const resp = await fetch('/api/admin/backup/restore', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd
  })
  const data = await resp.json().catch(() => null)
  if (!resp.ok) {
    throw new Error(data?.message || 'Не удалось восстановить бэкап')
  }
  return data
}

export default function AdminBackup() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  return (
    <PageShell title="Бэкап">
      <div className="admin-backup">
        <div className="admin-backup-card">
          <h3>Скачать бэкап</h3>
          <p>Архив содержит дамп базы данных и папку фотографий карточек.</p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setErr('')
              setMsg('')
              try {
                await downloadBackup()
                setMsg('Бэкап сформирован и скачан.')
              } catch (e) {
                setErr(e.message || 'Ошибка')
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Формирование…' : 'Скачать'}
          </button>
        </div>

        <div className="admin-backup-card admin-backup-card--danger">
          <h3>Восстановить из архива</h3>
          <p>
            Восстановление перезапишет базу данных и фотографии. Используйте только проверенный архив.
          </p>
          <input
            type="file"
            accept=".zip,application/zip"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setBusy(true)
              setErr('')
              setMsg('')
              try {
                await restoreBackup(file)
                setMsg('Бэкап восстановлен.')
              } catch (e2) {
                setErr(e2.message || 'Ошибка')
              } finally {
                setBusy(false)
                e.target.value = ''
              }
            }}
          />
        </div>

        {(msg || err) && (
          <div className={`admin-backup-message ${err ? 'is-error' : 'is-ok'}`}>
            {err || msg}
          </div>
        )}
      </div>
    </PageShell>
  )
}

