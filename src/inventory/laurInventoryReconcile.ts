import { terrainSetsByShortID } from '../data/terrainSets'
import { Pieces, type BoardPiece } from '../types'

const LAUR_STACK_ALTITUDE_DELTA = 9

export const RECONCILABLE_LAUR_PIECE_PAIRS: Array<{
  legacyID: string
  stackableID: string
}> = [
    {
      legacyID: Pieces.laurWallSquarePillar,
      stackableID: Pieces.laurWallPillarStackable,
    },
    {
      legacyID: Pieces.laurWallShort,
      stackableID: Pieces.laurWallShortStackable,
    },
    {
      legacyID: Pieces.laurWallLong,
      stackableID: Pieces.laurWallLongStackable,
    },
  ]

const isLaurSquarePillarPiece = (pieceID: string) =>
  pieceID === Pieces.laurWallSquarePillar ||
  pieceID === Pieces.laurWallPillarStackable

const isLaurTrianglePillarPiece = (pieceID: string) =>
  pieceID === Pieces.laurWallTrianglePillar

const getBoardPieceCoordAltitudeKey = (piece: BoardPiece) => {
  const { q, r, s } = piece.pieceCoords
  return `${q}~${r}~${s}~${piece.altitude}`
}

export const getCombinedInventory = (setsUsed: string[]): Record<string, number> => {
  const combined: Record<string, number> = {}
  for (const setID of setsUsed) {
    const set = terrainSetsByShortID[setID as keyof typeof terrainSetsByShortID]
    for (const [pieceID, count] of Object.entries(set?.inventory ?? {})) {
      combined[pieceID] = (combined[pieceID] || 0) + (count as number)
    }
  }
  return combined
}

export const countPiecesUsedWithLaurStacking = (
  boardPieces: BoardPiece[],
): Record<string, number> => {
  const pillarCoordAltitudes = new Set<string>()
  for (const piece of boardPieces) {
    if (
      isLaurSquarePillarPiece(piece.inventoryID) ||
      isLaurTrianglePillarPiece(piece.inventoryID)
    ) {
      pillarCoordAltitudes.add(getBoardPieceCoordAltitudeKey(piece))
    }
  }

  const pieceHasSupportingPillarBelow = (piece: BoardPiece) => {
    const belowKey = `${piece.pieceCoords.q}~${piece.pieceCoords.r}~${piece.pieceCoords.s}~${piece.altitude - LAUR_STACK_ALTITUDE_DELTA}`
    return pillarCoordAltitudes.has(belowKey)
  }

  const used: Record<string, number> = {}

  for (const boardPiece of boardPieces) {
    const inventoryID = boardPiece.inventoryID
    let remappedInventoryID = inventoryID

    if (
      inventoryID === Pieces.laurWallSquarePillar &&
      pieceHasSupportingPillarBelow(boardPiece)
    ) {
      remappedInventoryID = Pieces.laurWallPillarStackable
    }

    if (
      inventoryID === Pieces.laurWallShort &&
      pieceHasSupportingPillarBelow(boardPiece)
    ) {
      remappedInventoryID = Pieces.laurWallShortStackable
    }

    if (
      inventoryID === Pieces.laurWallLong &&
      pieceHasSupportingPillarBelow(boardPiece)
    ) {
      remappedInventoryID = Pieces.laurWallLongStackable
    }

    used[remappedInventoryID] = (used[remappedInventoryID] ?? 0) + 1
  }

  return used
}

export type LaurReconcileDetail = {
  legacyID: string
  stackableID: string
  converted: number
}

export const reconcileLaurLegacyToStackableUsage = ({
  usedInventory,
  availableInventory,
}: {
  usedInventory: Record<string, number>
  availableInventory: Record<string, number>
}): {
  reconciledUsedInventory: Record<string, number>
  totalConverted: number
  conversionsByStackableID: Record<string, LaurReconcileDetail>
} => {
  const reconciledUsedInventory = { ...usedInventory }
  const conversionsByStackableID: Record<string, LaurReconcileDetail> = {}
  let totalConverted = 0

  for (const { legacyID, stackableID } of RECONCILABLE_LAUR_PIECE_PAIRS) {
    const usedLegacy = reconciledUsedInventory[legacyID] ?? 0
    const usedStackable = reconciledUsedInventory[stackableID] ?? 0
    const availableLegacy = availableInventory[legacyID] ?? 0
    const availableStackable = availableInventory[stackableID] ?? 0

    const legacyShortage = Math.max(usedLegacy - availableLegacy, 0)
    const stackableCapacity = Math.max(availableStackable - usedStackable, 0)
    const conversionCount = Math.min(legacyShortage, stackableCapacity)

    if (conversionCount > 0) {
      reconciledUsedInventory[legacyID] = usedLegacy - conversionCount
      reconciledUsedInventory[stackableID] = usedStackable + conversionCount
      conversionsByStackableID[stackableID] = {
        legacyID,
        stackableID,
        converted: conversionCount,
      }
      totalConverted += conversionCount
    }
  }

  return {
    reconciledUsedInventory,
    totalConverted,
    conversionsByStackableID,
  }
}
