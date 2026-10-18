import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { getNewPieceSizeForPenMode } from '../data/flatPieceSizes'
import type { DragPreview } from '../data/dragMove'
import { blankPieceInventory } from '../inventory/blankInventory'
import { DIALOGS } from '../layout/dialogNames'
import {
  loadSettings,
  resetSettings as resetStoredSettings,
  SETTINGS_DEFAULTS,
  type LightPosition,
} from '../local-storage/settings'
import {
  type BoardHex,
  type BoardPiece,
  PICK_PEN_MODE,
  type PieceInventory,
  SELECT_PEN_MODE,
  type TerrainConstraintSource,
} from '../types'
import type { AppState } from './store'

export type { LightPosition } from '../local-storage/settings'

export interface UISlice {
  isShowStartZones: boolean
  toggleIsShowStartZones: (s: boolean) => void
  resetSettings: () => void
  resetLightPositions: () => void

  // unpersisted state below
  lastPenMode: string
  lastPenSize: number
  toggleLastPenMode: () => void

  penMode: string
  pieceSize: number
  togglePenMode: (mode: string) => void
  penModeRotation: number
  togglePenModeRotation: (s: number) => void
  togglePieceSize: (s: number) => void
  flatPieceSizes: number[]
  currentDialog: string
  toggleCurrentDialog: (s: string) => void
  toggleIsNewMapDialogOpen: (b: boolean) => void
  toggleIsEditMapDialogOpen: (b: boolean) => void
  toggleIsPieceInventoryDialogOpen: (b: boolean) => void

  // WORLD STATE
  selectedPieceIDs: string[]
  toggleSelectedPieceID: (id: string, multiSelect?: boolean) => void
  hoveredPieceID: string
  toggleHoveredPieceID: (id: string) => void
  hoveredHex: BoardHex | undefined
  toggleHoveredHex: (hex?: BoardHex) => void
  viewingLevel: number
  toggleViewingLevel: (level: number) => void
  is2DOpen: boolean
  toggleIs2DOpen: (b: boolean) => void
  isPdfOpen: boolean
  toggleIsPdfOpen: (b: boolean) => void
  isHighQualityRender: boolean
  toggleIsHighQualityRender: (b: boolean) => void
  isLightsAndShadowsRender: boolean
  toggleIsLightsAndShadowsRender: (b: boolean) => void
  isShowLightControls: boolean
  toggleIsShowLightControls: (b: boolean) => void
  lightPositions: Record<string, LightPosition>
  updateLightPosition: (id: string, position: LightPosition) => void
  isDisplayCapHeights: boolean
  toggleIsDisplayCapHeights: (b: boolean) => void
  isHideTableTop: boolean
  toggleIsHideTableTop: (b: boolean) => void
  isTopOutlinedInterlockHexes: boolean
  toggleIsTopOutlinedInterlockHexes: (b: boolean) => void
  isFrameloopDemand: boolean
  toggleIsFrameloopDemand: (b: boolean) => void
  isTakingPicture: boolean
  toggleIsTakingPicture: (s: boolean) => void
  isCameraDisabled: boolean
  toggleIsCameraDisabled: (b: boolean) => void
  isOrthoCam: boolean
  toggleIsOrthoCam: (b: boolean) => void
  userPieceInventory: PieceInventory
  updateUserPieceInventory: (n: PieceInventory) => void
  terrainConstraintSource: TerrainConstraintSource
  customConstraintInventory: PieceInventory
  customConstraintInventoryFileName: string
  updateTerrainConstraintSource: (source: TerrainConstraintSource) => void
  updateCustomConstraintInventory: (args: {
    inventory: PieceInventory
    fileName: string
  }) => void
  clearCustomConstraintInventory: () => void

  // OPERATION PREVIEW STATE
  piecePreviews: BoardPiece[] | null
  setPiecePreviews: (pieces: BoardPiece[] | null) => void

  // DRAG-TO-MOVE (transient: never saved, never in undo history)
  /** A selected piece is being dragged; the camera ignores the pointer. */
  isDraggingPiece: boolean
  dragPreview: DragPreview | null
  setDragState: (
    isDraggingPiece: boolean,
    dragPreview: DragPreview | null,
  ) => void

  // POST-DELETE UNDO RE-SELECTION
  pendingUndoSelectionRestoreStack: string[][]
  pushPendingUndoSelectionRestore: (ids: string[]) => void
  pushPendingUndoSelectionRestoreFromRedo: (ids: string[]) => void
  popPendingUndoSelectionRestore: () => string[] | null
  pendingRedoSelectionRestoreStack: string[][]
  pushPendingRedoSelectionRestore: (ids: string[]) => void
  popPendingRedoSelectionRestore: () => string[] | null

