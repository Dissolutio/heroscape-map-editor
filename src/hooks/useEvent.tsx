import type { Dictionary } from 'lodash'
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useRef,
} from 'react'

type EventContextType = {
  publish: (eventName: string) => void
  subscribe: (eventName: string, callback: () => void) => void
  unsubscribe: (eventName: string, callback: () => void) => void
}

const EventContext = createContext<EventContextType>(undefined!)

export const EventProvider = ({ children }: PropsWithChildren) => {
  const eventsRef = useRef<Dictionary<(() => void)[]>>({})

  const subscribe = useCallback((eventName: string, callback: () => void) => {
    eventsRef.current = {
      ...eventsRef.current,
      [eventName]: [...(eventsRef.current[eventName] || []), callback],
    }
  }, [])

  const unsubscribe = useCallback((eventName: string, callback: () => void) => {
    eventsRef.current = {
      ...eventsRef.current,
      [eventName]: (eventsRef.current[eventName] || []).filter(
        (cb) => cb !== callback,
      ),
    }
  }, [])

  const publish = useCallback((eventName: string) => {
    const arr = eventsRef.current?.[eventName] ?? []
    arr.forEach((callback) => callback())
  }, [])

  return (
    <EventContext.Provider value={{ subscribe, unsubscribe, publish }}>
      {children}
    </EventContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export default function useEvent() {
  return useContext(EventContext)
}
