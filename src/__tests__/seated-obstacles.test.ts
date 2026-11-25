import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { getDraggableSelectionGroup } from '../data/dragMove'
import getPieceTemplateCoords from '../data/rotationTransforms'
import { getSeatedGroupUIDs } from '../data/seatedObstacles'
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

function outcrop3Seat(): BoardPiece[] {
  const coordinates = getPieceTemplateCoords({
    clickedHex: center,
    rotation: 0,
    template: '3',
    isVsTile: false,
  })
  return [
    ...coordinates.map((pieceCoords, index) => ({
      uid: `base-${index}`,
      inventoryID: Pieces.shadow1,
      altitude: 0,
      rotation: 0,
      pieceCoords,
    })),
    {
      uid: 'outcrop',
      inventoryID: Pieces.outcrop3,
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
  it('derives the seat group and selects it from either member', () => {
    load(outcrop3Seat())
    const { boardHexes, boardPieces } = store.getState()
    const groupUIDs = ['outcrop', 'base-0', 'base-1', 'base-2']
    expect(getSeatedGroupUIDs('outcrop', boardHexes, boardPieces)).toEqual(
      groupUIDs,
    )
    expect(getSeatedGroupUIDs('base-1', boardHexes, boardPieces)).toEqual(
      groupUIDs,
    )

    store.getState().toggleSelectedPieceID('base-1')
    expect(store.getState().selectedPieceIDs).toEqual(groupUIDs)
    expect(
      getDraggableSelectionGroup(
        store.getState().selectedPieceIDs,
        'outcrop',
        store.getState().boardPieces,
      )?.map((piece) => piece.uid),
    ).toEqual(groupUIDs)
  })

  it('moves and rotates the outcrop with all bases in one undo step', () => {
    load(outcrop3Seat())
    const before = snapshot()
    const beforeHistory = store.temporal.getState().pastStates.length
    store.getState().movePiece({
      uid: 'outcrop',
      newPieceCoords: at(6, 6),
      newRotation: 1,
    })

    const after = store.getState()
    expect(after.boardPieces.map((piece) => piece.uid)).toEqual([
      'base-0',
      'base-1',
      'base-2',
      'outcrop',
    ])
    expect(
      getSeatedGroupUIDs('outcrop', after.boardHexes, after.boardPieces),
    ).toEqual(['outcrop', 'base-0', 'base-1', 'base-2'])
    expect(store.temporal.getState().pastStates.length).toBe(beforeHistory + 1)

    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
  })

  it('deleting a base removes the whole seat in one undo step', () => {
    load(outcrop3Seat())
    const before = snapshot()
    const beforeHistory = store.temporal.getState().pastStates.length
    store.getState().unpaintTile('base-1')

    expect(store.getState().boardPieces).toEqual([])
    expect(store.temporal.getState().pastStates.length).toBe(beforeHistory + 1)
    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
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
