import { enqueueSnackbar } from 'notistack'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import {
  getUrlMapString,
  parseMapDataArrayFromCrushed,
} from '../data/jsonCrush'
import { OBJECTIVE_MARKER_PEN_MODE } from '../data/objectiveMarkers'
import { piecesSoFar } from '../data/pieces'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import { LS_KEYS } from '../local-storage/keys'
import {
  type BoardPiece,
  type HexMap,
  type MapState,
  PICK_PEN_MODE,
  Pieces,
  SELECT_PEN_MODE,
} from '../types'
import { makeRectangleScenario } from '../utils/map-gen'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const hexMap: HexMap = {
  id: 'store-history',
  name: 'Store history',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 12,
  length: 12,
}

const storageValues = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => storageValues.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storageValues.set(key, value)
  }),
  removeItem: vi.fn((key: string) => {
    storageValues.delete(key)
  }),
}

let store: typeof import('../store/store').default
let saveMapPortraitWithoutUndo: (portrait: string) => void
let undoWithSelectionRestore: () => void
let redoWithSelectionRestore: () => void

function loadedMap(boardPieces: BoardPiece[] = []): MapState {
  return buildupJsonFileMap(boardPieces, hexMap)
}

function loadWithoutHistory(map: MapState, holdAutosave = true) {
  const temporal = store.temporal.getState()
  temporal.pause()
  store.getState().loadMap(map, { holdAutosave })
  temporal.clear()
  temporal.resume()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
}

function snapshot() {
  const { boardPieces, boardHexes } = store.getState()
  return structuredClone({ boardPieces, boardHexes })
}

function historyLength() {
  return store.temporal.getState().pastStates.length
}

