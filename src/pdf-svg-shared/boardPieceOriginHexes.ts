import { piecesSoFar } from '../data/pieces'
import type { BoardHex, BoardHexes, DecodedPieceID } from '../types'
import { HexTerrain } from '../types'

const boardPieceRenderedElsewhere = new Set<string>([
  HexTerrain.startZone,
  HexTerrain.ropeLadder,
  HexTerrain.laurWallAddon,
  HexTerrain.battlement,
  HexTerrain.roadWall,
])

export type BoardPieceOriginHex = {
  sourceHexID?: string
  hex: BoardHex
}

export const getBoardPieceOriginHexes = (
  boardPieces: DecodedPieceID[],
  boardHexes: BoardHexes | BoardHex[],
): BoardPieceOriginHex[] => {
  const hexes = Array.isArray(boardHexes)
    ? boardHexes
    : Object.values(boardHexes)

  return boardPieces.flatMap((piece) => {
    const terrain = piecesSoFar[piece.inventoryID]?.terrain ?? piece.terrain
    if (boardPieceRenderedElsewhere.has(terrain)) return []

    const sourceHex =
      hexes.find(
        (hex) =>
          hex.isObstacleOrigin && hex.boardPieceUID === piece.boardPieceID,
      ) ??
      hexes.find(
        (hex) =>
          hex.isObstacleOrigin &&
          !hex.boardPieceUID &&
          hex.inventoryID === piece.inventoryID &&
          hex.q === piece.pieceCoords.q &&
          hex.r === piece.pieceCoords.r &&
          hex.s === piece.pieceCoords.s,
      )
    const sourcePieceHex = hexes.find(
      (hex) =>
        hex.boardPieceUID === piece.boardPieceID &&
        !hex.isVerticalClearanceHex &&
        (hex.isObstacleOrigin || hex.isObstacleAuxiliary),
    )
    const altitude =
      sourceHex?.altitude ?? sourcePieceHex?.altitude ?? piece.altitude + 1
    const id =
      sourceHex?.id ??
      `${altitude}~${piece.pieceCoords.q}~${piece.pieceCoords.r}`
    const hex: BoardHex = {
      ...sourceHex,
      id,
      ...piece.pieceCoords,
      altitude,
      pieceID:
        sourceHex?.pieceID ?? `${id}~${piece.rotation}~${piece.inventoryID}`,
      boardPieceUID: piece.boardPieceID,
      inventoryID: piece.inventoryID,
      terrain,
      pieceRotation: piece.rotation,
      isObstacleOrigin: true,
    }

    return [{ sourceHexID: sourceHex?.id, hex }]
  })
}
