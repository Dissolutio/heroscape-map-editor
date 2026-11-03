import { produce } from 'immer'
import { enqueueSnackbar } from 'notistack'
import type { StateCreator } from 'zustand'
import type { DragPreview } from '../data/dragMove'
import { getNewPieceSizeForPenMode } from '../data/flatPieceSizes'
import { type LookSettings, sanitizeLookSettings } from '../data/lookSettings'
import {
  appendSelectionHistoryEntry,
  navigateSelectionHistory,
  resolveSelectionHistory,
  sameSelection,
  type SelectionHistoryEntry,
} from '../data/selectionHistory'
import {
  OBJECTIVE_MARKER_PEN_MODE,
  type ObjectiveMarker,
  type ObjectiveMarkerDraft,
} from '../data/objectiveMarkers'
import {
  type RotationPivot,
  createRotationPivot,
  getClosestOwnedPieceHex,
  shouldSetRotationPivotOnClick,
} from '../data/rotationPivot'
import {
  filterVisiblePieceIDs,
  isStartZoneBoardPiece,
} from '../data/startZoneVisibility'
import { blankPieceInventory } from '../inventory/blankInventory'
import { DIALOGS } from '../layout/dialogNames'
import {
  type GraphicsTier,
  type LightPosition,
  SETTINGS_DEFAULTS,
  loadSettings,
  resetGenericTerrainColorSettings,
  resetSettings as resetStoredSettings,
} from '../local-storage/settings'
import {
  finishPerformanceTiming,
  startPerformanceTiming,
} from '../performance/performanceTiming'
import {
  type BoardHex,
  type BoardPiece,
  PICK_PEN_MODE,
  type PieceInventory,
  SELECT_PEN_MODE,
  type TerrainConstraintSource,
} from '../types'
import {
  getLastPointerWorldPoint,
  shouldTrackHoveredWorldPoint,
} from '../world/hoverWorldPoint'
import {
  type TextureLoadStatus,
  loadTerrainTextureArrays,
} from '../world/textures/terrainTextureArrays'
import type { PictureCaptureOptions } from '../world/camera/pictureCaptureOptions'
import type { AppState } from './store'

export type { LightPosition } from '../local-storage/settings'

export type UndoSelectionRestoreRecord = {
  pieceUIDs: string[]
  objectiveMarkerUID: string | null
  restoreObjectiveMarkerSelection?: boolean
}

export const EMPTY_UNDO_SELECTION_RESTORE: UndoSelectionRestoreRecord = {
  pieceUIDs: [],
  objectiveMarkerUID: null,
}
const SELECTION_HISTORY_SETTLE_MS = 250
let selectionHistoryTimeout: ReturnType<typeof setTimeout> | null = null

function scheduleSelectionHistory(record: () => void) {
  if (selectionHistoryTimeout) clearTimeout(selectionHistoryTimeout)
  selectionHistoryTimeout = setTimeout(() => {
    selectionHistoryTimeout = null
    record()
  }, SELECTION_HISTORY_SETTLE_MS)
}

function applySelectionHistoryEntry(
  entry: SelectionHistoryEntry,
  set: (partial: Partial<AppState>) => void,
  get: () => AppState,
) {
  const state = get()
  const markerExists =
    entry.objectiveMarkerUID &&
    state.hexMap.objectiveMarkers?.some(
      (marker) => marker.uid === entry.objectiveMarkerUID,
    )
  set({
    selectedPieceIDs: markerExists
      ? []
      : filterVisiblePieceIDs(
          entry.pieceUIDs,
          state.boardPieces,
          state.isShowStartZones,
        ),
    selectedObjectiveMarkerUID: markerExists ? entry.objectiveMarkerUID : null,
    rotationPivot: null,
  })
}

function getCurrentSelection(state: AppState): SelectionHistoryEntry {
  return {
    pieceUIDs: [...state.selectedPieceIDs],
    objectiveMarkerUID: state.selectedObjectiveMarkerUID,
    selectedAt: 0,
  }
}

