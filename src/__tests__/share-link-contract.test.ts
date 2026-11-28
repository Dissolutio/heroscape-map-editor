/*
This pins the public share-link format that other apps rely on. If it fails,
you changed the format: bump the format version and keep old links loading,
don't just update the fixture.
*/
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { buildShareUrlWithFallback } from '../data/shareUrl'
import { parseMapDataArrayFromCrushed } from '../data/jsonCrush'
import type { BoardPiece, MapFileState } from '../types'
import { normalizeBoardPiecesWithDropped } from '../utils/map-utils'
import { getMapShareUrlParams } from '../utils/mapShareUrl'
import { warnAboutLoadedMap } from '../utils/warnAboutLoadedMap'

const fixture = JSON.parse(
  readFileSync(
    new URL('./fixtures/share-link-contract/map.json', import.meta.url),
    'utf8',
  ),
) as MapFileState
const expectedShareUrl = readFileSync(
  new URL('./fixtures/share-link-contract/share-url.txt', import.meta.url),
  'utf8',
).trim()
const baseUrl = 'https://hexoscape.com/hs'

function encodeShareUrl(boardPieces: BoardPiece[] = fixture.boardPieces) {
  const result = buildShareUrlWithFallback({
    hexMap: fixture.hexMap,
    boardPieces,
    baseUrl,
  })
  if ('error' in result) {
    throw new Error('Contract fixture unexpectedly exceeds the share URL limit')
  }
  return result
}

function loadShareUrl(url: string) {
  const { m } = getMapShareUrlParams(new URL(url).search)
  if (!m) throw new Error('Expected the share URL to contain map data')

  const { hexMap, boardPiecesEncodedArr } = parseMapDataArrayFromCrushed(m)
  const normalized = normalizeBoardPiecesWithDropped(boardPiecesEncodedArr)
  return buildupJsonFileMap(
    normalized.boardPieces,
    hexMap,
    normalized.droppedPieces,
  )
}

function savedPieceFields(pieces: BoardPiece[]) {
  return pieces
    .map(({ uid: _uid, ...piece }) => piece)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('public share-link contract', () => {
  it('encodes the fixture to the committed URL', () => {
    expect(encodeShareUrl()).toMatchObject({ removed: [] })
    expect(encodeShareUrl().url).toBe(expectedShareUrl)
  })

  it('decodes the committed URL through the map load path', () => {
    const loaded = loadShareUrl(expectedShareUrl)
    const {
      mapPortraitBase64: _portrait,
      mapNotes: _notes,
      ...expectedHexMap
    } = fixture.hexMap
    const { mapPortraitBase64, mapNotes, ...loadedShareHexMap } = loaded.hexMap

    expect(loaded.droppedPieces).toEqual([])
    expect(loadedShareHexMap).toEqual(expectedHexMap)
    expect(mapPortraitBase64).toBe('')
    expect(mapNotes).toBe('')
    expect(savedPieceFields(loaded.boardPieces)).toEqual(
      savedPieceFields(fixture.boardPieces),
    )
    // Share links regenerate piece UIDs; boardHexes and conflict/support state
    // are derived during load, while savedSelections are not encoded.
    expect(loaded.boardPieces.map((piece) => piece.uid)).not.toEqual(
      fixture.boardPieces.map((piece) => piece.uid),
    )
    expect(loaded.savedSelections).toEqual([])
  })

  it('drops and warns about an unknown piece ID without throwing', () => {
    const unknownPiece: BoardPiece = {
      uid: 'future-piece',
      inventoryID: 'unknown-future-id',
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 18, r: 12, s: -30 },
    }
    const shareUrl = encodeShareUrl([...fixture.boardPieces, unknownPiece]).url
    const loaded = loadShareUrl(shareUrl)
    const enqueueSnackbar = vi.fn()
    const consoleWarning = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)

    expect(() => warnAboutLoadedMap(enqueueSnackbar, loaded)).not.toThrow()
    expect(loaded.droppedPieces).toMatchObject([
      {
        inventoryID: 'unknown-future-id',
        reason: 'unknown',
      },
    ])
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('unknown-future-id'),
        variant: 'warning',
      }),
    )
    expect(consoleWarning).toHaveBeenCalledWith(
      'Dropped pieces on load',
      loaded.droppedPieces,
    )
  })
})
