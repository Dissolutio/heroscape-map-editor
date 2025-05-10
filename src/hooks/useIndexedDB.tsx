import { useEffect, useState } from 'react'
import { MapFileState } from '../types'

type IndexedDBHook<T> = {
  data: T[]
  loading: boolean
  error: Error | null
  addData: (item: MapFileState) => Promise<void>
}

const useIndexedDB = (
  dbName: string,
  storeName: string,
  version: number = 1,
): IndexedDBHook<MapFileState> => {
  const [data, setData] = useState<MapFileState[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const openDB = async () => {
      try {
        const db: IDBDatabase = await new Promise((resolve, reject) => {
          const request = window.indexedDB.open(dbName, version)

          request.onerror = () => reject(new Error('Failed to open database'))
          request.onsuccess = (event) =>
            resolve((event.target as IDBOpenDBRequest).result)

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, {
                keyPath: 'id',
                autoIncrement: true,
              })
            }
          }
        })

        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const items: MapFileState[] = await new Promise((resolve, reject) => {
          const request = store.getAll()
          request.onerror = () => reject(new Error('Failed to get data'))
          request.onsuccess = (event) =>
            resolve((event.target as IDBRequest<MapFileState[]>).result)
        })

        setData(items)
        setLoading(false)
        db.close()
      } catch (err) {
        setError(err as Error)
        setLoading(false)
      }
    }

    openDB()
  }, [dbName, storeName, version])

  const addData = async (item: MapFileState): Promise<void> => {
    try {
      const db: IDBDatabase = await new Promise((resolve, reject) => {
        const request = window.indexedDB.open(dbName, version)

        request.onerror = () => reject(new Error('Failed to open database'))
        request.onsuccess = (event) =>
          resolve((event.target as IDBOpenDBRequest).result)

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, {
              keyPath: 'id',
              autoIncrement: true,
            })
          }
        }
      })

      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      await new Promise<void>((resolve, reject) => {
        const request = store.add(item, item.hexMap.id)
        request.onerror = () => reject(new Error('Failed to add data'))
        request.onsuccess = () => resolve()
      })

      const updatedItems: MapFileState[] = await new Promise(
        (resolve, reject) => {
          const request = store.getAll()
          request.onerror = () => reject(new Error('Failed to get data'))
          request.onsuccess = (event) =>
            resolve((event.target as IDBRequest<MapFileState[]>).result)
        },
      )

      setData(updatedItems)
      db.close()
    } catch (err) {
      setError(err as Error)
    }
  }

  return { data, loading, error, addData }
}

export default useIndexedDB
