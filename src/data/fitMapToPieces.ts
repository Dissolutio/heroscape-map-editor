import type { BoardPiece, CubeCoordinate, HexMap } from '../types'
import { Pieces } from '../types'
import {
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from '../utils/constants'
import {
  hexUtilsGenHexagonGrid,
  hexUtilsGenRectangleGrid,
} from '../utils/hex-utils'
import { genBoardHexID } from '../utils/map-utils'
import {
  type ObjectiveMarker,
  getObjectiveMarkerFootprint,
} from './objectiveMarkers'
import { piecesSoFar } from './pieces'
import getPieceTemplateCoords from './rotationTransforms'

const rimPieces = new Set([Pieces.battlement, Pieces.roadWall])

// Four extra rings beyond the UI limit preserve overhangs during loading.
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
  objectiveMarkers: ObjectiveMarker[]
  droppedObjectiveMarkers: ObjectiveMarker[]
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

function getObjectiveMarkerFootprintCoords(marker: ObjectiveMarker) {
  return getObjectiveMarkerFootprint(marker).map(({ q, r, s }) => ({
    q,
    r,
    s,
  }))
}

export function getMapTableFootprintCoords(
  hexMap: HexMap,
  boardPieces: readonly BoardPiece[],
): CubeCoordinate[] {
  return [
    ...boardPieces.flatMap(getPieceFootprintCoords),
    ...(hexMap.objectiveMarkers ?? []).flatMap(
      getObjectiveMarkerFootprintCoords,
    ),
  ]
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

export function getHexagonTableFit(
  coords: readonly CubeCoordinate[],
  minimumRadius = 0,
  margin = 0,
  maximumRadius = Number.POSITIVE_INFINITY,
): { radius: number; originQ: number; originR: number } | null {
  if (!coords.length) return null

  const extents = coords.reduce<HexagonExtents>(
    (next, { q, r, s }) => ({
      minQ: Math.min(next.minQ, q),
      maxQ: Math.max(next.maxQ, q),
      minR: Math.min(next.minR, r),
      maxR: Math.max(next.maxR, r),
      minS: Math.min(next.minS, s),
      maxS: Math.max(next.maxS, s),
    }),
    {
      minQ: Number.POSITIVE_INFINITY,
      maxQ: Number.NEGATIVE_INFINITY,
      minR: Number.POSITIVE_INFINITY,
      maxR: Number.NEGATIVE_INFINITY,
      minS: Number.POSITIVE_INFINITY,
      maxS: Number.NEGATIVE_INFINITY,
    },
  )
  const centerQ = Math.floor((extents.minQ + extents.maxQ) / 2)
  const centerR = Math.floor((extents.minR + extents.maxR) / 2)
  let fittingRadius = Math.max(minimumRadius, getHexagonFitRadius(extents))
  if (fittingRadius + margin > maximumRadius) return null

  while (true) {
    const fittingOriginQ =
      centerQ -
      (fittingRadius % 2 === 0
        ? fittingRadius / 2
        : Math.floor(fittingRadius / 2 + 0.5))
    const fittingOriginR = centerR - fittingRadius
    const fittingHexes = new Set(
      hexUtilsGenHexagonGrid(fittingRadius, fittingOriginQ, fittingOriginR).map(
        (coords) => genBoardHexID({ ...coords, altitude: 0 }),
      ),
    )

    if (
      coords.every((coord) =>
        fittingHexes.has(genBoardHexID({ ...coord, altitude: 0 })),
      )
    ) {
      const radius = fittingRadius + margin
      const originQ =
        centerQ - (radius % 2 === 0 ? radius / 2 : Math.floor(radius / 2 + 0.5))
      return {
        radius,
        originQ,
        originR: centerR - radius,
      }
    }

    fittingRadius += 1
    if (fittingRadius + margin > maximumRadius) return null
  }
}

function getFittingHexagonFootprints(
  hexMap: HexMap,
  boardPieces: readonly BoardPiece[],
): FittingFootprints {
  const radius = Math.max(1, hexMap.length, hexMap.width) - 1
  const originQ = hexMap.originQ ?? 0
  const originR = hexMap.originR ?? 0
  const centerQ =
    originQ + (radius % 2 === 0 ? radius / 2 : Math.floor(radius / 2 + 0.5))
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
  const objectiveMarkers: ObjectiveMarker[] = []
  const droppedObjectiveMarkers: ObjectiveMarker[] = []

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

  for (const marker of hexMap.objectiveMarkers ?? []) {
    const coords = getObjectiveMarkerFootprintCoords(marker)
    const nextExtents = addHexagonCoordsToExtents(extents, coords)
    if (getHexagonFitRadius(nextExtents) > maxRadius) {
      droppedObjectiveMarkers.push(marker)
      continue
    }

    extents = nextExtents
    footprintCoords.push(...coords)
    objectiveMarkers.push(marker)
  }

  return {
    footprintCoords,
    droppedPieces,
    objectiveMarkers,
    droppedObjectiveMarkers,
  }
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
  const objectiveMarkers: ObjectiveMarker[] = []
  const droppedObjectiveMarkers: ObjectiveMarker[] = []

  for (const boardPiece of boardPieces) {
    const coords = getPieceFootprintCoords(boardPiece)
    if (coords.length === 0) continue

    const nextExtents = coords.reduce((next, { q, r }) => {
      const col = q + Math.floor(r / 2)
      return {
        minR: Math.min(next.minR, r),
        maxR: Math.max(next.maxR, r),
        minCol: Math.min(next.minCol, col),
        maxCol: Math.max(next.maxCol, col),
      }
    }, extents)
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

  for (const marker of hexMap.objectiveMarkers ?? []) {
    const coords = getObjectiveMarkerFootprintCoords(marker)
    const nextExtents = coords.reduce((next, { q, r }) => {
      const col = q + Math.floor(r / 2)
      return {
        minR: Math.min(next.minR, r),
        maxR: Math.max(next.maxR, r),
        minCol: Math.min(next.minCol, col),
        maxCol: Math.max(next.maxCol, col),
      }
    }, extents)
    if (
      nextExtents.maxR - nextExtents.minR + 1 > maxLength ||
      nextExtents.maxCol - nextExtents.minCol + 1 > maxWidth
    ) {
      droppedObjectiveMarkers.push(marker)
      continue
    }

    extents = nextExtents
    footprintCoords.push(...coords)
    objectiveMarkers.push(marker)
  }

  return {
    footprintCoords,
    droppedPieces,
    objectiveMarkers,
    droppedObjectiveMarkers,
  }
}

function withDroppedItems(
  result: { hexMap: HexMap; changed: boolean },
  fitting: FittingFootprints,
) {
  const droppedMarkerSet = new Set(fitting.droppedObjectiveMarkers)
  const hexMap = droppedMarkerSet.size
    ? {
        ...result.hexMap,
        objectiveMarkers: fitting.objectiveMarkers,
      }
    : result.hexMap
  return {
    ...result,
    hexMap,
    ...(fitting.droppedPieces.length
      ? { droppedPieces: fitting.droppedPieces }
      : {}),
    ...(fitting.droppedObjectiveMarkers.length
      ? { droppedObjectiveMarkers: fitting.droppedObjectiveMarkers }
      : {}),
  }
}

function getRectangleMapWithPieces(
  hexMap: HexMap,
  footprintCoords: ReturnType<typeof getPieceTemplateCoords>,
): HexMap {
  const originQ = hexMap.originQ ?? 0
  const originR = hexMap.originR ?? 0
  const fit = getRectangleTableFit(footprintCoords, { existingMap: hexMap })
  if (!fit) return hexMap
  const changed =
    fit.width !== hexMap.width ||
    fit.length !== hexMap.length ||
    fit.originQ !== originQ ||
    fit.originR !== originR

  if (!changed) return hexMap

  return {
    ...hexMap,
    width: fit.width,
    length: fit.length,
    ...(fit.originQ !== 0 || hexMap.originQ !== undefined
      ? { originQ: fit.originQ }
      : {}),
    ...(fit.originR !== 0 || hexMap.originR !== undefined
      ? { originR: fit.originR }
      : {}),
  }
}

export function getRectangleTableFit(
  coords: readonly CubeCoordinate[],
  options: {
    existingMap?: Pick<HexMap, 'length' | 'width' | 'originQ' | 'originR'>
    margin?: number
  } = {},
): { length: number; width: number; originQ: number; originR: number } | null {
  if (!coords.length) return null

  const { existingMap, margin = 0 } = options
  const mapOriginQ = existingMap?.originQ ?? 0
  const mapOriginR = existingMap?.originR ?? 0
  const bounds = coords.reduce(
    (next, { q, r }) => {
      const col = q + Math.floor(r / 2)
      return {
        minR: Math.min(next.minR, r),
        maxR: Math.max(next.maxR, r),
        minCol: Math.min(next.minCol, col),
        maxCol: Math.max(next.maxCol, col),
      }
    },
    {
      minR: existingMap ? mapOriginR : Number.POSITIVE_INFINITY,
      maxR: existingMap
        ? mapOriginR + existingMap.length - 1
        : Number.NEGATIVE_INFINITY,
      minCol: existingMap ? mapOriginQ : Number.POSITIVE_INFINITY,
      maxCol: existingMap
        ? mapOriginQ + existingMap.width - 1
        : Number.NEGATIVE_INFINITY,
    },
  )

  return {
    originQ: bounds.minCol - margin,
    originR: bounds.minR - margin,
    width: bounds.maxCol - bounds.minCol + 1 + margin * 2,
    length: bounds.maxR - bounds.minR + 1 + margin * 2,
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
  droppedObjectiveMarkers?: ObjectiveMarker[]
} {
  const fitting =
    hexMap.shape === 'hexagon'
      ? getFittingHexagonFootprints(hexMap, boardPieces)
      : getFittingRectangleFootprints(hexMap, boardPieces)
  const { footprintCoords } = fitting
  if (footprintCoords.length === 0) {
    return withDroppedItems({ hexMap, changed: false }, fitting)
  }

  if (hexMap.shape === 'hexagon') {
    const minimumRadius = Math.max(1, hexMap.length, hexMap.width) - 1
    const requiredHexes = [
      ...hexUtilsGenHexagonGrid(
        minimumRadius,
        hexMap.originQ ?? 0,
        hexMap.originR ?? 0,
      ),
      ...footprintCoords,
    ]
    const fit = getHexagonTableFit(requiredHexes, minimumRadius)
    if (!fit) throw new Error('Cannot fit an empty hexagon footprint')
    const size = fit.radius + 1
    const changed =
      size !== hexMap.length ||
      size !== hexMap.width ||
      fit.originQ !== (hexMap.originQ ?? 0) ||
      fit.originR !== (hexMap.originR ?? 0)
    if (!changed) {
      return withDroppedItems({ hexMap, changed: false }, fitting)
    }
    return withDroppedItems(
      {
        hexMap: {
          ...hexMap,
          length: size,
          width: size,
          ...(fit.originQ !== 0 || hexMap.originQ !== undefined
            ? { originQ: fit.originQ }
            : {}),
          ...(fit.originR !== 0 || hexMap.originR !== undefined
            ? { originR: fit.originR }
            : {}),
        },
        changed: true,
      },
      fitting,
    )
  }

  const nextHexMap = getRectangleMapWithPieces(hexMap, footprintCoords)
  return withDroppedItems(
    { hexMap: nextHexMap, changed: nextHexMap !== hexMap },
    fitting,
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
