import type { Dictionary } from 'lodash'
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useState,
} from 'react'

type EventContextType = {
  publish: (eventName: string) => void
  subscribe: (eventName: string, callback: () => void) => void
  unsubscribe: (eventName: string, callback: () => void) => void
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export const EventProvider = ({ children }: PropsWithChildren) => {
  const [events, setEvents] = useState<Dictionary<(() => void)[]>>({})

  const subscribe = (eventName: string, callback: () => void) => {
    setEvents((prevEvents) => ({
      ...prevEvents,
      [eventName]: [...(prevEvents[eventName] || []), callback],
    }))
  }

  const unsubscribe = (eventName: string, callback: () => void) => {
    setEvents((prevEvents) => ({
      ...prevEvents,
      [eventName]: (prevEvents[eventName] || []).filter(
        (cb) => cb !== callback,
      ),
    }))
  }

  const publish = (eventName: string) => {
    const arr = events?.[eventName] ?? []
    // biome-ignore lint/complexity/noForEach: <not complex>
    arr.forEach((callback) => callback())
  }

  return (
    <EventContext.Provider value={{ subscribe, unsubscribe, publish }}>
      {children}
    </EventContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export default function useEvent(): EventContextType {
  const ctx = useContext(EventContext)
  if (!ctx) {
    throw new Error('useEvent must be used within an EventProvider')
  }
  return ctx
}
