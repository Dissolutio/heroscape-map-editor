/**
 * Tiny external store for "is the 3D map ready". ReadySignal (inside the
 * canvas) writes it; the hidden status element (outside the canvas) reads it.
 */
type Listener = () => void

let ready = false
const listeners = new Set<Listener>()

export const getReady = () => ready

export const setReady = (next: boolean) => {
  if (ready === next) return
  ready = next
  for (const listener of listeners) listener()
}

export const subscribeReady = (listener: Listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
