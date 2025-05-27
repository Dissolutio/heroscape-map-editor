import { useState } from 'react'

export function useSessionStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  // try local first, default to initialValue
  const readValue = () => {
    // Prevent build error "window is undefined"
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading sessionStorage key “${key}”:`, error)
      return initialValue
    }
  }

  const [storedValue, setStoredValue] = useState<T>(() => readValue())

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    if (typeof window === 'undefined') {
      console.warn(
        `Tried setting sessionStorage key “${key}” even though environment is not a client`,
      )
    }
    try {
      // Allow value to be a function so we have the same API as useState
      const newValue = value instanceof Function ? value(storedValue) : value
      // Save to local storage
      window.sessionStorage.setItem(key, JSON.stringify(newValue))
      // Save state
      setStoredValue(newValue)
    } catch (error) {
      console.warn(`Error setting sessionStorage key “${key}”:`, error)
    }
  }

  return [storedValue, setValue]
}
