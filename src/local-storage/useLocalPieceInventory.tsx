import { useLocalStorage } from './useLocalStorage'
import type { PieceInventory } from '../types'
import { LS_KEYS } from './keys'
import { blankPieceInventory } from '../inventory/blankInventory'

const normalizePieceInventory = (
  maybeInventory?: PieceInventory,
): PieceInventory => {
  const normalized: PieceInventory = { ...blankPieceInventory }
  for (const pieceID of Object.keys(blankPieceInventory)) {
    const value = maybeInventory?.[pieceID]
    const count = Number.isFinite(value) ? Number(value) : 0
    normalized[pieceID] = Math.max(0, Math.floor(count))
  }
  return normalized
}

export const useLocalPieceInventory = () => {
  const [storedPieceInventory, setStoredPieceInventory] = useLocalStorage(
    LS_KEYS.pieceInventory,
    blankPieceInventory,
  )
  const pieceInventory = normalizePieceInventory(storedPieceInventory)

  const setPieceInventory = (nextPieceInventory: PieceInventory) => {
    setStoredPieceInventory(normalizePieceInventory(nextPieceInventory))
  }

  const clearPieceInventory = () => {
    setPieceInventory(blankPieceInventory)
  }

  const addSet = (pieceSet: PieceInventory) => {
    const newPieceInventory: PieceInventory = { ...pieceInventory }
    for (const pieceID of Object.keys(pieceSet)) {
      const valueToAdd = pieceSet[pieceID] ?? 0
      newPieceInventory[pieceID] = (pieceInventory[pieceID] ?? 0) + valueToAdd
    }
    setPieceInventory(newPieceInventory)
  }

  const removeSet = (pieceSet: PieceInventory) => {
    const newPieceInventory: PieceInventory = { ...pieceInventory }
    for (const pieceID of Object.keys(pieceSet)) {
      newPieceInventory[pieceID] = Math.max(
        (pieceInventory[pieceID] ?? 0) - (pieceSet[pieceID] ?? 0),
        0,
      )
    }
    setPieceInventory(newPieceInventory)
  }

  return {
    pieceInventory,
    addSet,
    removeSet,
    clearPieceInventory,
    setPieceInventory,
  }
}