export interface UISlice {
  graphicsTier: GraphicsTier
  setGraphicsTier: (tier: GraphicsTier) => Promise<void>
  effectiveGraphicsTier: GraphicsTier
  textureLoadStatus: TextureLoadStatus
  textureLoadProgress: { loaded: number; total: number }
  isShowStartZones: boolean
  toggleIsShowStartZones: (s: boolean) => void
  isShowActionLog: boolean
  toggleIsShowActionLog: (show: boolean) => void
  resetSettings: () => void
  resetLightPositions: () => void
  genericSolidCapColor: string
  genericSolidSideColor: string
  genericFluidCapColor: string
  genericFluidSideColor: string
  rememberedMapAuthor: string
  lookSettings: LookSettings
  setLookSettings: (settings: Partial<LookSettings>) => void
  markerGlyphRotation: number
  setMarkerGlyphRotation: (degrees: number) => void
  setGenericSolidCapColor: (color: string) => void
  setGenericSolidSideColor: (color: string) => void
  setGenericFluidCapColor: (color: string) => void
  setGenericFluidSideColor: (color: string) => void
  setRememberedMapAuthor: (name: string) => void
  resetGenericTerrainColors: () => void

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
  isLookSettingsDialogOpen: boolean
  setIsLookSettingsDialogOpen: (open: boolean) => void
  cropDialogReturnToEditMap: boolean
  toggleCurrentDialog: (s: string) => void
  openCropMapPortraitDialog: (returnToEditMap?: boolean) => void
  closeCropMapPortraitDialog: () => void
  toggleIsNewMapDialogOpen: (b: boolean) => void
  toggleIsEditMapDialogOpen: (b: boolean) => void
  toggleIsPieceInventoryDialogOpen: (b: boolean) => void

  // WORLD STATE
  selectedPieceIDs: string[]
  selectedObjectiveMarkerUID: string | null
  setSelectedObjectiveMarkerUID: (uid: string | null) => void
  objectiveMarkerDraft: ObjectiveMarkerDraft
  updateObjectiveMarkerDraft: (updates: Partial<ObjectiveMarkerDraft>) => void
  objectiveMarkerDragPreview: {
    marker: ObjectiveMarker
    status: 'ok' | 'blocked'
    reason?: 'outOfBounds' | 'unsupported' | 'overlap'
  } | null
  setObjectiveMarkerDragPreview: (
    preview: UISlice['objectiveMarkerDragPreview'],
  ) => void
  toggleSelectedPieceID: (
    id: string,
    multiSelect?: boolean,
    pointerPoint?: { x: number; z: number },
    clickedHex?: BoardHex,
  ) => void
  selectionHistory: SelectionHistoryEntry[]
  selectionHistoryCursor: number
  recordSettledSelection: () => void
  cancelSelectionHistoryRecording: () => void
  clearSelectionHistory: () => void
  navigateSelectionHistory: (direction: 'back' | 'forward') => void
  selectSelectionHistoryEntry: (index: number) => void
  rotationPivot: RotationPivot | null
  setRotationPivot: (pivot: RotationPivot | null) => void
  hoveredPieceID: string
  toggleHoveredPieceID: (id: string) => void
  hoveredHex: BoardHex | undefined
  toggleHoveredHex: (hex?: BoardHex) => void
  hoveredWorldPoint: { x: number; z: number } | undefined
  toggleHoveredWorldPoint: (point?: { x: number; z: number }) => void
  viewingLevel: number
  toggleViewingLevel: (level: number) => void
  is2DOpen: boolean
  toggleIs2DOpen: (b: boolean) => void
  isPdfOpen: boolean
  toggleIsPdfOpen: (b: boolean) => void
  isHighQualityRender: boolean
  toggleIsHighQualityRender: (b: boolean) => void
  useHighQualityForPicture: boolean
  toggleUseHighQualityForPicture: (b: boolean) => void
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
  pictureCaptureOptions: PictureCaptureOptions | null
  setPictureCaptureOptions: (options: PictureCaptureOptions | null) => void
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

