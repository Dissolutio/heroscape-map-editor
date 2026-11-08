import type { MouseEvent, ReactNode } from 'react'
import { filterVisiblePieceIDs } from '../data/startZoneVisibility'
import {
  resolveSelectionUnit,
  type SelectionUnit,
} from '../data/selectionUnits'
import { filterVisibleObjectiveMarkerUIDs } from '../data/objectiveMarkerVisibility'
import useBoundStore from '../store/store'
import { SELECT_PEN_MODE } from '../types'

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
  switchToSelectMode = false,
}: {
  selection: SelectionUnit
  label: string
  children: ReactNode
  className?: string
  disabled?: boolean
  switchToSelectMode?: boolean
}) {
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const isShowStartZones = useBoundStore((state) => state.isShowStartZones)
  const isShowGlyphs = useBoundStore((state) => state.isShowGlyphs)
  const isShowObjectiveMarkers = useBoundStore(
    (state) => state.isShowObjectiveMarkers,
  )
  const objectiveMarkers = useBoundStore(
    (state) => state.hexMap.objectiveMarkers ?? EMPTY_OBJECTIVE_MARKERS,
  )
  const selectSelectionUnit = useBoundStore(
    (state) => state.selectSelectionUnit,
  )
  const togglePenMode = useBoundStore((state) => state.togglePenMode)
  const available = resolveSelectionUnit(
    selection,
    new Set(boardPieces.map((piece) => piece.uid)),
    new Set(
      filterVisiblePieceIDs(
        boardPieces.map((piece) => piece.uid),
        boardPieces,
        isShowStartZones,
        isShowGlyphs,
      ),
    ),
    new Set(
      filterVisibleObjectiveMarkerUIDs(
        objectiveMarkers.map((marker) => marker.uid),
        objectiveMarkers,
        isShowObjectiveMarkers,
      ),
    ),
  )

  return (
    <button
      aria-label={label}
      className={className}
      disabled={disabled || !available}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (switchToSelectMode) togglePenMode(SELECT_PEN_MODE)
        selectSelectionUnit(selection, event.shiftKey)
      }}
      title={SELECTION_RECALL_TOOLTIP}
      type="button"
    >
      {children}
    </button>
  )
}
