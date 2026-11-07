import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import { getLaurAddonExportSymbol } from './laurAddonExportSymbol'
import type {
  PieceKeyEntry,
  PieceKeyModel,
  PieceKeySpecialGroup,
} from './pieceKey'

export const getPieceKeyShapeLayout = (entry: PieceKeyEntry) => {
  const origin = hexUtilsHexToPixel(entry.piece.pieceCoords)
  const angle = -((entry.piece.rotation % 6) * 60)
  const radians = (angle * Math.PI) / 180
  const rotate = (x: number, y: number) => ({
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians),
  })
  const positions = entry.hexes.map((hex) => {
    const pixel = hexUtilsHexToPixel(hex)
    const dx = pixel.x - origin.x
    const dy = pixel.y - origin.y
    return rotate(dx, dy)
  })
  const bounds = positions.length
    ? positions.flatMap(({ x, y }) => [
        { x: x - SVG_HEX_RADIUS, y: y - SVG_HEX_RADIUS },
        { x: x + SVG_HEX_RADIUS, y: y + SVG_HEX_RADIUS },
      ])
    : (() => {
        const laurSymbol = getLaurAddonExportSymbol(entry.inventoryID)
        const minX = laurSymbol ? 0 : -SVG_HEX_RADIUS
        const maxX =
          laurSymbol === 'long' || laurSymbol === 'arch'
            ? 3 * SVG_HEX_RADIUS
            : laurSymbol === 'short'
              ? 1.75 * SVG_HEX_APOTHEM
              : laurSymbol === 'ruin'
                ? 1.1 * SVG_HEX_RADIUS
                : SVG_HEX_RADIUS
        const halfHeight = laurSymbol ? SVG_HEX_RADIUS / 2 : SVG_HEX_RADIUS
        return [
          rotate(minX, -halfHeight),
          rotate(maxX, -halfHeight),
          rotate(maxX, halfHeight),
          rotate(minX, halfHeight),
        ]
      })()
  const minX = Math.min(...bounds.map(({ x }) => x))
  const maxX = Math.max(...bounds.map(({ x }) => x))
  const minY = Math.min(...bounds.map(({ y }) => y))
  const maxY = Math.max(...bounds.map(({ y }) => y))

  return {
    origin,
    angle,
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    width: maxX - minX,
    height: maxY - minY,
  }
}

export const getPieceKeyShapeScale = (
  model: PieceKeyModel,
  cellWidth: number,
  preferredScale: number,
) => {
  const maxShapeWidth = Math.max(
    0,
    ...model.landColumns.flatMap((column) =>
      column.cells.map(({ entry }) => getPieceKeyShapeLayout(entry).width),
    ),
  )
  return maxShapeWidth
    ? Math.min(preferredScale, Math.max(0.01, (cellWidth - 16) / maxShapeWidth))
    : preferredScale
}

export const getPieceKeyRowShapeHeight = (
  model: PieceKeyModel,
  size: number,
  scale: number,
  padding = 20,
) => {
  const maxShapeHeight = Math.max(
    0,
    ...model.landColumns.flatMap((column) =>
      column.cells
        .filter((cell) => cell.size === size)
        .map(({ entry }) => getPieceKeyShapeLayout(entry).height),
    ),
  )
  return maxShapeHeight * scale + padding
}

export const getPieceKeySpecialEntriesPerRow = (
  group: PieceKeySpecialGroup,
  rowWidth: number,
  scale: number,
) => {
  const maxShapeWidth = Math.max(
    0,
    ...group.entries.map((entry) => getPieceKeyShapeLayout(entry).width),
  )
  const itemWidth = maxShapeWidth * scale + 16
  return itemWidth > 0
    ? Math.max(
        1,
        Math.min(group.entries.length, Math.floor(rowWidth / itemWidth)),
      )
    : group.entries.length
}
