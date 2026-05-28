import { getVkProfileUrl } from '../utils/vkProfile'
import './VkProfileLink.css'

export default function VkProfileLink({ user, className = '', showLabel = true, iconOnly = false }) {
  const url = getVkProfileUrl(user)
  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`vk-profile-link${className ? ` ${className}` : ''}${iconOnly ? ' vk-profile-link--icon-only' : ''}`}
      title="Открыть профиль ВКонтакте"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="vk-profile-link__icon" aria-hidden="true">VK</span>
      {showLabel && !iconOnly && <span className="vk-profile-link__label">Профиль в VK</span>}
    </a>
  )
}
