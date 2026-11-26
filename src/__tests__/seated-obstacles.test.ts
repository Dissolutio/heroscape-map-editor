import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { getDraggableSelectionGroup } from '../data/dragMove'
import getPieceTemplateCoords from '../data/rotationTransforms'
import { getSeatedGroupUIDs } from '../data/seatedObstacles'
import { LS_KEYS } from '../local-storage/keys'
import { warnAboutLoadedMap } from '../utils/warnAboutLoadedMap'
import type { BoardPiece, CubeCoordinate, HexMap } from '../types'
import { Pieces } from '../types'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const hexMap: HexMap = {
  id: 'seated-obstacles',
  name: 'Seated obstacles',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 12,
  length: 12,
}

const at = (q: number, r: number): CubeCoordinate => ({ q, r, s: -q - r })
const center = at(5, 5)

let store: typeof import('../store/store').default
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

function marvelSeat(): BoardPiece[] {
  return [
    {
      uid: 'base',
      inventoryID: Pieces.concrete6,
      altitude: 0,
      rotation: 0,
      pieceCoords: center,
    },
    {
      uid: 'marvel',
      inventoryID: Pieces.marvel,
      altitude: 1,
      rotation: 0,
      pieceCoords: center,
    },
  ]
}

function load(boardPieces: BoardPiece[]) {
  const temporal = store.temporal.getState()
  temporal.pause()
  store.getState().loadMap(buildupJsonFileMap(boardPieces, hexMap), {
    holdAutosave: true,
  })
  temporal.clear()
  temporal.resume()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
}

function snapshot() {
  const { boardPieces, boardHexes } = store.getState()
  return structuredClone({ boardPieces, boardHexes })
}

