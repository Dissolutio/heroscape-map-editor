import { describe, expect, it } from 'vitest'
import {
  assignActionHotkey,
  buildHotkeyConfig,
  defaultHotkeyConfig,
  exportHotkeyFile,
  filterHotkeyActions,
  getActionHotkeys,
  getDefaultActionHotkeys,
  HOTKEY_ACTIONS,
  PEN_MODE_ACTION_TARGETS,
  parseHotkeyFile,
  resetActionHotkeys,
  sanitizeHotkeyOverrides,
  swapActionHotkeys,
  updateActionHotkeys,
} from './hotkeys'
import { getPieceIDForPenMode } from './flatPieceSizes'
import { piecesSoFar } from './pieces'
import { pieceGroups } from './pieceGroups'
import { Pieces } from '../types'

const originalDefaultBindings = {
  delete: 'deleteSelectedPiece',
  backspace: 'deleteSelectedPiece',
  insert: 'handleToggleIsOrthoCam',
  end: 'handleToggleIsCameraDisabled',
  home: 'zoomToMap',
  up: 'cameraPanUp',
  down: 'cameraPanDown',
  left: 'cameraPanLeft',
  right: 'cameraPanRight',
  'shift+up': 'cameraRotateUp',
  'shift+down': 'cameraRotateDown',
  'shift+left': 'cameraRotateLeft',
  'shift+right': 'cameraRotateRight',
  'mod+left': 'cameraRotateLeftFar',
  'mod+right': 'cameraRotateRightFar',
  'mod+up': 'cameraZoomIn',
  'mod+down': 'cameraZoomOut',
  pagedown: 'decrementViewingLevel',
  pageup: 'incrementViewingLevel',
  'mod+z': 'undoWorld',
  'mod+y': 'redoWorld',
  '1': 'togglePieceSize1',
  'shift+1': 'cyclePieceVariantBackward',
  '2': 'togglePieceSize2',
  '3': 'togglePieceSize3',
  '4': 'togglePieceSize4',
  '5': 'togglePieceSize5',
  '6': 'togglePieceSize6',
  '7': 'togglePieceSize7',
  a: 'togglePenModeAsphalt',
  b: 'togglePenModeWood',
  c: 'togglePenModeConcrete',
  d: 'togglePenModeDungeon',
  'shift+d': 'togglePenModeShadow',
  e: 'cyclePrevPieceRotation',
  g: 'togglePenModeGrass',
  i: 'togglePenModeSnow',
  'shift+i': 'togglePenModeIce',
  l: 'togglePenModeLavaField',
  'shift+l': 'togglePenModeLava',
  m: 'togglePenModeObjectiveMarker',
  'shift+m': 'togglePenModeObjectiveMarkerWhite',
  n: 'togglePenModeAncientTerrain',
  o: 'togglePenModeRoad',
  'shift+o': 'togglePenModeWallWalk',
  p: 'togglePenModeSwamp',
  'shift+p': 'togglePenModeSwampWater',
  q: 'cycleNextPieceRotation',
  r: 'togglePenModeRock',
  s: 'togglePenModeSand',
  'alt+s': 'saveSelection',
  t: 'togglePenModeToxic',
  'shift+t': 'togglePenModeToxicWater',
  w: 'togglePenModeWater',
  'shift+w': 'togglePenModeWellspringWater',
  x: 'togglePenModeLast',
  y: 'togglePenModePowerGlyph',
  'shift+y': 'togglePenModeTreasureGlyph',
  z: 'togglePenModeSelect',
  'shift+z': 'togglePenModePick',
}

