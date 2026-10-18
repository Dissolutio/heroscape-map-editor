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
