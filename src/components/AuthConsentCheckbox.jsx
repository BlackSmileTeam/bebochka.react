import { Link } from 'react-router-dom'

export default function AuthConsentCheckbox({ checked, onChange, id = 'auth-consent' }) {
  return (
    <div className="consent-block">
      <label htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          Я принимаю{' '}
          <Link to="/terms" target="_blank" rel="noopener noreferrer" className="consent-link">
            пользовательское соглашение
          </Link>{' '}
          и даю согласие на обработку моих персональных данных *
        </span>
      </label>
    </div>
  )
}
