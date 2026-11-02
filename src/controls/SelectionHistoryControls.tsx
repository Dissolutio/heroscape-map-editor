import { Button, ButtonGroup, MenuItem, Select } from '@mui/material'
import { MdArrowBack, MdArrowForward } from 'react-icons/md'
import { piecesSoFar } from '../data/pieces'
import { sameSelection } from '../data/selectionHistory'
import useBoundStore from '../store/store'
import { useHotkeyConfig } from './useHotkeyConfig'

function selectionLabel(
  pieceUIDs: string[],
  objectiveMarkerUID: string | null,
  boardPieces: ReturnType<typeof useBoundStore.getState>['boardPieces'],
) {
  if (objectiveMarkerUID) return 'Objective marker'
  if (!pieceUIDs.length) return 'No selection'
  const firstPiece = boardPieces.find((piece) => piece.uid === pieceUIDs[0])
  const title = firstPiece
    ? (piecesSoFar[firstPiece.inventoryID]?.title ?? firstPiece.inventoryID)
    : 'Piece'
  return pieceUIDs.length === 1 ? title : `${pieceUIDs.length} pieces: ${title}`
}

function relativeAge(timestamp: number) {
  const elapsed = Math.max(0, Date.now() - timestamp)
  if (elapsed < 60_000) return 'just now'
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const SelectionHistoryControls = () => {
  const entries = useBoundStore((state) => state.selectionHistory)
  const cursor = useBoundStore((state) => state.selectionHistoryCursor)
  const selectedPieceIDs = useBoundStore((state) => state.selectedPieceIDs)
  const selectedObjectiveMarkerUID = useBoundStore(
    (state) => state.selectedObjectiveMarkerUID,
  )
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const navigate = useBoundStore((state) => state.navigateSelectionHistory)
  const selectEntry = useBoundStore(
    (state) => state.selectSelectionHistoryEntry,
  )
  const { hotkeyLookup } = useHotkeyConfig()
  const currentEntry = {
    pieceUIDs: selectedPieceIDs,
    objectiveMarkerUID: selectedObjectiveMarkerUID,
    selectedAt: 0,
  }
  const cursorEntry = entries[cursor]
  const isAtCursor =
    cursorEntry !== undefined && sameSelection(cursorEntry, currentEntry)
  const canBack = entries.length > 0 && (!isAtCursor || cursor > 0)
  const canForward =
    entries.length > 0 && (!isAtCursor || cursor < entries.length - 1)

  if (!entries.length) return null

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}
    >
      <ButtonGroup size="small" variant="text">
        <Button
          aria-label="Back to previous selection"
          title={`Back to previous selection (${hotkeyLookup.backSelectionHistory?.toUpperCase()})`}
          disabled={!canBack}
          onClick={() => navigate('back')}
          sx={{ minWidth: 28, px: 0.5 }}
        >
          <MdArrowBack size={15} />
        </Button>
        <Button
          aria-label="Forward to next selection"
          title={`Forward to next selection (${hotkeyLookup.forwardSelectionHistory?.toUpperCase()})`}
          disabled={!canForward}
          onClick={() => navigate('forward')}
          sx={{ minWidth: 28, px: 0.5 }}
        >
          <MdArrowForward size={15} />
        </Button>
      </ButtonGroup>
      <Select
        aria-label="Recent selections"
        size="small"
        value={cursor < 0 ? '' : cursor}
        displayEmpty
        onChange={(event) => selectEntry(Number(event.target.value))}
        renderValue={(value) => {
          const entry = entries[Number(value)]
          return entry
            ? selectionLabel(
                entry.pieceUIDs,
                entry.objectiveMarkerUID,
                boardPieces,
              )
            : 'Recent selections'
        }}
        sx={{ flex: 1, minWidth: 0, fontSize: 10, height: 28 }}
      >
        {entries.map((entry, index) => (
          <MenuItem key={`${entry.selectedAt}-${index}`} value={index}>
            <span>
              {selectionLabel(
                entry.pieceUIDs,
                entry.objectiveMarkerUID,
                boardPieces,
              )}{' '}
              · {relativeAge(entry.selectedAt)}
            </span>
          </MenuItem>
        ))}
      </Select>
    </div>
  )
}

export default SelectionHistoryControls
