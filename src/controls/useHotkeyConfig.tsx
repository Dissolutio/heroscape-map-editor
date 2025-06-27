import useBoundStore from '../store/store'
import { LS_KEYS } from '../local-storage/keys'
import { useLocalStorage } from '../local-storage/useLocalStorage'
import { useHotkeys } from 'react-hotkeys-hook'
import { PiecePrefixes, Pieces } from '../types'
import {
  doPenModeCounterRotation,
  doPenModeRotation,
} from './getPossibleRotationsForPenMode'
import { useEffect } from 'react'
import useTemporalStore from '../hooks/useTemporalStore'
import type { Group, Object3DEventMap } from 'three'
import type { CameraControls } from '@react-three/drei'
import { getBoardPiecesMaxLevel } from '../utils/map-utils'

export const useHotkeyConfig = ({
  cameraControlsRef,
  mapGroupRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) => {
  const [hotkeyConfig, setHotkeyConfig] = useLocalStorage(
    LS_KEYS.hotkeyConfig,
    defaultHotkeyConfig,
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: <on-mount>
  useEffect(() => {
    setHotkeyConfig(defaultHotkeyConfig)
  }, [])

  const penMode = useBoundStore((s) => s.penMode)
  const togglePenMode = useBoundStore((state) => state.togglePenMode)
  const flatPieceSizes = useBoundStore((s) => s.flatPieceSizes)
  const togglePieceSize = useBoundStore((s) => s.togglePieceSize)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const penModeRotation = useBoundStore((s) => s.penModeRotation)
  const togglePenModeRotation = useBoundStore((s) => s.togglePenModeRotation)
  const toggleIsOrthoCam = useBoundStore((s) => s.toggleIsOrthoCam)
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const maxLevel = getBoardPiecesMaxLevel(boardPieces)
  const isSizes = flatPieceSizes?.length > 0
  const { undo, redo } = useTemporalStore((state: any) => state)
  const handleToggleIsOrthoCam = () => {
    toggleIsOrthoCam(!isOrthoCam)
  }
  const zoomToMap = () => {
    if (mapGroupRef.current) {
      cameraControlsRef.current?.fitToBox?.(mapGroupRef.current, true)
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
  const togglePenModeSelect = () => togglePenMode('select')
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
  const togglePenModeWellspringWater = () =>
    togglePenMode(PiecePrefixes.wellspringWater)
  const togglePenModeWater = () => togglePenMode(PiecePrefixes.water)
  const togglePenModeLava = () => togglePenMode(PiecePrefixes.lava)
  const togglePenModeIce = () => togglePenMode(PiecePrefixes.ice)
  const togglePenModeSwampWater = () => togglePenMode(PiecePrefixes.swampWater)
  const togglePenModeShadow = () => togglePenMode(PiecePrefixes.shadow)
  const togglePenModePowerGlyph = () => togglePenMode(Pieces.glyphPower)
  const togglePenModeTreasureGlyph = () => togglePenMode(Pieces.glyphTreasure)

  const actionMap: { [key: string]: () => void } = {
    incrementViewingLevel: incrementViewingLevel,
    decrementViewingLevel: decrementViewingLevel,

    handleToggleIsOrthoCam: handleToggleIsOrthoCam,
    zoomToMap: zoomToMap,

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
    togglePenModeWellspringWater: togglePenModeWellspringWater,
    togglePenModeWater: togglePenModeWater,
    togglePenModeLava: togglePenModeLava,
    togglePenModeIce: togglePenModeIce,
    togglePenModeSwampWater: togglePenModeSwampWater,
    togglePenModeShadow: togglePenModeShadow,
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  // biome-ignore lint/complexity/noForEach: <explanation>
  Object.entries(hotkeyConfig).forEach((value: any) => {
    if (value[0] && value[1] && actionMap[value[1]]) {
      useHotkeys(value[0], () => actionMap[value[1]]?.())
    }
  })

  return
}
const actions = {
  // camera
  handleToggleIsOrthoCam: 'handleToggleIsOrthoCam',
  zoomToMap: 'zoomToMap',

  incrementViewingLevel: 'incrementViewingLevel',
  decrementViewingLevel: 'decrementViewingLevel',

  // piece size
  togglePieceSize1: 'togglePieceSize1',
  togglePieceSize2: 'togglePieceSize2',
  togglePieceSize3: 'togglePieceSize3',
  togglePieceSize4: 'togglePieceSize4',
  togglePieceSize5: 'togglePieceSize5',

  // penmodes: other
  togglePenModeSelect: 'togglePenModeSelect',
  togglePenModePowerGlyph: 'togglePenModePowerGlyph',
  togglePenModeTreasureGlyph: 'togglePenModeTreasureGlyph',

  // penmodes: land
  togglePenModeGrass: 'togglePenModeGrass',
  togglePenModeRock: 'togglePenModeRock',
  togglePenModeSand: 'togglePenModeSand',
  togglePenModeRoad: 'togglePenModeRoad',
  togglePenModeWallwalk: 'togglePenModeWallwalk',
  togglePenModeSnow: 'togglePenModeSnow',
  togglePenModeLavaField: 'togglePenModeLavaField',
  togglePenModeSwamp: 'togglePenModeSwamp',
  togglePenModeAsphalt: 'togglePenModeAsphalt',
  togglePenModeConcrete: 'togglePenModeConcrete',
  togglePenModeDungeon: 'togglePenModeDungeon',
  togglePenModeWellspringWater: 'togglePenModeWellspringWater',
  togglePenModeWater: 'togglePenModeWater',
  togglePenModeLava: 'togglePenModeLava',
  togglePenModeIce: 'togglePenModeIce',
  togglePenModeSwampWater: 'togglePenModeSwampWater',
  togglePenModeShadow: 'togglePenModeShadow',
  // rotation select
  cycleNextPieceRotation: 'cycleNextPieceRotation',
  cyclePrevPieceRotation: 'cyclePrevPieceRotation',

  undoWorld: 'undoWorld',
  redoWorld: 'redoWorld',
}
export const defaultHotkeyConfig = {
  insert: actions.handleToggleIsOrthoCam,
  home: actions.zoomToMap,
  pagedown: actions.decrementViewingLevel,
  pageup: actions.incrementViewingLevel,

  '1': actions.togglePieceSize1,
  '2': actions.togglePieceSize2,
  '3': actions.togglePieceSize3,
  '4': actions.togglePieceSize4,
  '5': actions.togglePieceSize5,
  '6': undefined,
  '7': undefined,
  '8': undefined,
  '9': undefined,
  '0': undefined,
  a: actions.togglePenModeAsphalt,
  'shift+a': undefined,
  'alt+a': undefined,
  b: undefined,
  'shift+b': undefined,
  'alt+b': undefined,
  c: actions.togglePenModeConcrete,
  'shift+c': undefined,
  'alt+c': undefined,
  d: actions.togglePenModeDungeon,
  'shift+d': actions.togglePenModeShadow,
  'alt+d': undefined,
  e: actions.cyclePrevPieceRotation,
  'shift+e': undefined,
  'alt+e': undefined,
  f: undefined,
  'shift+f': undefined,
  'alt+f': undefined,
  g: actions.togglePenModeGrass,
  'shift+g': undefined,
  'alt+g': undefined,
  h: undefined,
  'shift+h': undefined,
  'alt+h': undefined,
  i: actions.togglePenModeSnow,
  'shift+i': actions.togglePenModeIce,
  'alt+i': undefined,
  j: undefined,
  'shift+j': undefined,
  'alt+j': undefined,
  k: undefined,
  'shift+k': undefined,
  'alt+k': undefined,
  l: actions.togglePenModeLavaField,
  'shift+l': actions.togglePenModeLava,
  'alt+l': undefined,
  m: undefined,
  'shift+m': undefined,
  'alt+m': undefined,
  n: undefined,
  'shift+n': undefined,
  'alt+n': undefined,
  o: actions.togglePenModeRoad,
  'shift+o': actions.togglePenModeWallwalk,
  'alt+o': undefined,
  p: actions.togglePenModeSwamp,
  'shift+p': actions.togglePenModeSwampWater,
  'alt+p': undefined,
  q: actions.cycleNextPieceRotation,
  'shift+q': undefined,
  'alt+q': undefined,
  r: actions.togglePenModeRock,
  'shift+r': undefined,
  'alt+r': undefined,
  s: actions.togglePenModeSand,
  'shift+s': undefined,
  'alt+s': undefined,
  t: undefined,
  'shift+t': undefined,
  'alt+t': undefined,
  u: undefined,
  'shift+u': undefined,
  'alt+u': undefined,
  v: undefined,
  'shift+v': undefined,
  'alt+v': undefined,
  w: actions.togglePenModeWater,
  'shift+w': actions.togglePenModeWellspringWater,
  'alt+w': undefined,
  x: undefined,
  'shift+x': undefined,
  'alt+x': undefined,
  y: actions.togglePenModePowerGlyph,
  'shift+y': actions.togglePenModeTreasureGlyph,
  'alt+y': undefined,
  'mod+y': actions.redoWorld,
  z: actions.togglePenModeSelect,
  'shift+z': undefined,
  'alt+z': undefined,
  'mod+z': actions.undoWorld,
}
