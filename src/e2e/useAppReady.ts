import { useSyncExternalStore } from 'react'
import { getReady, subscribeReady } from './readyStore'

export function useAppReady() {
  return useSyncExternalStore(subscribeReady, getReady, () => false)
}
