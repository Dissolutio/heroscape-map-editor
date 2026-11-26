import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import buildupVSFileMap, { buildupJsonFileMap } from '../data/buildupMap'
import {
  pieceCodes,
  virtualscapeLaurPillarBaseName,
  virtualscapeNamedPieceCodes,
} from '../data/pieceCodes'
import {
  getHexoscapeLaurRotation,
  getHexoscapeRopeLadderAltitude,
  processVirtualScapeArrayBuffer,
  getVirtualscapeLaurRotation,
  getVirtualscapeLadderBattlementRotation,
  getVirtualscapeRopeLadderAltitude,
  getVirtualscapeShieldRotation,
} from '../data/readVirtualscapeMapFile'
import { getVirtualscapeAnchorOffset } from '../data/rotationTransforms'
import { piecesSoFar } from '../data/pieces'
import { virtualscapeTileMetadata } from '../data/virtualscapeTileMetadata'
import { writeVirtualscapeMap } from '../data/writeVirtualscapeMapFile'
import type { BoardPiece, HexMap, MapFileState } from '../types'
import { Pieces } from '../types'
import { hexUtilsOddRToCube } from '../utils/hex-utils'

const map: HexMap = {
  id: 'vs-export-test',
  name: 'Café 日本語 Map',
  author: 'Zoë Müller',
  shape: 'rectangle',
  length: 20,
  width: 20,
  mapNotes: 'Scenario — preserve the notes exactly.',
}

function makePiece(
  inventoryID: string,
  pieceCoords = { q: 2, r: 4, s: -6 },
  altitude = 0,
  rotation = 0,
  uid = `${inventoryID}-${rotation}`,
): BoardPiece {
  return { uid, inventoryID, pieceCoords, altitude, rotation }
}

function importWrittenMap(sourceMap: HexMap, boardPieces: BoardPiece[]) {
  const { buffer, skipped } = writeVirtualscapeMap(sourceMap, boardPieces)
  const parsed = processVirtualScapeArrayBuffer(buffer)
  const loaded = buildupVSFileMap(
    parsed.tiles,
    parsed.name,
    parsed.author,
    parsed.scenario,
  )
  return { parsed, loaded, skipped }
}

function pieceValues(boardPieces: BoardPiece[]) {
  return boardPieces
    .map(({ inventoryID, altitude, rotation, pieceCoords }) => ({
      inventoryID,
      altitude,
      rotation,
      pieceCoords,
    }))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

const fixtureBytes = (name: string) =>
  Uint8Array.from(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)))
    .buffer

