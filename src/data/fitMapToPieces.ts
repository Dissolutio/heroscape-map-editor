import type { BoardPiece, HexMap } from '../types'
import { Pieces } from '../types'
import {
  hexUtilsGenHexagonGrid,
  hexUtilsGenRectangleGrid,
} from '../utils/hex-utils'
import { genBoardHexID } from '../utils/map-utils'
import getPieceTemplateCoords from './rotationTransforms'
import { piecesSoFar } from './pieces'

const rimPieces = new Set([Pieces.battlement, Pieces.roadWall])

function getFootprintCoords(boardPieces: readonly BoardPiece[]) {
  return boardPieces.flatMap((boardPiece) => {
    const piece = piecesSoFar[boardPiece.inventoryID]
    if (!piece || rimPieces.has(piece.id)) return []

    return getPieceTemplateCoords({
      clickedHex: boardPiece.pieceCoords,
      rotation: boardPiece.rotation,
      template: piece.template,
      isVsTile: false,
    })
  })
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
): { hexMap: HexMap; changed: boolean } {
  const footprintCoords = getFootprintCoords(boardPieces)
  if (footprintCoords.length === 0) return { hexMap, changed: false }

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
          return { hexMap, changed: false }
        }
        return {
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
        }
      }
      radius += 1
    }
  }

  const nextHexMap = getRectangleMapWithPieces(hexMap, footprintCoords)
  return { hexMap: nextHexMap, changed: nextHexMap !== hexMap }
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
