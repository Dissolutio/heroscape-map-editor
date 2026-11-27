import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LS_KEYS } from '../local-storage/keys'
import { loadSettings, SETTINGS_DEFAULTS } from '../local-storage/settings'
import { Pieces } from '../types'
import {
  FORTRESS_MODEL_URLS,
  FORTRESS_PIECE_PARTS,
  getFortressModelOverride,
  getFortressModelUrlsForPiece,
  resolveFortressModelSet,
  VS_FORTRESS_BANNER_URL,
  CLASSIC_HEIGHTS,
  classicWallTop,
  vsCastleNodeName,
  vsFitTarget,
} from '../world/models/fortressModels'
import {
  fitMeshHeights,
  heightRange,
  type IndexedMesh,
  measureSource,
  remapHeight,
} from '../world/models/fortressHeightFit'

type GlbJson = {
  nodes: Array<{
    name: string
    mesh?: number
    extras?: { walkableTop?: number }
  }>
  meshes: Array<{ primitives: Array<{ attributes: Record<string, number> }> }>
  accessors: Array<{ min?: number[]; max?: number[] }>
}

const readGlbJson = (url: string): GlbJson => {
  const buffer = readFileSync(resolve(process.cwd(), 'public', url.slice(1)))
  const length = buffer.readUInt32LE(12)
  return JSON.parse(buffer.toString('utf8', 20, 20 + length)) as GlbJson
}

const nodeBounds = (glb: GlbJson, name: string) => {
  const node = glb.nodes.find((n) => n.name === name)
  if (node?.mesh === undefined) throw new Error(`no mesh node ${name}`)
  const accessor =
    glb.accessors[glb.meshes[node.mesh].primitives[0].attributes.POSITION]
  return { min: accessor.min ?? [], max: accessor.max ?? [], node }
}

describe('which GLB each fortress piece uses', () => {
  it('defaults to the Virtualscape models; Classic stays available', () => {
    expect(SETTINGS_DEFAULTS.fortressModels).toBe('vs')
    expect(
      getFortressModelUrlsForPiece(Pieces.castleBaseCorner, 'classic'),
    ).toEqual(['/adjustable-castle-walls.glb'])
    expect(
      getFortressModelUrlsForPiece(Pieces.castleWallEnd, 'classic'),
    ).toEqual(['/adjustable-castle-walls.glb'])
    expect(getFortressModelUrlsForPiece(Pieces.castleArch, 'classic')).toEqual([
      '/castle-arch-handmade.glb',
    ])
    expect(getFortressModelUrlsForPiece(Pieces.ladder, 'classic')).toEqual([
      '/handmade-ladder.glb',
    ])
    expect(getFortressModelUrlsForPiece(Pieces.battlement, 'classic')).toEqual([
      '/handmade-battlement.glb',
    ])
  })

  it('switches all six fortress pieces to the Virtualscape GLBs', () => {
    const vs = (id: string) => getFortressModelUrlsForPiece(id, 'vs')
    for (const id of [
      Pieces.castleBaseCorner,
      Pieces.castleBaseStraight,
      Pieces.castleBaseEnd,
    ]) {
      expect(vs(id)).toEqual(['/vs-castle-base.glb'])
    }
    for (const id of [
      Pieces.castleWallCorner,
      Pieces.castleWallStraight,
      Pieces.castleWallEnd,
    ]) {
      expect(vs(id)).toEqual(['/vs-castle-wall.glb'])
    }
    expect(vs(Pieces.castleArch)).toEqual([
      '/vs-fortress-arch.glb',
      '/vs-fortress-door.glb',
    ])
    expect(vs(Pieces.castleArchNoDoor)).toEqual(['/vs-fortress-arch.glb'])
    expect(vs(Pieces.ladder)).toEqual(['/vs-fortress-ladder.glb'])
    expect(vs(Pieces.battlement)).toEqual(['/vs-fortress-battlement.glb'])
  })

  it('leaves other pieces alone, including the rope ladder', () => {
    expect(getFortressModelUrlsForPiece(Pieces.ropeLadder, 'vs')).toEqual([])
    expect(getFortressModelUrlsForPiece(Pieces.grass1, 'vs')).toEqual([])
  })

  it('has every GLB it names in public/', () => {
    const urls = [
      ...Object.values(FORTRESS_MODEL_URLS.classic),
      ...Object.values(FORTRESS_MODEL_URLS.vs),
      VS_FORTRESS_BANNER_URL,
    ]
    for (const url of urls) {
      expect(existsSync(resolve(process.cwd(), 'public', url.slice(1)))).toBe(
        true,
      )
    }
    expect(Object.keys(FORTRESS_PIECE_PARTS)).toHaveLength(10)
  })
})

