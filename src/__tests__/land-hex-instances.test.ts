import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { cloneBoard, makeTable, place, type Board } from './helpers/board'
import { HexTerrain, Pieces, type BoardHex } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { HEXGRID_HEX_RADIUS } from '../utils/constants'
import { parseTerrainTextureManifest } from '../world/textures/terrainTextureManifest'
import {
  buildLandHexInstanceIndex,
  buildLandHexInstanceData,
  getLandHexCapUV,
  getLandHexColors,
  getLandHexDisplayColors,
  getLandHexInstanceIDs,
  getLandHexHighlightValue,
  getLandHexManifestTerrainName,
  getLandHexSideUV,
  getLandHexTextureLayers,
  getLandHexHoverTransition,
  getLandHexSideVisibilityMask,
  LAND_HEX_TEXTURE_TERRAIN_NAMES,
  LAND_HEX_UNTEXTURED_TERRAINS,
  NON_INSTANCED_SUBTERRAIN_PIECES,
} from '../world/models/landHexInstances'

const terrainManifest = parseTerrainTextureManifest(
  JSON.parse(
    readFileSync(
      new URL('../../public/textures/manifest.json', import.meta.url),
      'utf8',
    ),
  ) as unknown,
)

const genericColors = {
  genericSolidCapColor: '#e63cc8',
  genericSolidSideColor: '#a01e8c',
  genericFluidCapColor: '#ff96e6',
  genericFluidSideColor: '#c864b4',
}

