import type { BoardHex, BoardPiece } from '../types'
import { HexTerrain, Pieces } from '../types'

export const LAUR_ADDON_STACK_INCREMENT = 8

const stackableBasesByTop = new Map<string, Set<string>>([
  [Pieces.laurWallShortStackable, new Set([Pieces.laurWallShortStackable])],
  [
    Pieces.laurWallLongStackable,
    new Set([Pieces.laurWallLongStackable, Pieces.laurWallArch]),
  ],
  [Pieces.laurWallRuin1, new Set([Pieces.laurWallRuin1])],
])

export const canLaurAddonStackOn = (topID: string, baseID: string) =>
  stackableBasesByTop.get(topID)?.has(baseID) ?? false

export const getLaurAddonStackAltitude = (baseAltitude: number) =>
  baseAltitude + LAUR_ADDON_STACK_INCREMENT

export function getLaurAddonHitHex(piece: BoardPiece): BoardHex {
  return {
    ...piece.pieceCoords,
    boardPieceUID: piece.uid,
    altitude: piece.altitude,
    inventoryID: piece.inventoryID,
    pieceID: '',
    pieceRotation: piece.rotation,
    terrain: HexTerrain.laurWallAddon,
  } as BoardHex
}
