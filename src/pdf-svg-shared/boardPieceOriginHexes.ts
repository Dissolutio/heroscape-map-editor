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

  // Index the hexes once (first match wins, like Array.find), so this stays
  // linear in board size instead of scanning every hex for every piece.
  const ownedOriginByUID = new Map<string, BoardHex>()
  const unownedOriginByKey = new Map<string, BoardHex>()
  const footprintHexByUID = new Map<string, BoardHex>()
  for (const hex of hexes) {
    if (hex.isObstacleOrigin) {
      if (hex.boardPieceUID) {
        if (!ownedOriginByUID.has(hex.boardPieceUID)) {
          ownedOriginByUID.set(hex.boardPieceUID, hex)
        }
      } else {
        const key = `${hex.inventoryID}|${hex.q}|${hex.r}|${hex.s}`
        if (!unownedOriginByKey.has(key)) unownedOriginByKey.set(key, hex)
      }
    }
    if (
      hex.boardPieceUID &&
      !hex.isVerticalClearanceHex &&
      (hex.isObstacleOrigin || hex.isObstacleAuxiliary) &&
      !footprintHexByUID.has(hex.boardPieceUID)
    ) {
      footprintHexByUID.set(hex.boardPieceUID, hex)
    }
  }

  return boardPieces.flatMap((piece) => {
    const terrain = piecesSoFar[piece.inventoryID]?.terrain ?? piece.terrain
    if (boardPieceRenderedElsewhere.has(terrain)) return []

    const sourceHex =
      ownedOriginByUID.get(piece.boardPieceID) ??
      unownedOriginByKey.get(
        `${piece.inventoryID}|${piece.pieceCoords.q}|${piece.pieceCoords.r}|${piece.pieceCoords.s}`,
      )
    const sourcePieceHex = footprintHexByUID.get(piece.boardPieceID)
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