describe('land hex instance data', () => {
  it('creates one instance per supported land hex with surface levels', () => {
    const table = makeTable(9)
    const first = place({
      board: table,
      pieceID: Pieces.grass1,
      at: table.center,
      altitude: 0,
    })

    const second = place({
      board: first.board,
      pieceID: Pieces.genericFluid1,
      at: {
        q: table.center.q + 3,
        r: table.center.r,
        s: table.center.s - 3,
      },
      altitude: 0,
    })
    const data = buildLandHexInstanceData(
      second.board.boardHexes,
      second.board.boardPieces,
      1,
      genericColors,
    )

    expect(data).toHaveLength(2)
    expect(
      getLandHexInstanceIDs(
        second.board.boardHexes,
        second.board.boardPieces,
        1,
      ).sort(),
    ).toEqual(data.map(({ hex }) => hex.id).sort())
    expect(data.map(({ isFluid }) => isFluid)).toEqual([false, true])
    expect(data.map(({ levels }) => levels)).toEqual([1, 1])
    expect(
      data.map(({ capLayer, sideLayer }) => [capLayer, sideLayer]),
    ).toEqual([
      [-1, -1],
      [-1, -1],
    ])
    expect(
      buildLandHexInstanceData(
        second.board.boardHexes,
        second.board.boardPieces,
        0,
        genericColors,
      ),
    ).toHaveLength(0)
  })

  it('maps every drawable land terrain or lists it as untextured', () => {
    const landTerrains = Object.values(HexTerrain).filter(
      (terrain) => isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain),
    )
    const declaredTerrains = [
      ...Object.keys(LAND_HEX_TEXTURE_TERRAIN_NAMES),
      ...LAND_HEX_UNTEXTURED_TERRAINS,
    ]

    expect(new Set(declaredTerrains)).toEqual(new Set(landTerrains))
    for (const terrain of landTerrains) {
      const manifestName = getLandHexManifestTerrainName(terrain)
      if (manifestName) {
        expect(terrainManifest.terrains[manifestName]).toBeDefined()
      } else {
        expect(LAND_HEX_UNTEXTURED_TERRAINS).toContain(terrain)
      }
    }
  })

  it('selects manifest diffuse layers for each tier and keeps flat terrains untextured', () => {
    for (const [terrain, manifestName] of Object.entries(
      LAND_HEX_TEXTURE_TERRAIN_NAMES,
    )) {
      const manifestTerrain = terrainManifest.terrains[manifestName]
      expect(
        getLandHexTextureLayers(
          terrain,
          'stable-hex',
          terrainManifest,
          'medium',
        ),
      ).toMatchObject({
        capLayer: manifestTerrain.capDiffuseLayer,
        sideLayer: manifestTerrain.sideDiffuseLayer,
        capNormalLayer: -1,
        capOrmLayer: -1,
        sideNormalLayer: -1,
        sideOrmLayer: -1,
      })
      expect(
        getLandHexTextureLayers(terrain, 'stable-hex', terrainManifest, 'high'),
      ).toMatchObject({
        capLayer: manifestTerrain.capDiffusePbrLayer,
        sideLayer: manifestTerrain.sideDiffuseLayer,
        capNormalLayer: manifestTerrain.capNormalLayer,
        capOrmLayer: manifestTerrain.capOrmLayer,
        sideNormalLayer: manifestTerrain.sideNormalLayer,
        sideOrmLayer: manifestTerrain.sideOrmLayer,
      })
      expect(
        getLandHexTextureLayers(terrain, 'stable-hex', terrainManifest, 'low'),
      ).toMatchObject({
        capLayer: -1,
        sideLayer: -1,
        capNormalLayer: -1,
        capOrmLayer: -1,
        sideNormalLayer: -1,
        sideOrmLayer: -1,
      })
    }

    for (const terrain of LAND_HEX_UNTEXTURED_TERRAINS) {
      expect(
        getLandHexTextureLayers(terrain, 'flat-hex', terrainManifest, 'high'),
      ).toMatchObject({
        capLayer: -1,
        sideLayer: -1,
        capNormalLayer: -1,
        capOrmLayer: -1,
        sideNormalLayer: -1,
        sideOrmLayer: -1,
      })
    }
    expect(getLandHexColors(HexTerrain.shadow, genericColors).cap).toBe(
      '#0f0f0d',
    )
    expect(getLandHexColors(HexTerrain.swampWater, genericColors).cap).toBe(
      '#7a6c35',
    )
    for (const [name, color] of [
      ['Shadow', '#0f0f0d'],
      ['SwampWater', '#7a6c35'],
    ]) {
      expect(terrainManifest.terrains[name]).toMatchObject({
        capDiffuseLayer: -1,
        capDiffusePbrLayer: -1,
        sideDiffuseLayer: -1,
        flatColor: color,
      })
    }
  })

  it('uses deterministic cap rotation only for Ice and ToxicWater', () => {
    const rotatedTerrains = [HexTerrain.ice, HexTerrain.toxicWater]
    for (const terrain of rotatedTerrains) {
      const first = getLandHexTextureLayers(
        terrain,
        'persisted-hex-id',
        terrainManifest,
        'medium',
      ).rotationSteps
      expect(first).toBe(
        getLandHexTextureLayers(
          terrain,
          'persisted-hex-id',
          terrainManifest,
          'medium',
        ).rotationSteps,
      )
      expect(first).toBeGreaterThanOrEqual(0)
      expect(first).toBeLessThan(6)
    }
    for (const terrain of Object.values(HexTerrain).filter(
      (value) => isSolidTerrainHex(value) || isFluidTerrainHex(value),
    )) {
      if (!rotatedTerrains.includes(terrain as HexTerrain)) {
        expect(
          getLandHexTextureLayers(
            terrain,
            'persisted-hex-id',
            terrainManifest,
            'medium',
          ).rotationSteps,
        ).toBe(0)
      }
    }
  })

  it('maps pointy-top cap corners and center to clamped UV bounds', () => {
    const radius = HEXGRID_HEX_RADIUS
    expect(getLandHexCapUV(0, 0)).toEqual({ u: 0.5, v: 0.5 })
    expect(getLandHexCapUV(0, -radius)).toEqual({ u: 0.5, v: 0 })
    expect(getLandHexCapUV(0, radius)).toEqual({ u: 0.5, v: 1 })
    expect(getLandHexCapUV((Math.sqrt(3) * radius) / 2, 0).u).toBe(1)
    expect(getLandHexCapUV((-Math.sqrt(3) * radius) / 2, 0).u).toBe(0)

    const vertices = Array.from({ length: 6 }, (_, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI) / 3
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
      }
    })
    const uvSet = (rotationSteps: number) =>
      vertices
        .map(({ x, z }) => {
          const { u, v } = getLandHexCapUV(x, z, rotationSteps)
          return [Number(u.toFixed(8)) || 0, Number(v.toFixed(8)) || 0]
        })
        .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    for (let step = 0; step < 6; step += 1) {
      expect(uvSet(step)).toEqual(uvSet(0))
    }
  })

  it('maps side UVs from the image top row to the top of each face', () => {
    const height = 1
    expect(getLandHexSideUV(0, height, height)).toEqual([0, 0])
    expect(getLandHexSideUV(1, height, height)).toEqual([1, 0])
    expect(getLandHexSideUV(0, 0, height)).toEqual([0, 1])
    expect(getLandHexSideUV(1, 0, height)).toEqual([1, 1])
  })

  it('builds mixed textured and flat terrain layers for a small map', () => {
    const table = makeTable(9)
    const grass = place({
      board: table,
      pieceID: Pieces.grass1,
      at: table.center,
      altitude: 0,
    })
    const water = place({
      board: grass.board,
      pieceID: Pieces.water1,
      at: {
        q: table.center.q + 3,
        r: table.center.r,
        s: table.center.s - 3,
      },
      altitude: 0,
    })
    const data = buildLandHexInstanceData(
      water.board.boardHexes,
      water.board.boardPieces,
      1,
      genericColors,
      terrainManifest,
      'medium',
    )

    expect(
      data.map(({ terrain, capLayer, sideLayer }) => [
        terrain,
        capLayer,
        sideLayer,
      ]),
    ).toEqual([
      ['grass', 4, 4],
      ['water', 14, 11],
    ])
  })

  it('omits every explicitly excluded piece family', () => {
    const table = makeTable(25)
    let board: Board = table
    const excludedIDs = [
      Pieces.glacier1,
      Pieces.outcrop1,
      Pieces.lavaRockOutcrop1,
      Pieces.toxicOutcrop1,
      Pieces.glacier3,
      Pieces.lavaRockOutcrop3,
      Pieces.outcrop3,
      Pieces.toxicOutcrop3,
      Pieces.glacier4,
      Pieces.glacier6,
      Pieces.hive,
    ]

    excludedIDs.forEach((pieceID, index) => {
      const q = table.center.q + index * 2 - 8
      const placed = place({
        board,
        pieceID,
        at: { q, r: table.center.r, s: -q - table.center.r },
        altitude: 0,
        permissive: true,
      })
      board = placed.board
    })

    const data = buildLandHexInstanceData(
      board.boardHexes,
      board.boardPieces,
      5,
      genericColors,
    )

    expect(new Set(excludedIDs)).toEqual(NON_INSTANCED_SUBTERRAIN_PIECES)
    expect(data).toEqual([])
  })
})

