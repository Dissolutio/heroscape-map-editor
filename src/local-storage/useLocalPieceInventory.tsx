import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { PieceInventory } from '../types'
import { LS_KEYS } from './keys'
import { blankPieceInventory } from '../inventory/blankInventory'
import { normalizePieceInventory } from '../utils/piece-inventory'
import useBoundStore from '../store/store'

export const useLocalPieceInventory = () => {
  const [storedPieceInventory, setStoredPieceInventory] = useLocalStorage(
    LS_KEYS.pieceInventory,
    blankPieceInventory,
  )
  const updateUserPieceInventory = useBoundStore(
    (state) => state.updateUserPieceInventory,
  )
  const syncTerrainConstraintPenMode = useBoundStore(
    (state) => state.syncTerrainConstraintPenMode,
  )
  const terrainConstraintSource = useBoundStore(
    (state) => state.terrainConstraintSource,
  )
  const pieceInventory = normalizePieceInventory(storedPieceInventory)

  // Keep the zustand copy in sync so terrain-constraint consumers can read the
  // user's inventory without each component touching localStorage directly.
  useEffect(() => {
    updateUserPieceInventory(pieceInventory)
    if (terrainConstraintSource === 'personalInventory') {
      syncTerrainConstraintPenMode()
    }
  }, [
    pieceInventory,
    syncTerrainConstraintPenMode,
    terrainConstraintSource,
    updateUserPieceInventory,
  ])

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