beforeEach(async () => {
  storageValues.clear()
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.stubGlobal('localStorage', localStorageMock)
  vi.resetModules()
  ;({ default: store, saveMapPortraitWithoutUndo } = await import(
    '../store/store'
  ))
  ;({ undoWithSelectionRestore, redoWithSelectionRestore } = await import(
    '../utils/undoWithSelectionRestore'
  ))
  loadWithoutHistory(loadedMap())
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('real store undo and redo', () => {
  it('loads shared objective markers without adding undo history', () => {
    const marker = {
      uid: 'shared-marker',
      anchor: { q: 2, r: 2, s: -4, altitude: 1 },
      size: 2 as const,
      rotation: 4 as const,
      style: 'white' as const,
      content: { kind: 'number' as const, value: 7 },
      name: 'Named objective',
    }
    const sharedMap = {
      ...hexMap,
      objectiveMarkers: [marker],
    }
    const payload = getUrlMapString({ hexMap: sharedMap, boardPieces: [] })
    const parsed = parseMapDataArrayFromCrushed(payload)

    loadWithoutHistory(buildupJsonFileMap([], parsed.hexMap))

    expect(store.getState().hexMap.objectiveMarkers).toEqual([marker])
    expect(historyLength()).toBe(0)
  })

  it('saves one cropped portrait update and leaves it unchanged on cancel', () => {
    saveMapPortraitWithoutUndo('data:image/jpeg;base64,previous')
    const portraitUpdates: string[] = []
    const unsubscribe = store.subscribe((state, previous) => {
      if (
        state.hexMap.mapPortraitBase64 !== previous.hexMap.mapPortraitBase64
      ) {
        portraitUpdates.push(state.hexMap.mapPortraitBase64 ?? '')
      }
    })

    store.getState().openCropMapPortraitDialog()
    saveMapPortraitWithoutUndo('data:image/jpeg;base64,cropped')
    store.getState().closeCropMapPortraitDialog()
    expect(portraitUpdates).toEqual(['data:image/jpeg;base64,cropped'])
    expect(historyLength()).toBe(0)

    const portraitBeforeCancel = store.getState().hexMap.mapPortraitBase64
    expect(portraitBeforeCancel).toBe('data:image/jpeg;base64,cropped')
    store.getState().openCropMapPortraitDialog()
    store.getState().closeCropMapPortraitDialog()
    expect(store.getState().hexMap.mapPortraitBase64).toBe(portraitBeforeCancel)
    expect(portraitUpdates).toEqual(['data:image/jpeg;base64,cropped'])
    unsubscribe()
  })

  it('recomputes Laur edge conflicts after paint, undo, redo, and remove', async () => {
    const { redoWithSelectionRestore, undoWithSelectionRestore } = await import(
      '../utils/undoWithSelectionRestore'
    )
    const anchor = { q: 4, r: 4, s: -8 }
    const neighbor = { q: 5, r: 4, s: -9 }
    loadWithoutHistory(
      loadedMap([
        {
          uid: 'first-addon',
          inventoryID: 'lws',
          altitude: 0,
          rotation: 0,
          pieceCoords: anchor,
        },
      ]),
    )
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    expect(store.getState().unsupportedPieceUIDs).toEqual(['first-addon'])

    const error = store.getState().paintTile({
      piece: piecesSoFar.lws,
      clickedHexCoords: neighbor,
      altitude: 0,
      rotation: 3,
    })
    expect(error).toBeUndefined()
    const added = store
      .getState()
      .boardPieces.find((piece) => piece.pieceCoords.q === neighbor.q)
    if (!added) throw new Error('Expected the second Laur add-on')
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['first-addon', added.uid]),
    )
    expect(store.getState().unsupportedPieceUIDs).toEqual(
      expect.arrayContaining(['first-addon', added.uid]),
    )
    expect(
      store.getState().boardPieces.every((piece) => !('conflict' in piece)),
    ).toBe(true)

    undoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    expect(store.getState().unsupportedPieceUIDs).toEqual(['first-addon'])
    redoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['first-addon', added.uid]),
    )
    expect(store.getState().unsupportedPieceUIDs).toEqual(
      expect.arrayContaining(['first-addon', added.uid]),
    )

    store.getState().unpaintTile(added.uid)
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    expect(store.getState().unsupportedPieceUIDs).toEqual(['first-addon'])
    undoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['first-addon', added.uid]),
    )
    expect(store.getState().unsupportedPieceUIDs).toEqual(
      expect.arrayContaining(['first-addon', added.uid]),
    )
    redoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    expect(store.getState().unsupportedPieceUIDs).toEqual(['first-addon'])
  })

  it('recomputes unsupported status when a Laur add-on moves to matching pillars', async () => {
    const { redoWithSelectionRestore, undoWithSelectionRestore } = await import(
      '../utils/undoWithSelectionRestore'
    )
    const anchor = { q: 4, r: 4, s: -8 }
    const nearPillar = { q: 5, r: 4, s: -9 }
    const farPillar = { q: 6, r: 4, s: -10 }
    loadWithoutHistory(
      loadedMap([
        {
          uid: 'moving-addon',
          inventoryID: 'lws',
          altitude: 0,
          rotation: 0,
          pieceCoords: anchor,
        },
        {
          uid: 'near-pillar',
          inventoryID: 'lwp',
          altitude: 0,
          rotation: 0,
          pieceCoords: nearPillar,
        },
        {
          uid: 'far-pillar',
          inventoryID: 'lwp',
          altitude: 0,
          rotation: 0,
          pieceCoords: farPillar,
        },
      ]),
    )
    expect(store.getState().unsupportedPieceUIDs).toEqual(['moving-addon'])

    store.getState().movePiece({
      uid: 'moving-addon',
      newPieceCoords: nearPillar,
    })
    expect(store.getState().unsupportedPieceUIDs).toEqual([])

    undoWithSelectionRestore()
    expect(store.getState().unsupportedPieceUIDs).toEqual(['moving-addon'])
    redoWithSelectionRestore()
    expect(store.getState().unsupportedPieceUIDs).toEqual([])
  })

  it('recomputes Laur footprint conflicts after map load and moving land', async () => {
    const { redoWithSelectionRestore, undoWithSelectionRestore } = await import(
      '../utils/undoWithSelectionRestore'
    )
    const anchor = { q: 4, r: 4, s: -8 }
    const landOrigin = { q: 2, r: 2, s: -4 }
    const blockedHex = { q: 5, r: 4, s: -9 }
    const map = loadedMap([
      {
        uid: 'measured-addon',
        inventoryID: 'lwr2',
        altitude: 0,
        rotation: 0,
        pieceCoords: anchor,
      },
      {
        uid: 'moving-land',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: landOrigin,
      },
    ])
    store.getState().loadMap(map, { holdAutosave: true })
    expect(store.getState().conflictedPieceUIDs).toEqual([])

    store.getState().movePiece({
      uid: 'moving-land',
      newPieceCoords: blockedHex,
      newAltitude: 0,
    })
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['measured-addon', 'moving-land']),
    )

    undoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    redoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['measured-addon', 'moving-land']),
    )
  })

  it('loads fitted pieces and shows one map-dimensions notification', () => {
    const edgePiece: BoardPiece = {
      uid: 'edge-land',
      inventoryID: 'g2',
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 4, r: 2, s: -6 },
    }
    const map = buildupJsonFileMap([edgePiece], {
      ...hexMap,
      width: 6,
      length: 6,
    })

    store.getState().loadMap(map, { holdAutosave: true })

    expect(store.getState().hexMap.width).toBe(7)
    expect(store.getState().boardPieces).toHaveLength(1)
    expect(store.getState().boardPieces[0]?.pieceCoords).toEqual(
      edgePiece.pieceCoords,
    )
    expect(enqueueSnackbar).toHaveBeenCalledOnce()
    expect(enqueueSnackbar).toHaveBeenCalledWith({
      message: 'Hexoscape has adjusted your map dimensions to fit all pieces',
      variant: 'info',
      key: 'map-dimensions-adjusted',
      preventDuplicate: true,
    })
  })

  it('undoes and redoes painting with exact boardPieces and boardHexes', () => {
    const before = snapshot()
    const error = store.getState().paintTile({
      piece: piecesSoFar.g1,
      clickedHexCoords: { q: 3, r: 4, s: -7 },
      altitude: 0,
      rotation: 0,
    })
    expect(error).toBeUndefined()
    const afterPaint = snapshot()
    expect(historyLength()).toBe(1)

    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
    store.temporal.getState().redo()
    expect(snapshot()).toEqual(afterPaint)
  })

  it('keeps logged placement, undo, and redo outside of undo history', async () => {
    const { redoWithSelectionRestore, undoWithSelectionRestore } = await import(
      '../utils/undoWithSelectionRestore'
    )
    store.getState().paintTile({
      piece: piecesSoFar.g1,
      clickedHexCoords: { q: 3, r: 4, s: -7 },
      altitude: 0,
      rotation: 0,
    })
    expect(store.getState().actionLog.map((entry) => entry.text)).toEqual([
      `Placed ${piecesSoFar.g1.title}`,
    ])
    expect(historyLength()).toBe(1)

    undoWithSelectionRestore()
    expect(store.getState().actionLog.map((entry) => entry.text)).toEqual([
      `Placed ${piecesSoFar.g1.title}`,
      `Undid: Placed ${piecesSoFar.g1.title}`,
    ])
    expect(historyLength()).toBe(0)

    redoWithSelectionRestore()
    expect(store.getState().actionLog.map((entry) => entry.text)).toEqual([
      `Placed ${piecesSoFar.g1.title}`,
      `Undid: Placed ${piecesSoFar.g1.title}`,
      `Redid: Placed ${piecesSoFar.g1.title}`,
    ])
    expect(historyLength()).toBe(1)
  })

  it('logs a group move once and does not log a no-op move', () => {
    const pieces: BoardPiece[] = [
      {
        uid: 'group-one',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 2, r: 2, s: -4 },
      },
      {
        uid: 'group-two',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 7, r: 6, s: -13 },
      },
    ]
    loadWithoutHistory(loadedMap(pieces))

    store.getState().movePieces({
      moves: [
        { uid: 'group-one', newPieceCoords: { q: 3, r: 2, s: -5 } },
        { uid: 'group-two', newPieceCoords: { q: 8, r: 6, s: -14 } },
      ],
    })
    expect(store.getState().actionLog.map((entry) => entry.text)).toEqual([
      'Moved 2 pieces',
    ])
    expect(historyLength()).toBe(1)

    store.getState().movePieces({
      moves: [
        { uid: 'group-one', newPieceCoords: { q: 3, r: 2, s: -5 } },
        { uid: 'group-two', newPieceCoords: { q: 8, r: 6, s: -14 } },
      ],
    })
    expect(store.getState().actionLog).toHaveLength(1)
    expect(historyLength()).toBe(1)
  })

  it('records objective marker changes and clears log and action stacks on load', () => {
    const marker = {
      anchor: { q: 2, r: 2, s: -4, altitude: 1 },
      size: 1 as const,
      rotation: 0 as const,
      style: 'black' as const,
      content: { kind: 'number' as const, value: 1 },
      name: 'Objective',
    }
    const uid = store.getState().addObjectiveMarker(marker)
    if (!uid) throw new Error('Expected objective marker to be added')
    store.getState().moveObjectiveMarker(uid, {
      q: 3,
      r: 2,
      s: -5,
      altitude: 1,
    })
    store.getState().updateObjectiveMarker(uid, { name: 'Updated objective' })
    store.getState().removeObjectiveMarker(uid)

    expect(store.getState().actionLog.map((entry) => entry.text)).toEqual([
      'Added objective marker Objective',
      'Moved objective marker Objective',
      'Edited objective marker Updated objective',
      'Removed objective marker Updated objective',
    ])
    expect(store.getState().actionLogUndoStack).toHaveLength(4)

    store.getState().loadMap(loadedMap(), { holdAutosave: true })
    expect(store.getState().actionLog).toEqual([])
    expect(store.getState().actionLogUndoStack).toEqual([])
    expect(store.getState().actionLogRedoStack).toEqual([])
  })

  it('records terrain conversion, rotation, and deletion at their commits', () => {
    const piece: BoardPiece = {
      uid: 'changing-piece',
      inventoryID: 'g1',
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 2, r: 2, s: -4 },
    }
    loadWithoutHistory(loadedMap([piece]))

    expect(
      store.getState().convertTerrainForPieces({
        selectedUIDs: [piece.uid],
        targetInventoryBySourceInventory: { g1: 'g2' },
      }),
    ).toBe(1)
    store.getState().movePieces({
      moves: [
        {
          uid: piece.uid,
          newPieceCoords: piece.pieceCoords,
          newRotation: 1,
        },
      ],
      preserveRotationPivot: true,
    })
    store.getState().unpaintTile(piece.uid)
    store.getState().unpaintTile('missing-piece')

    expect(store.getState().actionLog.map((entry) => entry.text)).toEqual([
      'Converted 1 piece',
      `Rotated ${piecesSoFar.g2.title}`,
      `Deleted ${piecesSoFar.g2.title}`,
    ])
    expect(historyLength()).toBe(3)
  })

  it('adapts different instances in one undo step and restores their IDs', () => {
    const pieces: BoardPiece[] = [
      {
        uid: 'surface-snow',
        inventoryID: Pieces.snow1,
        altitude: 0,
        rotation: 2,
        pieceCoords: { q: 2, r: 2, s: -4 },
      },
      {
        uid: 'buried-snow',
        inventoryID: Pieces.snow1,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 4, r: 2, s: -6 },
      },
      {
        uid: 'snow-cover',
        inventoryID: Pieces.grass1,
        altitude: 1,
        rotation: 0,
        pieceCoords: { q: 4, r: 2, s: -6 },
      },
    ]
    loadWithoutHistory(
      buildupJsonFileMap(pieces, {
        ...hexMap,
        name: 'Original map',
        author: 'Original author',
        mapNotes: 'Original notes',
      }),
      false,
    )
    const before = structuredClone(store.getState().boardPieces)
    const beforeMetadata = structuredClone(store.getState().hexMap)
    const conflictsBefore = [...store.getState().conflictedPieceUIDs]
    const actionLogLength = store.getState().actionLog.length

    expect(
      store.getState().convertTerrainForPieces({
        selectedUIDs: ['surface-snow', 'buried-snow'],
        targetInventoryBySourceInventory: {},
        targetInventoryByUID: {
          'surface-snow': Pieces.rock1,
          'buried-snow': Pieces.grass1,
        },
        adaptToCollection: true,
        mapMetadata: {
          name: 'Adapted map',
          author: 'Updated author',
          mapNotes: 'Updated notes',
        },
      }),
    ).toBe(2)

    expect(historyLength()).toBe(1)
    expect(store.getState().actionLog).toHaveLength(actionLogLength + 1)
    expect(
      store.getState().actionLog[store.getState().actionLog.length - 1]?.text,
    ).toBe('Adapted map to collection (2 pieces)')
    expect(store.getState().actionLogUndoStack).toHaveLength(1)
    expect(store.getState().hexMap).toMatchObject({
      name: 'Adapted map',
      author: 'Updated author',
      mapNotes: 'Updated notes',
    })
    expect(
      Object.fromEntries(
        store
          .getState()
          .boardPieces.map((piece) => [piece.uid, piece.inventoryID]),
      ),
    ).toEqual({
      'surface-snow': Pieces.rock1,
      'buried-snow': Pieces.grass1,
      'snow-cover': Pieces.grass1,
    })
    expect(store.getState().conflictedPieceUIDs).toEqual(conflictsBefore)
    for (const original of before) {
      const current = store
        .getState()
        .boardPieces.find((piece) => piece.uid === original.uid)
      expect(current).toMatchObject({
        altitude: original.altitude,
        rotation: original.rotation,
        pieceCoords: original.pieceCoords,
      })
    }

    const current = store.getState()
    const fileLoaded = buildupJsonFileMap(
      structuredClone(current.boardPieces),
      structuredClone(current.hexMap),
    )
    expect(fileLoaded.hexMap).toMatchObject({
      name: 'Adapted map',
      author: 'Updated author',
      mapNotes: 'Updated notes',
    })
    const shared = parseMapDataArrayFromCrushed(
      getUrlMapString({
        hexMap: current.hexMap,
        boardPieces: current.boardPieces,
      }),
    )
    expect(shared.hexMap).toMatchObject({
      name: 'Adapted map',
      author: 'Updated author',
    })
    vi.advanceTimersByTime(1000)
    const autosaved = JSON.parse(
      storageValues.get(LS_KEYS.lastMap) ?? '{}',
    ) as { hexMap?: HexMap }
    expect(autosaved.hexMap).toMatchObject({
      name: 'Adapted map',
      author: 'Updated author',
      mapNotes: 'Updated notes',
    })

    undoWithSelectionRestore()
    expect(
      store
        .getState()
        .boardPieces.map(({ uid, inventoryID }) => ({ uid, inventoryID })),
    ).toEqual(before.map(({ uid, inventoryID }) => ({ uid, inventoryID })))
    expect(store.getState().hexMap).toEqual(beforeMetadata)
  })

  it('undoes and redoes unpainting with exact boardPieces and boardHexes', () => {
    loadWithoutHistory(
      loadedMap([
        {
          uid: 'to-remove',
          inventoryID: 'g1',
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 3, r: 4, s: -7 },
        },
      ]),
    )
    const before = snapshot()

    store.getState().unpaintTile('to-remove')
    const afterUnpaint = snapshot()
    expect(historyLength()).toBe(1)

    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
    store.temporal.getState().redo()
    expect(snapshot()).toEqual(afterUnpaint)
  })

  it('undoes and redoes moving a piece with exact boardPieces and boardHexes', () => {
    loadWithoutHistory(
      loadedMap([
        {
          uid: 'to-move',
          inventoryID: 'g1',
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 2, r: 2, s: -4 },
        },
      ]),
    )
    const before = snapshot()

    store.getState().movePiece({
      uid: 'to-move',
      newPieceCoords: { q: 6, r: 5, s: -11 },
      newAltitude: 1,
      newRotation: 2,
    })
    const afterMove = snapshot()
    expect(historyLength()).toBe(1)

    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
    store.temporal.getState().redo()
    expect(snapshot()).toEqual(afterMove)
  })

  it('groups three moves when pausing after the first move', () => {
    const pieces = [
      {
        uid: 'first',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 2, r: 2, s: -4 },
      },
      {
        uid: 'second',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 7, r: 6, s: -13 },
      },
      {
        uid: 'third',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 3, r: 9, s: -12 },
      },
    ]
    loadWithoutHistory(loadedMap(pieces))
    const before = snapshot()
    const temporal = store.temporal.getState()
    const destinations = [
      { q: 4, r: 3, s: -7 },
      { q: 9, r: 8, s: -17 },
      { q: 5, r: 10, s: -15 },
    ]

    for (const [index, piece] of pieces.entries()) {
      if (index === 1) temporal.pause()
      const newPieceCoords = destinations[index]
      if (!newPieceCoords) throw new Error('Missing move destination')
      store.getState().movePiece({ uid: piece.uid, newPieceCoords })
    }
    temporal.resume()

    const afterMoves = snapshot()
    expect(historyLength()).toBe(1)
    temporal.undo()
    expect(snapshot()).toEqual(before)
    temporal.redo()
    expect(snapshot()).toEqual(afterMoves)
  })

  it('pausing before the first move records no undo state', () => {
    const pieces = [
      {
        uid: 'first',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 2, r: 2, s: -4 },
      },
      {
        uid: 'second',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 7, r: 6, s: -13 },
      },
      {
        uid: 'third',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 3, r: 9, s: -12 },
      },
    ]
    loadWithoutHistory(loadedMap(pieces))
    const temporal = store.temporal.getState()
    const destinations = [
      { q: 4, r: 3, s: -7 },
      { q: 9, r: 8, s: -17 },
      { q: 5, r: 10, s: -15 },
    ]

    temporal.pause()
    for (const [index, piece] of pieces.entries()) {
      const newPieceCoords = destinations[index]
      if (!newPieceCoords) throw new Error('Missing move destination')
      store.getState().movePiece({ uid: piece.uid, newPieceCoords })
    }
    temporal.resume()

    const afterMoves = snapshot()
    expect(historyLength()).toBe(0)
    temporal.undo()
    expect(snapshot()).toEqual(afterMoves)
  })

  it('records direct loadMap as one undo step and recomputes conflicts', () => {
    const before = snapshot()
    const conflicting = loadedMap([
      {
        uid: 'overlap-one',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 3, r: 3, s: -6 },
      },
      {
        uid: 'overlap-two',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 1,
        pieceCoords: { q: 3, r: 3, s: -6 },
      },
    ])

    store.getState().loadMap(conflicting)
    const afterLoad = snapshot()
    expect(historyLength()).toBe(1)
    expect(store.getState().conflictedPieceUIDs).toEqual(
      computeConflictedPieceUIDs(conflicting.boardPieces),
    )
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['overlap-one', 'overlap-two']),
    )

    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
    store.temporal.getState().redo()
    expect(snapshot()).toEqual(afterLoad)
  })

  it('view, pen, drag, and hover changes never add history or autosave the map', () => {
    const { boardHexes, boardPieces, hexMap } = store.getState()
    store.getState().toggleViewingLevel(2)
    store.getState().toggleSelectedPieceID('selected-piece')
    store.getState().toggleSelectedPieceID('selected-piece')
    store.getState().togglePenMode('g')
    store.getState().setDragState(true, null)
    store.getState().toggleHoveredPieceID('hovered')
    store.getState().toggleHoveredHex(Object.values(boardHexes)[0])
    store.getState().toggleHoveredWorldPoint({ x: 1, z: 2 })
    store.getState().recordActionLog({ type: 'warning', text: 'Not persisted' })
    const sharedMap = parseMapDataArrayFromCrushed(
      getUrlMapString({
        hexMap: store.getState().hexMap,
        boardPieces: store.getState().boardPieces,
      }),
    )
    store.getState().setDragState(false, null)
    store.getState().toggleHoveredPieceID('')
    store.getState().toggleHoveredHex(undefined)
    vi.advanceTimersByTime(1000)

    expect(historyLength()).toBe(0)
    expect(store.getState().boardPieces).toBe(boardPieces)
    expect(store.getState().boardHexes).toBe(boardHexes)
    expect(store.getState().hexMap).toBe(hexMap)
    expect(store.getState().actionLog).toHaveLength(1)
    expect(JSON.stringify(sharedMap)).not.toContain('Not persisted')
    expect(
      localStorageMock.setItem.mock.calls.some(
        ([key]) => key === LS_KEYS.lastMap,
      ),
    ).toBe(false)
    expect(
      localStorageMock.removeItem.mock.calls.some(
        ([key]) => key === LS_KEYS.lastMap,
      ),
    ).toBe(false)
  })

  it('does not record selection, no-op moves, pen changes, or an equal map load', () => {
    const piece = {
      uid: 'stable-piece',
      inventoryID: 'g1',
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 2, r: 2, s: -4 },
    }
    const map = loadedMap([piece])
    loadWithoutHistory(map)

    store.getState().toggleSelectedPieceID(piece.uid)
    store.getState().toggleSelectedPieceID(piece.uid)
    store.getState().toggleViewingLevel(2)
    store.getState().togglePenMode('select')
    store.getState().movePiece({
      uid: piece.uid,
      newPieceCoords: piece.pieceCoords,
      newAltitude: piece.altitude,
      newRotation: piece.rotation,
    })
    store.getState().loadMap(loadedMap([piece]), { holdAutosave: true })

    expect(historyLength()).toBe(0)
  })

  it('clears and logs selection only when entering a placement pen', () => {
    const piece = {
      uid: 'pen-selection',
      inventoryID: Pieces.grass1,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 2, r: 2, s: -4 },
    }
    loadWithoutHistory(loadedMap([piece]))
    store.setState({ selectedPieceIDs: [piece.uid] })
    store.temporal.getState().clear()

    store.getState().togglePenMode('g')

    expect(store.getState().selectedPieceIDs).toEqual([])
    expect(store.getState().actionLog).toMatchObject([
      {
        kind: 'deselect',
        text: 'Cleared selection of 1 piece (switched to 1-hex Grass)',
        selection: { pieceUIDs: [piece.uid] },
        selectionLabel: '1 piece',
        undoable: false,
      },
    ])
    expect(store.getState().actionLogUndoStack).toEqual([])
    expect(historyLength()).toBe(0)
    expect(store.temporal.getState().futureStates).toHaveLength(0)
  })

  it('clears a selected objective marker with pieces and preserves both in the log', () => {
    const piece = {
      uid: 'pen-selection-with-marker',
      inventoryID: Pieces.grass1,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 2, r: 2, s: -4 },
    }
    const marker = {
      uid: 'pen-selection-marker',
      anchor: { q: 3, r: 3, s: -6, altitude: 1 },
      size: 1 as const,
      rotation: 0 as const,
      style: 'black' as const,
      content: { kind: 'number' as const, value: 1 },
    }
    const map = loadedMap([piece])
    map.hexMap.objectiveMarkers = [marker]
    loadWithoutHistory(map)
    store.setState({ selectedPieceIDs: [piece.uid] })
    store.getState().setSelectedObjectiveMarkerUID(marker.uid)

    store.getState().togglePenMode('g')

    const entry = store.getState().actionLog[0]
    expect(store.getState().selectedPieceIDs).toEqual([])
    expect(store.getState().selectedObjectiveMarkerUID).toBeNull()
    expect(entry).toMatchObject({
      kind: 'deselect',
      selection: {
        pieceUIDs: [piece.uid],
        objectiveMarkerUID: marker.uid,
      },
      selectionLabel: '1 piece and objective marker',
    })
    if (!entry?.selection) throw new Error('Expected a selection to recall')

    store.getState().togglePenMode('r')
    store.getState().selectSelectionUnit(entry.selection)

    expect(store.getState().penMode).toBe('r')
    expect(store.getState().selectedPieceIDs).toEqual([piece.uid])
    expect(store.getState().selectedObjectiveMarkerUID).toBe(marker.uid)
  })

  it('does not log empty switches or clear selections in non-painting modes', () => {
    store.getState().togglePenMode('g')
    store.getState().togglePieceSize(2)
    store.getState().togglePenModeRotation(1)
    expect(store.getState().actionLog).toEqual([])

    store.setState({ selectedPieceIDs: ['placement-selection'] })
    store.getState().togglePenMode('r')
    expect(store.getState().selectedPieceIDs).toEqual(['placement-selection'])
    expect(store.getState().actionLog).toEqual([])

    store.setState({ selectedPieceIDs: ['selected-piece'] })
    store.getState().togglePenMode(SELECT_PEN_MODE)
    expect(store.getState().selectedPieceIDs).toEqual(['selected-piece'])
    store.getState().togglePenMode(PICK_PEN_MODE)
    expect(store.getState().selectedPieceIDs).toEqual(['selected-piece'])
    store.getState().togglePenMode(OBJECTIVE_MARKER_PEN_MODE)
    expect(store.getState().selectedPieceIDs).toEqual(['selected-piece'])
    expect(store.getState().actionLog).toEqual([])
    expect(historyLength()).toBe(0)
  })

  it('clears selection when the last-pen hotkey enters a placement mode', () => {
    const piece = {
      uid: 'last-pen-selection',
      inventoryID: Pieces.grass1,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 2, r: 2, s: -4 },
    }
    loadWithoutHistory(loadedMap([piece]))
    store.getState().togglePenMode('g')
    store.getState().togglePieceSize(3)
    store.getState().togglePenMode(SELECT_PEN_MODE)
    store.setState({ selectedPieceIDs: [piece.uid] })

    store.getState().toggleLastPenMode()

    expect(store.getState().penMode).toBe('g')
    expect(store.getState().pieceSize).toBe(3)
    expect(store.getState().selectedPieceIDs).toEqual([])
    expect(store.getState().actionLog).toMatchObject([
      {
        kind: 'deselect',
        selection: { pieceUIDs: [piece.uid] },
      },
    ])
    expect(historyLength()).toBe(0)
  })

  it('preserves selection without logging when Use as Pen enters placement', async () => {
    const piece = {
      uid: 'use-as-pen-selection',
      inventoryID: Pieces.grass1,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 2, r: 2, s: -4 },
    }
    loadWithoutHistory(loadedMap([piece]))
    store.setState({ selectedPieceIDs: [piece.uid] })

    const { pickPieceAsPenMode } = await import(
      '../hooks/useMiddleClickPickPenMode'
    )
    pickPieceAsPenMode(piece.uid, { preserveSelection: true })

    expect(store.getState().penMode).toBe('g')
    expect(store.getState().selectedPieceIDs).toEqual([piece.uid])
    expect(store.getState().actionLog).toEqual([])
    expect(store.getState().actionLogUndoStack).toEqual([])
    expect(historyLength()).toBe(0)
  })

  it('does not record plain selections in the action log', () => {
    const pieces = [
      {
        uid: 'first-selection',
        inventoryID: Pieces.grass1,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 2, r: 2, s: -4 },
      },
      {
        uid: 'second-selection',
        inventoryID: Pieces.grass1,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 3, r: 2, s: -5 },
      },
    ]
    loadWithoutHistory(loadedMap(pieces))

    store.getState().toggleSelectedPieceID('first-selection')
    store.getState().toggleSelectedPieceID('second-selection')
    expect(store.getState().actionLog).toEqual([])

    store.getState().loadMap(loadedMap(pieces.slice(0, 1)), {
      holdAutosave: true,
    })
    expect(store.getState().actionLog).toEqual([])
  })

  it('records touched piece and objective-marker IDs for map actions', () => {
    const piece = piecesSoFar[Pieces.grass1]
    if (!piece) throw new Error('test setup: grass piece is unavailable')
    const error = store.getState().paintTile({
      piece,
      clickedHexCoords: { q: 4, r: 4, s: -8 },
      altitude: 0,
      rotation: 0,
    })
    expect(error).toBeUndefined()
    const uid = store.getState().boardPieces[0]?.uid
    if (!uid) throw new Error('test setup: painted piece is unavailable')
    const latestRecord = () => {
      const stack = store.getState().pendingUndoSelectionRestoreStack
      return stack[stack.length - 1]
    }
    const expectedPieceRecord = {
      pieceUIDs: [uid],
      objectiveMarkerUID: null,
    }
    expect(latestRecord()).toEqual(expectedPieceRecord)

    store.getState().movePiece({
      uid,
      newPieceCoords: { q: 5, r: 4, s: -9 },
    })
    expect(latestRecord()).toEqual(expectedPieceRecord)

    store.getState().movePiece({
      uid,
      newPieceCoords: { q: 5, r: 4, s: -9 },
      newAltitude: 1,
      newRotation: 1,
    })
    expect(latestRecord()).toEqual(expectedPieceRecord)

    store.getState().convertTerrainForPieces({
      selectedUIDs: [uid],
      targetInventoryBySourceInventory: {
        [Pieces.grass1]: Pieces.grass2,
      },
    })
    expect(latestRecord()).toEqual(expectedPieceRecord)

    store.getState().unpaintTile(uid)
    expect(latestRecord()).toEqual(expectedPieceRecord)

    const marker = {
      uid: 'history-marker',
      anchor: { q: 3, r: 3, s: -6, altitude: 1 },
      size: 1 as const,
      rotation: 0 as const,
      style: 'black' as const,
      content: { kind: 'number' as const, value: 1 },
    }
    store.getState().addObjectiveMarker(marker)
    const expectedMarkerRecord = {
      pieceUIDs: [],
      objectiveMarkerUID: marker.uid,
      restoreObjectiveMarkerSelection: false,
    }
    expect(latestRecord()).toEqual(expectedMarkerRecord)
    store.getState().updateObjectiveMarker(marker.uid, { rotation: 1 })
    const expectedMarkerMutationRecord = {
      pieceUIDs: [],
      objectiveMarkerUID: marker.uid,
      restoreObjectiveMarkerSelection: undefined,
    }
    expect(latestRecord()).toEqual(expectedMarkerMutationRecord)
    store.getState().moveObjectiveMarker(marker.uid, {
      q: 4,
      r: 3,
      s: -7,
      altitude: 1,
    })
    expect(latestRecord()).toEqual(expectedMarkerMutationRecord)
    store.getState().removeObjectiveMarker(marker.uid)
    expect(latestRecord()).toEqual(expectedMarkerMutationRecord)
    expect(
      store.getState().actionLog.map(({ kind, selection }) => ({
        kind,
        selection,
      })),
    ).toEqual([
      { kind: 'place', selection: { pieceUIDs: [uid] } },
      { kind: 'move', selection: { pieceUIDs: [uid] } },
      { kind: 'move', selection: { pieceUIDs: [uid] } },
      { kind: 'convert', selection: { pieceUIDs: [uid] } },
      { kind: 'delete', selection: { pieceUIDs: [uid] } },
      {
        kind: 'marker',
        selection: { pieceUIDs: [], objectiveMarkerUID: marker.uid },
      },
      {
        kind: 'marker',
        selection: { pieceUIDs: [], objectiveMarkerUID: marker.uid },
      },
      {
        kind: 'marker',
        selection: { pieceUIDs: [], objectiveMarkerUID: marker.uid },
      },
      {
        kind: 'marker',
        selection: { pieceUIDs: [], objectiveMarkerUID: marker.uid },
      },
    ])
  })

  it('saves, recalls, and prunes named selection units outside undo history', () => {
    const pieces = [
      {
        uid: 'saved-one',
        inventoryID: Pieces.grass1,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 2, r: 2, s: -4 },
      },
      {
        uid: 'saved-two',
        inventoryID: Pieces.grass1,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 3, r: 2, s: -5 },
      },
      {
        uid: 'saved-other',
        inventoryID: Pieces.grass1,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 8, r: 8, s: -16 },
      },
    ]
    loadWithoutHistory(loadedMap(pieces))

    store.getState().toggleSelectedPieceID('saved-one')
    store.getState().toggleSelectedPieceID('saved-two', true)
    expect(store.getState().saveSelectedSelection('My group')).toBe('saved')
    const [savedSelection] = store.getState().savedSelections
    if (!savedSelection) throw new Error('Saved selection was not created')
    expect(savedSelection).toMatchObject({
      name: 'My group',
      pieceUIDs: ['saved-one', 'saved-two'],
    })
    expect(historyLength()).toBe(0)

    store.getState().toggleSelectedPieceID('saved-other')
    store.getState().selectSelectionUnit(savedSelection, true)
    expect(store.getState().selectedPieceIDs).toEqual([
      'saved-other',
      'saved-one',
      'saved-two',
    ])
    store.getState().renameSavedSelection(savedSelection.id, 'Renamed')
    expect(store.getState().savedSelections[0]?.name).toBe('Renamed')

    store.getState().unpaintTile('saved-one')
    expect(store.getState().savedSelections[0]?.pieceUIDs).toEqual([
      'saved-two',
    ])
    store.getState().unpaintTile('saved-two')
    expect(store.getState().savedSelections).toEqual([])
  })

  it('saves and deletes a marker-only named selection', () => {
    const marker = {
      uid: 'saved-marker',
      anchor: { q: 2, r: 2, s: -4, altitude: 1 },
      size: 2 as const,
      rotation: 4 as const,
      style: 'white' as const,
      content: { kind: 'number' as const, value: 7 },
      name: 'Named objective',
    }
    loadWithoutHistory(
      buildupJsonFileMap([], { ...hexMap, objectiveMarkers: [marker] }),
    )
    store.getState().setSelectedObjectiveMarkerUID(marker.uid)

    expect(store.getState().saveSelectedSelection('Marker-only')).toBe('saved')
    const [savedSelection] = store.getState().savedSelections
    if (!savedSelection) throw new Error('Saved selection was not created')
    expect(savedSelection).toMatchObject({
      name: 'Marker-only',
      pieceUIDs: [],
      objectiveMarkerUID: marker.uid,
    })

    store.getState().deleteSavedSelection(savedSelection.id)
    expect(store.getState().savedSelections).toEqual([])
  })

  it('restores placement, rotation, and conversion selections on undo and redo', () => {
    const piece = piecesSoFar[Pieces.grass1]
    if (!piece) throw new Error('test setup: grass piece is unavailable')
    store.getState().paintTile({
      piece,
      clickedHexCoords: { q: 4, r: 4, s: -8 },
      altitude: 0,
      rotation: 0,
    })
    const uid = store.getState().boardPieces[0]?.uid
    if (!uid) throw new Error('test setup: painted piece is unavailable')

    undoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([])
    redoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([uid])
    undoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([])

    const placed = {
      uid,
      inventoryID: Pieces.grass1,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 4, r: 4, s: -8 },
    }
    loadWithoutHistory(loadedMap([placed]))
    store.getState().toggleSelectedPieceID(uid)
    vi.advanceTimersByTime(250)
    store.getState().movePiece({
      uid,
      newPieceCoords: placed.pieceCoords,
      newRotation: 1,
    })
    store.getState().toggleSelectedPieceID('')
    undoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([uid])
    expect(store.getState().boardPieces[0]?.rotation).toBe(0)
    redoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([uid])
    expect(store.getState().boardPieces[0]?.rotation).toBe(1)

    store.getState().convertTerrainForPieces({
      selectedUIDs: [uid],
      targetInventoryBySourceInventory: {
        [Pieces.grass1]: Pieces.grass2,
      },
    })
    store.getState().toggleSelectedPieceID('')
    undoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([uid])
    expect(store.getState().boardPieces[0]?.inventoryID).toBe(Pieces.grass1)
    redoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([uid])
    expect(store.getState().boardPieces[0]?.inventoryID).toBe(Pieces.grass2)
    undoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([uid])
  })

  it('restores a multi-piece move selection on undo and redo', () => {
    const group = [
      {
        uid: 'group-one',
        inventoryID: Pieces.grass1,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 2, r: 2, s: -4 },
      },
      {
        uid: 'group-two',
        inventoryID: Pieces.grass1,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 3, r: 2, s: -5 },
      },
      {
        uid: 'group-three',
        inventoryID: Pieces.grass1,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 4, r: 2, s: -6 },
      },
      {
        uid: 'other-piece',
        inventoryID: Pieces.grass1,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 8, r: 8, s: -16 },
      },
    ]
    loadWithoutHistory(loadedMap(group))

    store.getState().toggleSelectedPieceID('group-one')
    store.getState().toggleSelectedPieceID('group-two', true)
    store.getState().toggleSelectedPieceID('group-three', true)
    vi.advanceTimersByTime(250)
    const originalCoords = group.slice(0, 3).map((piece) => piece.pieceCoords)
    store.getState().movePieces({
      moves: group.slice(0, 3).map((piece) => ({
        uid: piece.uid,
        newPieceCoords: {
          q: piece.pieceCoords.q + 1,
          r: piece.pieceCoords.r,
          s: piece.pieceCoords.s - 1,
        },
      })),
    })
    const records = store.getState().pendingUndoSelectionRestoreStack
    expect(records[records.length - 1]).toEqual({
      pieceUIDs: ['group-one', 'group-two', 'group-three'],
      objectiveMarkerUID: null,
    })

    undoWithSelectionRestore()

    expect(store.getState().selectedPieceIDs).toEqual([
      'group-one',
      'group-two',
      'group-three',
    ])
    expect(
      group
        .slice(0, 3)
        .map(
          (piece) =>
            store
              .getState()
              .boardPieces.find((boardPiece) => boardPiece.uid === piece.uid)
              ?.pieceCoords,
        ),
    ).toEqual(originalCoords)

    redoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([
      'group-one',
      'group-two',
      'group-three',
    ])
    undoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([
      'group-one',
      'group-two',
      'group-three',
    ])
  })
})
