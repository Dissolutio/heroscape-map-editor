import { afterEach, describe, expect, it, vi } from 'vitest'
import buildupVSFileMap from '../data/buildupMap'
import { pieceCodes } from '../data/pieceCodes'
import { readVirtualscapeMapFile } from '../data/readVirtualscapeMapFile'
import type { JsonMapLoadResult } from '../data/buildupMap'
import { Pieces } from '../types'
import { hexUtilsOddRToCube } from '../utils/hex-utils'
import { warnAboutLoadedMap } from '../utils/warnAboutLoadedMap'

type VirtualscapeTileInput = {
  type: number
  rotation: number
  posX: number
  posY: number
  posZ: number
}

function makeVirtualscapeFile(
  tiles: VirtualscapeTileInput[],
  name = 'Virtualscape import',
) {
  const tileLength = 4 + 8 + 16 + 1 + 4 + 4 + 4
  const buffer = new ArrayBuffer(
    45 + name.length * 2 + tiles.length * tileLength,
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
  vi.unstubAllGlobals()
})

describe('Virtualscape binary import', () => {
  it('reads supported codes and preserves known pieces, coordinates, and rotations', async () => {
    vi.stubGlobal('FileReader', MemoryFileReader)
    const file = makeVirtualscapeFile([
      { type: 1001, rotation: 2, posX: 1, posY: 3, posZ: 0 },
      { type: 2001, rotation: 5, posX: 4, posY: 2, posZ: 0 },
      { type: 3001, rotation: 3, posX: 6, posY: 4, posZ: 0 },
      { type: 987654, rotation: 0, posX: 8, posY: 5, posZ: 0 },
    ])

    const virtualscapeMap = await readVirtualscapeMapFile(file)
    const loaded = buildupVSFileMap(virtualscapeMap.tiles, virtualscapeMap.name)

    expect(virtualscapeMap).toMatchObject({
      version: 0.0007,
      name: 'Virtualscape import',
      tileCount: 4,
    })
    expect(virtualscapeMap.tiles.map((tile) => tile.type)).toEqual([
      1001, 2001, 3001, 987654,
    ])
    expect(pieceCodes['1001']).toBe(Pieces.grass1)
    expect(pieceCodes['2001']).toBe(Pieces.rock1)
    expect(pieceCodes['3001']).toBe(Pieces.sand1)
    expect(loaded.hexMap.name).toBe('Virtualscape import')
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

  it.fails(
    'KNOWN GAP: Virtualscape unknown codes are discarded without a dropped-piece warning',
    async () => {
      vi.stubGlobal('FileReader', MemoryFileReader)
      const virtualscapeMap = await readVirtualscapeMapFile(
        makeVirtualscapeFile([
          { type: 987654, rotation: 0, posX: 2, posY: 2, posZ: 0 },
        ]),
      )
      const loaded = buildupVSFileMap(
        virtualscapeMap.tiles,
        virtualscapeMap.name,
      )

      expect(loaded).toHaveProperty('droppedPieces', [
        { inventoryID: '987654', reason: 'unknown' },
      ])

      const enqueueSnackbar = vi.fn()
      warnAboutLoadedMap(enqueueSnackbar, loaded as JsonMapLoadResult)
      expect(enqueueSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            'Skipped 1 unknown piece (987654). Updating the app may let you load unknown pieces.',
          variant: 'warning',
        }),
      )
    },
  )
})
