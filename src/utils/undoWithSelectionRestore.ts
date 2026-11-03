import { filterVisiblePieceIDs } from '../data/startZoneVisibility'
import useBoundStore from '../store/store'
import type { UndoSelectionRestoreRecord } from '../store/ui-slice'

export function undoWithSelectionRestore() {
  const temporalState = useBoundStore.temporal.getState()
  const canUndo = temporalState.pastStates.length > 0

  temporalState.undo()
  useBoundStore.getState().recomputeConflicts()
  useBoundStore.getState().setPiecePreviews(null)
  useBoundStore.getState().setRotationPivot(null)

  if (canUndo) {
    const record = useBoundStore.getState().peekPendingRedoSelectionRestore()
    if (record) restoreTouchedSelection(record)
    useBoundStore.getState().recordUndoActionLog()
  }
}

export function redoWithSelectionRestore() {
  const temporalState = useBoundStore.temporal.getState()
  const canRedo = temporalState.futureStates.length > 0

  temporalState.redo()
  useBoundStore.getState().recomputeConflicts()
  useBoundStore.getState().setPiecePreviews(null)
  useBoundStore.getState().setRotationPivot(null)

  if (canRedo) {
    const record = useBoundStore.getState().peekPendingUndoSelectionRestore()
    if (record) restoreTouchedSelection(record)
    useBoundStore.getState().recordRedoActionLog()
  }
}

function restoreTouchedSelection(record: UndoSelectionRestoreRecord) {
  const state = useBoundStore.getState()
  state.cancelSelectionHistoryRecording()
  const markerExists =
    record.objectiveMarkerUID &&
    state.hexMap.objectiveMarkers?.some(
      (marker) => marker.uid === record.objectiveMarkerUID,
    )
  const pieceUIDs = markerExists
    ? []
    : filterVisiblePieceIDs(
        record.pieceUIDs.filter((uid) =>
          state.boardPieces.some((piece) => piece.uid === uid),
        ),
        state.boardPieces,
        state.isShowStartZones,
      )
  const selectedMarkerUID =
    markerExists && record.restoreObjectiveMarkerSelection !== false
      ? record.objectiveMarkerUID
      : null

  useBoundStore.setState({
    selectedPieceIDs: pieceUIDs,
    selectedObjectiveMarkerUID: selectedMarkerUID,
    rotationPivot: null,
  })
}