  // UNDO/REDO SELECTION RESTORATION
  pendingUndoSelectionRestore: UndoSelectionRestoreRecord | null
  pendingUndoSelectionRestoreStack: UndoSelectionRestoreRecord[]
  pushPendingUndoSelectionRestore: (
    record: string[] | UndoSelectionRestoreRecord,
  ) => void
  consumePendingUndoSelectionRestore: () => UndoSelectionRestoreRecord | null
  clearPendingUndoSelectionRestore: () => void
  pushUndoSelectionRestore: (record: UndoSelectionRestoreRecord) => void
  popPendingUndoSelectionRestore: () => UndoSelectionRestoreRecord | null
  peekPendingUndoSelectionRestore: () => UndoSelectionRestoreRecord | null
  pushPendingUndoSelectionRestoreFromRedo: (
    record: UndoSelectionRestoreRecord,
  ) => void
  pendingRedoSelectionRestoreStack: UndoSelectionRestoreRecord[]
  pushPendingRedoSelectionRestore: (record: UndoSelectionRestoreRecord) => void
  popPendingRedoSelectionRestore: () => UndoSelectionRestoreRecord | null
  peekPendingRedoSelectionRestore: () => UndoSelectionRestoreRecord | null
  clearPendingRedoSelectionRestoreStack: () => void
  clearUndoSelectionRestoreHistory: () => void

  // PDF STATE
  isShowPDFInventory: boolean
  toggleIsShowPDFInventory: (b: boolean) => void
  isPdfColorBorders: boolean
  toggleIsPdfColorBorders: (b: boolean) => void
  isTransparentGlyphSpaces: boolean
  toggleIsTransparentGlyphSpaces: (b: boolean) => void
  isHideHeightsOnGlyphs: boolean
  toggleIsHideHeightsOnGlyphs: (b: boolean) => void
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
  isShowPdfBuriedMarks: boolean
  toggleIsShowPdfBuriedMarks: (b: boolean) => void
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
  isShow2DExportBuriedMarks: boolean
  toggleIsShow2DExportBuriedMarks: (b: boolean) => void
  useLegacyStartZones: boolean
  toggleUseLegacyStartZones: (b: boolean) => void
}

const initialPenMode = SELECT_PEN_MODE
const nonPaintingPenModes = new Set<string>([
  SELECT_PEN_MODE,
  PICK_PEN_MODE,
  OBJECTIVE_MARKER_PEN_MODE,
])
let graphicsTierLoadGeneration = 0

const createUISlice: StateCreator<
  // https://immerjs.github.io/immer/#with-immer
  AppState,
  [],
  [],
  UISlice
