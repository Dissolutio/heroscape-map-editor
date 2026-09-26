import { isTauri } from '@tauri-apps/api/core'

// Safe wrapper to prevent standard browsers from choking on the native desktop API
export const isDesktop = (() => {
  try {
    return isTauri()
  } catch {
    return false // Safely fall back to web mode if the API fails to resolve
  }
})()

export const isWeb = !isDesktop
