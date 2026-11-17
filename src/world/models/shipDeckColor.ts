import type { ShipDeckSection } from '../../data/shipDeck'
import { hexTerrainColor } from '../maphex/hexColors'

/**
 * The colour of a ship's buildable deck section: yellow like the rest of the
 * piece when it is hovered or selected, or when a solid-land pen hovers that
 * section to build on it; ship wood otherwise.
 */
export function shipDeckColor(
  isHighlighted: boolean,
  isSectionHovered: boolean,
): string {
  return isHighlighted || isSectionHovered ? 'yellow' : hexTerrainColor.shipWood
}

export type DeckSection = ShipDeckSection

/**
 * The deck section that may light up. The section a pointer entered is local
 * component state, but only the pointer-out of that same mesh clears it, and
 * that handler is swapped out when the pen changes or the mesh is covered by
 * the piece just built on it. So it can go stale. A section only counts while
 * the store still says this ship is hovered and a solid-land pen is active.
 */
export function getActiveDeckSection({
  section,
  pid,
  hoveredPieceID,
  isSolidLandPenMode,
}: {
  section: DeckSection | null
  pid: string | undefined
  hoveredPieceID: string
  isSolidLandPenMode: boolean
}): DeckSection | null {
  if (!pid || !isSolidLandPenMode || hoveredPieceID !== pid) return null
  return section
}
