import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import buildupVSFileMap from '../data/buildupMap'
import { pieceCodes } from '../data/pieceCodes'
import {
  getCodeForVSPersonalTile,
  readVirtualscapeMapFile,
} from '../data/readVirtualscapeMapFile'
import { getUnsupportedPieceUIDs } from '../data/unsupportedPieces'
import { getVoidMatHexes } from '../data/voidMat'
import { isLaurAddonSupported } from '../data/laurAddonSupport'
import { rebuildBoardStateFromPieces } from '../data/rebuildBoardState'
import { Pieces } from '../types'
import { hexUtilsOddRToCube } from '../utils/hex-utils'
import { warnAboutLoadedMap } from '../utils/warnAboutLoadedMap'

type VirtualscapeTileInput = {
  type: number
  rotation: number
  posX: number
  posY: number
  posZ: number
  virtualscapeName?: string
}

function makeVirtualscapeFile(
  tiles: VirtualscapeTileInput[],
  name = 'Virtualscape import',
) {
  const tileLength = 4 + 8 + 16 + 1 + 4 + 4 + 4
  const buffer = new ArrayBuffer(
    45 +
      name.length * 2 +
      tiles.reduce(
        (length, tile) =>
          length +
          tileLength +
          (tile.virtualscapeName ? 1 + tile.virtualscapeName.length * 2 : 0),
        0,
      ),
  )
  const view = new DataView(buffer)
  let offset = 0
  const setInt32 = (value: number) => {
    view.setInt32(offset, value, true)
    offset += 4
  }
  const setFloat64 = (value: number) => {
    view.setFloat64(offset, value, true)
    offset += 8
  }
  const setEmptyCString = () => {
    view.setUint8(offset, 0xff)
    view.setUint16(offset + 1, 0xfffe, true)
    view.setUint8(offset + 3, 0)
    offset += 4
  }
  const setCString = (value: string) => {
    view.setUint8(offset++, value.length)
    for (const character of value) {
      view.setInt16(offset, character.charCodeAt(0), true)
      offset += 2
    }
  }

  setFloat64(0.0007)
  setCString(name)
  setEmptyCString()
  setEmptyCString()
  setInt32(0)
  setInt32(6)
  setInt32(80)
  setInt32(1)
  setInt32(0)
  setInt32(1)
  setInt32(tiles.length)

  for (const tile of tiles) {
    setInt32(tile.type)
    setFloat64(0.0003)
    setInt32(tile.rotation)
    setInt32(tile.posX)
    setInt32(tile.posY)
    setInt32(tile.posZ)
    view.setUint8(offset++, 84)
    setEmptyCString()
    setEmptyCString()
    view.setUint8(offset++, 0)
    view.setUint8(offset++, 0)
    view.setUint8(offset++, 0)
    view.setUint8(offset++, 0)
    if (tile.virtualscapeName) setCString(tile.virtualscapeName)
  }
  return new File([buffer], 'sample.hsc')
}

class MemoryFileReader {
  result: ArrayBuffer | null = null
  error: DOMException | null = null
  onloadend: (() => void) | null = null
  onerror: (() => void) | null = null

