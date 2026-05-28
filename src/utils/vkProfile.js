/**
 * Ссылка на профиль VK по данным пользователя из API.
 * Числовой id VK: https://vk.com/id{userId}
 */
export function getVkProfileUrl(user) {
  if (!user) return null

  const explicit = user.vkProfileUrl ?? user.VkProfileUrl
  if (explicit && /^https?:\/\//i.test(String(explicit).trim())) {
    return String(explicit).trim()
  }

  const raw = user.vkUserId ?? user.VkUserId ?? user.vkId ?? user.VkId
  if (raw === undefined || raw === null || raw === '') return null

  const normalized = String(raw).trim()
  if (!normalized) return null
  if (/^https?:\/\//i.test(normalized)) return normalized

  if (/^\d+$/.test(normalized)) {
    return `https://vk.com/id${normalized}`
  }

  return `https://vk.com/${normalized}`
}
