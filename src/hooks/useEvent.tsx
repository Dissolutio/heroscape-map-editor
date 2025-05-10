import { Dictionary } from 'lodash'
import { PropsWithChildren, createContext, useContext, useState } from 'react'

type EventContextType = {
  publish: (eventName: string) => void
  subscribe: (eventName: string, callback: () => void) => void
  unsubscribe: (eventName: string, callback: () => void) => void
}

const EventContext = createContext<EventContextType>(undefined!)

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
    arr.forEach((callback) => callback())
  }

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
