import type { SettingsValues } from '../../local-storage/settings'
import { HexTerrain } from '../../types'

export type GenericTerrainColorSettings = Pick<
  SettingsValues,
  | 'genericSolidCapColor'
  | 'genericSolidSideColor'
  | 'genericFluidCapColor'
  | 'genericFluidSideColor'
>

export function getGenericTerrainColors(
  terrain: string,
  settings: GenericTerrainColorSettings,
) {
  if (terrain === HexTerrain.generic) {
    return {
      cap: settings.genericSolidCapColor,
      side: settings.genericSolidSideColor,
    }
  }
  if (terrain === HexTerrain.genericFluid) {
    return {
      cap: settings.genericFluidCapColor,
      side: settings.genericFluidSideColor,
    }
  }
  return null
}

export function getContrastingTextColor(color: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(color)
  if (!match) {
    throw new Error(`Expected a six-digit hex color, received "${color}"`)
  }
  const channels = [0, 2, 4].map(
    (index) => Number.parseInt(match[1].slice(index, index + 2), 16) / 255,
  )
  const luminance = channels
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    )
    .reduce(
      (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
      0,
    )
  return luminance > 0.179 ? '#000000' : '#FFFFFF'
}
