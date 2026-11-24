import type { CameraControls } from '@react-three/drei'
import { type RefObject, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import type { Group, Object3DEventMap } from 'three'
import {
  getNextPieceSizeOption,
  getPieceIDForPenMode,
  isObstacleVariantFamily,
} from '../data/flatPieceSizes'
import { PEN_MODE_ACTION_TARGETS } from '../data/hotkeys'
import { getLaurAddonAllowedRotations } from '../data/laurAddonPlacement'
import {
  OBJECTIVE_MARKER_PEN_MODE,
  getObjectiveMarkerHotkeyAction,
} from '../data/objectiveMarkers'
import {
  getRotationHotkeyTarget,
  isRotationHotkeyReady,
} from '../data/rotationHotkey'
import { DIALOGS } from '../layout/dialogNames'
import useBoundStore from '../store/store'
import { PICK_PEN_MODE, Pieces, SELECT_PEN_MODE } from '../types'
import { zoomToMap } from '../utils/camera-utils'
import {
  getBoardHexesRectangularMapDimensions,
  getBoardPiecesMaxLevel,
  getCycleableLevels,
  getOverlayLevel,
} from '../utils/map-utils'
import {
  redoWithSelectionRestore,
  undoWithSelectionRestore,
} from '../utils/undoWithSelectionRestore'
import {
  hasDragRotationPress,
  rotateDragWithHotkey,
  setDragRotationHotkeyLabels,
} from '../world/drag/dragController'
import {
  doPenModeCounterRotation,
  doPenModeRotation,
} from './getPossibleRotationsForPenMode'
import { rotateSelectedPieces } from './rotateSelectedPieces'
import { promptToSaveSelection } from './SaveSelectionButton'

export const STANDARD_PIECE_SIZE_HOTKEYS = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 7,
  '5': 24,
} as const

export const PIECE_SIZE_OVERFLOW_HOTKEYS = ['6', '7', '8', '9', '0'] as const

export const getPieceSizeForHotkey = (
  hotkey: string,
  flatPieceSizes: number[],
  isVariantFamily = false,
  currentSize = 0,
): number | null => {
  if (isVariantFamily) {
    if (flatPieceSizes.length > 5) {
      const direction = hotkey === '1' ? 1 : hotkey === 'shift+1' ? -1 : 0
      return direction
        ? getNextPieceSizeOption(currentSize, flatPieceSizes, direction)
        : null
    }
    const index = Number(hotkey) - 1
    return flatPieceSizes[index] ?? null
  }

  const standardSize =
    STANDARD_PIECE_SIZE_HOTKEYS[
      hotkey as keyof typeof STANDARD_PIECE_SIZE_HOTKEYS
    ]

  if (standardSize !== undefined) {
    return flatPieceSizes.includes(standardSize) ? standardSize : null
  }

  const overflowIndex = PIECE_SIZE_OVERFLOW_HOTKEYS.indexOf(
    hotkey as (typeof PIECE_SIZE_OVERFLOW_HOTKEYS)[number],
  )
  if (overflowIndex === -1) return null

  const specialSizes = [...new Set(flatPieceSizes)]
    .filter((size) => !STANDARD_PIECE_SIZES.has(size))
    .sort((a, b) => a - b)

  return specialSizes[overflowIndex] ?? null
}

export const getPieceSizeHotkeyMap = (
  flatPieceSizes: number[],
  isVariantFamily = false,
) => {
  const hotkeyMap = new Map<string, string>()
  if (isVariantFamily) {
    if (flatPieceSizes.length <= 5) {
      flatPieceSizes.forEach((size, index) => {
        hotkeyMap.set(String(size), String(index + 1))
      })
    }
    return hotkeyMap
  }

  const standardKeys = Object.entries(STANDARD_PIECE_SIZE_HOTKEYS)
  for (const [hotkey, size] of standardKeys) {
    if (flatPieceSizes.includes(size)) {
      hotkeyMap.set(String(size), hotkey)
    }
  }

  const specialSizes = [...new Set(flatPieceSizes)]
    .filter((size) => !STANDARD_PIECE_SIZES.has(size))
    .sort((a, b) => a - b)

  PIECE_SIZE_OVERFLOW_HOTKEYS.forEach((hotkey, index) => {
    const size = specialSizes[index]
    if (size !== undefined) {
      hotkeyMap.set(String(size), hotkey)
    }
  })

  return hotkeyMap
}

