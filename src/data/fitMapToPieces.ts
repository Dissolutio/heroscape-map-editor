import type { BoardPiece, HexMap } from '../types'
import { Pieces } from '../types'
import {
  hexUtilsGenHexagonGrid,
  hexUtilsGenRectangleGrid,
} from '../utils/hex-utils'
import { genBoardHexID } from '../utils/map-utils'
import {
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from '../utils/constants'
import getPieceTemplateCoords from './rotationTransforms'
import { piecesSoFar } from './pieces'

const rimPieces = new Set([Pieces.battlement, Pieces.roadWall])

// The UI allows 20 hexagon cells per side; four extra rings preserve overhangs.
export const MAX_HEXAGON_FIT_RADIUS = MAX_HEXAGON_MAP_DIMENSION - 1 + 4
// The UI allows 40 rectangle cells per side; eight extra cells allow growth.
export const MAX_RECTANGLE_FIT_DIMENSION = MAX_RECTANGLE_MAP_DIMENSION + 8

type HexagonExtents = {
  minQ: number
  maxQ: number
  minR: number
  maxR: number
  minS: number
  maxS: number
}

type RectangleExtents = {
  minR: number
  maxR: number
  minCol: number
  maxCol: number
}

type FittingFootprints = {
  footprintCoords: ReturnType<typeof getPieceTemplateCoords>
  droppedPieces: BoardPiece[]
}

function getPieceFootprintCoords(boardPiece: BoardPiece) {
  const piece = piecesSoFar[boardPiece.inventoryID]
  if (!piece || rimPieces.has(piece.id)) return []

  return getPieceTemplateCoords({
    clickedHex: boardPiece.pieceCoords,
    rotation: boardPiece.rotation,
    template: piece.template,
    isVsTile: false,
  })
}

function addHexagonCoordsToExtents(
  extents: HexagonExtents,
  coords: ReturnType<typeof getPieceTemplateCoords>,
): HexagonExtents {
  return coords.reduce(
    (next, { q, r, s }) => ({
      minQ: Math.min(next.minQ, q),
      maxQ: Math.max(next.maxQ, q),
      minR: Math.min(next.minR, r),
      maxR: Math.max(next.maxR, r),
      minS: Math.min(next.minS, s),
      maxS: Math.max(next.maxS, s),
    }),
    extents,
  )
}

function getHexagonFitRadius(extents: HexagonExtents) {
  const centerQ = Math.floor((extents.minQ + extents.maxQ) / 2)
  const centerR = Math.floor((extents.minR + extents.maxR) / 2)
  const centerS = -centerQ - centerR
  return Math.max(
    Math.abs(extents.minQ - centerQ),
    Math.abs(extents.maxQ - centerQ),
    Math.abs(extents.minR - centerR),
    Math.abs(extents.maxR - centerR),
    Math.abs(extents.minS - centerS),
    Math.abs(extents.maxS - centerS),
  )
}

function getFittingHexagonFootprints(
  hexMap: HexMap,
  boardPieces: readonly BoardPiece[],
): FittingFootprints {
  const radius = Math.max(1, hexMap.length, hexMap.width) - 1
  const originQ = hexMap.originQ ?? 0
  const originR = hexMap.originR ?? 0
  const centerQ =
    originQ +
    (radius % 2 === 0 ? radius / 2 : Math.floor(radius / 2 + 0.5))
  const centerR = originR + radius
  const centerS = -centerQ - centerR
  let extents: HexagonExtents = {
    minQ: centerQ - radius,
    maxQ: centerQ + radius,
    minR: centerR - radius,
    maxR: centerR + radius,
    minS: centerS - radius,
    maxS: centerS + radius,
  }
  const maxRadius = Math.max(radius, MAX_HEXAGON_FIT_RADIUS)
  const footprintCoords: ReturnType<typeof getPieceTemplateCoords> = []
  const droppedPieces: BoardPiece[] = []

  for (const boardPiece of boardPieces) {
    const coords = getPieceFootprintCoords(boardPiece)
    if (coords.length === 0) continue

    const nextExtents = addHexagonCoordsToExtents(extents, coords)
    if (getHexagonFitRadius(nextExtents) > maxRadius) {
      droppedPieces.push(boardPiece)
      continue
    }

    extents = nextExtents
    footprintCoords.push(...coords)
  }

  return { footprintCoords, droppedPieces }
}

function getFittingRectangleFootprints(
  hexMap: HexMap,
  boardPieces: readonly BoardPiece[],
): FittingFootprints {
  const originQ = hexMap.originQ ?? 0
  const originR = hexMap.originR ?? 0
  let extents: RectangleExtents = {
    minR: originR,
    maxR: originR + hexMap.length - 1,
    minCol: originQ,
    maxCol: originQ + hexMap.width - 1,
  }
  const maxLength = Math.max(hexMap.length, MAX_RECTANGLE_FIT_DIMENSION)
  const maxWidth = Math.max(hexMap.width, MAX_RECTANGLE_FIT_DIMENSION)
  const footprintCoords: ReturnType<typeof getPieceTemplateCoords> = []
  const droppedPieces: BoardPiece[] = []

  for (const boardPiece of boardPieces) {
    const coords = getPieceFootprintCoords(boardPiece)
    if (coords.length === 0) continue

    const nextExtents = coords.reduce(
      (next, { q, r }) => {
        const col = q + Math.floor(r / 2)
        return {
          minR: Math.min(next.minR, r),
          maxR: Math.max(next.maxR, r),
          minCol: Math.min(next.minCol, col),
          maxCol: Math.max(next.maxCol, col),
        }
      },
      extents,
    )
    if (
      nextExtents.maxR - nextExtents.minR + 1 > maxLength ||
      nextExtents.maxCol - nextExtents.minCol + 1 > maxWidth
    ) {
      droppedPieces.push(boardPiece)
      continue
    }

    extents = nextExtents
    footprintCoords.push(...coords)
  }

  return { footprintCoords, droppedPieces }
}

function withDroppedPieces(
  result: { hexMap: HexMap; changed: boolean },
  droppedPieces: BoardPiece[],
) {
  return droppedPieces.length ? { ...result, droppedPieces } : result
}

function getRectangleMapWithPieces(
  hexMap: HexMap,
  footprintCoords: ReturnType<typeof getPieceTemplateCoords>,
): HexMap {
  const originQ = hexMap.originQ ?? 0
  const originR = hexMap.originR ?? 0
  const minR = Math.min(originR, ...footprintCoords.map(({ r }) => r))
  const maxR = Math.max(
    originR + hexMap.length - 1,
    ...footprintCoords.map(({ r }) => r),
  )
  const nextOriginQ = Math.min(
    originQ,
    ...footprintCoords.map(({ q, r }) => q + Math.floor(r / 2)),
  )
  const width = Math.max(
    hexMap.width + originQ - nextOriginQ,
    ...footprintCoords.map(
      ({ q, r }) => q + Math.floor(r / 2) - nextOriginQ + 1,
    ),
  )
  const length = maxR - minR + 1
  const changed =
    width !== hexMap.width ||
    length !== hexMap.length ||
    nextOriginQ !== originQ ||
    minR !== originR

  if (!changed) return hexMap

  return {
    ...hexMap,
    width,
    length,
    ...(nextOriginQ !== 0 || hexMap.originQ !== undefined
      ? { originQ: nextOriginQ }
      : {}),
    ...(minR !== 0 || hexMap.originR !== undefined ? { originR: minR } : {}),
  }
}

/**
 * Grows the map enough to cover every known piece footprint at table level.
 * Board-piece coordinates are never translated; rectangle maps expand their
 * coordinate origin when pieces extend beyond the top or left edge.
 */
export function fitMapToPieces(
  hexMap: HexMap,
  boardPieces: readonly BoardPiece[],
): {
  hexMap: HexMap
  changed: boolean
  droppedPieces?: BoardPiece[]
} {
  const fitting =
    hexMap.shape === 'hexagon'
      ? getFittingHexagonFootprints(hexMap, boardPieces)
      : getFittingRectangleFootprints(hexMap, boardPieces)
  const { footprintCoords, droppedPieces } = fitting
  if (footprintCoords.length === 0) {
    return withDroppedPieces({ hexMap, changed: false }, droppedPieces)
  }

  if (hexMap.shape === 'hexagon') {
    let radius = Math.max(1, hexMap.length, hexMap.width) - 1
    const requiredHexes = [
      ...hexUtilsGenHexagonGrid(
        radius,
        hexMap.originQ ?? 0,
        hexMap.originR ?? 0,
      ),
      ...footprintCoords,
    ]
    const minQ = Math.min(...requiredHexes.map(({ q }) => q))
    const maxQ = Math.max(...requiredHexes.map(({ q }) => q))
    const minR = Math.min(...requiredHexes.map(({ r }) => r))
    const maxR = Math.max(...requiredHexes.map(({ r }) => r))

    while (true) {
      const centerQ = Math.floor((minQ + maxQ) / 2)
      const centerR = Math.floor((minR + maxR) / 2)
      const originQ =
        centerQ - (radius % 2 === 0 ? radius / 2 : Math.floor(radius / 2 + 0.5))
      const originR = centerR - radius
      const tableHexes = new Set(
        hexUtilsGenHexagonGrid(radius, originQ, originR).map((coords) =>
          genBoardHexID({ ...coords, altitude: 0 }),
        ),
      )
      const fits = requiredHexes.every((coords) =>
        tableHexes.has(genBoardHexID({ ...coords, altitude: 0 })),
      )

      if (fits) {
        const size = radius + 1
        const changed =
          size !== hexMap.length ||
          size !== hexMap.width ||
          originQ !== (hexMap.originQ ?? 0) ||
          originR !== (hexMap.originR ?? 0)
        if (!changed) {
          return withDroppedPieces({ hexMap, changed: false }, droppedPieces)
        }
        return withDroppedPieces(
          {
            hexMap: {
              ...hexMap,
              length: size,
              width: size,
              ...(originQ !== 0 || hexMap.originQ !== undefined
                ? { originQ }
                : {}),
              ...(originR !== 0 || hexMap.originR !== undefined
                ? { originR }
                : {}),
            },
            changed: true,
          },
          droppedPieces,
        )
      }
      radius += 1
    }
  }

  const nextHexMap = getRectangleMapWithPieces(hexMap, footprintCoords)
  return withDroppedPieces(
    { hexMap: nextHexMap, changed: nextHexMap !== hexMap },
    droppedPieces,
  )
}

export function doesPieceFitOnMap(
  boardPiece: BoardPiece,
  tableHexes: Set<string>,
) {
  const piece = piecesSoFar[boardPiece.inventoryID]
  return (
    !piece ||
    rimPieces.has(piece.id) ||
    getPieceTemplateCoords({
      clickedHex: boardPiece.pieceCoords,
      rotation: boardPiece.rotation,
      template: piece.template,
      isVsTile: false,
    }).every((coords) =>
      tableHexes.has(genBoardHexID({ ...coords, altitude: 0 })),
    )
  )
}

export function mapTableHexes(hexMap: HexMap) {
  const coords =
    hexMap.shape === 'hexagon'
      ? hexUtilsGenHexagonGrid(
          Math.max(hexMap.length, hexMap.width) - 1,
          hexMap.originQ ?? 0,
          hexMap.originR ?? 0,
        )
      : hexUtilsGenRectangleGrid(
          hexMap.length,
          hexMap.width,
          hexMap.originQ ?? 0,
          hexMap.originR ?? 0,
        )
  return new Set(
    coords.map((coord) => genBoardHexID({ ...coord, altitude: 0 })),
  )
}
