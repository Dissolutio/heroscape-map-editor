import { useCallback, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'

/**
 * Hook to manage context menu state for piece right-clicks.
 * Returns handlers for pointer events and context menu state.
 */
export function usePieceContextMenu() {
  const [menuState, setMenuState] = useState<{
    anchorEl: HTMLElement | null
    pieceID: string
  }>({
    anchorEl: null,
    pieceID: '',
  })

  const handleContextMenu = useCallback(
    (event: ThreeEvent<PointerEvent>, pieceID: string) => {
      event.stopPropagation()

      // Create a synthetic anchor element at the pointer position
      // This allows us to position the menu where the user right-clicked
      const anchorElement = document.createElement('div')
      anchorElement.style.position = 'fixed'
      anchorElement.style.left = `${event.nativeEvent.clientX}px`
      anchorElement.style.top = `${event.nativeEvent.clientY}px`
      anchorElement.style.pointerEvents = 'none'
      anchorElement.style.visibility = 'hidden'
      document.body.appendChild(anchorElement)

      setMenuState({
        anchorEl: anchorElement,
        pieceID,
      })
    },
    [],
  )

  const handleCloseMenu = useCallback(() => {
    if (menuState.anchorEl?.parentElement) {
      menuState.anchorEl.parentElement.removeChild(menuState.anchorEl)
    }
    setMenuState({
      anchorEl: null,
      pieceID: '',
    })
  }, [menuState.anchorEl])

  return {
    menuState,
    handleContextMenu,
    handleCloseMenu,
  }
}