  // PDF STATE
  isShowPDFInventory: boolean
  toggleIsShowPDFInventory: (b: boolean) => void
  isPdfColorBorders: boolean
  toggleIsPdfColorBorders: (b: boolean) => void
  isShowPdfOverlayLayer: boolean
  toggleIsShowPdfOverlayLayer: (b: boolean) => void
  isShowPdfOverlayOnPlacedLevel: boolean
  toggleIsShowPdfOverlayOnPlacedLevel: (b: boolean) => void
  isShowPdfGridLinesOverSublevels: boolean
  toggleIsShowPdfGridLinesOverSublevels: (b: boolean) => void
  isShowPdfLevelLogo: boolean
  toggleIsShowPdfLevelLogo: (b: boolean) => void
  isShowPdfTileLetters: boolean
  toggleIsShowPdfTileLetters: (b: boolean) => void
  pdfRenderFormat: 'coversheet' | 'shortHeader' | 'condensedCoversheet'
  setPdfRenderFormat: (
    format: 'coversheet' | 'shortHeader' | 'condensedCoversheet',
  ) => void
  // SVG STATE
  is2DOverlayLevelEnabled: boolean
  toggleIs2DOverlayLevelEnabled: (b: boolean) => void
  isShow2DExportLevelLogo: boolean
  toggleIsShow2DExportLevelLogo: (b: boolean) => void
  isShow2DExportTileLetters: boolean
  toggleIsShow2DExportTileLetters: (b: boolean) => void
  useLegacyStartZones: boolean
  toggleUseLegacyStartZones: (b: boolean) => void
}

const initialPenMode = SELECT_PEN_MODE
const nonPaintingPenModes = new Set<string>([SELECT_PEN_MODE, PICK_PEN_MODE])

const createUISlice: StateCreator<
  // https://immerjs.github.io/immer/#with-immer
  AppState,
  [],
  [],
  UISlice
