import {
  PDF_BORDER_WIDTH,
  SVG_HEX_APOTHEM,
  SVG_HEX_RADIUS,
} from '../utils/constants'
import { Pieces } from '../types'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import {
  getLaurLongWallPdfPolygonPoints,
  getLaurLongWallSvgPolygonPoints,
  getLaurShortWallPolygonPoints,
  getLadderSvgPolygonPoints,
  getLaurWallRuinPdfPolygonPoints,
  getLaurWallRuinSvgPolygonPoints,
  getShipBowSvgPolygonPoints,
  getShipWallSvgPolygonPoints,
} from './hexPolygonPoints'
import { getLaurAddonExportSymbol } from './laurAddonExportSymbol'
import type {
  PieceKeyEntry,
  PieceKeyModel,
  PieceKeySpecialGroup,
} from './pieceKey'

export const getPieceKeyShapeLayout = (
  entry: PieceKeyEntry,
  renderer: 'pdf' | 'svg' = 'svg',
) => {
  const origin = hexUtilsHexToPixel(entry.piece.pieceCoords)
  const positions = entry.hexes.map((hex) => {
    const pixel = hexUtilsHexToPixel(hex)
    return { x: pixel.x - origin.x, y: pixel.y - origin.y }
  })
  const laurSymbol = getLaurAddonExportSymbol(entry.inventoryID)
  const footprintBounds =
    laurSymbol || entry.inventoryID === Pieces.ropeLadder
      ? []
      : positions.length
        ? positions.flatMap(({ x, y }) => [
            { x: x - SVG_HEX_RADIUS, y: y - SVG_HEX_RADIUS },
            { x: x + SVG_HEX_RADIUS, y: y + SVG_HEX_RADIUS },
          ])
        : (() => {
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
              { x: minX, y: -halfHeight },
              { x: maxX, y: -halfHeight },
              { x: maxX, y: halfHeight },
              { x: minX, y: halfHeight },
            ]
          })()
  const addonBounds = laurSymbol
    ? laurSymbol === 'long' || laurSymbol === 'arch'
      ? renderer === 'pdf'
        ? getLaurLongWallPdfPolygonPoints(SVG_HEX_RADIUS, PDF_BORDER_WIDTH)
            .corners
        : getLaurLongWallSvgPolygonPoints(SVG_HEX_RADIUS).corners
      : laurSymbol === 'short'
        ? getLaurShortWallPolygonPoints(
            SVG_HEX_RADIUS,
            renderer === 'pdf' ? 0.2 : 0.5,
          ).corners
        : renderer === 'pdf'
          ? getLaurWallRuinPdfPolygonPoints(SVG_HEX_RADIUS).corners
          : getLaurWallRuinSvgPolygonPoints(SVG_HEX_RADIUS).corners
    : []
  const symbolBounds = addonBounds.length
    ? addonBounds
    : entry.inventoryID === Pieces.ladder
      ? getLadderSvgPolygonPoints(SVG_HEX_RADIUS * 2, 0).corners
      : entry.inventoryID === Pieces.shipWall
        ? getShipWallSvgPolygonPoints(SVG_HEX_RADIUS, 0).corners
        : entry.inventoryID === Pieces.shipBow
          ? getShipBowSvgPolygonPoints(SVG_HEX_RADIUS, 0).corners
          : entry.inventoryID === Pieces.ropeLadder
            ? (() => {
                const iconRadius = SVG_HEX_RADIUS * 0.4
                const arrowWidth = (iconRadius * 2) / 1.3
                const arrowHalfHeight = (arrowWidth * 7) / 24
                const x = SVG_HEX_APOTHEM
                const scale = 2
                return [
                  {
                    x: scale * (x - iconRadius),
                    y: -scale * iconRadius,
                  },
                  {
                    x: scale * (x + iconRadius),
                    y: scale * iconRadius,
                  },
                  {
                    x: scale * (x - arrowWidth / 2),
                    y: scale * (-17 - arrowHalfHeight),
                  },
                  {
                    x: scale * (x + arrowWidth / 2),
                    y: scale * (-17 + arrowHalfHeight),
                  },
                  {
                    x: scale * (x - arrowWidth / 2),
                    y: scale * (15 - arrowHalfHeight),
                  },
                  {
                    x: scale * (x + arrowWidth / 2),
                    y: scale * (15 + arrowHalfHeight),
                  },
                ]
              })()
            : []
  const bounds = [...footprintBounds, ...symbolBounds]
  const minX = Math.min(...bounds.map(({ x }) => x))
  const maxX = Math.max(...bounds.map(({ x }) => x))
  const minY = Math.min(...bounds.map(({ y }) => y))
  const maxY = Math.max(...bounds.map(({ y }) => y))

  return {
    origin,
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    minX,
    minY,
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
  renderer: 'pdf' | 'svg' = 'svg',
) => {
  const maxShapeWidth = Math.max(
    0,
    ...group.entries.map(
      (entry) => getPieceKeyShapeLayout(entry, renderer).width,
    ),
  )
  const itemWidth = maxShapeWidth * scale + 16
  return itemWidth > 0
    ? Math.max(
        1,
        Math.min(group.entries.length, Math.floor(rowWidth / itemWidth)),
      )
    : group.entries.length
}
