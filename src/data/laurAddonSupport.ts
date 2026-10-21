import type { BoardPieces, BoardPiece } from '../types'
import { Pieces } from '../types'

export type LaurAddonSupportKey = `${string}@${number}`

export type LaurAddonSupportTable = Record<
  LaurAddonSupportKey,
  Partial<Record<LaurAddonSupportKey, boolean>>
>

/** Verified combinations only; leave empty until the physical fit is measured. */
export const laurAddonSupportTable: LaurAddonSupportTable = {}

export type LaurAddonSupport = boolean | 'unknown'

export function isLaurAddonSupported(
  board: { boardPieces: BoardPieces },
  addonPiece: BoardPiece,
): LaurAddonSupport {
  const addonKey =
    `${addonPiece.inventoryID}@${addonPiece.rotation}` as LaurAddonSupportKey
  const pillars = board.boardPieces.filter(
    (piece) =>
      (piece.inventoryID === Pieces.laurWallSquarePillar ||
        piece.inventoryID === Pieces.laurWallTrianglePillar) &&
      piece.pieceCoords.q === addonPiece.pieceCoords.q &&
      piece.pieceCoords.r === addonPiece.pieceCoords.r &&
      piece.pieceCoords.s === addonPiece.pieceCoords.s,
  )
  for (const pillar of pillars) {
    const pillarKey =
      `${pillar.inventoryID}@${pillar.rotation}` as LaurAddonSupportKey
    const value = laurAddonSupportTable[pillarKey]?.[addonKey]
    if (value !== undefined) return value
  }
  return 'unknown'
}
