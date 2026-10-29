import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { type BoardHex, HexTerrain, Pieces } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { HEXGRID_HEX_RADIUS } from '../utils/constants'
import {
  FLUID_CAP_FILL_UV_WINDOW,
  LAND_HEX_TEXTURE_TERRAIN_NAMES,
  LAND_HEX_UNTEXTURED_TERRAINS,
  NON_INSTANCED_SUBTERRAIN_PIECES,
  buildLandHexInstanceData,
  buildLandHexInstanceIndex,
  getLandHexFluidMaterialClass,
  getLandHexFluidMaterialSettings,
  getLandHexCapPbrStrengths,
  getLandHexCapUV,
  getLandHexColors,
  getLandHexDisplayColors,
  getLandHexFluidCapFillBlend,
  getLandHexFluidCapJoinMask,
  getLandHexHighlightValue,
  getLandHexHoverTransition,
  getLandHexInstanceIDs,
  getLandHexManifestTerrainName,
  getLandHexMirroredFillUV,
  getLandHexSideUV,
  getLandHexSideVisibilityMask,
  getLandHexTextureLayers,
  getLandHexWorldFillUV,
  packLandHexPbrTextureLayers,
  packLandHexVisibility,
  unpackLandHexPbrTextureLayers,
  unpackLandHexVisibility,
} from '../world/models/landHexInstances'
import { parseTerrainTextureManifest } from '../world/textures/terrainTextureManifest'
import { type Board, cloneBoard, makeTable, place } from './helpers/board'

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
  it('groups fluid terrain by opacity without adding instance attributes', () => {
    expect(getLandHexFluidMaterialClass(HexTerrain.ice)).toBe('ice')
    expect(getLandHexFluidMaterialSettings('ice')).toEqual({
      opacity: 0.98,
      transparent: true,
    })

    for (const terrain of [
      HexTerrain.water,
      HexTerrain.toxicWater,
      HexTerrain.wellspringWater,
      HexTerrain.lava,
      HexTerrain.genericFluid,
      HexTerrain.shadow,
      HexTerrain.swampWater,
    ]) {
      expect(getLandHexFluidMaterialClass(terrain)).toBe('opaque')
      expect(getLandHexFluidMaterialSettings('opaque')).toEqual({
        opacity: 1,
        transparent: false,
      })
    }
  })

  it('packs every supported PBR layer tuple into a unique scalar', () => {
    const codes = new Set<number>()
    for (let capNormal = -1; capNormal < 3; capNormal += 1) {
      for (let capOrm = -1; capOrm < 6; capOrm += 1) {
        for (let sideNormal = -1; sideNormal < 2; sideNormal += 1) {
          for (let sideOrm = -1; sideOrm < 3; sideOrm += 1) {
            codes.add(
              packLandHexPbrTextureLayers(
                capNormal,
                capOrm,
                sideNormal,
                sideOrm,
              ),
            )
          }
        }
      }
    }

    expect(codes.size).toBe(336)
    expect(
      unpackLandHexPbrTextureLayers(
        packLandHexPbrTextureLayers(-1, -1, -1, -1, 0.45, 0.4),
      ),
    ).toMatchObject({
      capNormalLayer: -1,
      capOrmLayer: -1,
      sideNormalLayer: -1,
      sideOrmLayer: -1,
    })
    expect(packLandHexPbrTextureLayers(0, 0, 0, 0, 0.45, 0.4)).not.toBe(
      packLandHexPbrTextureLayers(0, 0, 0, 0, 1, 1),
    )
    expect(
      unpackLandHexPbrTextureLayers(
        packLandHexPbrTextureLayers(1, 2, 0, 1, 0.45, 0.4),
      ),
    ).toMatchObject({
      capNormalLayer: 1,
      capOrmLayer: 2,
      sideNormalLayer: 0,
      sideOrmLayer: 1,
      capNormalStrength: expect.closeTo(0.45, 1),
      capAoStrength: expect.closeTo(0.4, 1),
    })
    expect(packLandHexPbrTextureLayers(2, 5, 1, 2, 1, 1)).toBeLessThan(2 ** 24)
  })

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

  it('selects manifest layers by tier and keeps generic terrain untextured', () => {
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
        sideDiffuseLayer: expect.any(Number),
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

  it('mirrors world-space fill UVs continuously inside the clean cap window', () => {
    const apothem = (Math.sqrt(3) * HEXGRID_HEX_RADIUS) / 2
    const neighborCenter = Math.sqrt(3) * HEXGRID_HEX_RADIUS
    const fromFirstHex = getLandHexMirroredFillUV(
      getLandHexWorldFillUV(apothem, 0),
    )
    const fromSecondHex = getLandHexMirroredFillUV(
      getLandHexWorldFillUV(neighborCenter - apothem, 0),
    )
    expect(fromFirstHex).toEqual(fromSecondHex)
    expect(fromFirstHex.u).toBeGreaterThanOrEqual(FLUID_CAP_FILL_UV_WINDOW.uMin)
    expect(fromFirstHex.u).toBeLessThanOrEqual(FLUID_CAP_FILL_UV_WINDOW.uMax)
    expect(fromFirstHex.v).toBeGreaterThanOrEqual(FLUID_CAP_FILL_UV_WINDOW.vMin)
    expect(fromFirstHex.v).toBeLessThanOrEqual(FLUID_CAP_FILL_UV_WINDOW.vMax)

    const beforeEdge = getLandHexMirroredFillUV(
      getLandHexWorldFillUV(apothem - 0.001, 0),
    )
    const afterEdge = getLandHexMirroredFillUV(
      getLandHexWorldFillUV(apothem + 0.001, 0),
    )
    expect(Math.abs(afterEdge.u - beforeEdge.u)).toBeLessThan(0.002)
  })

  it('packs side, cap, and fluid-edge masks in one attribute', () => {
    expect(packLandHexVisibility(0b101010, false, 0b000101)).toBe(
      0b000101_0_101010,
    )
    expect(packLandHexVisibility(0b111111, true, 0b111111)).toBe(8191)
    expect(packLandHexVisibility(0b111111, false, 0)).toBe(63)
    expect(
      unpackLandHexVisibility(packLandHexVisibility(0b111111, false, 0b111111)),
    ).toEqual({
      sideMask: 0b111111,
      capVisible: false,
      fluidCapJoinMask: 0b111111,
    })
  })

  it('reduces High-tier cap strengths and allows wood/road layer overrides', () => {
    expect(getLandHexCapPbrStrengths(HexTerrain.grass, 0, 0)).toEqual({
      normal: 0.35,
      ao: 0.4,
    })
    expect(getLandHexCapPbrStrengths(HexTerrain.wood, 0, 2)).toEqual({
      normal: 0.35,
      ao: 0.4,
    })
    expect(getLandHexCapPbrStrengths(HexTerrain.road, 1, 1)).toEqual({
      normal: 0.35,
      ao: 0.4,
    })
    expect(getLandHexCapPbrStrengths(HexTerrain.wallWalk, 1, 1)).toEqual({
      normal: 0.35,
      ao: 0.4,
    })
    expect(getLandHexCapPbrStrengths(HexTerrain.water, 2, 3)).toEqual({
      normal: 1,
      ao: 1,
    })
    expect(
      getLandHexTextureLayers(
        HexTerrain.grass,
        'grass-cap',
        terrainManifest,
        'high',
      ),
    ).toMatchObject({ capNormalStrength: 0.35, capAoStrength: 0.4 })
    expect(
      getLandHexTextureLayers(
        HexTerrain.grass,
        'grass-cap',
        terrainManifest,
        'medium',
      ),
    ).toMatchObject({ capNormalStrength: 1, capAoStrength: 1 })
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
    expect(
      getLandHexFluidCapJoinMask(fluidHex, fluidNeighbor.board.boardHexes),
    ).toBe(0)
    expect(
      getLandHexFluidCapJoinMask(
        fluidNextToSolid,
        solidNeighbor.board.boardHexes,
      ),
    ).toBe(0)
    const otherPieceFluidHex = Object.values(
      fluidNeighbor.board.boardHexes,
    ).find(
      (hex) =>
        hex.q === neighborCoords.q &&
        hex.r === neighborCoords.r &&
        hex.altitude === 1,
    ) as BoardHex
    expect(
      getLandHexFluidCapJoinMask(
        otherPieceFluidHex,
        fluidNeighbor.board.boardHexes,
      ),
    ).toBe(0)
  })

  it('only removes baked fluid borders within a multi-hex piece', () => {
    const table = makeTable(9)
    for (const pieceID of [
      Pieces.grass1,
      Pieces.water1,
      Pieces.toxicWater1,
      Pieces.wellspringWater1,
    ]) {
      const single = place({
        board: table,
        pieceID,
        at: table.center,
        altitude: 0,
      })
      const singleHex = Object.values(single.board.boardHexes).find(
        (hex) => hex.boardPieceUID === single.board.boardPieces[0].uid,
      ) as BoardHex
      expect(
        getLandHexFluidCapJoinMask(singleHex, single.board.boardHexes),
      ).toBe(0)
    }

    for (const pieceID of [Pieces.water3, Pieces.lava3, Pieces.ice3]) {
      const orientationMasks: number[][] = []
      let joinedDirections = 0
      for (let rotation = 0; rotation < 6; rotation += 1) {
        const multi = place({
          board: table,
          pieceID,
          at: table.center,
          altitude: 0,
          rotation,
        })
        const fluidHexes = Object.values(multi.board.boardHexes).filter(
          (hex) => hex.boardPieceUID === multi.board.boardPieces[0].uid,
        )
        expect(fluidHexes).toHaveLength(3)
        const masks = fluidHexes.map((hex) =>
          getLandHexFluidCapJoinMask(hex, multi.board.boardHexes),
        )
        expect(masks.some((mask) => mask > 0)).toBe(true)
        for (const mask of masks) joinedDirections |= mask
        orientationMasks.push(
          masks
            .map((mask) => mask.toString(2).replace(/0/g, '').length)
            .sort((a, b) => a - b),
        )
      }
      expect(joinedDirections).toBe(0b111111)
      for (const masks of orientationMasks.slice(1)) {
        expect(masks).toEqual(orientationMasks[0])
      }
    }
  })

  it('fills all joined-edge vertices across mitered corners', () => {
    for (let vertex = 0; vertex < 6; vertex += 1) {
      const angle = -Math.PI / 2 + (vertex * Math.PI) / 3
      const point = {
        x: Math.cos(angle) * HEXGRID_HEX_RADIUS,
        z: Math.sin(angle) * HEXGRID_HEX_RADIUS,
      }
      const beforeEdge = (vertex + 4) % 6
      const afterEdge = (vertex + 5) % 6
      const joinedEdges = (1 << beforeEdge) | (1 << afterEdge)

      expect(getLandHexFluidCapFillBlend(point, joinedEdges)).toBe(1)
      expect(getLandHexFluidCapFillBlend(point, 1 << beforeEdge)).toBe(1)

      const outerEdgeMidpoint = {
        x:
          (point.x +
            Math.cos(-Math.PI / 2 + ((vertex + 1) * Math.PI) / 3) *
              HEXGRID_HEX_RADIUS) /
          2,
        z:
          (point.z +
            Math.sin(-Math.PI / 2 + ((vertex + 1) * Math.PI) / 3) *
              HEXGRID_HEX_RADIUS) /
          2,
      }
      expect(
        getLandHexFluidCapFillBlend(outerEdgeMidpoint, 1 << beforeEdge),
      ).toBe(0)
    }
  })

  it('uses the joined edge sector at every corner for all join masks', () => {
    for (let vertex = 0; vertex < 6; vertex += 1) {
      const angle = -Math.PI / 2 + (vertex * Math.PI) / 3
      const point = {
        x: Math.cos(angle) * HEXGRID_HEX_RADIUS,
        z: Math.sin(angle) * HEXGRID_HEX_RADIUS,
      }
      const adjacentEdges =
        (1 << ((vertex + 4) % 6)) | (1 << ((vertex + 5) % 6))

      for (let joinMask = 0; joinMask < 64; joinMask += 1) {
        expect(getLandHexFluidCapFillBlend(point, joinMask)).toBe(
          joinMask & adjacentEdges ? 1 : 0,
        )
      }
    }
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