> = (set) => ({
  ...loadSettings(),
  selectedPieceIDs: [],
  toggleSelectedPieceID: (pieceID: string, multiSelect?: boolean) =>
    set(
      produce((state) => {
        // in pick pen mode a click is an eyedropper, not a selection
        if (pieceID && state.penMode === PICK_PEN_MODE) {
          return
        }
        if (!pieceID) {
          state.selectedPieceIDs = []
        } else if (multiSelect) {
          const idx = state.selectedPieceIDs.indexOf(pieceID)
          if (idx === -1) {
            state.selectedPieceIDs.push(pieceID)
          } else {
            state.selectedPieceIDs.splice(idx, 1)
            // Clear hover highlight so the deselected piece stops being yellow
            if (state.hoveredPieceID === pieceID) {
              state.hoveredPieceID = ''
            }
          }
        } else {
          if (
            state.selectedPieceIDs.length === 1 &&
            state.selectedPieceIDs[0] === pieceID
          ) {
            state.selectedPieceIDs = []
          } else {
            state.selectedPieceIDs = [pieceID]
          }
        }
      }),
    ),
  hoveredPieceID: '',
  toggleHoveredPieceID: (pieceID: string) =>
    set(
      produce((state) => {
        state.hoveredPieceID = pieceID
      }),
    ),
  hoveredHex: undefined,
  toggleHoveredHex: (hex?: BoardHex) =>
    set(
      produce((state) => {
        state.hoveredHex = hex
      }),
    ),
  penMode: initialPenMode,
  toggleLastPenMode: () =>
    set(
      produce((state) => {
        // if already using old pen mode, skip
        if (
          state.penMode === state.lastPenMode &&
          state.lastPenSize === state.pieceSize
        ) {
          return
        }
        // we are selecting old pen mode
        // recalculate piece sizes for old pen mode
        const { newSize: _, newSizes } = getNewPieceSizeForPenMode(
          state.lastPenMode,
          state.penMode,
          state.pieceSize,
        )
        state.penMode = state.lastPenMode
        state.pieceSize = state.lastPenSize
        state.flatPieceSizes = newSizes
      }),
    ),
  togglePenMode: (mode: string) => {
    set(
      produce((state) => {
        // when we switch terrains, we have different size options available and must update smartly
        const { newSize, newSizes } = getNewPieceSizeForPenMode(
          mode,
          state.penMode,
          state.pieceSize,
        )
        // Keep the active painting mode and size available after a reload.
        if (!nonPaintingPenModes.has(mode)) {
          state.lastPenMode = mode
          state.lastPenSize = newSize
        }
        // Preserve the painting mode when switching to a non-painting mode.
        if (
          nonPaintingPenModes.has(mode) &&
          !nonPaintingPenModes.has(state.penMode)
        ) {
          state.lastPenMode = state.penMode
          state.lastPenSize = state.pieceSize
        }
        // then update the pen mode/size and available sizes
        state.penMode = mode
        state.pieceSize = newSize
        state.flatPieceSizes = newSizes
      }),
    )
  },
  flatPieceSizes: getNewPieceSizeForPenMode(initialPenMode, 'select', 0)
    .newSizes,
  pieceSize: 0,
  togglePieceSize: (n: number) =>
    set(
      produce((s) => {
        s.pieceSize = n
        if (!nonPaintingPenModes.has(s.penMode)) {
          s.lastPenSize = n
        }
      }),
    ),
  penModeRotation: 0,
  togglePenModeRotation: (n: number | string) =>
    set(
      produce((s) => {
        s.penModeRotation = Number(n)
      }),
    ),
  piecePreviews: null,
  setPiecePreviews: (pieces: BoardPiece[] | null) =>
    set(
      produce((s) => {
        s.piecePreviews = pieces
      }),
    ),
  isDraggingPiece: false,
  dragPreview: null,
  setDragState: (isDraggingPiece, dragPreview) =>
    set({ isDraggingPiece, dragPreview }),
  pendingUndoSelectionRestoreStack: [],
  pushPendingUndoSelectionRestore: (ids: string[]) =>
    set(
      produce((s) => {
        if (ids.length) {
          // Any new mutation branch invalidates redo metadata from older undos.
          s.pendingRedoSelectionRestoreStack = []
          s.pendingUndoSelectionRestoreStack.push([...ids])
        }
      }),
    ),
  pushPendingUndoSelectionRestoreFromRedo: (ids: string[]) =>
    set(
      produce((s) => {
        if (ids.length) {
          // During redo replay, preserve remaining redo metadata for later steps.
          s.pendingUndoSelectionRestoreStack.push([...ids])
        }
      }),
    ),
  popPendingUndoSelectionRestore: () => {
    let popped: string[] | null = null
    set(
      produce((s) => {
        const stack = s.pendingUndoSelectionRestoreStack
        popped = stack.length ? [...stack[stack.length - 1]] : null
        if (stack.length) {
          stack.pop()
        }
      }),
    )
    return popped
  },
  pendingRedoSelectionRestoreStack: [],
  pushPendingRedoSelectionRestore: (ids: string[]) =>
    set(
      produce((s) => {
        if (ids.length) {
          s.pendingRedoSelectionRestoreStack.push([...ids])
        }
      }),
    ),
  popPendingRedoSelectionRestore: () => {
    let popped: string[] | null = null
    set(
      produce((s) => {
        const stack = s.pendingRedoSelectionRestoreStack
        popped = stack.length ? [...stack[stack.length - 1]] : null
        if (stack.length) {
          stack.pop()
        }
      }),
    )
    return popped
  },
  toggleIsShowStartZones: (b: boolean) =>
    set(
      produce((s) => {
        s.isShowStartZones = b
      }),
    ),
  isTakingPicture: false,
  toggleIsTakingPicture: (b: boolean) =>
    set(
      produce((s) => {
        s.isTakingPicture = b
      }),
    ),
  isCameraDisabled: false,
  toggleIsCameraDisabled: (b: boolean) =>
    set(
      produce((s) => {
        s.isCameraDisabled = b
      }),
    ),
  toggleIsOrthoCam: (b: boolean) =>
    set(
      produce((s) => {
        s.isOrthoCam = b
      }),
    ),
  toggleIsShowPDFInventory: (b: boolean) =>
    set(
      produce((s) => {
        s.isShowPDFInventory = b
      }),
    ),
  toggleIsPdfColorBorders: (b: boolean) =>
    set(
      produce((s) => {
        s.isPdfColorBorders = b
      }),
    ),
  toggleIsShowPdfOverlayLayer: (b: boolean) =>
    set(
      produce((s) => {
        s.isShowPdfOverlayLayer = b
        // Prevent impossible state where overlay content would be hidden everywhere.
        if (!b && !s.isShowPdfOverlayOnPlacedLevel) {
          s.isShowPdfOverlayOnPlacedLevel = true
        }
      }),
    ),
  toggleIsShowPdfOverlayOnPlacedLevel: (b: boolean) =>
    set(
      produce((s) => {
        s.isShowPdfOverlayOnPlacedLevel = b
        // Prevent impossible state where overlay content would be hidden everywhere.
        if (!b && !s.isShowPdfOverlayLayer) {
          s.isShowPdfOverlayLayer = true
        }
      }),
    ),
  toggleIsShowPdfGridLinesOverSublevels: (b: boolean) =>
    set(
      produce((s) => {
        s.isShowPdfGridLinesOverSublevels = b
      }),
    ),
  toggleIsShowPdfLevelLogo: (b: boolean) =>
    set(
      produce((s) => {
        s.isShowPdfLevelLogo = b
      }),
    ),
  toggleIsShowPdfTileLetters: (b: boolean) =>
    set(
      produce((s) => {
        s.isShowPdfTileLetters = b
      }),
    ),
  setPdfRenderFormat: (
    format: 'coversheet' | 'shortHeader' | 'condensedCoversheet',
  ) =>
    set(
      produce((s) => {
        s.pdfRenderFormat = format
      }),
    ),
  toggleIs2DOverlayLevelEnabled: (b: boolean) =>
    set(
      produce((s) => {
        s.is2DOverlayLevelEnabled = b
      }),
    ),
  toggleIsShow2DExportLevelLogo: (b: boolean) =>
    set(
      produce((s) => {
        s.isShow2DExportLevelLogo = b
      }),
    ),
  toggleIsShow2DExportTileLetters: (b: boolean) =>
    set(
      produce((s) => {
        s.isShow2DExportTileLetters = b
      }),
    ),
  toggleUseLegacyStartZones: (b: boolean) =>
    set(
      produce((s) => {
        s.useLegacyStartZones = b
      }),
    ),
  currentDialog: '',
  toggleIsNewMapDialogOpen: (b: boolean) =>
    set(
      produce((s) => {
        s.currentDialog = b ? DIALOGS.newMap : ''
      }),
    ),
  toggleIsEditMapDialogOpen: (b: boolean) =>
    set(
      produce((s) => {
        s.currentDialog = b ? DIALOGS.editMap : ''
      }),
    ),
  toggleIsPieceInventoryDialogOpen: (b: boolean) =>
    set(
      produce((s) => {
        s.currentDialog = b ? DIALOGS.editPersonalInventory : ''
      }),
    ),
  toggleCurrentDialog: (dialogName: string) =>
    set(
      produce((s) => {
        s.currentDialog = dialogName ?? ''
      }),
    ),
  viewingLevel: 0,
  toggleViewingLevel: (level: number) =>
    set(
      produce((s) => {
        s.viewingLevel = level
      }),
    ),
  toggleIsShowLightControls: (b: boolean) =>
    set(
      produce((s) => {
        s.isShowLightControls = b
      }),
    ),
  updateLightPosition: (id, position) =>
    set(
      produce((s) => {
        s.lightPositions[id] = position
      }),
    ),
  toggleIsLightsAndShadowsRender: (b: boolean) =>
    set(
      produce((s) => {
        s.isLightsAndShadowsRender = b
      }),
    ),
  is2DOpen: false,
  toggleIs2DOpen: (b: boolean) =>
    set(
      produce((s) => {
        s.isPdfOpen = false
        s.is2DOpen = b
      }),
    ),
  isPdfOpen: false,
  toggleIsPdfOpen: (b: boolean) =>
    set(
      produce((s) => {
        s.isPdfOpen = b
      }),
    ),
  toggleIsHighQualityRender: (b: boolean) =>
    set(
      produce((s) => {
        s.isHighQualityRender = b
      }),
    ),
  toggleIsDisplayCapHeights: (b: boolean) =>
    set(
      produce((s) => {
        s.isDisplayCapHeights = b
      }),
    ),
  toggleIsHideTableTop: (b: boolean) =>
    set(
      produce((s) => {
        s.isHideTableTop = b
      }),
    ),
  toggleIsTopOutlinedInterlockHexes: (b: boolean) =>
    set(
      produce((s) => {
        s.isTopOutlinedInterlockHexes = b
      }),
    ),
  isFrameloopDemand: false, // app seems to lockup on stale window regardless
  toggleIsFrameloopDemand: (b: boolean) =>
    set(
      produce((s) => {
        s.isFrameloopDemand = b
      }),
    ),
  userPieceInventory: blankPieceInventory,
  updateUserPieceInventory: (n: PieceInventory) =>
    set(
      produce((s) => {
        s.userPieceInventory = n
      }),
    ),
  updateTerrainConstraintSource: (source: TerrainConstraintSource) =>
    set(
      produce((s) => {
        s.terrainConstraintSource = source
      }),
    ),
  updateCustomConstraintInventory: ({ inventory, fileName }) =>
    set(
      produce((s) => {
        s.customConstraintInventory = inventory
        s.customConstraintInventoryFileName = fileName
      }),
    ),
  clearCustomConstraintInventory: () =>
    set(
      produce((s) => {
        s.customConstraintInventory = blankPieceInventory
        s.customConstraintInventoryFileName = ''
      }),
    ),
  resetSettings: () => {
    resetStoredSettings()
    set(SETTINGS_DEFAULTS)
  },
  resetLightPositions: () =>
    set(
      produce((s) => {
        s.lightPositions = {}
      }),
    ),
})

export default createUISlice
