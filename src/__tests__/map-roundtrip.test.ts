import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap, type JsonMapLoadResult } from '../data/buildupMap'
import {
  getUrlMapString,
  parseMapDataArrayFromCrushed,
} from '../data/jsonCrush'
import { createLocalMapAutosaveStorage } from '../local-storage/mapAutosave'
import { LS_KEYS } from '../local-storage/keys'
import type { BoardPiece, HexMap, MapFileState } from '../types'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import {
  inflateBoardPiecesFromIds,
  normalizeBoardPiecesWithDropped,
} from '../utils/map-utils'
import { parseMapShareUrlParams } from '../utils/mapShareUrl'
import { loadMapFromLocalStorage } from '../local-storage/get-local-item'

const hexMap: HexMap = {
  id: 'roundtrip-map',
  name: 'Several terrain families',
  author: 'Test Builder',
  version: 1,
  shape: 'rectangle',
  width: 20,
  length: 20,
}

const boardPieces: BoardPiece[] = [
  {
    uid: 'grass-first',
    inventoryID: 'g1',
    altitude: 0,
    rotation: 0,
    pieceCoords: { q: 2, r: 2, s: -4 },
  },
  {
    uid: 'grass-overlap',
    inventoryID: 'g1',
    altitude: 0,
    rotation: 3,
    pieceCoords: { q: 2, r: 2, s: -4 },
  },
  {
    uid: 'multi-land',
    inventoryID: 'g2',
    altitude: 0,
    rotation: 2,
    pieceCoords: { q: 5, r: 4, s: -9 },
  },
  {
    uid: 'tree-obstacle',
    inventoryID: 'tr10',
    altitude: 1,
    rotation: 4,
    pieceCoords: { q: 10, r: 8, s: -18 },
  },
  {
    uid: 'power-glyph',
    inventoryID: 'y0',
    altitude: 1,
    rotation: 0,
    pieceCoords: { q: 15, r: 8, s: -23 },
  },
  {
    uid: 'start-zone',
    inventoryID: 'z1',
    altitude: 1,
    rotation: 0,
    pieceCoords: { q: 15, r: 12, s: -27 },
  },
]

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

function openJsonMapFile(serialized: string): JsonMapLoadResult {
  const fileData = JSON.parse(serialized) as MapFileState
  const normalized = normalizeBoardPiecesWithDropped(fileData.boardPieces)
  return buildupJsonFileMap(
    normalized.boardPieces,
    fileData.hexMap,
    normalized.droppedPieces,
  )
}

function pieceDetails(pieces: BoardPiece[]) {
  return pieces
    .map(({ uid: _uid, ...piece }) => piece)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

function expectMapDetails(loaded: JsonMapLoadResult) {
  expect(loaded.droppedPieces).toEqual([])
  expect(loaded.hexMap).toMatchObject({
    id: hexMap.id,
    name: hexMap.name,
    author: hexMap.author,
    shape: hexMap.shape,
    width: hexMap.width,
    length: hexMap.length,
  })
  expect(pieceDetails(loaded.boardPieces)).toEqual(pieceDetails(boardPieces))
  expect(computeConflictedPieceUIDs(loaded.boardPieces)).toHaveLength(2)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('map persistence round trips', () => {
  it('saves and reopens the JSON file format with rebuilt conflicts', () => {
    const savedFile = JSON.stringify({ hexMap, boardPieces })
    const loaded = openJsonMapFile(savedFile)

    expectMapDetails(loaded)
    expect(loaded.boardPieces.map((piece) => piece.uid)).toEqual(
      boardPieces.map((piece) => piece.uid),
    )
  })

  it('saves and reloads the local autosave format with rebuilt occupancy', () => {
    storageValues.clear()
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', localStorageMock)

    const autosave = createLocalMapAutosaveStorage()
    expect(autosave.load()).toBeNull()
    expect(autosave.save({ hexMap, boardPieces })).toEqual({ ok: true })
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      LS_KEYS.lastMap,
      expect.any(String),
    )

    const saved = loadMapFromLocalStorage(LS_KEYS.lastMap)
    if (!saved) throw new Error('Expected the autosaved map to load')
    const normalized = normalizeBoardPiecesWithDropped(saved.boardPieces)
    const loaded = buildupJsonFileMap(
      normalized.boardPieces,
      saved.hexMap,
      normalized.droppedPieces,
    )

    expectMapDetails(loaded)
    expect(loaded.boardPieces.map((piece) => piece.uid)).toEqual(
      boardPieces.map((piece) => piece.uid),
    )
  })

  it('crushes and reopens a share URL with multiple piece families', () => {
    const crushed = getUrlMapString({ hexMap, boardPieces })
    const { m } = parseMapShareUrlParams(`https://hexoscape.com/?m=${crushed}`)
    if (m === null) throw new Error('Expected a shared map payload')

    const decoded = parseMapDataArrayFromCrushed(m)
    const loaded = buildupJsonFileMap(
      inflateBoardPiecesFromIds(decoded.boardPiecesEncodedArr),
      decoded.hexMap,
    )

    expectMapDetails(loaded)
    expect(loaded.boardPieces.map((piece) => piece.uid)).not.toEqual(
      boardPieces.map((piece) => piece.uid),
    )
  })
})
