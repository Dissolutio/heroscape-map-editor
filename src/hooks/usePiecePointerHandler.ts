import type { ThreeEvent } from '@react-three/fiber'

/**
 * Hook to handle piece pointer events with context menu support.
 * Separates left-click (selection) from right-click (context menu).
 */
export function usePiecePointerHandler({
  pieceID,
  onLeftClick,
  onRightClick,
}: {
  pieceID: string
  onLeftClick: (e: ThreeEvent<PointerEvent>, isMultiSelect: boolean) => void
  onRightClick?: (e: ThreeEvent<PointerEvent>, pieceID: string) => void
}) {
  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()

    if (event.button === 0) {
      // Left click
      const isMultiSelect = event.shiftKey || event.ctrlKey || event.metaKey
      onLeftClick(event, isMultiSelect)
    } else if (event.button === 2 && onRightClick) {
      // Right click
      onRightClick(event, pieceID)
    }
    // Ignore middle mouse (button 1) and other buttons
  }

  return { handlePointerUp }
}
