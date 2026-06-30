import { useEffect, useState } from 'react'

type BroadcastMessage =
  | { type: 'HELLO'; tabId: string }
  | { type: 'HELLO_ACK'; tabId: string }
  | { type: 'GOODBYE'; tabId: string }

export function useHasOtherTabs() {
  const [tabId] = useState(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `tab-${crypto.randomUUID()}`
    }
    return `tab-${Math.random().toString(36).slice(2)}`
  })
  const [tabIds, setTabIds] = useState<Set<string>>(() => new Set([tabId]))

  useEffect(() => {
    const channel = new BroadcastChannel('hexoscape')

    const addTabId = (otherTabId: string) => {
      setTabIds((current) => {
        if (current.has(otherTabId)) {
          return current
        }
        const next = new Set(current)
        next.add(otherTabId)
        return next
      })
    }

    const removeTabId = (otherTabId: string) => {
      setTabIds((current) => {
        if (!current.has(otherTabId)) {
          return current
        }
        const next = new Set(current)
        next.delete(otherTabId)
        return next
      })
    }

    channel.onmessage = (event) => {
      const message = event.data as BroadcastMessage
      if (!message || message.tabId === tabId) {
        return
      }

      switch (message.type) {
        case 'HELLO':
          addTabId(message.tabId)
          channel.postMessage({ type: 'HELLO_ACK', tabId })
          break
        case 'HELLO_ACK':
          addTabId(message.tabId)
          break
        case 'GOODBYE':
          removeTabId(message.tabId)
          break
        default:
          break
      }
    }

    const announce = () => {
      channel.postMessage({ type: 'HELLO', tabId })
    }

    const sayGoodbye = () => {
      channel.postMessage({ type: 'GOODBYE', tabId })
    }

    announce()
    window.addEventListener('beforeunload', sayGoodbye)

    return () => {
      window.removeEventListener('beforeunload', sayGoodbye)
      sayGoodbye()
      channel.close()
    }
  }, [tabId])

  return {
    tabId,
    tabCount: tabIds.size,
    isDuplicateTab: tabIds.size > 1,
  }
}
