import { useEffect, useRef, useState } from 'react'
import PageShell from '../components/PageShell'
import './AdminBackup.css'

function getToken() {
  return localStorage.getItem('authToken') || ''
}

function authHeaders(json = false) {
  const token = getToken()
  const h = {}
  if (token) h.Authorization = `Bearer ${token}`
  if (json) h['Content-Type'] = 'application/json'
  return h
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function monthAgoIso() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

async function pollProgress(jobId, onProgress) {
  for (;;) {
    const resp = await fetch(`/api/admin/backup/progress/${jobId}`, {
      headers: authHeaders()
    })
    if (!resp.ok) {
      const data = await resp.json().catch(() => null)
      throw new Error(data?.message || 'Не удалось получить прогресс')
    }
    const data = await resp.json()
    const percent = data.percent ?? data.Percent ?? 0
    const stage = data.stage ?? data.Stage ?? ''
    const status = (data.status ?? data.Status ?? '').toLowerCase()
    onProgress(percent, stage)
    if (status === 'failed') {
      throw new Error(data.error ?? data.Error ?? 'Ошибка формирования бэкапа')
    }
    if (status === 'completed') return
    await new Promise((r) => setTimeout(r, 450))
  }
}

async function downloadJob(jobId) {
  const resp = await fetch(`/api/admin/backup/download/${jobId}`, {
    headers: authHeaders()
  })
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error(txt || 'Не удалось скачать архив')
  }
  const blob = await resp.blob()
  const cd = resp.headers.get('content-disposition') || ''
  const match = cd.match(/filename="?([^";\n]+)"?/i)
  const fileName = match?.[1] || `bebochka-backup-${new Date().toISOString().slice(0, 10)}.zip`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function startAndDownloadBackup(dateFrom, dateTo, onProgress) {
  const resp = await fetch('/api/admin/backup/start', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ dateFrom, dateTo })
  })
  const data = await resp.json().catch(() => null)
  if (!resp.ok) {
    throw new Error(data?.message || 'Не удалось запустить бэкап')
  }
  const jobId = data.jobId ?? data.JobId
  if (!jobId) throw new Error('Сервер не вернул идентификатор задачи')
  onProgress(1, 'Запуск…')
  await pollProgress(jobId, onProgress)
  onProgress(100, 'Скачивание архива…')
  await downloadJob(jobId)
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
  const [dateFrom, setDateFrom] = useState(monthAgoIso)
  const [dateTo, setDateTo] = useState(todayIso)
  const [busy, setBusy] = useState(false)
  const [percent, setPercent] = useState(0)
  const [stage, setStage] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const abortRef = useRef(false)

  useEffect(() => () => { abortRef.current = true }, [])

  const onProgress = (p, s) => {
    if (abortRef.current) return
    setPercent(p)
    setStage(s)
  }

  return (
    <PageShell title="Бэкап">
      <div className="admin-backup">
        <div className="admin-backup-card">
          <h3>Скачать бэкап за период</h3>
          <p>
            В архив попадут записи, <strong>созданные</strong> в указанном диапазоне дат (по московскому времени),
            и фотографии, привязанные к этим записям (товары, отзывы, коллажи анонсов).
          </p>
          <div className="admin-backup-dates">
            <div className="form-group">
              <label htmlFor="backup-from">С</label>
              <input
                id="backup-from"
                type="date"
                value={dateFrom}
                max={dateTo}
                disabled={busy}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="backup-to">По</label>
              <input
                id="backup-to"
                type="date"
                value={dateTo}
                min={dateFrom}
                disabled={busy}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          {busy && (
            <div className="admin-backup-progress" role="status" aria-live="polite">
              <div className="admin-backup-progress-track">
                <div
                  className="admin-backup-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                />
              </div>
              <p className="admin-backup-progress-label">
                <span className="admin-backup-progress-pct">{percent}%</span>
                {stage && <span className="admin-backup-progress-stage">{stage}</span>}
              </p>
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !dateFrom || !dateTo}
            onClick={async () => {
              if (!dateFrom || !dateTo) return
              if (dateTo < dateFrom) {
                setErr('Дата «по» не может быть раньше даты «с».')
                return
              }
              setBusy(true)
              setErr('')
              setMsg('')
              setPercent(0)
              setStage('Старт…')
              abortRef.current = false
              try {
                await startAndDownloadBackup(dateFrom, dateTo, onProgress)
                setPercent(100)
                setStage('Готово')
                setMsg(`Бэкап за ${dateFrom} — ${dateTo} сформирован и скачан.`)
              } catch (e) {
                setErr(e.message || 'Ошибка')
                setPercent(0)
                setStage('')
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Формирование…' : 'Сформировать и скачать'}
          </button>
        </div>

        <div className="admin-backup-card admin-backup-card--danger">
          <h3>Восстановить из архива</h3>
          <p>
            Полное восстановление — только из архива с дампом БД (папка <code>db/</code>).
            Архивы за период (JSON) предназначены для выгрузки данных, не для полной замены базы.
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
              setPercent(0)
              setStage('')
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
