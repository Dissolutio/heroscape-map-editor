import type { SettingsValues } from '../../local-storage/settings'
import { HexTerrain } from '../../types'

export type GenericTerrainColorSettings = Pick<
  SettingsValues,
  | 'genericSolidCapColor'
  | 'genericSolidSideColor'
  | 'genericFluidCapColor'
  | 'genericFluidSideColor'
>

function parseHexColor(color: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(color)
  if (!match) {
    throw new Error(`Expected a six-digit hex color, received "${color}"`)
  }
  return [
    Number.parseInt(match[1].slice(0, 2), 16),
    Number.parseInt(match[1].slice(2, 4), 16),
    Number.parseInt(match[1].slice(4, 6), 16),
  ]
}

export function blendHexWithWhite(color: string) {
  return `#${parseHexColor(color)
    .map((channel) =>
      Math.round((channel + 255) / 2)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

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

export function getGenericTerrain2DColors(
  terrain: string,
  settings: GenericTerrainColorSettings,
) {
  const capColor =
    terrain === HexTerrain.generic
      ? settings.genericSolidCapColor
      : terrain === HexTerrain.genericFluid
        ? settings.genericFluidCapColor
        : null
  return getGenericTerrain2DColorsFromCap(terrain, capColor)
}

export function getGenericTerrain2DColorsFromCap(
  terrain: string,
  capColor: string | null,
) {
  if (
    (terrain !== HexTerrain.generic && terrain !== HexTerrain.genericFluid) ||
    !capColor
  ) {
    return null
  }
  return {
    main: capColor,
    subLevel: blendHexWithWhite(capColor),
  }
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
