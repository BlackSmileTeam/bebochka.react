import { Link } from 'react-router-dom'

/**
 * @param {'register' | 'vk'} variant — register: форма по телефону; vk: вход/регистрация через ВКонтакте
 */
export default function AuthConsentCheckbox({ checked, onChange, id = 'auth-consent', variant = 'register' }) {
  const isVk = variant === 'vk'

  return (
    <div className={`consent-block${isVk ? ' consent-block--vk' : ''}`}>
      <label htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          <>
            Я принимаю{' '}
            <Link to="/terms" target="_blank" rel="noopener noreferrer" className="consent-link">
              пользовательское соглашение
            </Link>{' '}
            и даю согласие на обработку моих персональных данных *
          </>
        </span>
      </label>
    </div>
  )
}