beforeEach(async () => {
  storageValues.clear()
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.stubGlobal('localStorage', localStorageMock)
  vi.resetModules()
  ;({ default: store } = await import('../store/store'))
  load([])
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('seated obstacle groups', () => {
  it('derives the Marvel Ruin group and selects it from either member', () => {
    load(marvelSeat())
    const { boardHexes, boardPieces } = store.getState()
    const groupUIDs = ['marvel', 'base']
    expect(getSeatedGroupUIDs('marvel', boardHexes, boardPieces)).toEqual(
      groupUIDs,
    )
    expect(getSeatedGroupUIDs('base', boardHexes, boardPieces)).toEqual(
      groupUIDs,
    )

    store.getState().toggleSelectedPieceID('base')
    expect(store.getState().selectedPieceIDs).toEqual(groupUIDs)
    expect(
      getDraggableSelectionGroup(
        store.getState().selectedPieceIDs,
        'marvel',
        store.getState().boardPieces,
      )?.map((piece) => piece.uid),
    ).toEqual(groupUIDs)
  })

  it('moves and rotates the Marvel Ruin with its base in one undo step', () => {
    load(marvelSeat())
    const before = snapshot()
    const beforeHistory = store.temporal.getState().pastStates.length
    store.getState().movePiece({
      uid: 'marvel',
      newPieceCoords: at(6, 6),
      newRotation: 1,
    })

    const after = store.getState()
    expect(after.boardPieces.map((piece) => piece.uid)).toEqual([
      'base',
      'marvel',
    ])
    expect(
      getSeatedGroupUIDs('marvel', after.boardHexes, after.boardPieces),
    ).toEqual(['marvel', 'base'])
    expect(store.temporal.getState().pastStates.length).toBe(beforeHistory + 1)

    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
  })

  it('moves the Marvel Ruin with its base selected as the move anchor', () => {
    load(marvelSeat())
    const before = snapshot()
    const beforeHistory = store.temporal.getState().pastStates.length
    store.getState().movePiece({
      uid: 'base',
      newPieceCoords: at(6, 6),
    })

    expect(
      getSeatedGroupUIDs(
        'marvel',
        store.getState().boardHexes,
        store.getState().boardPieces,
      ),
    ).toEqual(['marvel', 'base'])
    expect(store.temporal.getState().pastStates.length).toBe(beforeHistory + 1)
    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
  })

  it('deleting the Marvel Ruin removes its base in one undo step', () => {
    load(marvelSeat())
    const before = snapshot()
    const beforeHistory = store.temporal.getState().pastStates.length
    store.getState().unpaintTile('marvel')

    expect(store.getState().boardPieces).toEqual([])
    expect(store.temporal.getState().pastStates.length).toBe(beforeHistory + 1)
    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
  })

  it('deleting the Marvel base removes the whole seat in one undo step', () => {
    load(marvelSeat())
    const before = snapshot()
    const beforeHistory = store.temporal.getState().pastStates.length
    store.getState().unpaintTile('base')

    expect(store.getState().boardPieces).toEqual([])
    expect(store.temporal.getState().pastStates.length).toBe(beforeHistory + 1)
    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
  })

  it('loads an old obstacle-only map without adding a base', () => {
    const obstacle: BoardPiece = {
      uid: 'legacy-outcrop',
      inventoryID: Pieces.outcrop1,
      altitude: 0,
      rotation: 0,
      pieceCoords: center,
    }

    load([obstacle])

    expect(store.getState().boardPieces).toEqual([obstacle])
    expect(
      getSeatedGroupUIDs(
        obstacle.uid,
        store.getState().boardHexes,
        store.getState().boardPieces,
      ),
    ).toEqual([obstacle.uid])
  })

  it('merges an exact hand-placed base and reports it once', () => {
    const base: BoardPiece = {
      uid: 'old-shadow',
      inventoryID: Pieces.shadow1,
      altitude: 0,
      rotation: 0,
      pieceCoords: center,
    }
    const obstacle: BoardPiece = {
      uid: 'old-outcrop',
      inventoryID: Pieces.outcrop1,
      altitude: 1,
      rotation: 0,
      pieceCoords: center,
    }
    const loaded = buildupJsonFileMap([base, obstacle], hexMap)
    const enqueueSnackbar = vi.fn()

    expect(loaded.boardPieces).toEqual([{ ...obstacle, altitude: 0 }])
    expect(loaded.mergedSeatedBaseCount).toBe(1)
    warnAboutLoadedMap(enqueueSnackbar, loaded)
    expect(enqueueSnackbar).toHaveBeenCalledTimes(1)
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Merged 1 hand-placed bases into the outcrops, glaciers or hives sitting on them.',
        variant: 'info',
      }),
    )
  })

  it('does not autosave a migrated share-link map over the saved last map', () => {
    const base: BoardPiece = {
      uid: 'shared-shadow',
      inventoryID: Pieces.shadow1,
      altitude: 0,
      rotation: 0,
      pieceCoords: center,
    }
    const obstacle: BoardPiece = {
      uid: 'shared-outcrop',
      inventoryID: Pieces.outcrop1,
      altitude: 1,
      rotation: 0,
      pieceCoords: center,
    }
    storageValues.set(LS_KEYS.lastMap, 'saved-last-map')
    localStorageMock.setItem.mockClear()

    const sharedMap = buildupJsonFileMap([base, obstacle], hexMap)
    store.getState().loadMap(sharedMap, { holdAutosave: true })
    vi.advanceTimersByTime(1000)

    expect(store.getState().boardPieces).toEqual([{ ...obstacle, altitude: 0 }])
    expect(storageValues.get(LS_KEYS.lastMap)).toBe('saved-last-map')
    expect(
      localStorageMock.setItem.mock.calls.filter(
        ([key]) => key === LS_KEYS.lastMap,
      ),
    ).toEqual([])
  })

  it('does not merge unsupported, partial, or occupied base matches', () => {
    const shadow: BoardPiece = {
      uid: 'shadow',
      inventoryID: Pieces.shadow1,
      altitude: 0,
      rotation: 0,
      pieceCoords: center,
    }
    const glacier: BoardPiece = {
      uid: 'glacier',
      inventoryID: Pieces.glacier1,
      altitude: 1,
      rotation: 0,
      pieceCoords: center,
    }
    const unrelated = buildupJsonFileMap([shadow, glacier], hexMap)
    expect(unrelated.boardPieces).toEqual([shadow, glacier])
    expect(unrelated.mergedSeatedBaseCount).toBe(0)

    const coordinates = getPieceTemplateCoords({
      clickedHex: center,
      rotation: 0,
      template: '3',
      isVsTile: false,
    })
    const partialBases = coordinates.slice(0, 2).map((pieceCoords, index) => ({
      uid: `partial-base-${index}`,
      inventoryID: Pieces.shadow1,
      altitude: 0,
      rotation: 0,
      pieceCoords,
    }))
    const partial = buildupJsonFileMap(
      [
        ...partialBases,
        {
          uid: 'partial-outcrop',
          inventoryID: Pieces.outcrop3,
          altitude: 1,
          rotation: 0,
          pieceCoords: center,
        },
      ],
      hexMap,
    )
    expect(partial.boardPieces).toHaveLength(3)
    expect(partial.mergedSeatedBaseCount).toBe(0)

    const occupied = buildupJsonFileMap(
      [
        shadow,
        {
          uid: 'top-water',
          inventoryID: Pieces.water1,
          altitude: 1,
          rotation: 0,
          pieceCoords: center,
        },
        {
          uid: 'occupied-outcrop',
          inventoryID: Pieces.outcrop1,
          altitude: 1,
          rotation: 0,
          pieceCoords: center,
        },
      ],
      hexMap,
    )
    expect(occupied.mergedSeatedBaseCount).toBe(0)
    expect(occupied.boardPieces).toHaveLength(3)
  })

  it('leaves a plain Shadow 1 independent', () => {
    const plainBase: BoardPiece = {
      uid: 'plain-shadow',
      inventoryID: Pieces.shadow1,
      altitude: 0,
      rotation: 0,
      pieceCoords: center,
    }
    load([plainBase])
    expect(
      getSeatedGroupUIDs(
        plainBase.uid,
        store.getState().boardHexes,
        store.getState().boardPieces,
      ),
    ).toEqual([plainBase.uid])
    store.getState().movePiece({
      uid: plainBase.uid,
      newPieceCoords: at(6, 5),
    })
    expect(store.getState().boardPieces).toHaveLength(1)
    expect(store.getState().boardPieces[0]?.pieceCoords).toEqual(at(6, 5))
  })
})
