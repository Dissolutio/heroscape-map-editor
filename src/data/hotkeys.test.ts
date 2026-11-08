import { describe, expect, it } from 'vitest'
import {
  assignActionHotkey,
  buildHotkeyConfig,
  defaultHotkeyConfig,
  exportHotkeyFile,
  getActionHotkeys,
  getDefaultActionHotkeys,
  HOTKEY_ACTIONS,
  parseHotkeyFile,
  resetActionHotkeys,
  sanitizeHotkeyOverrides,
  swapActionHotkeys,
  updateActionHotkeys,
} from './hotkeys'

describe('hotkey overrides', () => {
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
