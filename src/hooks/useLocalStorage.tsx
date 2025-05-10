import { useEffect, useState } from 'react'

// https://stackoverflow.com/questions/4391575/how-to-find-the-size-of-localstorage
// GETS MEMORY OF LOCAL STORAGE

// var _lsTotal = 0,
//     _xLen, _x;
// for (_x in localStorage) {
//     if (!localStorage.hasOwnProperty(_x)) {
//         continue;
//     }
//     _xLen = ((localStorage[_x].length + _x.length) * 2);
//     _lsTotal += _xLen;
//     console.log(_x.substr(0, 50) + " = " + (_xLen / 1024).toFixed(2) + " KB")
// };
// console.log("Total = " + (_lsTotal / 1024).toFixed(2) + " KB");

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
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error)
      return initialValue
    }
  }

  const [storedValue, setStoredValue] = useState<T>(() => readValue())

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    if (typeof window == 'undefined') {
      console.warn(
        `Tried setting localStorage key “${key}” even though environment is not a client`,
      )
    }
    try {
      // Allow value to be a function so we have the same API as useState
      const newValue = value instanceof Function ? value(storedValue) : value
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(newValue))
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
  useEffect(() => {
    if (typeof window == 'undefined') {
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