  readAsArrayBuffer(file: File) {
    void file.arrayBuffer().then((buffer) => {
      this.result = buffer
      this.onloadend?.()
    })
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Virtualscape binary import', () => {
  it('reads supported codes, preserving positions and rotations with no drops', async () => {
    vi.stubGlobal('FileReader', MemoryFileReader)
    const file = makeVirtualscapeFile([
      { type: 1001, rotation: 2, posX: 1, posY: 3, posZ: 0 },
      { type: 2001, rotation: 5, posX: 4, posY: 2, posZ: 0 },
      { type: 3001, rotation: 3, posX: 6, posY: 4, posZ: 0 },
    ])

    const virtualscapeMap = await readVirtualscapeMapFile(file)
    const loaded = buildupVSFileMap(virtualscapeMap.tiles, virtualscapeMap.name)

    expect(virtualscapeMap).toMatchObject({
      version: 0.0007,
      name: 'Virtualscape import',
      tileCount: 3,
    })
    expect(virtualscapeMap.tiles.map((tile) => tile.type)).toEqual([
      1001, 2001, 3001,
    ])
    expect(pieceCodes['1001']).toBe(Pieces.grass1)
    expect(pieceCodes['2001']).toBe(Pieces.rock1)
    expect(pieceCodes['3001']).toBe(Pieces.sand1)
    expect(loaded.hexMap.name).toBe('Virtualscape import')
    expect(loaded.droppedPieces).toEqual([])
    expect(loaded.boardPieces).toHaveLength(3)
    expect(
      loaded.boardPieces.map(
        ({ inventoryID, altitude, rotation, pieceCoords }) => ({
          inventoryID,
          altitude,
          rotation,
          pieceCoords,
        }),
      ),
    ).toEqual([
      {
        inventoryID: Pieces.grass1,
        altitude: 0,
        rotation: 2,
        pieceCoords: hexUtilsOddRToCube(1, 3),
      },
      {
        inventoryID: Pieces.rock1,
        altitude: 0,
        rotation: 5,
        pieceCoords: hexUtilsOddRToCube(4, 2),
      },
      {
        inventoryID: Pieces.sand1,
        altitude: 0,
        rotation: 3,
        pieceCoords: hexUtilsOddRToCube(6, 4),
      },
    ])
  })

  it('imports the named Void and Pylons fixture with supported shields', async () => {
    vi.stubGlobal('FileReader', MemoryFileReader)
    const file = new File(
      [
        readFileSync(
          new URL('./fixtures/void-and-pylons-example.hsc', import.meta.url),
        ),
      ],
      'void-and-pylons-example.hsc',
    )
    const virtualscapeMap = await readVirtualscapeMapFile(file)
    const loaded = buildupVSFileMap(virtualscapeMap.tiles, virtualscapeMap.name)
    const count = (inventoryID: string) =>
      loaded.boardPieces.filter((piece) => piece.inventoryID === inventoryID)
        .length

    expect(virtualscapeMap).toMatchObject({
      version: 0.0007,
      tileCount: 33,
    })
    expect(
      virtualscapeMap.tiles.slice(0, 10).map((tile) => tile.virtualscapeName),
    ).toEqual(Array(10).fill('core.void_mat'))
    expect(virtualscapeMap.tiles[12].virtualscapeName).toBe('custom.pylon_2way')
    expect(getCodeForVSPersonalTile(virtualscapeMap.tiles[12])).toBe(
      Pieces.twoWayPylon,
    )
    expect({
      grass24: count(Pieces.grass24),
      voidMats: count(Pieces.voidMat),
      twoWayPylons: count(Pieces.twoWayPylon),
      threeWayPylons: count(Pieces.threeWayPylon),
      shields: count(Pieces.deflectorShield),
    }).toEqual({
      grass24: 2,
      voidMats: 10,
      twoWayPylons: 5,
      threeWayPylons: 7,
      shields: 9,
    })
    expect(loaded.droppedPieces).toEqual([])

    for (const [name, inventoryID] of [
      ['custom.pylon_2way', Pieces.twoWayPylon],
      ['custom.pylon_3way', Pieces.threeWayPylon],
    ] as const) {
      expect(
        loaded.boardPieces
          .filter((piece) => piece.inventoryID === inventoryID)
          .map((piece) => piece.rotation)
          .sort((a, b) => a - b),
      ).toEqual(
        virtualscapeMap.tiles
          .filter((tile) => tile.virtualscapeName === name)
          .map((tile) => tile.rotation)
          .sort((a, b) => a - b),
      )
    }

    const shields = loaded.boardPieces.filter(
      (piece) => piece.inventoryID === Pieces.deflectorShield,
    )
    expect(shields.map((piece) => piece.rotation)).toEqual([
      5.5, 5.5, 4.5, 0.5, 1.5, 4.5, 0.5, 2.5, 4.5,
    ])
    for (const shield of shields) {
      expect(
        isLaurAddonSupported({ boardPieces: loaded.boardPieces }, shield),
      ).toBe('supported')
    }
    expect(
      getUnsupportedPieceUIDs({
        boardPieces: loaded.boardPieces,
        boardHexes: loaded.boardHexes,
      }),
    ).toEqual([])
    expect(
      rebuildBoardStateFromPieces(loaded.boardPieces).conflictedPieceUIDs,
    ).toEqual([])
  })

  it('anchors Void Mats at the top-left hex of their ring', async () => {
    vi.stubGlobal('FileReader', MemoryFileReader)
    const file = new File(
      [
        readFileSync(
          new URL('./fixtures/void-and-pylons-example.hsc', import.meta.url),
        ),
      ],
      'void-and-pylons-example.hsc',
    )
    const virtualscapeMap = await readVirtualscapeMapFile(file)
    const loaded = buildupVSFileMap(virtualscapeMap.tiles, virtualscapeMap.name)
    const mats = loaded.boardPieces.filter(
      (piece) => piece.inventoryID === Pieces.voidMat,
    )

    expect(
      mats.slice(0, 6).map(({ pieceCoords, rotation }) => ({
        pieceCoords,
        rotation,
      })),
    ).toEqual([
      { pieceCoords: { q: 8, r: 5, s: -13 }, rotation: 0 },
      { pieceCoords: { q: 15, r: 5, s: -20 }, rotation: 1 },
      { pieceCoords: { q: 22, r: 7, s: -29 }, rotation: 2 },
      { pieceCoords: { q: 27, r: 9, s: -36 }, rotation: 3 },
      { pieceCoords: { q: 32, r: 8, s: -40 }, rotation: 4 },
      { pieceCoords: { q: 39, r: 6, s: -45 }, rotation: 5 },
    ])
  })

  it('puts each Void Mat on the hexes John marked', async () => {
    // John's VoidMatTemplates.hsc: one mat at each Virtualscape rotation
    // (0, 1, 2), lava on the hex he clicked, water on the 14 full hexes and
    // Wellspring Water on the ring of half hexes.
    vi.stubGlobal('FileReader', MemoryFileReader)
    const file = new File(
      [
        readFileSync(
          new URL('./fixtures/void-mat-templates.hsc', import.meta.url),
        ),
      ],
      'void-mat-templates.hsc',
    )
    const virtualscapeMap = await readVirtualscapeMapFile(file)
    const key = ({ q, r }: { q: number; r: number }) => `${q},${r}`
    const waterHexes = new Set(
      virtualscapeMap.tiles
        .filter((tile) => tile.type === 4001)
        .map((tile) => key(hexUtilsOddRToCube(tile.posX, tile.posY))),
    )
    expect(waterHexes.size).toBe(42)

    const loaded = buildupVSFileMap(virtualscapeMap.tiles, virtualscapeMap.name)
    const mats = loaded.boardPieces.filter(
      (piece) => piece.inventoryID === Pieces.voidMat,
    )
    const rotations = [...new Set(mats.map((mat) => mat.rotation))].sort()
    expect(rotations).toEqual([0, 1, 2])
    const footprint = new Set(mats.flatMap((mat) => getVoidMatHexes(mat)))
    expect(new Set([...footprint].map(key))).toEqual(waterHexes)
  })

  it('drops and warns with the name for an unknown named tile', async () => {
    vi.stubGlobal('FileReader', MemoryFileReader)
    const virtualscapeMap = await readVirtualscapeMapFile(
      makeVirtualscapeFile([
        {
          type: 28091,
          rotation: 0,
          posX: 2,
          posY: 2,
          posZ: 0,
          virtualscapeName: 'custom.unknown_tile',
        },
      ]),
    )
    const loaded = buildupVSFileMap(virtualscapeMap.tiles, virtualscapeMap.name)

    expect(loaded.boardPieces).toEqual([])
    expect(loaded.droppedPieces).toEqual([
      { inventoryID: 'custom.unknown_tile', reason: 'unknown' },
    ])

    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const enqueueSnackbar = vi.fn()
    warnAboutLoadedMap(enqueueSnackbar, loaded)
    expect(enqueueSnackbar).toHaveBeenCalledOnce()
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Skipped 1 unknown piece (custom.unknown_tile). Updating the app may let you load unknown pieces.',
        variant: 'warning',
      }),
    )
  })

  it('drops and warns for unknown Virtualscape codes without crashing', async () => {
    vi.stubGlobal('FileReader', MemoryFileReader)
    const virtualscapeMap = await readVirtualscapeMapFile(
      makeVirtualscapeFile([
        { type: 987654, rotation: 0, posX: 2, posY: 2, posZ: 0 },
      ]),
    )
    const loaded = buildupVSFileMap(virtualscapeMap.tiles, virtualscapeMap.name)

    expect(loaded.boardPieces).toEqual([])
    expect(loaded).toHaveProperty('droppedPieces', [
      { inventoryID: '987654', reason: 'unknown' },
    ])

    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const enqueueSnackbar = vi.fn()
    warnAboutLoadedMap(enqueueSnackbar, loaded)
    expect(enqueueSnackbar).toHaveBeenCalledOnce()
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Skipped 1 unknown piece (987654). Updating the app may let you load unknown pieces.',
        variant: 'warning',
      }),
    )
  })

  it('loads known pieces and reports unknown codes from a mixed file', async () => {
    vi.stubGlobal('FileReader', MemoryFileReader)
    const virtualscapeMap = await readVirtualscapeMapFile(
      makeVirtualscapeFile([
        { type: 1001, rotation: 2, posX: 1, posY: 3, posZ: 0 },
        { type: 987654, rotation: 0, posX: 4, posY: 2, posZ: 0 },
      ]),
    )

    const loaded = buildupVSFileMap(virtualscapeMap.tiles, virtualscapeMap.name)

    expect(loaded.boardPieces).toHaveLength(1)
    expect(loaded.boardPieces[0]).toMatchObject({
      inventoryID: Pieces.grass1,
      rotation: 2,
      pieceCoords: hexUtilsOddRToCube(1, 3),
    })
    expect(loaded.droppedPieces).toEqual([
      { inventoryID: '987654', reason: 'unknown' },
    ])

    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const enqueueSnackbar = vi.fn()
    warnAboutLoadedMap(enqueueSnackbar, loaded)
    expect(enqueueSnackbar).toHaveBeenCalledOnce()
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Skipped 1 unknown piece (987654). Updating the app may let you load unknown pieces.',
        variant: 'warning',
      }),
    )
  })
})