describe('the ?fortress= URL override', () => {
  it('reads vs and classic, and ignores anything else', () => {
    expect(getFortressModelOverride('?fortress=vs')).toBe('vs')
    expect(getFortressModelOverride('?e2e=1&fortress=classic')).toBe('classic')
    expect(getFortressModelOverride('?fortress=VS')).toBeNull()
    expect(getFortressModelOverride('?fortress=')).toBeNull()
    expect(getFortressModelOverride('')).toBeNull()
  })

  it('wins over the saved setting', () => {
    expect(resolveFortressModelSet('classic', '?fortress=vs')).toBe('vs')
    expect(resolveFortressModelSet('vs', '?fortress=classic')).toBe('classic')
    expect(resolveFortressModelSet('vs', '?m=abc')).toBe('vs')
  })
})

describe('the Fortress models setting', () => {
  const values = new Map<string, string>()
  beforeEach(() => {
    values.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  const store = (fortressModels: unknown) =>
    values.set(
      LS_KEYS.settings,
      JSON.stringify({ v: 1, values: { fortressModels } }),
    )

  it('loads a saved Virtualscape choice', () => {
    store('vs')
    expect(loadSettings().fortressModels).toBe('vs')
  })

  it('falls back to the default (Virtualscape) for unknown values', () => {
    store('virtualscape')
    expect(loadSettings().fortressModels).toBe('vs')
  })
})

describe('the Virtualscape GLBs', () => {
  const base = readGlbJson('/vs-castle-base.glb')
  const wall = readGlbJson('/vs-castle-wall.glb')
  const arch = readGlbJson('/vs-fortress-arch.glb')

  it('have every node the app draws', () => {
    for (const shape of ['Corner', 'Straight', 'End'] as const) {
      expect(nodeBounds(base, vsCastleNodeName('Base', shape))).toBeTruthy()
      expect(nodeBounds(wall, vsCastleNodeName('Wall', shape))).toBeTruthy()
    }
    expect(arch.nodes.map((n) => n.name)).toEqual([
      'VsFortressArch_tile',
      'VsFortressArch_fer',
      'VsFortressArch_boulon',
    ])
    expect(readGlbJson('/vs-fortress-door.glb').nodes[0].name).toBe(
      'VsFortressDoor',
    )
    expect(readGlbJson('/vs-fortress-ladder.glb').nodes[0].name).toBe(
      'VsFortressLadder',
    )
    expect(readGlbJson('/vs-fortress-battlement.glb').nodes[0].name).toBe(
      'VsFortressBattlement',
    )
    expect(
      readGlbJson(VS_FORTRESS_BANNER_URL).nodes.every((n) =>
        n.name.startsWith('VsFortressBanner_'),
      ),
    ).toBe(true)
  })

  it('stand on y = 0 within their hexes, like the classic models', () => {
    for (const shape of ['Corner', 'Straight', 'End'] as const) {
      for (const [glb, kind] of [
        [base, 'Base'],
        [wall, 'Wall'],
      ] as const) {
        const { min, max } = nodeBounds(glb, vsCastleNodeName(kind, shape))
        expect(min[1]).toBeCloseTo(0, 1)
        // Inside one hex (radius 1) give or take Virtualscape's connector tabs.
        expect(Math.max(-min[0], max[0], -min[2], max[2])).toBeLessThan(1.05)
      }
    }
    const { min, max } = nodeBounds(arch, 'VsFortressArch_tile')
    expect(min[0]).toBeCloseTo(-Math.sqrt(3) / 2, 2)
    expect(max[0]).toBeCloseTo(2.5 * Math.sqrt(3), 2)
    expect(max[1]).toBeCloseTo(3.5, 2) // 10 levels of 0.35
  })

  it('put ladders and battlements on the +X edge, like the classic ones', () => {
    for (const url of [
      '/vs-fortress-ladder.glb',
      '/vs-fortress-battlement.glb',
    ]) {
      const glb = readGlbJson(url)
      const { min, max } = nodeBounds(glb, glb.nodes[0].name)
      expect(max[0]).toBeCloseTo(0, 1) // the edge is at x = 0
      expect(min[0]).toBeGreaterThan(-0.5)
      expect(min[2]).toBeCloseTo(-0.5, 1)
      expect(max[2]).toBeCloseTo(0.5, 1)
    }
  })

  it('carry the walkway heights the fit starts from', () => {
    const top = (glb: GlbJson, name: string) =>
      nodeBounds(glb, name).node.extras?.walkableTop
    expect(top(wall, 'VsCastleWallStraight')).toBeCloseTo(2.95, 2)
    expect(top(base, 'VsCastleBaseStraight')).toBeCloseTo(0.32, 2)
    expect(top(arch, 'VsFortressArch_tile')).toBeCloseTo(3.5, 2)
  })
})

// The real GLBs, fitted exactly as the app fits them.
type GlbMesh = { name: string; extras?: { walkableTop?: number } } & IndexedMesh

function readGlbMeshes(url: string): GlbMesh[] {
  const buffer = readFileSync(resolve(process.cwd(), 'public', url.slice(1)))
  const jsonLength = buffer.readUInt32LE(12)
  const json = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength))
  const binStart = 20 + jsonLength + 8
  const read = (accessorIndex: number) => {
    const accessor = json.accessors[accessorIndex]
    const view = json.bufferViews[accessor.bufferView]
    const offset =
      binStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3 }[accessor.type as string] ?? 1
    const count = accessor.count * size
    const bytes = buffer.buffer.slice(
      buffer.byteOffset + offset,
      buffer.byteOffset +
        offset +
        count * (accessor.componentType === 5123 ? 2 : 4),
    )
    if (accessor.componentType === 5126) return new Float32Array(bytes)
    if (accessor.componentType === 5123) return new Uint16Array(bytes)
    return new Uint32Array(bytes)
  }
  return json.nodes.map(
    (node: {
      name: string
      mesh: number
      extras?: { walkableTop?: number }
    }) => {
      const primitive = json.meshes[node.mesh].primitives[0]
      return {
        name: node.name,
        extras: node.extras,
        positions: read(primitive.attributes.POSITION),
        normals: read(primitive.attributes.NORMAL),
        index: read(primitive.indices),
      }
    },
  )
}

