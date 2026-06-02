const STORAGE_KEY = 'bebochka-profile-tab'

export const PROFILE_TABS = ['orders', 'favorites', 'settings']

export function readProfileTab() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return PROFILE_TABS.includes(raw) ? raw : 'orders'
  } catch {
    return 'orders'
  }
}

export function saveProfileTab(tab) {
  if (!PROFILE_TABS.includes(tab)) return
  try {
    localStorage.setItem(STORAGE_KEY, tab)
  } catch {
    /* ignore */
  }
}
