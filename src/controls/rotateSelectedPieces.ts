import { enqueueSnackbar } from 'notistack'
import { getGroupRotationBlockedReason } from '../data/evaluateGroupRotation'
import {
  type PlacementBlockedReason,
  placementBlockedMessages,
} from '../data/placement'
import { rotateGroupAroundPivot } from '../data/rotateGroup'
import {
  isRotationPivotAtPieceOrigin,
  resolveRotationPivot,
} from '../data/rotationPivot'
import useBoundStore from '../store/store'
import {
  getRotationByListStep,
  hasIntegerRotationSteps,
} from './getPossibleRotationsForPenMode'

export function rotateSelectedPieces(direction: 1 | -1) {
  const {
    boardPieces,
    boardHexes,
    selectedPieceIDs,
    rotationPivot: storedRotationPivot,
    movePieces,
    setPiecePreviews,
  } = useBoundStore.getState()
  const selectedBoardPieces = boardPieces.filter((piece) =>
    selectedPieceIDs.includes(piece.uid),
  )
  const groupRotationPivot = resolveRotationPivot(
    selectedPieceIDs,
    boardPieces,
    boardHexes,
    storedRotationPivot,
  )
  const firstBp = selectedBoardPieces[0]
  if (!firstBp) return

  const showBlockedRotation = (reason?: PlacementBlockedReason) => {
    enqueueSnackbar({
      message: reason
        ? placementBlockedMessages[reason]
        : 'That rotation is blocked.',
      variant: 'warning',
      autoHideDuration: 5000,
    })
  }

  const isMulti = selectedBoardPieces.length > 1
  const hasNonOriginPivot =
    !isMulti &&
    groupRotationPivot !== undefined &&
    !isRotationPivotAtPieceOrigin(
      firstBp.pieceCoords,
      groupRotationPivot.coords,
    )

  if (isMulti || hasNonOriginPivot) {
    if (hasNonOriginPivot && !hasIntegerRotationSteps(firstBp.inventoryID)) {
      showBlockedRotation()
      setPiecePreviews(null)
      return
    }

    const moves = rotateGroupAroundPivot(
      selectedBoardPieces,
      groupRotationPivot?.coords ??
        selectedPieceIDs[selectedPieceIDs.length - 1],
      direction,
    )
    const blockedReason = getGroupRotationBlockedReason(
      { boardHexes, boardPieces },
      selectedBoardPieces,
      moves,
    )
    if (blockedReason) {
      showBlockedRotation(blockedReason)
      setPiecePreviews(null)
      return
    }
    setPiecePreviews(null)
    movePieces({ moves, preserveRotationPivot: true })
    return
  }

  setPiecePreviews(null)
  movePieces({
    moves: selectedBoardPieces.map((piece) => ({
      uid: piece.uid,
      newPieceCoords: piece.pieceCoords,
      newRotation: getRotationByListStep(
        piece.inventoryID,
        piece.rotation,
        direction,
      ),
    })),
  })
  setPiecePreviews(
    selectedBoardPieces.map((piece) => ({
      ...piece,
      rotation: getRotationByListStep(
        piece.inventoryID,
        piece.rotation,
        direction,
        2,
      ),
    })),
  )
}
