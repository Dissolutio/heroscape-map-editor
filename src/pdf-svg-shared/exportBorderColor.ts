import { HexTerrain } from '../types'

export const ASPHALT_BORDER_COLOR = '#767676'
export const ASPHALT_SUBLEVEL_BORDER_COLOR = '#252525'

// #767676 contrasts with Asphalt black at 4.62:1 and a white page at 4.54:1.
// #252525 contrasts with the #7a7a7a sub-level fill at 3.57:1;
// contrast with white is 15.33:1.
export function getExportBorderColor({
  terrain,
  isFluid,
  isSubLevel,
  useTerrainBorderColor,
  colorBorder,
  defaultBorderColor,
}: {
  terrain: string
  isFluid: boolean
  isSubLevel: boolean
  useTerrainBorderColor: boolean
  colorBorder: string
  defaultBorderColor: string
}) {
  if (useTerrainBorderColor || isFluid) return colorBorder
  if (terrain === HexTerrain.asphalt) {
    return isSubLevel ? ASPHALT_SUBLEVEL_BORDER_COLOR : ASPHALT_BORDER_COLOR
  }
  return defaultBorderColor
}
