import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { getNewPieceSizeForPenMode } from '../data/flatPieceSizes'
import type { AppState } from './store'
import type { BoardHex, PieceInventory } from '../types'
import { blankPieceInventory } from '../inventory/blankInventory'
import { DIALOGS } from '../layout/dialogNames'

export interface UISlice {
  // TODO: persisted state below
  isShowStartZones: boolean
  toggleIsShowStartZones: (s: boolean) => void

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
  selectedPieceID: string
  toggleSelectedPieceID: (id: string) => void
  hoveredPieceID: string
  toggleHoveredPieceID: (id: string) => void
  hoveredHex: BoardHex | undefined
  toggleHoveredHex: (hex?: BoardHex) => void
  viewingLevel: number
  toggleViewingLevel: (level: number) => void
  isHighQualityRender: boolean
  toggleIsHighQualityRender: (b: boolean) => void
  isLightsAndShadowsRender: boolean
  toggleIsLightsAndShadowsRender: (b: boolean) => void
  isDisplayCapHeights: boolean
  toggleIsDisplayCapHeights: (b: boolean) => void
  isHideTableTop: boolean
  toggleIsHideTableTop: (b: boolean) => void
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
}

const initialPenMode = 'select'

const createUISlice: StateCreator<
  // https://immerjs.github.io/immer/#with-immer
  AppState,
  [],
  [],
  UISlice
> = (set) => ({
  selectedPieceID: '',
  toggleSelectedPieceID: (pieceID: string) =>
    set(
      produce((state) => {
        state.selectedPieceID = pieceID
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
  lastPenMode: 'g',
  lastPenSize: 1,
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
        // if switching to 'select', remeber the last pen mode
        if (mode === 'select' && state.penMode !== 'select') {
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
      }),
    ),
  penModeRotation: 0,
  togglePenModeRotation: (n: number) =>
    set(
      produce((s) => {
        s.penModeRotation = n
      }),
    ),
  isShowStartZones: true,
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
  isOrthoCam: true,
  toggleIsOrthoCam: (b: boolean) =>
    set(
      produce((s) => {
        s.isOrthoCam = b
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
  isLightsAndShadowsRender: false,
  toggleIsLightsAndShadowsRender: (b: boolean) =>
    set(
      produce((s) => {
        s.isLightsAndShadowsRender = b
      }),
    ),
  isHighQualityRender: false,
  toggleIsHighQualityRender: (b: boolean) =>
    set(
      produce((s) => {
        s.isHighQualityRender = b
      }),
    ),
  isDisplayCapHeights: false,
  toggleIsDisplayCapHeights: (b: boolean) =>
    set(
      produce((s) => {
        s.isDisplayCapHeights = b
      }),
    ),
  isHideTableTop: false,
  toggleIsHideTableTop: (b: boolean) =>
    set(
      produce((s) => {
        s.isHideTableTop = b
      }),
    ),
  isFrameloopDemand: true,
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
})

export default createUISlice
