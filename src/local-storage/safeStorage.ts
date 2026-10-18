export function safeGetJSON<T = unknown>(
  key: string,
  fallback: T | null = null,
): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error)
    return fallback
  }
}

export function safeSetItem(
  key: string,
  value: string,
): { ok: true } | { ok: false; quota: boolean } {
  try {
    localStorage.setItem(key, value)
    return { ok: true }
  } catch (error) {
    const quota =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    console.warn(`Error setting localStorage key "${key}":`, error)
    return { ok: false, quota }
  }
}

export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error)
  }
}
