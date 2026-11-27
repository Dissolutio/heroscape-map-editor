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
  vsArchScaleY,
  vsBaseTransformY,
  vsCastleNodeName,
  vsWallScaleY,
} from '../world/models/fortressModels'

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
  it('uses today’s models by default (Classic)', () => {
    expect(SETTINGS_DEFAULTS.fortressModels).toBe('classic')
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

  it('falls back to Classic for unknown values', () => {
    store('virtualscape')
    expect(loadSettings().fortressModels).toBe('classic')
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

  it('carry walkable tops that fit the classic tops', () => {
    const wallTop = nodeBounds(wall, 'VsCastleWallStraight').node.extras
      ?.walkableTop
    const baseTop = nodeBounds(base, 'VsCastleBaseStraight').node.extras
      ?.walkableTop
    const archTop = nodeBounds(arch, 'VsFortressArch_tile').node.extras
      ?.walkableTop
    expect(wallTop).toBeCloseTo(2.95, 2)
    expect(baseTop).toBeCloseTo(0.32, 2)
    expect(archTop).toBeCloseTo(3.5, 2)
    if (!wallTop || !baseTop || !archTop) return
    // A 9-level wall on land: the classic cap top is at 9.99 * 0.35 + 0.1.
    expect(vsWallScaleY(9.99, wallTop) * wallTop).toBeCloseTo(3.5965, 4)
    const { scale, offset } = vsBaseTransformY(baseTop)
    expect(offset + scale * baseTop).toBeCloseTo(0.45, 4)
    expect(vsArchScaleY(archTop) * archTop).toBeCloseTo(3.6, 4)
  })
})
