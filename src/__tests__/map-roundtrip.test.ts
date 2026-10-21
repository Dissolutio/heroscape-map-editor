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
  width: 22,
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
  it('rebuilds Laur add-on conflicts after JSON, autosave, and share-link round trips', () => {
    const laurPieces: BoardPiece[] = [
      {
        uid: 'edge-a',
        inventoryID: 'lws',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 3, r: 3, s: -6 },
      },
      {
        uid: 'edge-b',
        inventoryID: 'lws',
        altitude: 0,
        rotation: 3,
        pieceCoords: { q: 4, r: 3, s: -7 },
      },
    ]
    const piecesConflict = (pieces: BoardPiece[]) => {
      const addonUIDs = pieces
        .filter((piece) => piece.inventoryID === 'lws')
        .map((piece) => piece.uid)
      expect(computeConflictedPieceUIDs(pieces)).toEqual(
        expect.arrayContaining(addonUIDs),
      )
      expect(pieces.every((piece) => !('conflict' in piece))).toBe(true)
    }
    const savedFile = JSON.stringify({ hexMap, boardPieces: laurPieces })
    const fromFile = openJsonMapFile(savedFile)
    piecesConflict(fromFile.boardPieces)

    storageValues.clear()
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', localStorageMock)
    const autosave = createLocalMapAutosaveStorage()
    expect(autosave.save({ hexMap, boardPieces: laurPieces })).toEqual({
      ok: true,
    })
    const saved = loadMapFromLocalStorage(LS_KEYS.lastMap)
    if (!saved) throw new Error('Expected the Laur autosave to load')
    const normalized = normalizeBoardPiecesWithDropped(saved.boardPieces)
    const fromAutosave = buildupJsonFileMap(
      normalized.boardPieces,
      saved.hexMap,
      normalized.droppedPieces,
    )
    piecesConflict(fromAutosave.boardPieces)

    const crushed = getUrlMapString({ hexMap, boardPieces: laurPieces })
    const { m } = parseMapShareUrlParams(`https://hexoscape.com/?m=${crushed}`)
    if (m === null) throw new Error('Expected the Laur share payload')
    const decoded = parseMapDataArrayFromCrushed(m)
    const fromShare = buildupJsonFileMap(
      inflateBoardPiecesFromIds(decoded.boardPiecesEncodedArr),
      decoded.hexMap,
    )
    piecesConflict(fromShare.boardPieces)
  })

  it('grows a map for an overhanging piece and preserves the fit on reload', () => {
    const smallMap = { ...hexMap, width: 6, length: 6 }
    const edgePiece: BoardPiece = {
      uid: 'edge-land',
      inventoryID: 'g2',
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 4, r: 2, s: -6 },
    }
    const firstLoad = buildupJsonFileMap([edgePiece], smallMap)

    expect(firstLoad.dimensionsAdjusted).toBe(true)
    expect(firstLoad.hexMap.width).toBe(7)
    expect(firstLoad.boardPieces).toHaveLength(1)
    expect(firstLoad.boardPieces[0]?.pieceCoords).toEqual(edgePiece.pieceCoords)

    const savedMap = JSON.stringify({
      hexMap: firstLoad.hexMap,
      boardPieces: firstLoad.boardPieces,
    })
    const secondLoad = openJsonMapFile(savedMap)

    expect(secondLoad.dimensionsAdjusted).toBe(false)
    expect(secondLoad.hexMap).toEqual(firstLoad.hexMap)
    expect(pieceDetails(secondLoad.boardPieces)).toEqual(
      pieceDetails(firstLoad.boardPieces),
    )
  })

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
