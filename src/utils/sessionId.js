/**
 * Gets or creates a session ID for the current user
 * Session ID is stored in localStorage and persists across page reloads
 * @returns {string} Session ID
 */
export function getSessionId() {
  let sessionId = localStorage.getItem('sessionId')
  
  if (!sessionId) {
    // Генерируем новый sessionId
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem('sessionId', sessionId)
    console.log('[Session] Created new session ID:', sessionId)
  }
  
  return sessionId
}