describe('hotkey overrides', () => {
  it('preserves all existing default bindings', () => {
    const newKeys = new Set([
      'f',
      'shift+f',
      'j',
      'shift+j',
      'shift+r',
      'shift+v',
      'shift+x',
      'shift+g',
      'h',
      'shift+h',
      'v',
      'shift+n',
      'u',
      'shift+s',
      'shift+a',
      'shift+b',
      'shift+c',
    ])
    const existing = Object.fromEntries(
      Object.entries(defaultHotkeyConfig).filter(
        ([key, action]) => action && !newKeys.has(key),
      ),
    )
    expect(existing).toEqual(originalDefaultBindings)
  })

  it('merges overrides without changing default bindings', () => {
    const before = { ...defaultHotkeyConfig }
    const { overrides } = sanitizeHotkeyOverrides({
      cycleNextPieceRotation: ['shift+q'],
      togglePenModeRock: [],
    })
    const config = buildHotkeyConfig(overrides)

    expect(config.q).toBeUndefined()
    expect(config['shift+q']).toBe('cycleNextPieceRotation')
    expect(config.r).toBeUndefined()
    expect(config.g).toBe('togglePenModeGrass')
    expect(defaultHotkeyConfig).toEqual(before)
  })

  it('lists every default action with unique keys', () => {
    const defaults = getDefaultActionHotkeys()
    expect(Object.keys(defaults).sort()).toEqual(
      HOTKEY_ACTIONS.map(({ id }) => id).sort(),
    )
    const keys = Object.values(defaults).flat()
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('filters hotkeys by text and exact assigned key tokens', () => {
    const keyOnlyActions = HOTKEY_ACTIONS.filter(({ id }) =>
      ['zoomToMap', 'undoWorld'].includes(id),
    )
    const bindings = getActionHotkeys({})
    bindings.zoomToMap = ['l']
    bindings.undoWorld = ['shift+l']

    expect(
      filterHotkeyActions(keyOnlyActions, bindings, ' L ').map(({ id }) => id),
    ).toEqual(['zoomToMap'])
    expect(
      filterHotkeyActions(keyOnlyActions, bindings, 'SHIFT+L').map(
        ({ id }) => id,
      ),
    ).toEqual(['undoWorld'])

    const lavaAction = HOTKEY_ACTIONS.filter(
      ({ id }) => id === 'togglePenModeLavaField',
    )
    expect(
      filterHotkeyActions(lavaAction, bindings, 'LAVA').map(({ id }) => id),
    ).toEqual(['togglePenModeLavaField'])
    expect(filterHotkeyActions(keyOnlyActions, bindings, 'missing')).toEqual(
      [],
    )
    expect(filterHotkeyActions(keyOnlyActions, bindings, '')).toEqual(
      keyOnlyActions,
    )
  })

  it('binds the requested obstacle and castle pen modes', () => {
    expect({
      f: defaultHotkeyConfig.f,
      'shift+f': defaultHotkeyConfig['shift+f'],
      j: defaultHotkeyConfig.j,
      'shift+j': defaultHotkeyConfig['shift+j'],
      'shift+r': defaultHotkeyConfig['shift+r'],
      'shift+v': defaultHotkeyConfig['shift+v'],
      'shift+x': defaultHotkeyConfig['shift+x'],
      'shift+g': defaultHotkeyConfig['shift+g'],
      h: defaultHotkeyConfig.h,
      'shift+h': defaultHotkeyConfig['shift+h'],
      v: defaultHotkeyConfig.v,
      'shift+n': defaultHotkeyConfig['shift+n'],
      u: defaultHotkeyConfig.u,
      'shift+s': defaultHotkeyConfig['shift+s'],
      'shift+a': defaultHotkeyConfig['shift+a'],
      'shift+b': defaultHotkeyConfig['shift+b'],
      'shift+c': defaultHotkeyConfig['shift+c'],
    }).toEqual({
      f: 'togglePenModeEvergreenTree',
      'shift+f': 'togglePenModeSnowTree',
      j: 'togglePenModeLaurJungleTree',
      'shift+j': 'togglePenModeTicallaPalm',
      'shift+r': 'togglePenModeRockOutcrop',
      'shift+v': 'togglePenModeLavaRockOutcrop',
      'shift+x': 'togglePenModeToxicOutcrop',
      'shift+g': 'togglePenModeGlacier',
      h: 'togglePenModeMarroHive',
      'shift+h': 'togglePenModeShroudshroom',
      v: 'togglePenModeMarvelRuin',
      'shift+n': 'togglePenModeRuins',
      u: 'togglePenModeLaurWall',
      'shift+s': 'togglePenModeShip',
      'shift+a': 'togglePenModeLadder',
      'shift+b': 'togglePenModeBattlement',
      'shift+c': 'togglePenModeCastleWall',
    })
    expect(defaultHotkeyConfig).toMatchObject({
      k: undefined,
      'shift+k': undefined,
      'shift+u': undefined,
      'shift+e': undefined,
      'shift+q': undefined,
    })

    expect(PEN_MODE_ACTION_TARGETS).toMatchObject({
      togglePenModeEvergreenTree: Pieces.tree10,
      togglePenModeSnowTree: Pieces.snowTree10,
      togglePenModeTicallaPalm: Pieces.palm14,
      togglePenModeLaurJungleTree: Pieces.laurPalm13,
      togglePenModeRockOutcrop: Pieces.outcrop1,
      togglePenModeLavaRockOutcrop: Pieces.lavaRockOutcrop1,
      togglePenModeToxicOutcrop: Pieces.toxicOutcrop1,
      togglePenModeGlacier: Pieces.glacier1,
      togglePenModeMarroHive: Pieces.hive,
      togglePenModeShroudshroom: Pieces.shroudshroom7,
      togglePenModeMarvelRuin: Pieces.marvel,
      togglePenModeRuins: Pieces.ruins2,
      togglePenModeLaurWall: Pieces.laurWallSquarePillar,
      togglePenModeShip: Pieces.shipWall,
      togglePenModeLadder: Pieces.ladder,
      togglePenModeBattlement: Pieces.battlement,
      togglePenModeCastleWall: Pieces.castleWallStraight,
    })
  })

  it('lists every obstacle family and standalone obstacle/castle pen mode', () => {
    const targets = Object.values(PEN_MODE_ACTION_TARGETS)
    const actionIds = HOTKEY_ACTIONS.map(({ id }) => id)
    for (const action of Object.keys(PEN_MODE_ACTION_TARGETS)) {
      expect(actionIds).toContain(action)
    }
    const families = new Set(
      Object.values(piecesSoFar)
        .map((piece) => piece.pieceSizeFamily)
        .filter((family): family is string => Boolean(family)),
    )

    for (const family of families) {
      expect(
        targets.some(
          (target) => piecesSoFar[target]?.pieceSizeFamily === family,
        ),
        `missing hotkey action for ${family}`,
      ).toBe(true)
    }

    const obstacleAndCastlePieces = pieceGroups
      .filter((group) =>
        ['Obstacles & Jungle', 'Castle & Walls'].includes(group.label),
      )
      .flatMap((group) => group.pieces)
    for (const id of obstacleAndCastlePieces) {
      const piece = piecesSoFar[id]
      const hasAction = targets.some((target) => {
        if (piece.pieceSizeFamily) {
          return piecesSoFar[target]?.pieceSizeFamily === piece.pieceSizeFamily
        }
        return (
          target === id ||
          (piece.landPrefix === target &&
            getPieceIDForPenMode(target, piece.size) === id)
        )
      })
      expect(hasAction, `missing hotkey action for ${id}`).toBe(true)
    }

    for (const action of [
      'togglePenModeGeneric',
      'togglePenModeGenericFluid',
      'togglePenModeTicallaUnderbrush',
      'togglePenModeSwampUnderbrush',
      'togglePenModeLaurUnderbrush',
      'togglePenModeFortifiedWall',
      'togglePenModeStoneWall',
      'togglePenModeCastleBaseEnd',
      'togglePenModeCastleBaseStraight',
      'togglePenModeCastleBaseCorner',
      'togglePenModeCastleArch',
      'togglePenModeCastleArchNoDoor',
    ] as const) {
      expect(HOTKEY_ACTIONS.some(({ id }) => id === action)).toBe(true)
      expect(getDefaultActionHotkeys()[action]).toEqual([])
    }
    expect(
      getPieceIDForPenMode(PEN_MODE_ACTION_TARGETS.togglePenModeGeneric, 1),
    ).toBe(Pieces.generic1)
    expect(
      getPieceIDForPenMode(
        PEN_MODE_ACTION_TARGETS.togglePenModeGenericFluid,
        1,
      ),
    ).toBe(Pieces.genericFluid1)
  })

  it('reports binding conflicts and swaps both actions', () => {
    const conflict = assignActionHotkey({}, 'togglePenModeGrass', 'r')
    expect(conflict.conflict).toBe('togglePenModeRock')

    const swapped = swapActionHotkeys(
      {},
      'togglePenModeGrass',
      'togglePenModeRock',
      'r',
    )
    const bindings = getActionHotkeys(swapped)
    expect(bindings.togglePenModeGrass).toEqual(['r'])
    expect(bindings.togglePenModeRock).toEqual(['g'])
    expect(new Set(Object.values(bindings).flat()).size).toBe(
      Object.values(bindings).flat().length,
    )
  })

  it('clears, resets one action, and resets all actions', () => {
    const changed = assignActionHotkey(
      {},
      'cycleNextPieceRotation',
      'shift+q',
    ).overrides
    const cleared = updateActionHotkeys(changed, 'deleteSelectedPiece', [])
    expect(getActionHotkeys(cleared).deleteSelectedPiece).toEqual([])

    const resetOne = resetActionHotkeys(
      cleared,
      'cycleNextPieceRotation',
    ).overrides
    expect(getActionHotkeys(resetOne).cycleNextPieceRotation).toEqual(['q'])
    expect(getActionHotkeys({}).deleteSelectedPiece).toEqual([
      'delete',
      'backspace',
    ])
  })

  it('swaps an existing binding when resetting into a conflict', () => {
    const swapped = swapActionHotkeys(
      {},
      'togglePenModeGrass',
      'cycleNextPieceRotation',
      'q',
    )
    expect(
      resetActionHotkeys(swapped, 'cycleNextPieceRotation').conflicts,
    ).toEqual([{ action: 'togglePenModeGrass', key: 'q' }])

    const reset = resetActionHotkeys(
      swapped,
      'cycleNextPieceRotation',
      true,
    ).overrides
    expect(getActionHotkeys(reset).cycleNextPieceRotation).toEqual(['q'])
    expect(getActionHotkeys(reset).togglePenModeGrass).toEqual(['g'])
  })

  it('exports only versioned overrides', () => {
    const overrides = assignActionHotkey(
      {},
      'cycleNextPieceRotation',
      'shift+q',
    ).overrides
    expect(exportHotkeyFile(overrides)).toEqual({
      version: 1,
      overrides: { cycleNextPieceRotation: ['shift+q'] },
    })
  })

  it('imports valid and partly invalid files while reporting skipped values', () => {
    const result = parseHotkeyFile(
      JSON.stringify({
        version: 1,
        overrides: {
          cycleNextPieceRotation: ['shift+q'],
          unknownAction: ['x'],
          togglePenModeRock: ['not a key'],
        },
      }),
    )
    expect(result.overrides).toEqual({
      cycleNextPieceRotation: ['shift+q'],
    })
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'Unknown action: unknownAction',
        'Malformed key for togglePenModeRock',
      ]),
    )
  })

  it('skips imported bindings that conflict with an unchanged default', () => {
    const result = parseHotkeyFile(
      JSON.stringify({
        version: 1,
        overrides: { togglePenModeRock: ['q'] },
      }),
    )
    expect(result.overrides).toEqual({})
    expect(result.issues).toContain(
      'Key q is already assigned to cycleNextPieceRotation',
    )
  })

  it('preserves legacy overrides that use newly assigned default keys', () => {
    const newBindings = [
      ['f', 'togglePenModeEvergreenTree'],
      ['shift+f', 'togglePenModeSnowTree'],
      ['j', 'togglePenModeLaurJungleTree'],
      ['shift+j', 'togglePenModeTicallaPalm'],
      ['shift+r', 'togglePenModeRockOutcrop'],
      ['shift+v', 'togglePenModeLavaRockOutcrop'],
      ['shift+x', 'togglePenModeToxicOutcrop'],
      ['shift+g', 'togglePenModeGlacier'],
      ['h', 'togglePenModeMarroHive'],
      ['shift+h', 'togglePenModeShroudshroom'],
      ['v', 'togglePenModeMarvelRuin'],
      ['shift+n', 'togglePenModeRuins'],
      ['u', 'togglePenModeLaurWall'],
      ['shift+s', 'togglePenModeShip'],
      ['shift+a', 'togglePenModeLadder'],
      ['shift+b', 'togglePenModeBattlement'],
      ['shift+c', 'togglePenModeCastleWall'],
    ] as const

    for (const [key, defaultAction] of newBindings) {
      const result = sanitizeHotkeyOverrides({
        togglePenModeRock: [key],
      })
      const bindings = getActionHotkeys(result.overrides)

      expect(result.issues).toEqual([])
      expect(bindings.togglePenModeRock).toEqual([key])
      expect(bindings[defaultAction]).toEqual([])
      expect(buildHotkeyConfig(result.overrides)[key]).toBe('togglePenModeRock')
    }
  })

  it('rejects garbage files without applying overrides', () => {
    expect(parseHotkeyFile('{')).toEqual({
      overrides: null,
      issues: ['Invalid JSON hotkey file'],
    })
    expect(
      parseHotkeyFile(JSON.stringify({ version: 2, overrides: {} })).overrides,
    ).toBeNull()
  })
})
