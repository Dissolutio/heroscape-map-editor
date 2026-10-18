import { useEffect, useState } from 'react'
import { safeGetJSON, safeSetItem } from './safeStorage'

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  // try local first, default to initialValue
  const readValue = () => {
    // Prevent build error "window is undefined"
    if (typeof window === 'undefined') {
      return initialValue
    }
    return safeGetJSON<T>(key, initialValue) ?? initialValue
  }

  const [storedValue, setStoredValue] = useState<T>(() => readValue())

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    if (typeof window === 'undefined') {
      console.warn(
        `Tried setting localStorage key “${key}” even though environment is not a client`,
      )
      return
    }
    try {
      // Allow value to be a function so we have the same API as useState
      const newValue = value instanceof Function ? value(storedValue) : value
      // Save to local storage
      const result = safeSetItem(key, JSON.stringify(newValue))
      if (!result.ok) return
      // Save state
      setStoredValue(newValue)
      // We dispatch a custom event so every useLocalStorage hook are notified
      const writeValueToLocalStorage = () => {
        window.dispatchEvent(new Event('local-storage'))
      }
      writeValueToLocalStorage()
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error)
    }
  }

  // set/remove localStorage listeners (1 native, 1 custom)
  // biome-ignore lint/correctness/useExhaustiveDependencies: <on mount>
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const handleStorageChange = () => {
      setStoredValue(readValue())
    }
    // this only works for other documents, not the current one
    window.addEventListener('storage', handleStorageChange)
    // this is a custom event, triggered in writeValueToLocalStorage
    window.addEventListener('local-storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('local-storage', handleStorageChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [storedValue, setValue]
}
