import useBoundStore, { type AppState } from '../store/store'
import { useHotkeys } from 'react-hotkeys-hook'
import { PiecePrefixes, Pieces } from '../types'
import {
  doPenModeCounterRotation,
  doPenModeRotation,
} from './getPossibleRotationsForPenMode'
import useTemporalStore from '../hooks/useTemporalStore'
import type { Group, Object3DEventMap } from 'three'
import type { CameraControls } from '@react-three/drei'
import {
  getBoardHexesRectangularMapDimensions,
  getBoardPiecesMaxLevel,
} from '../utils/map-utils'
import type { RefObject } from 'react'
import { zoomToMap } from '../utils/camera-utils'

export const useApplyHotkeys = ({
  cameraControlsRef,
  mapGroupRef,
  hotkeyConfig,
}: {
  cameraControlsRef: RefObject<CameraControls>
  mapGroupRef: RefObject<Group<Object3DEventMap>>
  hotkeyConfig: { [key: string]: string | undefined }
}) => {
  const penMode = useBoundStore((s) => s.penMode)
  // const lastPenMode = useBoundStore((s) => s.lastPenMode)
  const togglePenMode = useBoundStore((state) => state.togglePenMode)
  const toggleLastPenMode = useBoundStore((state) => state.toggleLastPenMode)
  const flatPieceSizes = useBoundStore((s) => s.flatPieceSizes)
  const togglePieceSize = useBoundStore((s) => s.togglePieceSize)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const penModeRotation = useBoundStore((s) => s.penModeRotation)
  const togglePenModeRotation = useBoundStore((s) => s.togglePenModeRotation)
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  const toggleIsOrthoCam = useBoundStore((s) => s.toggleIsOrthoCam)
  const isCameraDisabled = useBoundStore((s) => s.isCameraDisabled)
  const toggleIsCameraDisabled = useBoundStore((s) => s.toggleIsCameraDisabled)
  const unpaintTile = useBoundStore((s) => s.unpaintTile)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const { width, length } = getBoardHexesRectangularMapDimensions(boardHexes)
  const maxLevel = getBoardPiecesMaxLevel(boardPieces)
  const isSizes = flatPieceSizes?.length > 0
  const { undo, redo } = useTemporalStore((state: AppState) => state)

  const deleteSelectedPiece = () => {
    if (selectedPieceID) {
      unpaintTile(selectedPieceID)
      toggleSelectedPieceID('')
    }
  }
  const handleToggleIsOrthoCam = () => {
    toggleIsOrthoCam(!isOrthoCam)
  }
  const handleToggleIsCameraDisabled = () => {
    toggleIsCameraDisabled(!isCameraDisabled)
  }
  const useZoomToMap = () => {
    if (mapGroupRef.current) {
      zoomToMap(mapGroupRef, cameraControlsRef, width, length)
    }
  }

  const incrementViewingLevel = () =>
    toggleViewingLevel(Math.min(viewingLevel + 1, maxLevel))
  const decrementViewingLevel = () =>
    toggleViewingLevel(Math.max(viewingLevel - 1, 0))
  const togglePieceSize1 = () => {
    if (isSizes) {
      togglePieceSize(flatPieceSizes[0])
    }
  }
  const togglePieceSize2 = () => {
    if (isSizes) {
      togglePieceSize(flatPieceSizes?.[1] ?? flatPieceSizes[0])
    }
  }
  const togglePieceSize3 = () => {
    if (isSizes) {
      togglePieceSize(
        flatPieceSizes?.[2] ?? flatPieceSizes?.[1] ?? flatPieceSizes?.[0],
      )
    }
  }
  const togglePieceSize4 = () => {
    if (isSizes) {
      togglePieceSize(
        flatPieceSizes?.[3] ??
        flatPieceSizes?.[2] ??
        flatPieceSizes?.[1] ??
        flatPieceSizes[0],
      )
    }
  }
  const togglePieceSize5 = () => {
    if (isSizes) {
      togglePieceSize(
        flatPieceSizes?.[4] ??
        flatPieceSizes?.[3] ??
        flatPieceSizes?.[2] ??
        flatPieceSizes?.[1] ??
        flatPieceSizes[0],
      )
    }
  }
  const undoWorld = undo
  const redoWorld = redo
  const cycleNextPieceRotation = () => {
    doPenModeRotation(penMode, penModeRotation, togglePenModeRotation)
  }
  const cyclePrevPieceRotation = () => {
    doPenModeCounterRotation(penMode, penModeRotation, togglePenModeRotation)
  }
  // Instead of one for select, and one for last, maybe combine them and cycle? Could also track
  // a history of pen modes, and cycle backwards.
  const togglePenModeSelect = () => togglePenMode('select')
  const togglePenModeLast = () => {
    toggleLastPenMode()
  }
  const togglePenModeGrass = () => togglePenMode(PiecePrefixes.grass)
  const togglePenModeRock = () => togglePenMode(PiecePrefixes.rock)
  const togglePenModeSand = () => togglePenMode(PiecePrefixes.sand)
  const togglePenModeRoad = () => togglePenMode(PiecePrefixes.road)
  const togglePenModeWallWalk = () => togglePenMode(PiecePrefixes.wallWalk)
  const togglePenModeSnow = () => togglePenMode(PiecePrefixes.snow)
  const togglePenModeLavaField = () => togglePenMode(PiecePrefixes.lavaField)
  const togglePenModeSwamp = () => togglePenMode(PiecePrefixes.swamp)
  const togglePenModeAsphalt = () => togglePenMode(PiecePrefixes.asphalt)
  const togglePenModeConcrete = () => togglePenMode(PiecePrefixes.concrete)
  const togglePenModeDungeon = () => togglePenMode(PiecePrefixes.dungeon)
  const togglePenModeToxic = () => togglePenMode(PiecePrefixes.toxic)
  const togglePenModeWellspringWater = () =>
    togglePenMode(PiecePrefixes.wellspringWater)
  const togglePenModeToxicWater = () =>
    togglePenMode(PiecePrefixes.toxicWater)
  const togglePenModeWater = () => togglePenMode(PiecePrefixes.water)
  const togglePenModeLava = () => togglePenMode(PiecePrefixes.lava)
  const togglePenModeIce = () => togglePenMode(PiecePrefixes.ice)
  const togglePenModeSwampWater = () => togglePenMode(PiecePrefixes.swampWater)
  const togglePenModeShadow = () => togglePenMode(PiecePrefixes.shadow)
  const togglePenModePowerGlyph = () => togglePenMode(Pieces.glyphPower)
  const togglePenModeTreasureGlyph = () => togglePenMode(Pieces.glyphTreasure)

  const actionMap: { [key: string]: () => void } = {
    deleteSelectedPiece: deleteSelectedPiece,

    incrementViewingLevel: incrementViewingLevel,
    decrementViewingLevel: decrementViewingLevel,

    handleToggleIsOrthoCam: handleToggleIsOrthoCam,
    handleToggleIsCameraDisabled: handleToggleIsCameraDisabled,
    zoomToMap: useZoomToMap,

    togglePieceSize1: togglePieceSize1,
    togglePieceSize2: togglePieceSize2,
    togglePieceSize3: togglePieceSize3,
    togglePieceSize4: togglePieceSize4,
    togglePieceSize5: togglePieceSize5,

    cycleNextPieceRotation: cycleNextPieceRotation,
    cyclePrevPieceRotation: cyclePrevPieceRotation,

    undoWorld: undoWorld,
    redoWorld: redoWorld,

    togglePenModeSelect: togglePenModeSelect,
    togglePenModeLast: togglePenModeLast,
    togglePenModePowerGlyph: togglePenModePowerGlyph,
    togglePenModeTreasureGlyph: togglePenModeTreasureGlyph,
    togglePenModeGrass: togglePenModeGrass,
    togglePenModeRock: togglePenModeRock,
    togglePenModeSand: togglePenModeSand,
    togglePenModeRoad: togglePenModeRoad,
    togglePenModeWallWalk: togglePenModeWallWalk,
    togglePenModeSnow: togglePenModeSnow,
    togglePenModeLavaField: togglePenModeLavaField,
    togglePenModeSwamp: togglePenModeSwamp,
    togglePenModeAsphalt: togglePenModeAsphalt,
    togglePenModeConcrete: togglePenModeConcrete,
    togglePenModeDungeon: togglePenModeDungeon,
    togglePenModeToxic: togglePenModeToxic,
    togglePenModeWellspringWater: togglePenModeWellspringWater,
    togglePenModeToxicWater: togglePenModeToxicWater,
    togglePenModeWater: togglePenModeWater,
    togglePenModeLava: togglePenModeLava,
    togglePenModeIce: togglePenModeIce,
    togglePenModeSwampWater: togglePenModeSwampWater,
    togglePenModeShadow: togglePenModeShadow,
  }

  // ALL ACTION-ASSIGNED HOTKEYS ARE APPLIED HERE
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  // biome-ignore lint/complexity/noForEach: <explanation>
  Object.entries(hotkeyConfig).forEach((value: any) => {
    if (value[0] && value[1] && actionMap[value[1]]) {
      useHotkeys(value[0], () => actionMap[value[1]]?.())
    }
  })

  return null
}
