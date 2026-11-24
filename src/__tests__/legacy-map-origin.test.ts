import { createStore } from 'zustand/vanilla'
import { describe, expect, it, vi } from 'vitest'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import { buildupJsonFileMap } from '../data/buildupMap'
import { normalizeLegacyMapOrigin } from '../data/convertMapShape'
import { parseMapDataArrayFromCrushed } from '../data/jsonCrush'
import { createMapAutosave } from '../local-storage/mapAutosave'
import type { AppState } from '../store/store'
import type { BoardPiece, HexMap } from '../types'
import { HEXGRID_HEX_APOTHEM } from '../utils/constants'
import {
  cubeToPixel,
  hexUtilsGenHexagonGrid,
  hexUtilsGenRectangleGrid,
} from '../utils/hex-utils'
import { mapTableHexes } from '../data/fitMapToPieces'
import { genBoardHexID, inflateBoardPiecesFromIds } from '../utils/map-utils'
import { parseMapShareUrlParams } from '../utils/mapShareUrl'
import oldConvertedHexagonFixture from './fixtures/old-converted-hexagon.json'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const oldConvertedHexagonShareUrl =
  "https://hexoscape.com/hs?m=%5B('id!'TwWekKigrJ8c_Fname!'%D9%85%D9%86%D8%A7%D8%B1%D8%A9%20%D8%BA%D8%B2%D8%A9Fauthor!'dissolutioFmapNotes!'Fversion!1~shape!'hexagonFwidth!14~length!14~setsUsed!%5B%5D~objectiveMarkers!%5B%5D~originQ!-2~originR!-4~mapPortraitBase64!'')~0OA5z*2*lp14A5C4Hs2A3C5Gr7A12*7Gs7A9zLYA5C5*2*wwX6C7Hs7A9C5*5E8C8*5E4C7*5E6C5HwwX5*3Gg24A9*7Ig24A5C7*3E5C6GYA9fLs2A4ZIr2A2ZIr2A1*6Lg7A6qIs3A10fGwwX-4qLr7A7qLlp14A13ZLrX11C0CE13C0CE10ZLgX4C4LsX6C4LsX7zLsX8C4CE7C5GYA7C4GgX10qHYA12C0GgX12fGsX0zLg7A0ZLg3A-3zS*g7A-5C7S*g7A1C4IwwX0C5IwwX-3fIg7A-2C6IgX11*7HwwX10*7SE12*6S*s2A13*6S*s2A12SS*r7A11*5GrX-1ZHgX-3C4HgX-4C4HgX-5C5HgX11*0Lg3A13*0Lg3A14G0*g3A11*6S*wwX10G4E9L4E12G4E1*8HrX10*8*3E9*8*3E8q*0E9C0CE10C0*5E8f*5E8z*5E1C5LslA8*8SE11zIr3A8C0*3E7f*3E7C0IrX3C4*2*g2A14SSE14H4E4zGgX9ZIs2A16L3E15L3E15*2Iw1V*8fLsbV*8ZGYVOVC0ZGYV*2*8HlwpVI9HlwpVqZLYV*0zLg7VG6Lg3VSSGr3VfCLr24VC4G0*g2VqSS*r7VC4L4*g1VzL4*g1VzG4*g1V*-5C4HcnV*-3C6HcnV*-3C0GcnVL6DSC7D*8C8DZC5D*7fDfzDzC0DfC0DZCD*7*2DH3D*3C6GYVC4SDq*0D*6C7Hr2VC6CD*6C8Hr2VC0*8IslF2OF2*0zLg7F2C5G2*r3F2ZSHlwpF2G6Gy1F3OF4OF5OF6CC0Gg2F6*7ZIr1F6ZfLYF6*2C5LYF6*2C4HYF6CfIr2F6CzS*r24F7ZZIYF7*5fLlwpF7SqS*g2F7*3qLlwpF8SqS*g2F9SqS*g2V0SfLlwpV0SqLg1V1SqLg1V2SqLlwpVI9*3.5*lwlF2ZS*2*lwrF2ZS*0.5*lwrF6*2C5GrlF6ZqGrlF6CC0IrlF6*0f*2*rlF6*6C0GrlF7*6*6Hrl'%5D*%2C'AF0*L1DGy1VE*wXF'~G*0*H*5*I*3*LC*O*0fHg24S*4VF1X1AYwd2Z*9fC1qC2zC3%01zqfZYXVSOLIHGFEDCA*_"

type SavedMapFixture = { hexMap: HexMap; boardPieces: BoardPiece[] }

const fixture = oldConvertedHexagonFixture as SavedMapFixture

