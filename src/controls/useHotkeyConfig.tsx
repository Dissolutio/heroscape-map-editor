import { LS_KEYS } from '../local-storage/keys'
import { useLocalStorage } from '../local-storage/useLocalStorage'
import { useEffect } from 'react'

export const useHotkeyConfig = () => {
  const [hotkeyConfig, setHotkeyConfig] = useLocalStorage(
    LS_KEYS.hotkeyConfig,
    defaultHotkeyConfig,
  )
  const hotkeyLookup = Object.fromEntries(
    Object.entries(hotkeyConfig).map(([key, value]) => [value, key]),
  )

  // FOR DEVELOPMENT, when updating default hotkey config, activate this effect to update in app
  // biome-ignore lint/correctness/useExhaustiveDependencies: <on-mount>
  useEffect(() => {
    setHotkeyConfig(defaultHotkeyConfig)
  }, [])

  return { hotkeyConfig, setHotkeyConfig, hotkeyLookup }
}

export const defaultHotkeyConfig = {
  delete: 'deleteSelectedPiece',

  // CAMERA
  insert: 'handleToggleIsOrthoCam',
  end: 'handleToggleIsCameraDisabled',
  home: 'zoomToMap',

  pagedown: 'decrementViewingLevel',
  pageup: 'incrementViewingLevel',

  // 2 control buttons
  'mod+z': 'undoWorld',
  'mod+y': 'redoWorld',

  // 10 numbers, 26 letters, shift+, alt+
  '1': 'togglePieceSize1',
  'shift+1': undefined,
  'alt+1': undefined,
  '2': 'togglePieceSize2',
  'shift+2': undefined,
  'alt+2': undefined,
  '3': 'togglePieceSize3',
  'shift+3': undefined,
  'alt+3': undefined,
  '4': 'togglePieceSize4',
  'shift+4': undefined,
  'alt+4': undefined,
  '5': 'togglePieceSize5',
  'shift+5': undefined,
  'alt+5': undefined,
  '6': 'togglePieceSize6',
  'shift+6': undefined,
  'alt+6': undefined,
  '7': undefined,
  'shift+7': undefined,
  'alt+7': undefined,
  '8': undefined,
  'shift+8': undefined,
  'alt+8': undefined,
  '9': undefined,
  'shift+9': undefined,
  'alt+9': undefined,
  '0': undefined,
  'shift+0': undefined,
  'alt+0': undefined,

  a: 'togglePenModeAsphalt',
  'shift+a': undefined,
  'alt+a': undefined,
  b: 'togglePenModeWood',
  'shift+b': undefined,
  'alt+b': undefined,
  c: 'togglePenModeConcrete',
  'shift+c': undefined,
  'alt+c': undefined,
  d: 'togglePenModeDungeon',
  'shift+d': 'togglePenModeShadow',
  'alt+d': undefined,
  e: 'cyclePrevPieceRotation',
  'shift+e': undefined,
  'alt+e': undefined,
  f: undefined,
  'shift+f': undefined,
  'alt+f': undefined,
  g: 'togglePenModeGrass',
  'shift+g': undefined,
  'alt+g': undefined,
  h: undefined,
  'shift+h': undefined,
  'alt+h': undefined,
  i: 'togglePenModeSnow',
  'shift+i': 'togglePenModeIce',
  'alt+i': undefined,
  j: undefined,
  'shift+j': undefined,
  'alt+j': undefined,
  k: undefined,
  'shift+k': undefined,
  'alt+k': undefined,
  l: 'togglePenModeLavaField',
  'shift+l': 'togglePenModeLava',
  'alt+l': undefined,
  m: undefined,
  'shift+m': undefined,
  'alt+m': undefined,
  n: 'togglePenModeAncientTerrain',
  'shift+n': undefined,
  'alt+n': undefined,
  o: 'togglePenModeRoad',
  'shift+o': 'togglePenModeWallWalk',
  'alt+o': undefined,
  p: 'togglePenModeSwamp',
  'shift+p': 'togglePenModeSwampWater',
  'alt+p': undefined,
  q: 'cycleNextPieceRotation',
  'shift+q': undefined,
  'alt+q': undefined,
  r: 'togglePenModeRock',
  'shift+r': undefined,
  'alt+r': undefined,
  s: 'togglePenModeSand',
  'shift+s': undefined,
  'alt+s': undefined,
  t: 'togglePenModeToxic',
  'shift+t': 'togglePenModeToxicWater',
  'alt+t': undefined,
  u: undefined,
  'shift+u': undefined,
  'alt+u': undefined,
  v: undefined,
  'shift+v': undefined,
  'alt+v': undefined,
  w: 'togglePenModeWater',
  'shift+w': 'togglePenModeWellspringWater',
  'alt+w': undefined,
  x: 'togglePenModeLast',
  'shift+x': undefined,
  'alt+x': undefined,
  y: 'togglePenModePowerGlyph',
  'shift+y': 'togglePenModeTreasureGlyph',
  'alt+y': undefined,
  z: 'togglePenModeSelect',
  'shift+z': 'togglePenModePick',
  'alt+z': undefined,
}
