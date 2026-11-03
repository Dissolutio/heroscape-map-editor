import type { MouseEvent, ReactNode } from 'react'
import { filterVisiblePieceIDs } from '../data/startZoneVisibility'
import {
  resolveSelectionUnit,
  type SelectionUnit,
} from '../data/selectionUnits'
import useBoundStore from '../store/store'

export const SELECTION_RECALL_TOOLTIP =
  'Click to select these pieces again (Shift-click adds to your selection). Pieces that are gone are skipped.'
const EMPTY_OBJECTIVE_MARKERS: NonNullable<
  ReturnType<typeof useBoundStore.getState>['hexMap']['objectiveMarkers']
> = []

export default function SelectionRecallButton({
  selection,
  label,
  children,
  className,
  disabled = false,
}: {
  selection: SelectionUnit
  label: string
  children: ReactNode
  className?: string
  disabled?: boolean
}) {
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const isShowStartZones = useBoundStore((state) => state.isShowStartZones)
  const objectiveMarkers = useBoundStore(
    (state) => state.hexMap.objectiveMarkers ?? EMPTY_OBJECTIVE_MARKERS,
  )
  const selectSelectionUnit = useBoundStore(
    (state) => state.selectSelectionUnit,
  )
  const available = resolveSelectionUnit(
    selection,
    new Set(boardPieces.map((piece) => piece.uid)),
    new Set(
      filterVisiblePieceIDs(
        boardPieces.map((piece) => piece.uid),
        boardPieces,
        isShowStartZones,
      ),
    ),
    new Set(objectiveMarkers.map((marker) => marker.uid)),
  )

  return (
    <button
      aria-label={label}
      className={className}
      disabled={disabled || !available}
      onClick={(event: MouseEvent<HTMLButtonElement>) =>
        selectSelectionUnit(selection, event.shiftKey)
      }
      title={SELECTION_RECALL_TOOLTIP}
      type="button"
    >
      {children}
    </button>
  )
}
