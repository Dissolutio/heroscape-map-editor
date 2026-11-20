import { piecesSoFar } from '../data/pieces'
import type { AppState } from '../store/store'
import { Pieces, type BoardPiece } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import {
  getConstrainedLandInventoryByTerrainAndSizeFromInventory,
  getEffectiveTerrainConstraintInventory,
  hasActiveTerrainConstraints,
} from '../utils/terrain-constraints'

export const startZoneInventoryIDs = [
  Pieces.startZone1,
  Pieces.startZone2,
  Pieces.startZone3,
  Pieces.startZone4,
  Pieces.startZone5,
  Pieces.startZone6,
  Pieces.startZone7,
  Pieces.startZone8,
]
export const startZoneInventoryIDSet = new Set<string>(startZoneInventoryIDs)

function isLandTerrain(terrain: string) {
  return isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain)
}

function formatTerrainLabel(terrain: string) {
  if (!terrain) return 'Unknown'
  return terrain
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
}

const landPieceInventoryByTerrainAndSize = new Map<
  string,
  Map<number, string>
>()
for (const piece of Object.values(piecesSoFar)) {
  if (!piece?.isHexTerrainPiece || !isLandTerrain(piece.terrain)) continue
  if (!landPieceInventoryByTerrainAndSize.has(piece.terrain)) {
    landPieceInventoryByTerrainAndSize.set(piece.terrain, new Map())
  }
  landPieceInventoryByTerrainAndSize
    .get(piece.terrain)
    ?.set(piece.size, piece.id)
}

export function getConvertTerrainAvailability({
  boardPieces,
  selectedPieceIDs,
  setsUsed,
  terrainConstraintSource,
  customConstraintInventory,
  customConstraintInventoryFileName,
  userPieceInventory,
  compact,
}: {
  boardPieces: readonly BoardPiece[]
  selectedPieceIDs: readonly string[]
  setsUsed: AppState['hexMap']['setsUsed']
  terrainConstraintSource: AppState['terrainConstraintSource']
  customConstraintInventory: AppState['customConstraintInventory']
  customConstraintInventoryFileName: AppState['customConstraintInventoryFileName']
  userPieceInventory: AppState['userPieceInventory']
  compact: boolean
}) {
  const selectedIDs = new Set(selectedPieceIDs)
  const selectedBoardPieces = boardPieces.filter((piece) =>
    selectedIDs.has(piece.uid),
  )
  const selectedLandPieces = selectedBoardPieces.flatMap((piece) => {
    const definition = piecesSoFar[piece.inventoryID]
    if (!isLandTerrain(definition?.terrain ?? '')) return []
    return [
      {
        id: piece.uid,
        inventoryID: piece.inventoryID,
        terrain: definition?.terrain ?? '',
        pieceSize: definition?.size ?? 0,
      },
    ]
  })
  const selectedStartZonePieces = selectedBoardPieces.filter((piece) =>
    startZoneInventoryIDSet.has(piece.inventoryID),
  )
  const hasMixedStartZoneSelection =
    selectedStartZonePieces.length > 0 && selectedLandPieces.length > 0
  const constrainedInventory = getEffectiveTerrainConstraintInventory({
    setsUsed: setsUsed ?? [],
    terrainConstraintSource,
    customConstraintInventory,
    userPieceInventory,
  })
  const hasSetConstraints = hasActiveTerrainConstraints({
    setsUsed: setsUsed ?? [],
    terrainConstraintSource,
    customConstraintInventoryFileName,
  })
  const constrainedLandInventoryByTerrainAndSize =
    getConstrainedLandInventoryByTerrainAndSizeFromInventory(
      constrainedInventory,
    )
  const allTerrains = Array.from(
    landPieceInventoryByTerrainAndSize.keys(),
  ).filter((terrain) => terrain !== '')
  const selectedPieceSizes = new Set(
    selectedLandPieces.map((piece) => piece.pieceSize),
  )
  const terrainsValidForSelectedPieces = Array.from(
    landPieceInventoryByTerrainAndSize.entries(),
  )
    .filter(([terrain, targetBySize]) => {
      if (terrain === '') return false
      return Array.from(selectedPieceSizes).some((size) =>
        targetBySize.has(size),
      )
    })
    .map(([terrain]) => terrain)
    .sort((a, b) =>
      formatTerrainLabel(a).localeCompare(formatTerrainLabel(b)),
    )
  const availableTerrains = Array.from(
    (
      hasSetConstraints
        ? constrainedLandInventoryByTerrainAndSize
        : landPieceInventoryByTerrainAndSize
    ).entries(),
  )
    .filter(([terrain, targetBySize]) => {
      if (terrain === '') return false
      return Array.from(selectedPieceSizes).some((size) =>
        targetBySize.has(size),
      )
    })
    .map(([terrain]) => terrain)
    .sort((a, b) =>
      formatTerrainLabel(a).localeCompare(formatTerrainLabel(b)),
    )
  const hiddenForSelectionCount =
    allTerrains.length - terrainsValidForSelectedPieces.length
  const hiddenForConstraintsCount =
    terrainsValidForSelectedPieces.length - availableTerrains.length
  const showConstraintNotice =
    !compact && (hiddenForSelectionCount > 0 || hiddenForConstraintsCount > 0)
  const constraintNoticeText =
    hiddenForSelectionCount > 0 && hiddenForConstraintsCount > 0
      ? 'Some terrain options are unavailable for the selected pieces or hidden by terrain set constraints.'
      : hiddenForSelectionCount > 0
        ? 'Some terrain options are unavailable for the selected pieces.'
        : 'Some terrain options are hidden because this map has active terrain constraints.'
  const hasAvailableLandTargets =
    selectedLandPieces.length > 0 && availableTerrains.length > 0
  const hasAvailableStartZoneTargets =
    selectedStartZonePieces.length > 0 && !hasMixedStartZoneSelection
  const isDisabled =
    !hasAvailableLandTargets && !hasAvailableStartZoneTargets
  const disabledMessage =
    selectedLandPieces.length === 0 && selectedStartZonePieces.length === 0
      ? 'No eligible pieces selected'
      : selectedLandPieces.length > 0 && availableTerrains.length === 0
        ? hasSetConstraints
          ? 'No constrained terrain options available'
          : 'No terrain options available'
        : 'No conversion options available'

  return {
    availableTerrains,
    constraintNoticeText,
    disabledMessage,
    hasAvailableLandTargets,
    hasAvailableStartZoneTargets,
    hasSetConstraints,
    hasMixedStartZoneSelection,
    isDisabled,
    landPieceInventoryByTerrainAndSize,
    selectedLandPieces,
    selectedStartZonePieces,
    showConstraintNotice,
    shouldRender: hasAvailableLandTargets || selectedStartZonePieces.length > 0,
  }
}

export { formatTerrainLabel }
