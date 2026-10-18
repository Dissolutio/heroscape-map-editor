import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadMapFromLocalStorage } from '../local-storage/get-local-item'
import { LS_KEYS } from '../local-storage/keys'
import { loadSettings } from '../local-storage/settings'
import { makeTable } from './helpers/board'

const hotkeyStorage = vi.hoisted(() => ({
  config: { x: 'customAction' },
  read: vi.fn(),
  write: vi.fn(),
}))

vi.mock('react', () => ({
  useEffect: (effect: () => void) => effect(),
}))
vi.mock('../local-storage/useLocalStorage', () => ({
  useLocalStorage: () => {
    hotkeyStorage.read()
    return [hotkeyStorage.config, hotkeyStorage.write]
  },
}))

import { useHotkeyConfig } from '../controls/useHotkeyConfig'

describe('storage known gaps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  // Execute the hook's effects synchronously without a renderer: no hook
  // should overwrite a stored configuration just because it was mounted.
  it('KNOWN GAP: hotkey config is overwritten on mount', () => {
    useHotkeyConfig()
    expect(hotkeyStorage.read).not.toHaveBeenCalled()
    expect(hotkeyStorage.write).not.toHaveBeenCalled()
  })
})