function loadShareUrl() {
  const parsed = getShareData()
  return buildupJsonFileMap(
    inflateBoardPiecesFromIds(parsed.boardPiecesEncodedArr),
    parsed.hexMap,
  )
}

function getShareData() {
  const { m } = parseMapShareUrlParams(oldConvertedHexagonShareUrl)
  if (!m) throw new Error('Expected the shared map payload')
  return parseMapDataArrayFromCrushed(m)
}

function pieceDetails(pieces: BoardPiece[]) {
  return pieces
    .map(({ uid: _uid, pieceCoords, ...piece }) => ({
      ...piece,
      pieceCoords,
    }))
    .sort(
      (a, b) =>
        a.inventoryID.localeCompare(b.inventoryID) ||
        a.pieceCoords.q - b.pieceCoords.q ||
        a.pieceCoords.r - b.pieceCoords.r ||
        a.altitude - b.altitude ||
        a.rotation - b.rotation,
    )
}

function translatedPieceDetails(pieces: BoardPiece[]) {
  return pieceDetails(
    pieces.map((piece) => ({
      ...piece,
      pieceCoords: {
        q: piece.pieceCoords.q + 2,
        r: piece.pieceCoords.r + 4,
        s: piece.pieceCoords.s - 6,
      },
    })),
  )
}

function createHexagonMap(): HexMap {
  return {
    ...fixture.hexMap,
    originQ: -2,
    originR: -4,
  }
}

