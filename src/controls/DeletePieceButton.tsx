import { Button } from '@mui/material'
import useBoundStore from '../store/store'
import { decodePieceID, genPieceID } from '../utils/map-utils'
import { removePiece } from '../data/removePiece'
import { addPiece } from '../data/addPiece'
import { piecesSoFar } from '../data/pieces'
import { buildupJsonFileMap } from '../data/buildupMap'

const DeletePieceButton = () => {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const unpaintTile = useBoundStore((s) => s.unpaintTile)
  const deletePiece = () => {
    unpaintTile(selectedPieceID)
    toggleSelectedPieceID('')
  }

  return (
    <Button
      // variant='contained'
      // color="error"
      size="small"
      onClick={deletePiece}
      title="Hotkey: delete"
    >
      Delete Piece
    </Button>
  )
}
export const RotateClockwisePieceButton = () => {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const hexMap = useBoundStore((s) => s.hexMap)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const loadMap = useBoundStore((s) => s.loadMap)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)

  const rotatePiece = () => {
    if (!selectedPieceID) return
    const { inventoryID, altitude, rotation, pieceCoords } = decodePieceID(selectedPieceID)
    const piece = piecesSoFar[inventoryID]
    if (!piece) return

    // Remove the piece from the board
    const { newBoardHexes, newBoardPieces } = removePiece({
      pieceID: selectedPieceID,
      boardHexes,
      boardPieces,
    })

    // Try to add the piece with new rotation (+1, wrap 0-5)
    const newRotation = (rotation + 1) % 6
    const result = addPiece({
      piece,
      boardHexes: newBoardHexes,
      boardPieces: newBoardPieces,
      pieceCoords,
      placementAltitude: altitude,
      rotation: newRotation,
      isVsTile: false,
    })

    if (!result.error) {
      // Update selection to new pieceID
      const newPieceID = genPieceID(
        Object.keys(result.newBoardHexes).find(
          (id) => result.newBoardHexes[id]?.pieceID === selectedPieceID
        ) || Object.keys(result.newBoardHexes)[0],
        piece.id,
        newRotation
      )
      toggleSelectedPieceID(newPieceID)
      loadMap(buildupJsonFileMap(result.newBoardPieces, hexMap))
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

export default DeletePieceButton