const meshesNamed = (url: string, name: string) =>
  readGlbMeshes(url).filter(
    (mesh) => mesh.name === name || mesh.name.startsWith(`${name}_`),
  )

/** Fits like VsModel; returns the drawn height range and the walkway top. */
function fitLikeTheApp(
  meshes: GlbMesh[],
  target: ReturnType<typeof vsFitTarget>,
  source = measureSource(
    meshes,
    target.shoulder === 'walkway'
      ? (meshes[0].extras?.walkableTop ?? null)
      : null,
  ),
) {
  const fit = { ...source, dstBottom: target.dstBottom, dstTop: target.dstTop }
  const fitted = meshes.map((mesh) =>
    fitMeshHeights(mesh, fit, { keepReceiver: target.keepReceiver }),
  )
  return { ...heightRange(fitted), source, fit }
}

describe('the fitted Virtualscape models land on the classic bottoms and tops', () => {
  const shapes = ['Corner', 'Straight', 'End'] as const
  for (const shape of shapes) {
    for (const levels of [9, 10]) {
      it(`${shape} wall, ${levels} levels: bottom, shoulder and receiver`, () => {
        const meshes = meshesNamed(
          '/vs-castle-wall.glb',
          vsCastleNodeName('Wall', shape),
        )
        const scaleY = levels + 0.99
        const bare = fitLikeTheApp(
          meshes,
          vsFitTarget('castleWall', { scaleY }),
        )
        const receiver = heightRange(meshes).max - bare.source.srcShoulder
        expect(receiver).toBeGreaterThan(0.3) // about one level, the male part
        expect(bare.min).toBeCloseTo(0, 5)
        expect(remapHeight(bare.source.srcShoulder, bare.fit)).toBeCloseTo(
          classicWallTop(scaleY),
          5,
        )
        // the receiver keeps its real height above the classic top
        expect(bare.max - classicWallTop(scaleY)).toBeCloseTo(receiver, 4)
        // covered: nothing above the classic top
        const covered = fitLikeTheApp(
          meshes,
          vsFitTarget('castleWall', { scaleY, isTopCovered: true }),
        )
        expect(covered.min).toBeCloseTo(0, 5)
        expect(covered.max).toBeCloseTo(classicWallTop(scaleY), 2)
      })
    }

    it(`${shape} base: nothing below the classic bottom, receiver kept or dropped`, () => {
      const meshes = meshesNamed(
        '/vs-castle-base.glb',
        vsCastleNodeName('Base', shape),
      )
      const bare = fitLikeTheApp(meshes, vsFitTarget('castleBase'))
      expect(bare.min).toBeCloseTo(CLASSIC_HEIGHTS.castleBase.bottom, 5)
      expect(remapHeight(bare.source.srcShoulder, bare.fit)).toBeCloseTo(
        CLASSIC_HEIGHTS.castleBase.top,
        5,
      )
      const receiver = heightRange(meshes).max - bare.source.srcShoulder
      expect(bare.max - CLASSIC_HEIGHTS.castleBase.top).toBeCloseTo(receiver, 4)
      const covered = fitLikeTheApp(
        meshes,
        vsFitTarget('castleBase', { isTopCovered: true }),
      )
      expect(covered.min).toBeCloseTo(0, 5)
      expect(covered.max).toBeCloseTo(CLASSIC_HEIGHTS.castleBase.top, 2)
    })
  }

  it('arch and door: the arch spans the classic arch exactly, the door inside it', () => {
    const archMeshes = meshesNamed('/vs-fortress-arch.glb', 'VsFortressArch')
    const target = vsFitTarget('fortressArch')
    const archFit = fitLikeTheApp(archMeshes, target)
    expect(archFit.min).toBeCloseTo(CLASSIC_HEIGHTS.fortressArch.bottom, 5)
    expect(archFit.max).toBeCloseTo(CLASSIC_HEIGHTS.fortressArch.top, 5)
    const door = fitLikeTheApp(
      meshesNamed('/vs-fortress-door.glb', 'VsFortressDoor'),
      target,
      archFit.source,
    )
    expect(door.min).toBeGreaterThanOrEqual(0)
    expect(door.max).toBeLessThan(CLASSIC_HEIGHTS.fortressArch.top)
  })

  it('ladder: bottom and top rung on the classic ones, hooks above', () => {
    const ladder = fitLikeTheApp(
      meshesNamed('/vs-fortress-ladder.glb', 'VsFortressLadder'),
      vsFitTarget('fortressLadder'),
    )
    expect(ladder.min).toBeCloseTo(CLASSIC_HEIGHTS.fortressLadder.bottom, 5)
    expect(remapHeight(ladder.source.srcShoulder, ladder.fit)).toBeCloseTo(
      CLASSIC_HEIGHTS.fortressLadder.top,
      5,
    )
  })

  it('battlement: spans the classic battlement exactly', () => {
    const battlement = fitLikeTheApp(
      meshesNamed('/vs-fortress-battlement.glb', 'VsFortressBattlement'),
      vsFitTarget('fortressBattlement'),
    )
    expect(battlement.min).toBeCloseTo(
      CLASSIC_HEIGHTS.fortressBattlement.bottom,
      5,
    )
    expect(battlement.max).toBeCloseTo(
      CLASSIC_HEIGHTS.fortressBattlement.top,
      5,
    )
  })

  it('agrees with the classic models themselves', () => {
    const classic = (url: string, names: string[]) => {
      const meshes = readGlbMeshes(url).filter((m) => names.includes(m.name))
      return heightRange(meshes)
    }
    const base = classic('/adjustable-castle-walls.glb', [
      'CastleWallStraightBody',
      'WallCap',
    ])
    expect(base.min).toBeCloseTo(CLASSIC_HEIGHTS.castleBase.bottom, 3)
    expect(base.max).toBeCloseTo(CLASSIC_HEIGHTS.castleBase.top, 3)
    const arch = classic('/castle-arch-handmade.glb', [
      'CastleArchBody',
      'CastleArchCapNear',
    ])
    expect(arch.min).toBeCloseTo(CLASSIC_HEIGHTS.fortressArch.bottom, 3)
    expect(arch.max).toBeCloseTo(CLASSIC_HEIGHTS.fortressArch.top, 3)
    const ladder = classic('/handmade-ladder.glb', ['Ladder'])
    expect(ladder.min).toBeCloseTo(CLASSIC_HEIGHTS.fortressLadder.bottom, 3)
    expect(ladder.max).toBeCloseTo(CLASSIC_HEIGHTS.fortressLadder.top, 3)
    const battlement = classic('/handmade-battlement.glb', ['Battlement'])
    expect(battlement.min).toBeCloseTo(
      CLASSIC_HEIGHTS.fortressBattlement.bottom,
      3,
    )
    expect(battlement.max).toBeCloseTo(
      CLASSIC_HEIGHTS.fortressBattlement.top,
      3,
    )
  })
})
