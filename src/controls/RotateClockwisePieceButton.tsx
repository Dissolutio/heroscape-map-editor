import { Button } from '@mui/material'
import useBoundStore from '../store/store'
import { decodePieceID, genBoardHexID, genPieceID } from '../utils/map-utils'
import { removePiece } from '../data/removePiece'
import { addPiece } from '../data/addPiece'
import { piecesSoFar } from '../data/pieces'
import { getPossibleRotationsForPenMode, getRotationDeltaForPieceId } from './getPossibleRotationsForPenMode'

export const RotateClockwisePieceButton = () => {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const hexMap = useBoundStore((s) => s.hexMap)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const loadMap = useBoundStore((s) => s.loadMap)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)

  const rotatePiece = (reverse?: boolean) => {
    if (!selectedPieceID) return
    const { inventoryID, altitude, rotation, pieceCoords } = decodePieceID(selectedPieceID)
    const piece = piecesSoFar[inventoryID]
    if (!piece) return

    // Remove the piece from the board
    const { newBoardHexes: removedBoardHexes, newBoardPieces: removedBoardPieces } = removePiece({
      pieceID: selectedPieceID,
      boardHexes,
      boardPieces,
    })
    console.log("🚀 ~ rotatePiece ~ removedBoardHexes:", removedBoardHexes)
    console.log("🚀 ~ rotatePiece ~ removedBoardPieces:", removedBoardPieces)
    const delta = getRotationDeltaForPieceId(piece.id)
    // Try to add the piece with new rotation (+1, wrap 0-5)
    const newRotation = (reverse ? -1 : 1) * delta + (rotation) % 6
    const result = addPiece({
      piece,
      boardHexes: removedBoardHexes,
      boardPieces: removedBoardPieces,
      pieceCoords,
      placementAltitude: altitude,
      rotation: newRotation,
      isVsTile: false,
    })
    console.log("🚀 ~ rotatePiece ~ result:", result)
    const pieceOriginBoardHexID = genBoardHexID({
      ...pieceCoords,
      altitude,
    })
    const newPieceID = genPieceID(
      pieceOriginBoardHexID,
      piece.id,
      newRotation
    )
    // load new boardhexes/pieces
    if (!result.error) {
      loadMap({
        hexMap,
        boardPieces: result.newBoardPieces,
        boardHexes: result.newBoardHexes
      })
    }
    // Update selection to new pieceID
    if (newPieceID) {
      toggleSelectedPieceID(newPieceID)
    }

    // Optionally: handle error (e.g., show a snackbar)
  }

  return (
    <Button
      size="small"
      onClick={rotatePiece}
      title="Rotate Clockwise"
    >
      Rotate ⟳
    </Button>
  )
}