describe('land hex side visibility', () => {
  it('maps all six cube directions to the matching side-mask bit', () => {
    const directions = [
      { q: 1, r: 0, s: -1 },
      { q: 0, r: 1, s: -1 },
      { q: -1, r: 1, s: 0 },
      { q: -1, r: 0, s: 1 },
      { q: 0, r: -1, s: 1 },
      { q: 1, r: -1, s: 0 },
    ]

    directions.forEach((offset, direction) => {
      const table = makeTable(9)
      const center = place({
        board: table,
        pieceID: Pieces.grass1,
        at: table.center,
        altitude: 0,
      })
      const neighbor = place({
        board: center.board,
        pieceID: Pieces.grass1,
        at: {
          q: table.center.q + offset.q,
          r: table.center.r + offset.r,
          s: table.center.s + offset.s,
        },
        altitude: 0,
      })
      const hex = Object.values(neighbor.board.boardHexes).find(
        (candidate) =>
          candidate.q === table.center.q &&
          candidate.r === table.center.r &&
          candidate.altitude === 1,
      ) as BoardHex

      expect(getLandHexSideVisibilityMask(hex, neighbor.board.boardHexes)).toBe(
        0b111111 ^ (1 << direction),
      )
    })
  })

  it('hides fluid-to-fluid and fluid-to-solid sides at the same level', () => {
    const table = makeTable(9)
    const fluid = place({
      board: table,
      pieceID: Pieces.water1,
      at: table.center,
      altitude: 0,
    })
    const neighborCoords = {
      q: table.center.q + 1,
      r: table.center.r,
      s: table.center.s - 1,
    }
    const fluidNeighbor = place({
      board: fluid.board,
      pieceID: Pieces.water1,
      at: neighborCoords,
      altitude: 0,
    })
    const fluidHex = Object.values(fluidNeighbor.board.boardHexes).find(
      (hex) =>
        hex.q === table.center.q &&
        hex.r === table.center.r &&
        hex.altitude === 1,
    ) as BoardHex
    const solidNeighbor = place({
      board: fluid.board,
      pieceID: Pieces.grass1,
      at: neighborCoords,
      altitude: 0,
    })
    const fluidNextToSolid = Object.values(solidNeighbor.board.boardHexes).find(
      (hex) =>
        hex.q === table.center.q &&
        hex.r === table.center.r &&
        hex.altitude === 1,
    ) as BoardHex

    expect(
      getLandHexSideVisibilityMask(fluidHex, fluidNeighbor.board.boardHexes),
    ).toBe(0b111110)
    expect(
      getLandHexSideVisibilityMask(
        fluidNextToSolid,
        solidNeighbor.board.boardHexes,
      ),
    ).toBe(0b111110)
  })

  it('does not cull across levels and leaves map-edge sides visible', () => {
    const table = makeTable(3)
    const placed = place({
      board: table,
      pieceID: Pieces.grass1,
      at: table.center,
      altitude: 0,
    })
    const hex = Object.values(placed.board.boardHexes).find(
      (candidate) =>
        candidate.q === table.center.q &&
        candidate.r === table.center.r &&
        candidate.altitude === 1,
    ) as BoardHex

    expect(getLandHexSideVisibilityMask(hex, placed.board.boardHexes)).toBe(
      0b111111,
    )

    const higher = place({
      board: cloneBoard(placed.board),
      pieceID: Pieces.grass1,
      at: {
        q: table.center.q + 1,
        r: table.center.r,
        s: table.center.s - 1,
      },
      altitude: 1,
      permissive: true,
    })
    expect(getLandHexSideVisibilityMask(hex, higher.board.boardHexes)).toBe(
      0b111111,
    )
  })
})

