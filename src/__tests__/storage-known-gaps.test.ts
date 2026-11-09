import { describe, expect, it, vi } from 'vitest'
import { loadMapFromLocalStorage } from '../local-storage/get-local-item'
import { LS_KEYS } from '../local-storage/keys'
import { loadSettings } from '../local-storage/settings'
import { buildHotkeyConfig } from '../data/hotkeys'
import { makeTable } from './helpers/board'

describe('storage and hotkey persistence', () => {
  it('restores legacy constraint settings from the saved map', () => {
    const { boardPieces } = makeTable(3)
    const settings = {
      terrainConstraintSource: 'inventoryFile',
      customConstraintInventory: { g1: 12 },
      customConstraintInventoryFileName: 'inventory.json',
    }
    const saved = {
      state: {
        boardPieces,
        hexMap: {
          id: 'constraints',
          name: 'Constraints',
          shape: 'rectangle',
          width: 3,
          length: 3,
        },
        ...settings,
      },
    }
    vi.stubGlobal('localStorage', {
      getItem: (key: string) =>
        key === LS_KEYS.settings ? null : JSON.stringify(saved),
    })
    try {
      expect(loadMapFromLocalStorage(LS_KEYS.lastMap)).toMatchObject({
        boardPieces,
      })
      expect(loadSettings()).toMatchObject(settings)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('applies saved hotkey overrides to the default configuration', () => {
    const config = buildHotkeyConfig({
      cycleNextPieceRotation: ['shift+q'],
    })
    expect(config.q).toBeUndefined()
    expect(config['shift+q']).toBe('cycleNextPieceRotation')
  })
})