> = (set, get) => ({
  ...loadSettings(),
  isLookSettingsDialogOpen: false,
  effectiveGraphicsTier: 'low',
  textureLoadStatus: 'idle',
  textureLoadProgress: { loaded: 0, total: 0 },
  setGraphicsTier: async (tier) => {
    const request = ++graphicsTierLoadGeneration
    set({
      graphicsTier: tier,
      effectiveGraphicsTier: 'low',
      textureLoadStatus: tier === 'low' ? 'idle' : 'loading',
      textureLoadProgress: { loaded: 0, total: 0 },
      ...(tier === 'high' ? { isLightsAndShadowsRender: true } : {}),
    })
    if (tier === 'low') return

    let result: Awaited<ReturnType<typeof loadTerrainTextureArrays>>
    try {
      result = await loadTerrainTextureArrays(tier, {
        onProgress: (loaded, total) => {
          if (request !== graphicsTierLoadGeneration) return
          set({ textureLoadProgress: { loaded, total } })
        },
      })
    } catch (error) {
      result = {
        error: error instanceof Error ? error : new Error(String(error)),
        status: 'error',
      }
    }

    let fellBackToMedium = false
    if (request !== graphicsTierLoadGeneration) return
    if (tier === 'high' && result.status === 'error') {
      try {
        result = await loadTerrainTextureArrays('medium', {
          onProgress: (loaded, total) => {
            if (request !== graphicsTierLoadGeneration) return
            set({ textureLoadProgress: { loaded, total } })
          },
        })
        fellBackToMedium = result.status === 'ready'
      } catch (error) {
        result = {
          error: error instanceof Error ? error : new Error(String(error)),
          status: 'error',
        }
      }
    }

    if (request !== graphicsTierLoadGeneration) return
    if (result.status === 'ready') {
      set({
        effectiveGraphicsTier: fellBackToMedium ? 'medium' : tier,
        textureLoadStatus: fellBackToMedium ? 'fallback' : 'ready',
        textureLoadProgress: {
          loaded: result.textures ? Object.keys(result.textures).length : 0,
          total: fellBackToMedium ? 2 : tier === 'medium' ? 2 : 7,
        },
      })
      return
    }

    set({
      effectiveGraphicsTier: 'low',
      textureLoadStatus: 'error',
    })
    enqueueSnackbar({
      message: `Could not load terrain textures: ${result.error.message}`,
      variant: 'error',
      preventDuplicate: true,
      key: 'terrain-texture-load-error',
    })
  },
  setRememberedMapAuthor: (name: string) => set({ rememberedMapAuthor: name }),
  isShowStartZones: true,
  toggleIsShowActionLog: (show) => set({ isShowActionLog: show }),
  selectedPieceIDs: [],
  selectedObjectiveMarkerUID: null,
  setSelectedObjectiveMarkerUID: (uid) => {
    const previous = get().selectedObjectiveMarkerUID
    set({ selectedObjectiveMarkerUID: uid })
    if (previous !== uid) {
      scheduleSelectionHistory(() => get().recordSettledSelection())
    }
  },
  objectiveMarkerDraft: {
    size: 1,
    style: 'black',
    content: { kind: 'number', value: 1 },
    name: undefined,
    pinNumber: false,
  },
  updateObjectiveMarkerDraft: (updates) =>
    set((state) =>
      produce(state, (draft) => {
        draft.objectiveMarkerDraft = {
          ...draft.objectiveMarkerDraft,
          ...updates,
        }
      }),
    ),
  objectiveMarkerDragPreview: null,
  setObjectiveMarkerDragPreview: (preview) =>
    set({ objectiveMarkerDragPreview: preview }),
  selectionHistory: [],
  selectionHistoryCursor: -1,
  recordSettledSelection: () => {
    const state = get()
    const entry: SelectionHistoryEntry = {
      pieceUIDs: [...state.selectedPieceIDs],
      objectiveMarkerUID: state.selectedObjectiveMarkerUID,
      selectedAt: Date.now(),
    }
    const history = appendSelectionHistoryEntry(
      {
        entries: state.selectionHistory,
        cursor: state.selectionHistoryCursor,
      },
      entry,
    )
    set({
      selectionHistory: history.entries,
      selectionHistoryCursor: history.cursor,
    })
  },
  cancelSelectionHistoryRecording: () => {
    if (selectionHistoryTimeout) clearTimeout(selectionHistoryTimeout)
    selectionHistoryTimeout = null
  },
  clearSelectionHistory: () => {
    get().cancelSelectionHistoryRecording()
    set({ selectionHistory: [], selectionHistoryCursor: -1 })
  },
  navigateSelectionHistory: (direction) => {
    if (selectionHistoryTimeout) clearTimeout(selectionHistoryTimeout)
    selectionHistoryTimeout = null
    const state = get()
    const available = resolveSelectionHistory(
      {
        entries: state.selectionHistory,
        cursor: state.selectionHistoryCursor,
      },
      {
        pieceUIDs: new Set(state.boardPieces.map((piece) => piece.uid)),
        visiblePieceUIDs: new Set(
          filterVisiblePieceIDs(
            state.boardPieces.map((piece) => piece.uid),
            state.boardPieces,
            state.isShowStartZones,
          ),
        ),
        objectiveMarkerUIDs: new Set(
          (state.hexMap.objectiveMarkers ?? []).map((marker) => marker.uid),
        ),
      },
    )
    const next = navigateSelectionHistory(
      available,
      getCurrentSelection(state),
      direction === 'back' ? -1 : 1,
    )
    set({
      selectionHistory: next.entries,
      selectionHistoryCursor: next.cursor,
    })
    const entry = next.entries[next.cursor]
    if (
      !entry ||
      (next.cursor === available.cursor &&
        sameSelection(entry, getCurrentSelection(state)))
    ) {
      return
    }
    applySelectionHistoryEntry(entry, set, get)
  },
  selectSelectionHistoryEntry: (index) => {
    if (selectionHistoryTimeout) clearTimeout(selectionHistoryTimeout)
    selectionHistoryTimeout = null
    const state = get()
    const available = resolveSelectionHistory(
      {
        entries: state.selectionHistory,
        cursor: state.selectionHistoryCursor,
      },
      {
        pieceUIDs: new Set(state.boardPieces.map((piece) => piece.uid)),
        visiblePieceUIDs: new Set(
          filterVisiblePieceIDs(
            state.boardPieces.map((piece) => piece.uid),
            state.boardPieces,
            state.isShowStartZones,
          ),
        ),
        objectiveMarkerUIDs: new Set(
          (state.hexMap.objectiveMarkers ?? []).map((marker) => marker.uid),
        ),
      },
    )
    const requested = state.selectionHistory[index]
    const resolvedIndex = requested
      ? available.entries.findIndex(
          (entry) =>
            entry.selectedAt === requested.selectedAt &&
            sameSelection(entry, requested),
        )
      : -1
    set({
      selectionHistory: available.entries,
      selectionHistoryCursor:
        resolvedIndex >= 0 ? resolvedIndex : available.cursor,
    })
    if (resolvedIndex < 0) return
    const entry = available.entries[resolvedIndex]
    if (!entry) return
    applySelectionHistoryEntry(entry, set, get)
  },
  rotationPivot: null,
  toggleSelectedPieceID: (
    pieceID: string,
    multiSelect?: boolean,
    pointerPoint?: { x: number; z: number },
    clickedHex?: BoardHex,
  ) => {
    const previous = get()
    set(
      produce((state) => {
        state.selectedObjectiveMarkerUID = null
        // in pick pen mode a click is an eyedropper, not a selection
        if (pieceID && state.penMode === PICK_PEN_MODE) {
          return
        }
        if (
          pieceID &&
          !state.isShowStartZones &&
          isStartZoneBoardPiece(
            state.boardPieces.find(
              (candidate: BoardPiece) => candidate.uid === pieceID,
            ),
          )
        ) {
          return
        }
        const hitHex =
          (pointerPoint
            ? getClosestOwnedPieceHex(state.boardHexes, pieceID, pointerPoint)
            : undefined) ??
          (clickedHex?.boardPieceUID === pieceID ? clickedHex : undefined)
        if (
          pieceID &&
          hitHex &&
          shouldSetRotationPivotOnClick(
            state.selectedPieceIDs,
            state.boardPieces,
            state.boardHexes,
            state.rotationPivot,
            hitHex,
            Boolean(multiSelect),
          )
        ) {
          const piece = state.boardPieces.find(
            (candidate: BoardPiece) => candidate.uid === pieceID,
          )
          const pivot = piece && createRotationPivot(piece, hitHex)
          if (pivot) {
            state.rotationPivot = pivot
            return
          }
        }

        const wasSelected = state.selectedPieceIDs.includes(pieceID)
        state.rotationPivot = null
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

        if (
          pieceID &&
          !wasSelected &&
          state.selectedPieceIDs[state.selectedPieceIDs.length - 1] ===
            pieceID &&
          hitHex
        ) {
          const piece = state.boardPieces.find(
            (candidate: BoardPiece) => candidate.uid === pieceID,
          )
          const pivot = piece && createRotationPivot(piece, hitHex)
          if (pivot) state.rotationPivot = pivot
        }
      }),
    )
    const next = get()
    if (
      !sameSelection(
        {
          pieceUIDs: previous.selectedPieceIDs,
          objectiveMarkerUID: previous.selectedObjectiveMarkerUID,
          selectedAt: 0,
        },
        {
          pieceUIDs: next.selectedPieceIDs,
          objectiveMarkerUID: next.selectedObjectiveMarkerUID,
          selectedAt: 0,
        },
      )
    ) {
      scheduleSelectionHistory(() => get().recordSettledSelection())
    }
  },
  setRotationPivot: (pivot: RotationPivot | null) =>
    set(
      produce((state) => {
        state.rotationPivot = pivot
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
        if (!hex) state.hoveredWorldPoint = undefined
      }),
    ),
  hoveredWorldPoint: undefined,
  toggleHoveredWorldPoint: (point?: { x: number; z: number }) => {
    const startedAt = startPerformanceTiming()
    try {
      set(
        produce((state) => {
          if (
            state.hoveredWorldPoint?.x === point?.x &&
            state.hoveredWorldPoint?.z === point?.z
          ) {
            return
          }
          state.hoveredWorldPoint = point
        }),
      )
    } finally {
      finishPerformanceTiming('store.toggleHoveredWorldPoint', startedAt)
    }
  },
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
        const startsPlacement =
          !shouldTrackHoveredWorldPoint(state.penMode) &&
          shouldTrackHoveredWorldPoint(mode)
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
        if (startsPlacement) {
          state.hoveredWorldPoint = getLastPointerWorldPoint()
        }
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
  pendingUndoSelectionRestore: null,
  pendingUndoSelectionRestoreStack: [],
  pushPendingUndoSelectionRestore: (record) => {
    if (get().pendingUndoSelectionRestore) return
    const normalized = Array.isArray(record)
      ? { pieceUIDs: [...record], objectiveMarkerUID: null }
      : {
          pieceUIDs: [...record.pieceUIDs],
          objectiveMarkerUID: record.objectiveMarkerUID,
          restoreObjectiveMarkerSelection:
            record.restoreObjectiveMarkerSelection,
        }
    set({ pendingUndoSelectionRestore: normalized })
  },
  consumePendingUndoSelectionRestore: () => {
    const record = get().pendingUndoSelectionRestore
    if (record) set({ pendingUndoSelectionRestore: null })
    return record
  },
  clearPendingUndoSelectionRestore: () => {
    if (get().pendingUndoSelectionRestore) {
      set({ pendingUndoSelectionRestore: null })
    }
  },
  pushUndoSelectionRestore: (record) =>
    set(
      produce((s) => {
        s.pendingRedoSelectionRestoreStack = []
        s.pendingUndoSelectionRestoreStack.push({
          pieceUIDs: [...record.pieceUIDs],
          objectiveMarkerUID: record.objectiveMarkerUID,
          restoreObjectiveMarkerSelection:
            record.restoreObjectiveMarkerSelection,
        })
        if (s.pendingUndoSelectionRestoreStack.length > 30) {
          s.pendingUndoSelectionRestoreStack.shift()
        }
      }),
    ),
  popPendingUndoSelectionRestore: () => {
    let popped: UndoSelectionRestoreRecord | null = null
    set(
      produce((s) => {
        const stack = s.pendingUndoSelectionRestoreStack
        const record = stack[stack.length - 1]
        popped = record
          ? {
              pieceUIDs: [...record.pieceUIDs],
              objectiveMarkerUID: record.objectiveMarkerUID,
              restoreObjectiveMarkerSelection:
                record.restoreObjectiveMarkerSelection,
            }
          : null
        if (stack.length) {
          stack.pop()
        }
      }),
    )
    return popped
  },
  peekPendingUndoSelectionRestore: () => {
    const stack = get().pendingUndoSelectionRestoreStack
    const record = stack[stack.length - 1]
    return record
      ? {
          pieceUIDs: [...record.pieceUIDs],
          objectiveMarkerUID: record.objectiveMarkerUID,
          restoreObjectiveMarkerSelection:
            record.restoreObjectiveMarkerSelection,
        }
      : null
  },
  pushPendingUndoSelectionRestoreFromRedo: (record) =>
    get().pushUndoSelectionRestore(record),
  pendingRedoSelectionRestoreStack: [],
  pushPendingRedoSelectionRestore: (record) =>
    set(
      produce((s) => {
        s.pendingRedoSelectionRestoreStack.push({
          pieceUIDs: [...record.pieceUIDs],
          objectiveMarkerUID: record.objectiveMarkerUID,
          restoreObjectiveMarkerSelection:
            record.restoreObjectiveMarkerSelection,
        })
        if (s.pendingRedoSelectionRestoreStack.length > 30) {
          s.pendingRedoSelectionRestoreStack.shift()
        }
      }),
    ),
  popPendingRedoSelectionRestore: () => {
    let popped: UndoSelectionRestoreRecord | null = null
    set(
      produce((s) => {
        const stack = s.pendingRedoSelectionRestoreStack
        const record = stack[stack.length - 1]
        popped = record
          ? {
              pieceUIDs: [...record.pieceUIDs],
              objectiveMarkerUID: record.objectiveMarkerUID,
              restoreObjectiveMarkerSelection:
                record.restoreObjectiveMarkerSelection,
            }
          : null
        if (stack.length) {
          stack.pop()
        }
      }),
    )
    return popped
  },
  peekPendingRedoSelectionRestore: () => {
    const stack = get().pendingRedoSelectionRestoreStack
    const record = stack[stack.length - 1]
    return record
      ? {
          pieceUIDs: [...record.pieceUIDs],
          objectiveMarkerUID: record.objectiveMarkerUID,
          restoreObjectiveMarkerSelection:
            record.restoreObjectiveMarkerSelection,
        }
      : null
  },
  clearPendingRedoSelectionRestoreStack: () =>
    set({ pendingRedoSelectionRestoreStack: [] }),
  clearUndoSelectionRestoreHistory: () =>
    set({
      pendingUndoSelectionRestore: null,
      pendingUndoSelectionRestoreStack: [],
      pendingRedoSelectionRestoreStack: [],
    }),
  toggleIsShowStartZones: (b: boolean) =>
    set(
      produce((s) => {
        s.isShowStartZones = b
        if (!b) {
          s.selectedPieceIDs = filterVisiblePieceIDs(
            s.selectedPieceIDs,
            s.boardPieces,
            false,
          )
          const lastSelectedUID =
            s.selectedPieceIDs[s.selectedPieceIDs.length - 1]
          const pivotPiece = s.boardPieces.find(
            (piece: BoardPiece) => piece.uid === s.rotationPivot?.uid,
          )
          if (
            s.rotationPivot &&
            (s.rotationPivot.uid !== lastSelectedUID ||
              isStartZoneBoardPiece(pivotPiece))
          ) {
            s.rotationPivot = null
          }
          if (
            isStartZoneBoardPiece(
              s.boardPieces.find(
                (piece: BoardPiece) => piece.uid === s.hoveredPieceID,
              ),
            )
          ) {
            s.hoveredPieceID = ''
          }
        }
      }),
    ),
  isTakingPicture: false,
  toggleIsTakingPicture: (b: boolean) =>
    set(
      produce((s) => {
        s.isTakingPicture = b
      }),
    ),
  pictureCaptureOptions: null,
  setPictureCaptureOptions: (options) =>
    set({ pictureCaptureOptions: options }),
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
  toggleIsTransparentGlyphSpaces: (b: boolean) =>
    set(
      produce((s) => {
        s.isTransparentGlyphSpaces = b
      }),
    ),
  toggleIsHideHeightsOnGlyphs: (b: boolean) =>
    set(
      produce((s) => {
        s.isHideHeightsOnGlyphs = b
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
  toggleIsShowPdfBuriedMarks: (b: boolean) =>
    set(
      produce((s) => {
        s.isShowPdfBuriedMarks = b
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
  toggleIsShow2DExportBuriedMarks: (b: boolean) =>
    set(
      produce((s) => {
        s.isShow2DExportBuriedMarks = b
      }),
    ),
  toggleUseLegacyStartZones: (b: boolean) =>
    set(
      produce((s) => {
        s.useLegacyStartZones = b
      }),
    ),
  currentDialog: '',
  cropDialogReturnToEditMap: false,
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
  openCropMapPortraitDialog: (returnToEditMap = false) =>
    set(
      produce((s) => {
        s.currentDialog = DIALOGS.cropMapPortrait
        s.cropDialogReturnToEditMap = returnToEditMap
      }),
    ),
  closeCropMapPortraitDialog: () =>
    set(
      produce((s) => {
        s.currentDialog = s.cropDialogReturnToEditMap ? DIALOGS.editMap : ''
        s.cropDialogReturnToEditMap = false
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
  toggleUseHighQualityForPicture: (b: boolean) =>
    set(
      produce((s) => {
        s.useHighQualityForPicture = b
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
    graphicsTierLoadGeneration += 1
    resetStoredSettings()
    set({
      ...SETTINGS_DEFAULTS,
      effectiveGraphicsTier: 'low',
      textureLoadStatus: 'idle',
      textureLoadProgress: { loaded: 0, total: 0 },
    })
  },
  setLookSettings: (settings) =>
    set((state) => ({
      lookSettings: sanitizeLookSettings({
        ...state.lookSettings,
        ...settings,
      }),
    })),
  setMarkerGlyphRotation: (degrees) => {
    if (!Number.isFinite(degrees)) return
    set({ markerGlyphRotation: Math.max(-180, Math.min(180, degrees)) })
  },
  setIsLookSettingsDialogOpen: (open) =>
    set({ isLookSettingsDialogOpen: open }),
  setGenericSolidCapColor: (color: string) =>
    set({ genericSolidCapColor: color }),
  setGenericSolidSideColor: (color: string) =>
    set({ genericSolidSideColor: color }),
  setGenericFluidCapColor: (color: string) =>
    set({ genericFluidCapColor: color }),
  setGenericFluidSideColor: (color: string) =>
    set({ genericFluidSideColor: color }),
  resetGenericTerrainColors: () =>
    set((state) => resetGenericTerrainColorSettings(state)),
  resetLightPositions: () =>
    set(
      produce((s) => {
        s.lightPositions = {}
      }),
    ),
})

export default createUISlice
