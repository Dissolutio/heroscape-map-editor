import { createStore } from 'zustand/vanilla'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { blankPieceInventory } from '../inventory/blankInventory'
import { terrainSetsByShortID } from '../data/terrainSets'
import {
  DEFAULT_LOOK_SETTINGS,
  clampLookRoughness,
  getAmbientIntensity,
  LOOK_SETTINGS_VERSION,
  sanitizeLookSettings,
} from '../data/lookSettings'
import { LS_KEYS } from '../local-storage/keys'
import {
  createSettingsWriter,
  loadSettings,
  migrateSettings,
  pickSettings,
  resetSettings,
  resetGenericTerrainColorSettings,
  serializeSettings,
  SETTINGS_DEFAULTS,
  SETTINGS_KEYS,
  settingsChanged,
  type SettingsValues,
} from '../local-storage/settings'
import type { AppState } from '../store/store'
import { safeGetJSON } from '../local-storage/safeStorage'
import {
  getAvailableLandPrefixesForInventory,
  getAvailableLandPrefixesForSets,
} from '../utils/terrain-constraints'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const values = new Map<string, string>()
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value)
  },
  removeItem: (key: string) => {
    values.delete(key)
  },
}

describe('settings persistence', () => {
  beforeEach(() => {
    values.clear()
    vi.stubGlobal('localStorage', storage)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('uses defaults when no settings are stored', () => {
    expect(loadSettings()).toEqual(SETTINGS_DEFAULTS)
    expect(SETTINGS_DEFAULTS).toMatchObject({
      genericSolidCapColor: '#e63cc8',
      genericSolidSideColor: '#a01e8c',
      genericFluidCapColor: '#ff96e6',
      genericFluidSideColor: '#c864b4',
    })
    expect(LOOK_SETTINGS_VERSION).toBe(1)
    expect(DEFAULT_LOOK_SETTINGS).toEqual({
      toneMapping: 'aces',
      exposure: 1,
      ambientIntensity: 0.5,
      hemisphereIntensity: 0.5,
      pointLightIntensity: 200,
      lightColor: '#ffffff',
      shine: 1,
      backgroundColor: '#ffffff',
      tableColor: '#ffffff',
    })
    expect(getAmbientIntensity(DEFAULT_LOOK_SETTINGS, true)).toBe(0.5)
    expect(getAmbientIntensity(DEFAULT_LOOK_SETTINGS, false)).toBe(2)
  })

  it('round-trips changed values and writes only differences', () => {
    const changed = {
      ...SETTINGS_DEFAULTS,
      graphicsTier: 'high' as const,
      isOrthoCam: false,
      useHighQualityForPicture: true,
      isShowPdfBuriedMarks: true,
      isShow2DExportBuriedMarks: true,
      isTransparentGlyphSpaces: true,
      isHideHeightsOnGlyphs: true,
      lightPositions: { key: [1, 2, 3] as [number, number, number] },
      genericSolidCapColor: '#123456',
      genericSolidSideColor: '#234567',
      genericFluidCapColor: '#345678',
      genericFluidSideColor: '#456789',
      rememberedMapAuthor: 'Map Builder',
      lookSettings: {
        ...DEFAULT_LOOK_SETTINGS,
        toneMapping: 'agx' as const,
        exposure: 2.2,
        shine: 1.4,
      },
    }
    const serialized = serializeSettings(changed)
    expect(serialized).toEqual({
      v: 1,
      values: {
        isOrthoCam: false,
        useHighQualityForPicture: true,
        graphicsTier: 'high' as const,
        isShowPdfBuriedMarks: true,
        isShow2DExportBuriedMarks: true,
        isTransparentGlyphSpaces: true,
        isHideHeightsOnGlyphs: true,
        lightPositions: { key: [1, 2, 3] },
        genericSolidCapColor: '#123456',
        genericSolidSideColor: '#234567',
        genericFluidCapColor: '#345678',
        genericFluidSideColor: '#456789',
        rememberedMapAuthor: 'Map Builder',
        lookSettings: changed.lookSettings,
      },
    })
    storage.setItem(LS_KEYS.settings, JSON.stringify(serialized))
    expect(loadSettings()).toEqual(changed)
  })

  it('ignores a stale start-zone visibility setting without rewriting it', () => {
    const staleSettings = JSON.stringify({
      v: 1,
      values: { isShowStartZones: false },
    })
    storage.setItem(LS_KEYS.settings, staleSettings)

    expect(loadSettings()).toEqual(SETTINGS_DEFAULTS)
    expect(values.get(LS_KEYS.settings)).toBe(staleSettings)
  })

  it('sanitizes look settings by defaulting invalid values and clamping numbers', () => {
    expect(
      sanitizeLookSettings({
        toneMapping: 'unknown',
        exposure: 10,
        ambientIntensity: -1,
        hemisphereIntensity: 1.25,
        pointLightIntensity: Number.NaN,
        lightColor: 'red',
        shine: 0.1,
        backgroundColor: '#abc',
        tableColor: '#123456',
        ignored: 'value',
      }),
    ).toEqual({
      ...DEFAULT_LOOK_SETTINGS,
      exposure: 3,
      ambientIntensity: 0,
      hemisphereIntensity: 1.25,
      shine: 0.5,
      tableColor: '#123456',
    })
  })

  it('clamps the final roughness after applying the shine multiplier', () => {
    expect(clampLookRoughness(0.1, 0.5)).toBe(0.05)
    expect(clampLookRoughness(0.02, 0.5)).toBe(0.04)
    expect(clampLookRoughness(0.8, 2)).toBe(1)
  })

  it('returns null when all settings equal their defaults', () => {
    expect(serializeSettings(SETTINGS_DEFAULTS)).toBeNull()
  })

  it('resets only the Generic colors without changing other settings', () => {
    const changed = {
      ...SETTINGS_DEFAULTS,
      isOrthoCam: false,
      graphicsTier: 'high' as const,
      genericSolidCapColor: '#123456',
      genericSolidSideColor: '#234567',
      genericFluidCapColor: '#345678',
      genericFluidSideColor: '#456789',
    }

    expect(resetGenericTerrainColorSettings(changed)).toMatchObject({
      isOrthoCam: false,
      graphicsTier: 'high',
      genericSolidCapColor: SETTINGS_DEFAULTS.genericSolidCapColor,
      genericSolidSideColor: SETTINGS_DEFAULTS.genericSolidSideColor,
      genericFluidCapColor: SETTINGS_DEFAULTS.genericFluidCapColor,
      genericFluidSideColor: SETTINGS_DEFAULTS.genericFluidSideColor,
    })
  })

  it('removes the settings key on reset', () => {
    storage.setItem(LS_KEYS.settings, JSON.stringify({ v: 1, values: {} }))
    expect(resetSettings()).toBe(true)
    expect(values.has(LS_KEYS.settings)).toBe(false)
    expect(loadSettings()).toEqual(SETTINGS_DEFAULTS)
  })

  it('validates each key independently and ignores unknown keys', () => {
    storage.setItem(
      LS_KEYS.settings,
      JSON.stringify({
        v: 1,
        values: {
          isOrthoCam: false,
          graphicsTier: 'fast',
          isShowPdfBuriedMarks: 'yes',
          isShow2DExportBuriedMarks: 1,
          isTransparentGlyphSpaces: 'yes',
          isHideHeightsOnGlyphs: 1,
          pdfRenderFormat: 'invalid',
          terrainConstraintSource: 'invalid',
          lastPenMode: 5,
          lastPenSize: Number.POSITIVE_INFINITY,
          lightPositions: { bad: [1, Number.NaN, 3] },
          genericSolidCapColor: 'pink',
          rememberedMapAuthor: 42,
          customConstraintInventory: {
            g1: 1.9,
            g2: -4,
            unknown: 20,
          },
          customConstraintInventoryFileName: 'valid.csv',
          unknownSetting: true,
        },
      }),
    )

    expect(loadSettings()).toMatchObject({
      isOrthoCam: false,
      isTransparentGlyphSpaces: SETTINGS_DEFAULTS.isTransparentGlyphSpaces,
      isHideHeightsOnGlyphs: SETTINGS_DEFAULTS.isHideHeightsOnGlyphs,
      pdfRenderFormat: SETTINGS_DEFAULTS.pdfRenderFormat,
      terrainConstraintSource: SETTINGS_DEFAULTS.terrainConstraintSource,
      lastPenMode: SETTINGS_DEFAULTS.lastPenMode,
      lastPenSize: SETTINGS_DEFAULTS.lastPenSize,
      lightPositions: {},
      genericSolidCapColor: SETTINGS_DEFAULTS.genericSolidCapColor,
      rememberedMapAuthor: SETTINGS_DEFAULTS.rememberedMapAuthor,
      customConstraintInventory: {
        ...blankPieceInventory,
        g1: 1,
        g2: 0,
      },
      customConstraintInventoryFileName: 'valid.csv',
    })
  })

  it('normalizes a saved custom constraint inventory', () => {
    storage.setItem(
      LS_KEYS.settings,
      JSON.stringify({
        v: 1,
        values: { customConstraintInventory: { r3: 2.5 } },
      }),
    )
    expect(loadSettings().customConstraintInventory).toEqual({
      ...blankPieceInventory,
      r3: 2,
    })
  })

  it('uses defaults for corrupted JSON and an unsupported version', () => {
    storage.setItem(LS_KEYS.settings, '{')
    expect(loadSettings()).toEqual(SETTINGS_DEFAULTS)

    storage.setItem(LS_KEYS.settings, JSON.stringify({ v: 2, values: {} }))
    expect(loadSettings()).toEqual(SETTINGS_DEFAULTS)
  })

  it('keeps the v1 migration as an identity function', () => {
    const blob = { v: 1, values: { isOrthoCam: false } }
    expect(migrateSettings(blob)).toBe(blob)
  })

  it.each([false, true])(
    'migrates constraint values from an old map (wrapped=%s)',
    (wrapped) => {
      const legacy = {
        terrainConstraintSource: 'inventoryFile',
        customConstraintInventory: { g1: 2.4, unknown: 4 },
        customConstraintInventoryFileName: 'inventory.csv',
      }
      const savedMap = {
        boardPieces: [],
        hexMap: {},
        ...legacy,
      }
      storage.setItem(
        LS_KEYS.lastMap,
        JSON.stringify(wrapped ? { state: savedMap } : savedMap),
      )

      expect(loadSettings()).toMatchObject({
        ...legacy,
        customConstraintInventory: {
          ...blankPieceInventory,
          g1: 2,
        },
      })
      expect(safeGetJSON(LS_KEYS.settings)).toMatchObject({
        v: 1,
        values: {
          terrainConstraintSource: 'inventoryFile',
          customConstraintInventory: { g1: 2 },
          customConstraintInventoryFileName: 'inventory.csv',
        },
      })
    },
  )

  it('debounces settings changes, ignores unrelated state, and flushes now', () => {
    vi.useFakeTimers()
    const writes: (string | null)[] = []
    const writer = createSettingsWriter(
      {
        setItem: (_key, value) => {
          writes.push(value)
          return true
        },
        removeItem: () => {
          writes.push(null)
          return true
        },
      },
      300,
    )
    const initial = { ...SETTINGS_DEFAULTS }
    const unrelated = {
      ...initial,
      hoveredPieceID: 'hovered',
      currentDialog: 'dialog',
      selectedPieceIDs: ['piece'],
    }
    if (settingsChanged(initial, unrelated)) {
      writer.schedule(pickSettings(unrelated))
    }
    vi.advanceTimersByTime(500)
    expect(writes).toEqual([])

    const firstChange = { ...initial, isOrthoCam: false }
    if (settingsChanged(initial, firstChange)) {
      writer.schedule(firstChange)
    }
    vi.advanceTimersByTime(299)
    expect(writes).toEqual([])
    vi.advanceTimersByTime(1)
    expect(writes).toHaveLength(1)

    const nextChange = { ...firstChange, isPdfColorBorders: true }
    const finalChange = { ...nextChange, isPdfColorBorders: false }
    writer.schedule(nextChange)
    vi.advanceTimersByTime(100)
    writer.schedule(finalChange)
    vi.advanceTimersByTime(299)
    expect(writes).toHaveLength(1)
    writer.flush()
    expect(writes).toHaveLength(2)
    expect(JSON.parse(writes[1] ?? '')).toEqual({
      v: 1,
      values: { isOrthoCam: false },
    })
  })

  it('classifies every store data key exactly once', async () => {
    const transientKeys = [
      'selectedPieceIDs',
      'selectedObjectiveMarkerUID',
      'objectiveMarkerDraft',
      'objectiveMarkerDragPreview',
      'rotationPivot',
      'hoveredPieceID',
      'hoveredHex',
      'hoveredWorldPoint',
      'piecePreviews',
      'isDraggingPiece',
      'dragPreview',
      'pendingUndoSelectionRestoreStack',
      'pendingRedoSelectionRestoreStack',
      'currentDialog',
      'cropDialogReturnToEditMap',
      'isTakingPicture',
      'isCameraDisabled',
      'isShowStartZones',
      'is2DOpen',
      'isPdfOpen',
      'viewingLevel',
      'penMode',
      'pieceSize',
      'penModeRotation',
      'flatPieceSizes',
      'userPieceInventory',
      'isFrameloopDemand',
      'isAutosaveHeld',
      'mapLoadRevision',
      'unsupportedPieceUIDs',
      'effectiveGraphicsTier',
      'textureLoadStatus',
      'textureLoadProgress',
      'isLookSettingsDialogOpen',
    ]
    const mapStateKeys = [
      'boardHexes',
      'hexMap',
      'boardPieces',
      'conflictedPieceUIDs',
      'mapPortraitBase64',
      'mapNotes',
    ]

    vi.resetModules()
    const [{ default: createMapSlice }, { default: createUISlice }] =
      await Promise.all([
        import('../store/map-slice'),
        import('../store/ui-slice'),
      ])
    const store = createStore<AppState>()((...args) => ({
      ...createMapSlice(...args),
      ...createUISlice(...args),
    }))
    const dataKeys = Object.entries(store.getState())
      .filter(([, value]) => typeof value !== 'function')
      .map(([key]) => key)
    for (const key of dataKeys) {
      const classifications = [
        SETTINGS_KEYS.includes(key as keyof SettingsValues),
        transientKeys.includes(key),
        mapStateKeys.includes(key),
      ].filter(Boolean)
      expect(classifications, `${key} classification`).toHaveLength(1)
    }
  })

  it('flushes a pending settings write on pagehide', async () => {
    vi.useFakeTimers()
    const handlers = new Map<string, (event?: Event) => void>()
    const eventTarget = {
      addEventListener: (type: string, listener: (event?: Event) => void) => {
        handlers.set(type, listener)
      },
    }
    vi.stubGlobal('window', eventTarget)
    vi.stubGlobal('document', {
      ...eventTarget,
      visibilityState: 'visible',
    })

    vi.resetModules()
    const { default: store } = await import('../store/store')
    store.getState().toggleIsOrthoCam(false)
    vi.advanceTimersByTime(299)
    expect(values.has(LS_KEYS.settings)).toBe(false)

    handlers.get('pagehide')?.()
    expect(safeGetJSON(LS_KEYS.settings)).toEqual({
      v: 1,
      values: { isOrthoCam: false },
    })
  })

  it.each(['setsUsed', 'personalInventory', 'inventoryFile'] as const)(
    'reconciles an unavailable remembered pen for %s constraints',
    async (terrainConstraintSource) => {
      vi.resetModules()
      const setID = Object.keys(terrainSetsByShortID).find(
        (id) => getAvailableLandPrefixesForSets([id]).size > 0,
      )
      if (!setID) throw new Error('Expected a terrain set with land pieces')
      const customConstraintInventory = { g1: 1 }
      storage.setItem(
        LS_KEYS.settings,
        JSON.stringify({
          v: 1,
          values: {
            terrainConstraintSource,
            customConstraintInventory,
            lastPenMode: 'unavailable',
            lastPenSize: 5,
          },
        }),
      )

      const { default: store } = await import('../store/store')
      const setsUsed = terrainConstraintSource === 'setsUsed' ? [setID] : []
      const hexMap = {
        id: 'constraints',
        name: 'Constraints',
        author: '',
        shape: 'rectangle',
        width: 3,
        length: 3,
        setsUsed,
      }
      if (terrainConstraintSource === 'personalInventory') {
        store.getState().updateUserPieceInventory({ g1: 1 })
        store.getState().syncTerrainConstraintPenMode()
      } else {
        store.getState().loadMap({
          hexMap,
          boardPieces: [],
          boardHexes: {},
        })
      }
      const available =
        terrainConstraintSource === 'setsUsed'
          ? getAvailableLandPrefixesForSets(setsUsed)
          : getAvailableLandPrefixesForInventory({ g1: 1 })
      expect(available.has(store.getState().lastPenMode)).toBe(true)
      expect(store.getState().lastPenMode).not.toBe('unavailable')
    },
  )

  it('preserves an allowed remembered pen mode and size when loading a map', async () => {
    vi.resetModules()
    storage.setItem(
      LS_KEYS.settings,
      JSON.stringify({
        v: 1,
        values: {
          terrainConstraintSource: 'inventoryFile',
          customConstraintInventory: { g1: 1 },
          lastPenMode: 'g',
          lastPenSize: 3,
        },
      }),
    )
    const { default: store } = await import('../store/store')
    store.getState().loadMap({
      hexMap: {
        id: 'constraints',
        name: 'Constraints',
        author: '',
        shape: 'rectangle',
        width: 3,
        length: 3,
      },
      boardPieces: [],
      boardHexes: {},
    })
    expect(store.getState().lastPenMode).toBe('g')
    expect(store.getState().lastPenSize).toBe(3)
  })

  it('remembers the active painting mode and size across a reload', async () => {
    vi.useFakeTimers()
    vi.resetModules()
    const { default: store } = await import('../store/store')
    store.getState().togglePenMode('r')
    store.getState().togglePieceSize(3)
    store.getState().togglePenMode('select')
    vi.advanceTimersByTime(300)

    expect(safeGetJSON(LS_KEYS.settings)).toMatchObject({
      v: 1,
      values: { lastPenMode: 'r', lastPenSize: 3 },
    })

    vi.resetModules()
    const { default: reloadedStore } = await import('../store/store')
    expect(reloadedStore.getState().penMode).toBe('select')
    expect(reloadedStore.getState().lastPenMode).toBe('r')
    expect(reloadedStore.getState().lastPenSize).toBe(3)
  })

  it('resets every settings value and removes the stored settings blob', async () => {
    vi.useFakeTimers()
    vi.resetModules()
    storage.setItem(
      LS_KEYS.settings,
      JSON.stringify({
        v: 1,
        values: {
          isOrthoCam: false,
          lightPositions: { 'front-left': [1, 2, 3] },
        },
      }),
    )
    const { default: store } = await import('../store/store')
    store.getState().updateLightPosition('back-left', [3, 4, 5])
    store.getState().resetSettings()
    expect(pickSettings(store.getState())).toEqual(SETTINGS_DEFAULTS)
    expect(values.has(LS_KEYS.settings)).toBe(false)
    vi.advanceTimersByTime(300)
    expect(values.has(LS_KEYS.settings)).toBe(false)
  })
})
