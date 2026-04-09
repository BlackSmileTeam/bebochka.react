import { useState, useEffect } from 'react'
import './CookieNotice.css'

const STORAGE_KEY = 'bebochka_cookie_notice_dismissed_v1'

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch (_) {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-notice" role="dialog" aria-label="Уведомление о файлах cookie">
      <div className="cookie-notice-inner">
        <p>
          Мы используем <strong>файлы cookie</strong> и аналогичные технологии для работы сайта, корзины,
          входа в аккаунт и запоминания настроек. Обработка данных — в соответствии с Федеральным законом
          № 152-ФЗ «О персональных данных». Продолжая пользоваться сайтом, вы соглашаетесь с использованием cookie
          в указанных целях.
        </p>
        <button type="button" className="cookie-notice-btn" onClick={dismiss}>
          Понятно
        </button>
      </div>
    </div>
  )
}
