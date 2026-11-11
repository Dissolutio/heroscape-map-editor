import type { HexMap } from '../types'
import { HEX_FLAT_TO_FLAT_INCHES } from './constants'
import {
  cubeToPixel,
  hexUtilsGenHexagonGrid,
  hexUtilsGenRectangleGrid,
} from './hex-utils'

export type MapPhysicalSizeInput = Pick<
  HexMap,
  'shape' | 'width' | 'length' | 'originQ' | 'originR'
>

export type MapPhysicalSize = {
  hexCount: number
  widthIn: number
  lengthIn: number
  diagonalIn: number
  widthCm: number
  lengthCm: number
  diagonalCm: number
  label: string
}

export function formatMapPhysicalInches(inches: number) {
  const quarters = Math.round(inches * 4)
  const whole = Math.floor(quarters / 4)
  const fraction = ['', '¼', '½', '¾'][quarters % 4]
  return whole === 0 ? fraction : `${whole}${fraction}`
}

export function formatMapPhysicalDimension(
  inches: number,
  centimeters: number,
) {
  return `${formatMapPhysicalInches(inches)} in (${Math.round(centimeters)} cm)`
}

export function formatMapPhysicalSize(size: MapPhysicalSize) {
  return `${size.label} · ${formatMapPhysicalInches(
    size.widthIn,
  )} × ${formatMapPhysicalInches(size.lengthIn)} in (${Math.round(
    size.widthCm,
  )} × ${Math.round(size.lengthCm)} cm)`
}

export function getMapPhysicalSize(
  hexMap: MapPhysicalSizeInput,
): MapPhysicalSize {
  const radius = Math.max(hexMap.length, hexMap.width) - 1
  const coords =
    hexMap.shape === 'hexagon'
      ? hexUtilsGenHexagonGrid(radius, hexMap.originQ, hexMap.originR)
      : hexUtilsGenRectangleGrid(
          hexMap.length,
          hexMap.width,
          hexMap.originQ,
          hexMap.originR,
        )
  const sideLengthIn = HEX_FLAT_TO_FLAT_INCHES / Math.sqrt(3)
  const halfFlatToFlatIn = HEX_FLAT_TO_FLAT_INCHES / 2
  const centerBounds = coords.reduce(
    (bounds, coord) => {
      const { x, y } = cubeToPixel(coord)
      return {
        minX: Math.min(bounds.minX, x * sideLengthIn),
        maxX: Math.max(bounds.maxX, x * sideLengthIn),
        minY: Math.min(bounds.minY, y * sideLengthIn),
        maxY: Math.max(bounds.maxY, y * sideLengthIn),
      }
    },
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  )

  const widthIn = centerBounds.maxX - centerBounds.minX + 2 * halfFlatToFlatIn
  const lengthIn = centerBounds.maxY - centerBounds.minY + 2 * sideLengthIn
  const diagonalIn = Math.hypot(widthIn, lengthIn)
  const label =
    hexMap.shape === 'hexagon'
      ? `Hexagon, radius ${radius}`
      : `${hexMap.width} × ${hexMap.length} hexes`

  return {
    hexCount: coords.length,
    widthIn,
    lengthIn,
    diagonalIn,
    widthCm: widthIn * 2.54,
    lengthCm: lengthIn * 2.54,
    diagonalCm: diagonalIn * 2.54,
    label,
  }
}
