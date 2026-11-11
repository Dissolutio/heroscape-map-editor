/*
 * These are Renegade's publication colors. Do not update this snapshot unless
 * the PM asked for a color change.
 */
import { describe, expect, it } from 'vitest'
import type { ObjectiveMarker } from '../data/objectiveMarkers'
import { piecesSoFar } from '../data/pieces'
import { SETTINGS_DEFAULTS } from '../local-storage/settings'
import {
  ASPHALT_BORDER_COLOR,
  ASPHALT_SUBLEVEL_BORDER_COLOR,
} from '../pdf-svg-shared/exportBorderColor'
import { levelLogoShapes } from '../pdf-svg-shared/levelLogoShapes'
import { getObjectiveMarkerExportColors } from '../pdf-svg-shared/objectiveMarkerExport'
import {
  getSvgHexBorderColor,
  getSvgHexFillColor,
  getSvgHexSubLevelBorderColor,
  getSvgHexSubLevelFillColor,
} from '../svg-map/getSvgHexColors'
import type { DecodedPieceID } from '../types'
import {
  hexTerrainColor,
  svgColors,
  svgSubLevelColors,
  terrainCapColors,
  virtualscapeSublevelTileColors,
  virtualscapeTileColors,
} from '../world/maphex/hexColors'

const decodedPiece = (
  inventoryID: string,
  terrain: string,
): DecodedPieceID => ({
  boardPieceID: `${inventoryID}-board-piece`,
  inventoryID,
  altitude: 0,
  rotation: 0,
  boardHexID: '0~0~0',
  pieceCoords: { q: 0, r: 0, s: 0 },
  terrain,
})

const entriesForTable = (name: string, table: Record<string, string>) =>
  Object.entries(table).map(([key, color]) => `${name}.${key}=${color}`)

const exportColors = () => {
  const entries = [
    ...entriesForTable('hexTerrainColor', hexTerrainColor),
    ...entriesForTable('svgColors', svgColors),
    ...entriesForTable('svgSubLevelColors', svgSubLevelColors),
    ...entriesForTable('terrainCapColors', terrainCapColors),
    ...entriesForTable(
      'virtualscapeSublevelTileColors',
      virtualscapeSublevelTileColors,
    ),
    ...entriesForTable('virtualscapeTileColors', virtualscapeTileColors),
    ...levelLogoShapes.map(
      ({ fill }, index) => `levelLogoShapes.${index}.fill=${fill}`,
    ),
    `exportBorderColor.ASPHALT_BORDER_COLOR=${ASPHALT_BORDER_COLOR}`,
    `exportBorderColor.ASPHALT_SUBLEVEL_BORDER_COLOR=${ASPHALT_SUBLEVEL_BORDER_COLOR}`,
    ...(['black', 'white'] as const).map((style) => {
      const marker = { style } as ObjectiveMarker
      return `objectiveMarker.${style}=${JSON.stringify(
        getObjectiveMarkerExportColors(marker),
      )}`
    }),
    ...Object.entries(piecesSoFar).map(([inventoryID, piece]) => {
      const hex = decodedPiece(inventoryID, piece.terrain)
      const fill = {
        top: getSvgHexFillColor(hex),
        subLevel: getSvgHexSubLevelFillColor(hex),
      }
      const borders = {
        top: {
          terrain: getSvgHexBorderColor(hex, true),
          default: getSvgHexBorderColor(hex, false),
        },
        subLevel: {
          terrain: getSvgHexSubLevelBorderColor(hex, true),
          default: getSvgHexSubLevelBorderColor(hex, false),
        },
      }
      return `piece.${inventoryID}=${JSON.stringify({ fill, borders })}`
    }),
    `settings.genericFluidCapColor=${SETTINGS_DEFAULTS.genericFluidCapColor}`,
    `settings.genericSolidCapColor=${SETTINGS_DEFAULTS.genericSolidCapColor}`,
  ]

  return entries.sort()
}

describe('SVG/PDF export color lock', () => {
  it('keeps publication colors and registered piece colors fixed', () => {
    expect(exportColors()).toMatchSnapshot()
  })
})
