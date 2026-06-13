/**
 * Сообщения об ошибках для пользователя (без технических деталей).
 */
export function formatUserFacingError(err, fallback = 'Что-то пошло не так. Попробуйте ещё раз.') {
  const msg = String(err?.message || '').trim()

  if (
    msg === 'Failed to fetch'
    || msg.includes('Network Error')
    || err?.code === 'ERR_NETWORK'
    || err?.name === 'TypeError' && msg === 'Failed to fetch'
  ) {
    return 'Не удалось связаться с сайтом. Проверьте интернет и попробуйте снова.'
  }

  const apiMsg = err?.response?.data?.message || err?.response?.data?.Message
  if (apiMsg) return String(apiMsg)

  if (msg && !msg.startsWith('Request failed with status')) {
    return msg
  }

  return fallback
}
