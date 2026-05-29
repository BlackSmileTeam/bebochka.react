import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { initYandexMetrika } from '../utils/yandexMetrika'
import './CookieNotice.css'

export const COOKIE_NOTICE_STORAGE_KEY = 'bebochka_cookie_notice_dismissed_v1'

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY)) {
        initYandexMetrika()
        setVisible(false)
      } else {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, '1')
    } catch (_) {}
    initYandexMetrika()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-notice" role="dialog" aria-label="Уведомление о файлах cookie">
      <div className="cookie-notice-inner">
        <p>
          Мы используем <strong>файлы cookie</strong> и локальное хранилище браузера для работы сайта:
          вход в аккаунт, корзина, сохранение сессии и ваших настроек. Также подключается{' '}
          <strong>Яндекс.Метрика</strong> — она помогает понять, как пользователи пользуются сайтом
          (просмотры страниц, клики; при включённом вебвизоре — записи обезличенных сессий).
          Подробнее — в{' '}
          <Link to="/terms" className="cookie-notice-link">
            пользовательском соглашении
          </Link>
          . Продолжая пользоваться сайтом и нажимая «Принять», вы соглашаетесь с использованием cookie
          и аналитики в указанных целях (152-ФЗ).
        </p>
        <button type="button" className="cookie-notice-btn" onClick={dismiss}>
          Принять
        </button>
      </div>
    </div>
  )
}