const STANDARD_PIECE_SIZES = new Set<number>([
  STANDARD_PIECE_SIZE_HOTKEYS['1'],
  STANDARD_PIECE_SIZE_HOTKEYS['2'],
  STANDARD_PIECE_SIZE_HOTKEYS['3'],
  STANDARD_PIECE_SIZE_HOTKEYS['4'],
  STANDARD_PIECE_SIZE_HOTKEYS['5'],
])

export const useApplyHotkeys = ({
  cameraControlsRef,
  mapGroupRef,
  hotkeyConfig,
}: {
  cameraControlsRef: RefObject<CameraControls>
  mapGroupRef: RefObject<Group<Object3DEventMap>>
  hotkeyConfig: { [key: string]: string | undefined }
}) => {
  const lastNonDragRotationAt = useRef<number | null>(null)
  const penMode = useBoundStore((s) => s.penMode)
  // const lastPenMode = useBoundStore((s) => s.lastPenMode)
  const togglePenMode = useBoundStore((state) => state.togglePenMode)
  const toggleLastPenMode = useBoundStore((state) => state.toggleLastPenMode)
  const flatPieceSizes = useBoundStore((s) => s.flatPieceSizes)
  const togglePieceSize = useBoundStore((s) => s.togglePieceSize)
  const updateObjectiveMarkerDraft = useBoundStore(
    (s) => s.updateObjectiveMarkerDraft,
  )
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const penModeRotation = useBoundStore((s) => s.penModeRotation)
  const togglePenModeRotation = useBoundStore((s) => s.togglePenModeRotation)
  const hoveredHex = useBoundStore((s) => s.hoveredHex)
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  const toggleIsOrthoCam = useBoundStore((s) => s.toggleIsOrthoCam)
  const isCameraDisabled = useBoundStore((s) => s.isCameraDisabled)
  const toggleIsCameraDisabled = useBoundStore((s) => s.toggleIsCameraDisabled)
  const unpaintTile = useBoundStore((s) => s.unpaintTile)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const selectedObjectiveMarkerUID = useBoundStore(
    (s) => s.selectedObjectiveMarkerUID,
  )
  const updateObjectiveMarker = useBoundStore((s) => s.updateObjectiveMarker)
  const removeObjectiveMarker = useBoundStore((s) => s.removeObjectiveMarker)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const is2DOpen = useBoundStore((s) => s.is2DOpen)
  const isPdfOpen = useBoundStore((s) => s.isPdfOpen)
  const isShowPieceKey = useBoundStore((s) => s.isShowPdfPieceLegend)
  const currentDialog = useBoundStore((s) => s.currentDialog)
  const is2DOverlayLevelEnabled = useBoundStore(
    (s) => s.is2DOverlayLevelEnabled,
  )
  const { width, length } = getBoardHexesRectangularMapDimensions(boardHexes)
  const maxLevel = getBoardPiecesMaxLevel(boardPieces, boardHexes)
  const overlayLevel = getOverlayLevel(boardPieces, boardHexes)
  const canViewLegend =
    is2DOpen && !isPdfOpen && isShowPieceKey && boardPieces.length > 0
  const allowedMaxLevel = canViewLegend
    ? overlayLevel + 1
    : is2DOverlayLevelEnabled && is2DOpen && !isPdfOpen
      ? overlayLevel
      : maxLevel
  const cycleableLevels = getCycleableLevels(
    boardPieces,
    boardHexes,
    canViewLegend,
  ).filter((level) => level <= allowedMaxLevel)
  const isSizes = flatPieceSizes?.length > 0
  const rotationHotkey = (action: string) =>
    Object.entries(hotkeyConfig).find(
      ([, assignedAction]) => assignedAction === action,
    )?.[0]
  setDragRotationHotkeyLabels({
    previous: rotationHotkey('cyclePrevPieceRotation')?.toUpperCase(),
    next: rotationHotkey('cycleNextPieceRotation')?.toUpperCase(),
  })

  const deleteSelectedPiece = () => {
    if (selectedObjectiveMarkerUID) {
      removeObjectiveMarker(selectedObjectiveMarkerUID)
      return
    }
    if (selectedPieceIDs.length) {
      // Save the IDs so undo() can re-select them
      useBoundStore
        .getState()
        .pushPendingUndoSelectionRestore([...selectedPieceIDs])
      // Zundo batching: let the first delete run normally so zundo records the
      // pre-batch snapshot into history, then pause so intermediate deletes are
      // not individually tracked. resume() after the loop collapses everything
      // into a single undo step.
      for (const [i, id] of selectedPieceIDs.entries()) {
        if (i === 1) useBoundStore.temporal.getState().pause()
        unpaintTile(id)
      }
      if (selectedPieceIDs.length > 1)
        useBoundStore.temporal.getState().resume()
      toggleSelectedPieceID('')
    }
  }
  const handleToggleIsOrthoCam = () => {
    toggleIsOrthoCam(!isOrthoCam)
  }
  const handleToggleIsCameraDisabled = () => {
    toggleIsCameraDisabled(!isCameraDisabled)
  }
  const zoomToCurrentMap = () => {
    if (mapGroupRef.current) {
      zoomToMap(mapGroupRef, cameraControlsRef, width, length)
    }
  }

  const incrementViewingLevel = () => {
    const next = cycleableLevels.find((level) => level > viewingLevel)
    toggleViewingLevel(next ?? allowedMaxLevel)
  }
  const decrementViewingLevel = () => {
    const priorLevels = cycleableLevels.filter((level) => level < viewingLevel)
    toggleViewingLevel(
      priorLevels.length ? priorLevels[priorLevels.length - 1] : 0,
    )
  }
  const togglePieceSizeForHotkey = (hotkey: string) => {
    if (
      penMode === OBJECTIVE_MARKER_PEN_MODE &&
      (hotkey === '1' || hotkey === '2')
    ) {
      const action = getObjectiveMarkerHotkeyAction(hotkey as '1' | '2', true)
      if (action) updateObjectiveMarkerDraft(action.draftUpdates)
      return
    }
    if (!isSizes) return

    if (isObstacleVariantFamily(penMode)) {
      if (flatPieceSizes.length > 5 && hotkey !== '1') return
    }

    const targetSize = getPieceSizeForHotkey(
      hotkey,
      flatPieceSizes,
      isObstacleVariantFamily(penMode),
      pieceSize,
    )
    if (targetSize === null) return

    togglePieceSize(targetSize)
  }
  const cyclePieceVariantBackward = () => {
    if (!isObstacleVariantFamily(penMode) || flatPieceSizes.length <= 5) {
      return
    }
    const previousSize = getPieceSizeForHotkey(
      'shift+1',
      flatPieceSizes,
      true,
      pieceSize,
    )
    if (previousSize !== null) togglePieceSize(previousSize)
  }

  const togglePieceSize1 = () => togglePieceSizeForHotkey('1')
  const togglePieceSize2 = () => togglePieceSizeForHotkey('2')
  const togglePieceSize3 = () => togglePieceSizeForHotkey('3')
  const togglePieceSize4 = () => togglePieceSizeForHotkey('4')
  const togglePieceSize5 = () => togglePieceSizeForHotkey('5')
  const togglePieceSize6 = () => togglePieceSizeForHotkey('6')
  const togglePieceSize7 = () => togglePieceSizeForHotkey('7')
  const undoWorld = undoWithSelectionRestore
  const redoWorld = redoWithSelectionRestore
  const rotatePenMode = (direction: 1 | -1) => {
    const pieceID = getPieceIDForPenMode(penMode, pieceSize)
    const rotate =
      direction === 1 ? doPenModeRotation : doPenModeCounterRotation
    rotate(
      penMode,
      penModeRotation,
      togglePenModeRotation,
      getLaurAddonAllowedRotations(pieceID, hoveredHex),
    )
  }
  const rotatePiece = (direction: 1 | -1) => {
    const target = getRotationHotkeyTarget({
      isDragging: hasDragRotationPress(),
      selectedPieceCount: selectedPieceIDs.length,
      hasSelectedObjectiveMarker: Boolean(selectedObjectiveMarkerUID),
      penMode,
    })
    if (target === 'drag') {
      rotateDragWithHotkey(direction)
      return
    }
    const time = performance.now()
    if (!isRotationHotkeyReady(lastNonDragRotationAt.current, time)) return
    lastNonDragRotationAt.current = time
    if (target === 'selection') {
      rotateSelectedPieces(direction)
      return
    }
    if (target === 'objective-marker') {
      const marker = useBoundStore
        .getState()
        .hexMap.objectiveMarkers?.find(
          (item) => item.uid === selectedObjectiveMarkerUID,
        )
      if (marker) {
        updateObjectiveMarker(marker.uid, {
          rotation: ((marker.rotation + direction + 6) % 6) as
            | 0
            | 1
            | 2
            | 3
            | 4
            | 5,
        })
      }
      return
    }
    rotatePenMode(direction)
  }
  const cycleNextPieceRotation = () => {
    rotatePiece(1)
  }
  const cyclePrevPieceRotation = () => {
    rotatePiece(-1)
  }
  // Instead of one for select, and one for last, maybe combine them and cycle? Could also track
  // a history of pen modes, and cycle backwards.
  const togglePenModeSelect = () => togglePenMode(SELECT_PEN_MODE)
  const togglePenModePick = () => togglePenMode(PICK_PEN_MODE)
  const togglePenModeLast = () => {
    toggleLastPenMode()
  }
  const togglePenModePowerGlyph = () => togglePenMode(Pieces.glyphPower)
  const togglePenModeTreasureGlyph = () => togglePenMode(Pieces.glyphTreasure)
  const togglePenModeObjectiveMarker = () => applyObjectiveMarkerHotkey('m')
  const togglePenModeObjectiveMarkerWhite = () =>
    applyObjectiveMarkerHotkey('shift+m')
  const applyObjectiveMarkerHotkey = (hotkey: 'm' | 'shift+m') => {
    const action = getObjectiveMarkerHotkeyAction(hotkey, false)
    if (!action) return
    updateObjectiveMarkerDraft(action.draftUpdates)
    if (action.selectPen) togglePenMode(OBJECTIVE_MARKER_PEN_MODE)
  }

  const penModeActionMap = Object.fromEntries(
    Object.entries(PEN_MODE_ACTION_TARGETS).map(([action, mode]) => [
      action,
      () => togglePenMode(mode),
    ]),
  )
  const actionMap: { [key: string]: () => void } = {
    ...penModeActionMap,
    deleteSelectedPiece: deleteSelectedPiece,

    incrementViewingLevel: incrementViewingLevel,
    decrementViewingLevel: decrementViewingLevel,

    handleToggleIsOrthoCam: handleToggleIsOrthoCam,
    handleToggleIsCameraDisabled: handleToggleIsCameraDisabled,
    zoomToMap: zoomToCurrentMap,

    togglePieceSize1: togglePieceSize1,
    togglePieceSize2: togglePieceSize2,
    togglePieceSize3: togglePieceSize3,
    togglePieceSize4: togglePieceSize4,
    togglePieceSize5: togglePieceSize5,
    togglePieceSize6: togglePieceSize6,
    togglePieceSize7: togglePieceSize7,
    cyclePieceVariantBackward: cyclePieceVariantBackward,

    cycleNextPieceRotation: cycleNextPieceRotation,
    cyclePrevPieceRotation: cyclePrevPieceRotation,

    undoWorld: undoWorld,
    redoWorld: redoWorld,
    saveSelection: promptToSaveSelection,

    togglePenModeSelect: togglePenModeSelect,
    togglePenModePick: togglePenModePick,
    togglePenModeLast: togglePenModeLast,
    togglePenModePowerGlyph: togglePenModePowerGlyph,
    togglePenModeTreasureGlyph: togglePenModeTreasureGlyph,
    togglePenModeObjectiveMarker: togglePenModeObjectiveMarker,
    togglePenModeObjectiveMarkerWhite: togglePenModeObjectiveMarkerWhite,
  }

  const activeHotkeys = Object.keys(hotkeyConfig).filter((key) => {
    const action = hotkeyConfig[key]
    return action !== undefined && actionMap[action] !== undefined
  })
  useHotkeys(
    activeHotkeys,
    (_, hotkeysEvent) => {
      const action = hotkeyConfig[hotkeysEvent.hotkey]
      if (action) actionMap[action]?.()
    },
    {
      enabled: currentDialog !== DIALOGS.cropMapPortrait,
      enableOnFormTags: false,
      enableOnContentEditable: false,
    },
    [hotkeyConfig, actionMap],
  )

  return null
}
