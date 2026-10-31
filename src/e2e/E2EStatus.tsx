import { type CSSProperties, useEffect, useSyncExternalStore } from 'react'
import useBoundStore from '../store/store'
import { initialE2EGraphicsTier, isE2E } from './isE2E'
import { getReady, subscribeReady } from './readyStore'

// Visually hidden but still in the accessibility tree (display:none would
// hide it from Playwright's accessibility snapshot too).
const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
  pointerEvents: 'none',
}

/**
 * Text mirror of the canvas for browser automation: the 3D view is invisible
 * to Playwright locators and accessibility snapshots, so say what is going on
 * in words. Rendered only when `isE2E` is true.
 */
export function E2EStatus() {
  if (!isE2E) return null
  return <E2EStatusInner />
}

function E2EStatusInner() {
  const ready = useSyncExternalStore(subscribeReady, getReady)
  const setGraphicsTier = useBoundStore((s) => s.setGraphicsTier)
  const mapName = useBoundStore((s) => s.hexMap.name)
  const pieceCount = useBoundStore((s) => s.boardPieces.length)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const penMode = useBoundStore((s) => s.penMode)
  const selectedCount = useBoundStore((s) => s.selectedPieceIDs.length)
  useEffect(() => {
    if (initialE2EGraphicsTier) {
      void setGraphicsTier(initialE2EGraphicsTier)
    }
  }, [setGraphicsTier])
  return (
    <div
      data-testid="app-status"
      data-ready={ready}
      aria-live="polite"
      style={visuallyHidden}
    >
      {ready
        ? `Map loaded: ${mapName}, ${pieceCount} pieces, level ${viewingLevel}, pen ${penMode}, ${selectedCount} selected`
        : 'Loading map'}
    </div>
  )
}