describe('legacy map origins', () => {
  function expectNormalizedJohnMap(
    loaded: ReturnType<typeof buildupJsonFileMap>,
    originalPieces: BoardPiece[],
  ) {
    expect(loaded.hexMap).not.toHaveProperty('originQ')
    expect(loaded.hexMap).not.toHaveProperty('originR')
    expect(loaded.hexMap).toMatchObject({
      shape: 'hexagon',
      length: 14,
      width: 14,
    })

    const expectedTableIDs = hexUtilsGenHexagonGrid(13).map((coords) =>
      genBoardHexID({ ...coords, altitude: 0 }),
    )
    expect([...mapTableHexes(loaded.hexMap)].sort()).toEqual(
      expectedTableIDs.sort(),
    )

    expect(pieceDetails(loaded.boardPieces)).toEqual(
      translatedPieceDetails(originalPieces),
    )
    expect(computeConflictedPieceUIDs(loaded.boardPieces)).toHaveLength(
      computeConflictedPieceUIDs(
        buildupJsonFileMap(originalPieces, {
          ...createHexagonMap(),
          originQ: 0,
          originR: 0,
        }).boardPieces,
      ).length,
    )

    const worldCenters = Object.values(loaded.boardHexes)
      .filter(({ id }) => expectedTableIDs.includes(id))
      .map(cubeToPixel)
    const minX = Math.min(...worldCenters.map(({ x }) => x))
    const minZ = Math.min(...worldCenters.map(({ y }) => y))
    expect(minX - HEXGRID_HEX_APOTHEM).toBeCloseTo(0)
    expect(minZ).toBe(0)
  }

  it('moves the saved-map fixture onto the new-map axes', () => {
    expectNormalizedJohnMap(
      buildupJsonFileMap(fixture.boardPieces, fixture.hexMap),
      fixture.boardPieces,
    )
  })

  it('decodes the share link and moves it onto the new-map axes', () => {
    expectNormalizedJohnMap(
      loadShareUrl(),
      inflateBoardPiecesFromIds(getShareData().boardPiecesEncodedArr),
    )
  })

  it('moves objective markers and start zones with the same hexagon offset', () => {
    const marker = {
      uid: 'objective',
      anchor: { q: 1, r: 2, s: -3, altitude: 4 },
      size: 1 as const,
      rotation: 0 as const,
      style: 'black' as const,
      content: { kind: 'text' as const, value: 'A' },
      name: 'Objective',
    }
    const startZone: BoardPiece = {
      uid: 'start-zone',
      inventoryID: 'z1',
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 1, r: 2, s: -3 },
    }

    const normalized = normalizeLegacyMapOrigin(
      { ...createHexagonMap(), objectiveMarkers: [marker] },
      [startZone],
    )

    expect(normalized.hexMap.objectiveMarkers?.[0]?.anchor).toEqual({
      q: 3,
      r: 6,
      s: -9,
      altitude: 4,
    })
    expect(normalized.boardPieces[0]?.pieceCoords).toEqual({
      q: 3,
      r: 6,
      s: -9,
    })
  })

  it('normalizes an even-row-offset rectangle when all footprints fit', () => {
    const hexMap: HexMap = {
      id: 'even-row-rectangle',
      name: 'Even row rectangle',
      author: '',
      version: 1,
      shape: 'rectangle',
      length: 4,
      width: 4,
      originQ: -3,
      originR: 2,
    }
    const firstHex = hexUtilsGenRectangleGrid(4, 4, -3, 2)[0]
    if (!firstHex) throw new Error('Expected a rectangle table hex')
    const piece: BoardPiece = {
      uid: 'first-piece',
      inventoryID: 'g1',
      altitude: 0,
      rotation: 0,
      pieceCoords: firstHex,
    }

    const loaded = buildupJsonFileMap([piece], hexMap)

    expect(loaded.hexMap).not.toHaveProperty('originQ')
    expect(loaded.hexMap).not.toHaveProperty('originR')
    expect(loaded.hexMap).toMatchObject({ length: 4, width: 4 })
    expect(loaded.boardPieces[0]?.pieceCoords).toEqual({
      q: 0,
      r: 0,
      s: 0,
    })
    expect([...mapTableHexes(loaded.hexMap)].sort()).toEqual(
      hexUtilsGenRectangleGrid(4, 4)
        .map((coords) => genBoardHexID({ ...coords, altitude: 0 }))
        .sort(),
    )
  })

  it('leaves an even-row rectangle unchanged when a footprint will not fit', () => {
    const hexMap: HexMap = {
      id: 'outside-rectangle',
      name: 'Outside rectangle',
      author: '',
      version: 1,
      shape: 'rectangle',
      length: 4,
      width: 4,
      originQ: -3,
      originR: 2,
    }
    const piece: BoardPiece = {
      uid: 'outside-piece',
      inventoryID: 'g1',
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 100, r: 2, s: -102 },
    }

    const normalized = normalizeLegacyMapOrigin(hexMap, [piece])

    expect(normalized.hexMap).toBe(hexMap)
    expect(normalized.boardPieces[0]).toBe(piece)
  })

  it('leaves an odd-row-offset rectangle unchanged', () => {
    const hexMap: HexMap = {
      id: 'odd-row-rectangle',
      name: 'Odd row rectangle',
      author: '',
      version: 1,
      shape: 'rectangle',
      length: 4,
      width: 4,
      originQ: -3,
      originR: 1,
    }
    const firstHex = hexUtilsGenRectangleGrid(4, 4, -3, 1)[0]
    if (!firstHex) throw new Error('Expected a rectangle table hex')
    const piece: BoardPiece = {
      uid: 'odd-row-piece',
      inventoryID: 'g1',
      altitude: 0,
      rotation: 0,
      pieceCoords: firstHex,
    }

    const normalized = normalizeLegacyMapOrigin(hexMap, [piece])
    const loaded = buildupJsonFileMap([piece], hexMap)

    expect(normalized).toEqual({ hexMap, boardPieces: [piece] })
    expect(loaded.hexMap).toEqual(hexMap)
    expect(loaded.boardPieces[0]?.pieceCoords).toEqual(piece.pieceCoords)
  })

  it('does not alter a map without an origin', () => {
    const hexMap: HexMap = {
      id: 'no-origin',
      name: 'No origin',
      author: '',
      version: 1,
      shape: 'rectangle',
      length: 4,
      width: 4,
    }
    const boardPieces: BoardPiece[] = []

    const normalized = normalizeLegacyMapOrigin(hexMap, boardPieces)
    expect(normalized.hexMap).toBe(hexMap)
    expect(normalized.boardPieces).toBe(boardPieces)

    const loaded = buildupJsonFileMap(boardPieces, hexMap)
    expect(loaded.hexMap).toEqual(hexMap)
    expect(loaded.boardPieces).toEqual(boardPieces)
  })

  it('does not autosave a share-link load with an old origin', async () => {
    const store = await createTestStore()
    const save = vi.fn(() => ({ ok: true as const }))
    createMapAutosave(store, {
      storage: { load: () => null, save },
      onError: vi.fn(),
    })

    store.getState().loadMap(loadShareUrl(), { holdAutosave: true })

    expect(save).not.toHaveBeenCalled()
  })
})

async function createTestStore() {
  vi.resetModules()
  const [
    { default: createMapSlice },
    { default: createUISlice },
    { default: createActionLogSlice },
  ] = await Promise.all([
    import('../store/map-slice'),
    import('../store/ui-slice'),
    import('../store/action-log-slice'),
  ])
  return createStore<AppState>()((...args) => ({
    ...createMapSlice(...args),
    ...createUISlice(...args),
    ...createActionLogSlice(...args),
  }))
}
