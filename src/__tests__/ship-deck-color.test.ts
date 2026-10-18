/**
 * SHIP DECK COLOR (world/models/shipDeckColor.ts)
 *
 * The buildable deck sections of the ship bow and ship wall must turn yellow
 * with the rest of the piece when it is hovered or selected. They used to
 * look only at their own build hover, leaving a dark strip on a selected bow.
 */
import { describe, expect, it } from 'vitest'
import { hexTerrainColor } from '../world/maphex/hexColors'
import { shipDeckColor } from '../world/models/shipDeckColor'

describe('shipDeckColor', () => {
  it.each([
    { isHighlighted: false, isSectionHovered: false, color: 'shipWood' },
    { isHighlighted: true, isSectionHovered: false, color: 'yellow' },
    { isHighlighted: false, isSectionHovered: true, color: 'yellow' },
    { isHighlighted: true, isSectionHovered: true, color: 'yellow' },
  ])(
    'highlighted $isHighlighted, section hovered $isSectionHovered: $color',
    ({ isHighlighted, isSectionHovered, color }) => {
      expect(shipDeckColor(isHighlighted, isSectionHovered)).toBe(
        color === 'yellow' ? 'yellow' : hexTerrainColor.shipWood,
      )
    },
  )
})