describe('Virtualscape binary export', () => {
  it('round-trips map metadata, Unicode text, and ordinary coordinates', () => {
    const piece = makePiece(Pieces.grass1)
    const { parsed, loaded, skipped } = importWrittenMap(map, [piece])

    expect(skipped).toEqual([])
    expect(parsed).toMatchObject({
      version: 0.0007,
      name: map.name,
      author: map.author,
      scenario: map.mapNotes,
      tileCount: 1,
    })
    expect(loaded.hexMap).toMatchObject({
      name: map.name,
      author: map.author,
      mapNotes: map.mapNotes,
    })
    expect(pieceValues(loaded.boardPieces)).toEqual(pieceValues([piece]))
  })

  it('writes CStrings with the FF FE FF marker, like Virtualscape', () => {
    // Virtualscape refused files whose CStrings lacked FF FE FF: MFC read
    // the length as single-byte characters and the file misaligned.
    const { buffer } = writeVirtualscapeMap(
      { ...map, name: 'Ab', author: '' },
      [makePiece(Pieces.grass1, { q: 0, r: 0, s: 0 })],
    )
    const bytes = Array.from(new Uint8Array(buffer))
    // version (8 bytes), then name, author and player number
    expect(bytes.slice(8, 24)).toEqual([
      0xff, 0xfe, 0xff, 2, 0x41, 0, 0x62, 0, 0xff, 0xfe, 0xff, 0, 0xff, 0xfe,
      0xff, 0,
    ])
    // A Grass 1 at 0,0,0 exactly as Virtualscape wrote it in vs-all-tiles.hsc
    const hex = (text: string) =>
      text.split(' ').map((byte) => Number.parseInt(byte, 16))
    const grass1Record = [
      // type 1001, version 0.0003
      ...hex('e9 03 00 00 61 32 55 30 2a a9 33 3f'),
      // rotation, x, y, z, glyph letter
      ...Array(17).fill(0),
      // glyph name, start name, RGBA
      ...hex('ff fe ff 00 ff fe ff 00 00 a0 00 00'),
    ]
    expect(bytes.slice(-grass1Record.length)).toEqual(grass1Record)
  })

  it('inverts all import rotations and ladder altitude conversion', () => {
    for (let rotation = 0; rotation < 6; rotation += 1) {
      expect(
        getHexoscapeLaurRotation(
          Pieces.laurWallSquarePillar,
          getVirtualscapeLaurRotation(Pieces.laurWallSquarePillar, rotation),
        ),
      ).toBe(rotation)
    }

    for (let index = 0; index < 12; index += 1) {
      const rotation = index / 2
      for (const inventoryID of [
        Pieces.laurWallTrianglePillar,
        Pieces.laurWallLong,
        Pieces.laurWallArch,
        Pieces.laurWallRuin1,
        Pieces.laurWallRuin2,
        Pieces.laurWallRuin3,
        Pieces.laurWallShort,
      ]) {
        expect(
          getHexoscapeLaurRotation(
            inventoryID,
            getVirtualscapeLaurRotation(inventoryID, rotation),
          ),
        ).toBeCloseTo(rotation)
      }
      expect((getVirtualscapeShieldRotation(rotation) + 4.5) % 6).toBeCloseTo(
        rotation,
      )
    }

    for (let altitude = -2; altitude <= 8; altitude += 1) {
      expect(
        getHexoscapeRopeLadderAltitude(
          getVirtualscapeRopeLadderAltitude(altitude),
        ),
      ).toBe(altitude)
    }
    for (let rotation = 0; rotation < 6; rotation += 1) {
      expect((getVirtualscapeLadderBattlementRotation(rotation) + 5) % 6).toBe(
        rotation,
      )
    }
    expect(getHexoscapeLaurRotation(Pieces.laurWallRuin2, 8)).toBe(2)
  })

  it('uses the exact tile metadata from the fixture', () => {
    const fixtures = [
      processVirtualScapeArrayBuffer(fixtureBytes('vs-all-tiles.hsc')),
      processVirtualScapeArrayBuffer(
        fixtureBytes('vs-laur-addons-default.hsc'),
      ),
      processVirtualScapeArrayBuffer(fixtureBytes('vs-ticalla-jungle.hsc')),
    ]

    for (const metadata of virtualscapeTileMetadata) {
      expect(
        fixtures.some((fixture) =>
          fixture.tiles.some((tile) => {
            const color = tile.colorf.match(/\d+/g)?.map(Number)
            return (
              tile.type === metadata.type &&
              tile.virtualscapeName === metadata.name &&
              tile.glyphLetter.charCodeAt(0) === metadata.glyph &&
              color?.every((value, index) => value === metadata.color[index])
            )
          }),
        ),
        `${metadata.type} ${metadata.name}`,
      ).toBe(true)
    }
  })

  it('round-trips every code-table piece type', () => {
    const inventoryIDs = new Set<string>()
    for (const metadata of virtualscapeTileMetadata) {
      if (metadata.name === virtualscapeLaurPillarBaseName) continue
      const inventoryID = metadata.name
        ? virtualscapeNamedPieceCodes[metadata.name]
        : pieceCodes[String(metadata.type)]
      if (inventoryID && piecesSoFar[inventoryID]) {
        inventoryIDs.add(inventoryID)
      }
    }

    for (const inventoryID of inventoryIDs) {
      const isMarvelRuin =
        inventoryID === Pieces.marvel ||
        inventoryID === Pieces.marvelBroken ||
        inventoryID === Pieces.marvelNoUpper ||
        inventoryID === Pieces.marvelNoUpperBroken
      const altitude = isMarvelRuin ? 1 : 0
      const rotation = inventoryID === Pieces.deflectorShield ? 0.5 : 0
      const piece = makePiece(
        inventoryID,
        { q: 2, r: 4, s: -6 },
        altitude,
        rotation,
      )
      const pieces = [piece]
      if (isMarvelRuin) {
        pieces.push(
          makePiece(
            Pieces.concrete6,
            piece.pieceCoords,
            altitude - 1,
            rotation,
            `${inventoryID}-base`,
          ),
        )
      }
      const { loaded, skipped } = importWrittenMap(map, pieces)

      expect(skipped, inventoryID).toEqual([])
      expect(loaded.droppedPieces, inventoryID).toEqual([])
      expect(pieceValues(loaded.boardPieces), inventoryID).toEqual(
        pieceValues(pieces),
      )
    }
  })

  it('round-trips Void Mats at every rotation and linked Laur add-ons', () => {
    const pieces = Array.from({ length: 6 }, (_, rotation) =>
      makePiece(
        Pieces.voidMat,
        { q: rotation * 3, r: 4, s: -rotation * 3 - 4 },
        0,
        rotation,
        `mat-${rotation}`,
      ),
    )
    const pillar = makePiece(Pieces.laurWallSquarePillar, {
      q: 30,
      r: 4,
      s: -34,
    })
    const addon = makePiece(
      Pieces.laurWallRuin1,
      pillar.pieceCoords,
      0,
      3,
      'pillar-addon',
    )
    const { loaded, skipped } = importWrittenMap(map, [
      ...pieces,
      pillar,
      addon,
    ])

    expect(skipped).toEqual([])
    expect(pieceValues(loaded.boardPieces)).toEqual(
      pieceValues([...pieces, pillar, addon]),
    )
    for (let rotation = 0; rotation < 6; rotation += 1) {
      expect(getVirtualscapeAnchorOffset(Pieces.voidMat, rotation)).toEqual(
        expect.objectContaining({
          q: expect.any(Number),
          r: expect.any(Number),
        }),
      )
    }
  })

  it('round-trips edge coordinates and all land rotations', () => {
    for (const [x, y] of [
      [-20, -20],
      [-20, 20],
      [20, -20],
      [20, 20],
      [-1, 0],
      [0, -1],
    ]) {
      for (let rotation = 0; rotation < 6; rotation += 1) {
        const coords = hexUtilsOddRToCube(x, y)
        const piece = makePiece(Pieces.grass24, coords, 0, rotation)
        const { loaded, skipped } = importWrittenMap(map, [piece])

        expect(skipped).toEqual([])
        expect(pieceValues(loaded.boardPieces)).toEqual(pieceValues([piece]))
      }
    }
  })

  it('writes and restores objective markers, glyphs, and start zones', () => {
    const markerMap = {
      ...map,
      objectiveMarkers: [
        {
          uid: 'objective-one',
          anchor: { q: 2, r: 4, s: -6, altitude: 0 },
          size: 1 as const,
          rotation: 2 as const,
          style: 'black' as const,
          content: { kind: 'number' as const, value: 1 },
          name: 'Objective One',
        },
      ],
    }
    const pieces = [
      makePiece(Pieces.glyphPower, { q: 4, r: 4, s: -8 }),
      makePiece(Pieces.glyphTreasure, { q: 6, r: 4, s: -10 }),
      makePiece(Pieces.startZone3, { q: 8, r: 4, s: -12 }),
    ]
    const { parsed, loaded, skipped } = importWrittenMap(markerMap, pieces)

    expect(skipped).toEqual([])
    expect(parsed.tiles.map(({ type }) => type)).toEqual(
      expect.arrayContaining([14063, 28014, 15001, 15101]),
    )
    expect(parsed.tiles.find(({ type }) => type === 15001)?.colorf).toBe(
      'rgba(0,0,255,0)',
    )
    expect(loaded.hexMap.objectiveMarkers?.[0]).toMatchObject({
      name: 'Objective One',
      content: { kind: 'number', value: 1 },
      rotation: 2,
    })
    expect(pieceValues(loaded.boardPieces)).toEqual(pieceValues(pieces))
  })

  it('skips unsupported types once and writes valid remaining tiles', () => {
    const { parsed, loaded, skipped } = importWrittenMap(map, [
      makePiece(Pieces.grass1),
      makePiece('hexoscape-only-piece', { q: 8, r: 4, s: -12 }),
      makePiece('hexoscape-only-piece', { q: 10, r: 4, s: -14 }, 0, 0, 'other'),
    ])

    expect(skipped).toEqual([
      { inventoryID: 'hexoscape-only-piece', title: 'hexoscape-only-piece' },
    ])
    expect(parsed.tileCount).toBe(1)
    expect(loaded.droppedPieces).toEqual([])
    expect(loaded.boardPieces.map(({ inventoryID }) => inventoryID)).toEqual([
      Pieces.grass1,
    ])
  })

  it('skips the Concrete-6 seated beneath a Marvel Ruin', () => {
    const ruin = makePiece(Pieces.marvel, { q: 2, r: 4, s: -6 }, 1)
    const base = makePiece(Pieces.concrete6, ruin.pieceCoords, 0, 0, 'base')
    const { parsed, loaded, skipped } = importWrittenMap(map, [base, ruin])

    expect(skipped).toEqual([])
    expect(parsed.tiles.map(({ type }) => type)).toContain(11006)
    expect(parsed.tiles.map(({ type }) => type)).not.toContain(21006)
    expect(
      loaded.boardPieces.filter(
        ({ inventoryID }) => inventoryID === Pieces.concrete6,
      ),
    ).toHaveLength(1)
  })

  it('restores a Marvel base when absent and does not add a duplicate', () => {
    const source = processVirtualScapeArrayBuffer(
      writeVirtualscapeMap(map, [
        makePiece(Pieces.marvel, { q: 2, r: 4, s: -6 }, 1),
      ]).buffer,
    )
    const importedAlone = buildupVSFileMap(source.tiles, source.name)
    const marvel = source.tiles.find(({ type }) => type === 11006)
    expect(marvel).toBeDefined()
    if (!marvel) return
    const withExistingBase = buildupVSFileMap(
      [...source.tiles, { ...marvel, type: 21006, posZ: marvel.posZ - 1 }],
      source.name,
    )

    for (const loaded of [importedAlone, withExistingBase]) {
      expect(
        loaded.boardPieces.filter(
          ({ inventoryID }) => inventoryID === Pieces.concrete6,
        ),
      ).toHaveLength(1)
      expect(loaded.droppedPieces).toEqual([])
    }
  })

  it('round-trips Virtualscape fixtures', () => {
    for (const fixture of [
      'vs-all-tiles.hsc',
      'vs-laur-jungle.hsc',
      'vs-ticalla-jungle.hsc',
      'vs-laur-addons-default.hsc',
      'void-and-pylons-example.hsc',
      'void-mat-templates.hsc',
    ]) {
      const firstImport = processVirtualScapeArrayBuffer(fixtureBytes(fixture))
      const firstMap = buildupVSFileMap(
        firstImport.tiles,
        firstImport.name,
        firstImport.author,
        firstImport.scenario,
      )
      const { buffer, skipped } = writeVirtualscapeMap(
        firstMap.hexMap,
        firstMap.boardPieces,
      )
      const secondImport = processVirtualScapeArrayBuffer(buffer)
      const secondMap = buildupVSFileMap(
        secondImport.tiles,
        secondImport.name,
        secondImport.author,
        secondImport.scenario,
      )

      expect(skipped, fixture).toEqual([])
      expect(pieceValues(secondMap.boardPieces), fixture).toEqual(
        pieceValues(firstMap.boardPieces),
      )
      expect(secondMap.hexMap).toMatchObject({
        name: firstMap.hexMap.name,
        author: firstMap.hexMap.author,
        mapNotes: firstMap.hexMap.mapNotes,
      })
    }
  })

  it('round-trips the JSON map fixtures through Virtualscape', () => {
    for (const fixture of [
      'twin-irons-dockyard.json',
      'fortified-walls-and-ruins.json',
      'mountains-of-modi.json',
    ]) {
      const json = JSON.parse(
        readFileSync(new URL(`./fixtures/${fixture}`, import.meta.url), 'utf8'),
      ) as MapFileState
      const firstMap = buildupJsonFileMap(
        json.boardPieces,
        json.hexMap,
        [],
        json.savedSelections,
      )
      const { buffer, skipped } = writeVirtualscapeMap(
        firstMap.hexMap,
        firstMap.boardPieces,
      )
      const imported = processVirtualScapeArrayBuffer(buffer)
      const secondMap = buildupVSFileMap(
        imported.tiles,
        imported.name,
        imported.author,
        imported.scenario,
      )

      expect(skipped, fixture).toEqual([])
      expect(secondMap.droppedPieces, fixture).toEqual([])
      expect(pieceValues(secondMap.boardPieces), fixture).toEqual(
        pieceValues(firstMap.boardPieces),
      )
    }
  })
})
