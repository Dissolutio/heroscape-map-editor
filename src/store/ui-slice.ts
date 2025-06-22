import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { getNewPieceSizeForPenMode } from '../data/flatPieceSizes'
import type { AppState } from './store'
import type { BoardHex } from '../types'

export interface UISlice {
  penMode: string
  togglePenMode: (mode: string) => void
  penModeRotation: number
  togglePenModeRotation: (s: number) => void
  pieceSize: number
  togglePieceSize: (s: number) => void
  flatPieceSizes: number[]
  isNewMapDialogOpen: boolean
  toggleIsNewMapDialogOpen: (b: boolean) => void
  isEditMapDialogOpen: boolean
  toggleIsEditMapDialogOpen: (b: boolean) => void
  // WORLD STATE
  selectedPieceID: string
  toggleSelectedPieceID: (id: string) => void
  hoveredPieceID: string
  toggleHoveredPieceID: (id: string) => void
  hoveredHex: BoardHex | undefined
  toggleHoveredHex: (hex: BoardHex) => void
  isShowStartZones: boolean
  toggleIsShowStartZones: (s: boolean) => void
  isTakingPicture: boolean
  toggleIsTakingPicture: (s: boolean) => void
  isCameraDisabled: boolean
  toggleIsCameraDisabled: (b: boolean) => void
  isOrthoCam: boolean
  toggleIsOrthoCam: (b: boolean) => void
  viewingLevel: number
  toggleViewingLevel: (level: number) => void
  isHighQualityRender: boolean
  toggleIsHighQualityRender: (b: boolean) => void
  isFrameloopDemand: boolean
  toggleIsFrameloopDemand: (b: boolean) => void
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
  toggleHoveredHex: (hex: BoardHex) =>
    set(
      produce((state) => {
        state.hoveredHex = hex
      }),
    ),
  penMode: initialPenMode,
  togglePenMode: (mode: string) =>
    set(
      produce((state) => {
        // when we switch terrains, we have different size options available and must update smartly
        const { newSize, newSizes } = getNewPieceSizeForPenMode(
          mode,
          state.penMode,
          state.pieceSize,
        )
        state.penMode = mode
        state.pieceSize = newSize
        state.flatPieceSizes = newSizes
      }),
    ),
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
  isOrthoCam: false,
  toggleIsOrthoCam: (b: boolean) =>
    set(
      produce((s) => {
        s.isOrthoCam = b
      }),
    ),
  isNewMapDialogOpen: false,
  toggleIsNewMapDialogOpen: (b: boolean) =>
    set(
      produce((s) => {
        s.isNewMapDialogOpen = b
      }),
    ),
  isEditMapDialogOpen: false,
  toggleIsEditMapDialogOpen: (b: boolean) =>
    set(
      produce((s) => {
        s.isEditMapDialogOpen = b
      }),
    ),
  viewingLevel: 0,
  toggleViewingLevel: (level: number) =>
    set(
      produce((s) => {
        s.viewingLevel = level
      }),
    ),
  isHighQualityRender: false,
  toggleIsHighQualityRender: (b: boolean) =>
    set(
      produce((s) => {
        s.isHighQualityRender = b
      }),
    ),
  isFrameloopDemand: true,
  toggleIsFrameloopDemand: (b: boolean) =>
    set(
      produce((s) => {
        s.isFrameloopDemand = b
      }),
    ),
})

export default createUISlice
