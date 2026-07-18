import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material'
import { useState } from 'react'
import useBoundStore from '../store/store'
import {
  selectAllPiecesOnLevel,
  selectAllPiecesOfType,
  selectNeighboringPieces,
} from '../utils/selection-utils'

interface PieceContextMenuProps {
  anchorEl: HTMLElement | null
  pieceID: string
  onClose: () => void
}

/**
 * Context menu for right-clicking on pieces in the 3D view.
 * Provides options to expand selection to related pieces.
 */
export function PieceContextMenu({
  anchorEl,
  pieceID,
  onClose,
}: PieceContextMenuProps) {
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)

  const clickedPiece = boardPieces.find((bp) => bp.uid === pieceID)
  if (!clickedPiece) return null

  const handleSelectAllOnLevel = () => {
    const piecesToSelect = selectAllPiecesOnLevel(pieceID, boardPieces)
    if (piecesToSelect.length > 0) {
      // Clear current selection and select all on level
      toggleSelectedPieceID('') // Explicitly clear
      for (const id of piecesToSelect) {
        toggleSelectedPieceID(id, true) // Add each piece to selection
      }
    }
    onClose()
  }

  const handleSelectAllOfType = () => {
    const piecesToSelect = selectAllPiecesOfType(pieceID, boardPieces)
    if (piecesToSelect.length > 0) {
      // Clear current selection and select all of type
      toggleSelectedPieceID('') // Explicitly clear
      for (const id of piecesToSelect) {
        toggleSelectedPieceID(id, true) // Add each piece to selection
      }
    }
    onClose()
  }

  const handleSelectNeighboring = () => {
    const piecesToSelect = selectNeighboringPieces(pieceID, boardPieces)
    if (piecesToSelect.length > 0) {
      // Add neighboring pieces to current selection
      for (const id of piecesToSelect) {
        toggleSelectedPieceID(id, true)
      }
    }
    onClose()
  }

  const handleAddToSelection = () => {
    if (!selectedPieceIDs.includes(pieceID)) {
      toggleSelectedPieceID(pieceID, true)
    }
    onClose()
  }

  const handleRemoveFromSelection = () => {
    if (selectedPieceIDs.includes(pieceID)) {
      toggleSelectedPieceID(pieceID, true)
    }
    onClose()
  }

  const handleSelectOnly = () => {
    toggleSelectedPieceID(pieceID, false)
    onClose()
  }

  const isAlreadySelected = selectedPieceIDs.includes(pieceID)

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      slotProps={{
        paper: {
          style: {
            maxWidth: '250px',
          },
        },
      }}
    >
      {!isAlreadySelected && (
        <>
          <MenuItem onClick={handleSelectOnly}>
            <ListItemText>Select this piece</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleAddToSelection}>
            <ListItemText>Add to selection</ListItemText>
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
        </>
      )}
      {isAlreadySelected && (
        <>
          <MenuItem onClick={handleRemoveFromSelection}>
            <ListItemText>Remove from selection</ListItemText>
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
        </>
      )}
      <MenuItem onClick={handleSelectAllOnLevel}>
        <ListItemText>Select all on level</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleSelectAllOfType}>
        <ListItemText>Select all of same type</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleSelectNeighboring}>
        <ListItemText>Add neighbors to selection</ListItemText>
      </MenuItem>
    </Menu>
  )
}