describe('land hex colors', () => {
  it('uses terrain, dirt, and generic cap/side colors', () => {
    expect(getLandHexColors('grass', genericColors)).toMatchObject({
      cap: '#7c9a3c',
      side: '#975a3a',
      isFluid: false,
    })
    expect(getLandHexColors('generic', genericColors)).toMatchObject({
      cap: '#e63cc8',
      side: '#a01e8c',
      isFluid: false,
    })
    expect(getLandHexColors('genericFluid', genericColors)).toMatchObject({
      cap: '#ff96e6',
      side: '#c864b4',
      isFluid: true,
    })
  })

  describe('land hex hover highlighting', () => {
    const items = [
      { uid: 'first', hex: { id: 'hex-a' } },
      { uid: 'first', hex: { id: 'hex-b' } },
      { uid: 'second', hex: { id: 'hex-c' } },
    ]
    const index = buildLandHexInstanceIndex(items)

    it('indexes every piece instance and each hex', () => {
      expect(index.indicesByUID).toEqual(
        new Map([
          ['first', [0, 1]],
          ['second', [2]],
        ]),
      )
      expect(index.indexByHexID).toEqual(
        new Map([
          ['hex-a', 0],
          ['hex-b', 1],
          ['hex-c', 2],
        ]),
      )
    })

    it('turns the previous piece off and the next piece on', () => {
      expect(
        getLandHexHoverTransition(
          { uid: 'first', hexID: 'hex-a', isCap: true },
          { uid: 'second', hexID: 'hex-c', isCap: true },
          index,
        ),
      ).toEqual({
        sideUpdates: [
          { index: 0, isHighlighted: false },
          { index: 1, isHighlighted: false },
          { index: 2, isHighlighted: true },
        ],
        capUpdates: [
          { index: 0, isHighlighted: false },
          { index: 2, isHighlighted: true },
        ],
      })
    })

    it('changes only the cap when moving across one piece', () => {
      expect(
        getLandHexHoverTransition(
          { uid: 'first', hexID: 'hex-a', isCap: true },
          { uid: 'first', hexID: 'hex-b', isCap: true },
          index,
        ),
      ).toEqual({
        sideUpdates: [],
        capUpdates: [
          { index: 0, isHighlighted: false },
          { index: 1, isHighlighted: true },
        ],
      })
    })

    it('turns the cap off when pointer movement reaches the same tile sides', () => {
      expect(
        getLandHexHoverTransition(
          { uid: 'first', hexID: 'hex-a', isCap: true },
          { uid: 'first', hexID: 'hex-a', isCap: false },
          index,
        ),
      ).toEqual({
        sideUpdates: [],
        capUpdates: [{ index: 0, isHighlighted: false }],
      })
    })

    it('turns the hovered piece and cap off when leaving', () => {
      expect(
        getLandHexHoverTransition(
          { uid: 'first', hexID: 'hex-a', isCap: true },
          null,
          index,
        ),
      ).toEqual({
        sideUpdates: [
          { index: 0, isHighlighted: false },
          { index: 1, isHighlighted: false },
        ],
        capUpdates: [{ index: 0, isHighlighted: false }],
      })
    })

    it('encodes cap hover separately from highlighted sides', () => {
      const item = items[0]
      expect(
        getLandHexHighlightValue(
          item,
          { uid: item.uid, hexID: 'hex-a', isCap: true },
          new Set(),
        ),
      ).toBe(3)
      expect(
        getLandHexHighlightValue(
          item,
          { uid: item.uid, hexID: 'hex-a', isCap: true },
          new Set(),
          'cap',
        ),
      ).toBe(1)
      expect(
        getLandHexHighlightValue(
          item,
          { uid: item.uid, hexID: 'hex-a', isCap: false },
          new Set(),
          'side',
        ),
      ).toBe(2)
      expect(
        getLandHexHighlightValue(
          item,
          { uid: item.uid, hexID: 'hex-a', isCap: false },
          new Set(),
        ),
      ).toBe(2)
      expect(
        getLandHexHighlightValue(
          item,
          { uid: item.uid, hexID: 'hex-a', isCap: true },
          new Set([item.uid]),
        ),
      ).toBe(3)
      expect(getLandHexHighlightValue(item, null, new Set([item.uid]))).toBe(2)
      expect(getLandHexHighlightValue(item, null, new Set())).toBe(0)
    })
  })

  it('highlights caps and sides independently without changing base colors', () => {
    const datum = { capColor: '#123456', sideColor: '#abcdef' }
    expect(getLandHexDisplayColors(datum, false)).toEqual({
      cap: '#123456',
      side: '#abcdef',
    })
    expect(getLandHexDisplayColors(datum, true)).toEqual({
      cap: 'yellow',
      side: 'yellow',
    })
    expect(getLandHexDisplayColors(datum, true, false)).toEqual({
      cap: 'yellow',
      side: '#abcdef',
    })
    expect(getLandHexDisplayColors(datum, false, true)).toEqual({
      cap: '#123456',
      side: 'yellow',
    })
  })
})
