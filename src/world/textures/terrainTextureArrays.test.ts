import { readFileSync } from 'node:fs'
import { ClampToEdgeWrapping, NoColorSpace, SRGBColorSpace } from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  disposeTerrainTextureArrays,
  getCachedTerrainTextureArrays,
  getTerrainTextureArrayStats,
  getTerrainTextureStrips,
  loadTerrainTextureArrays,
  sliceTextureArrayLayers,
  type DecodedTerrainTexture,
} from './terrainTextureArrays'
import {
  parseTerrainTextureManifest,
  TERRAIN_TEXTURE_FILES,
  type TerrainTextureManifest,
} from './terrainTextureManifest'

const committedManifest = JSON.parse(
  readFileSync(
    new URL('../../../public/textures/manifest.json', import.meta.url),
    'utf8',
  ),
) as unknown

function smallManifest(): TerrainTextureManifest {
  const files = Object.fromEntries(
    TERRAIN_TEXTURE_FILES.map((name) => [
      name,
      {
        colorSpace: name.includes('diffuse') ? 'srgb' : 'data',
        frameHeight: 2,
        frameWidth: 2,
        height: 4,
        layers: 2,
        width: 2,
      },
    ]),
  )
  return {
    files: files as TerrainTextureManifest['files'],
    normalConvention: 'opengl',
    terrainOrder: ['Grass', 'Rock'],
    terrains: {
      Grass: {
        allowRandomRotation: false,
        capDiffuseLayer: 0,
        capDiffusePbrLayer: 0,
        capNormalLayer: 0,
        capOrmLayer: 0,
        flatColor: null,
        isFluid: false,
        sideDiffuseLayer: 0,
        sideNormalLayer: 0,
        sideOrmLayer: 0,
      },
      Rock: {
        allowRandomRotation: false,
        capDiffuseLayer: 1,
        capDiffusePbrLayer: 1,
        capNormalLayer: 1,
        capOrmLayer: 1,
        flatColor: null,
        isFluid: false,
        sideDiffuseLayer: 1,
        sideNormalLayer: 1,
        sideOrmLayer: 1,
      },
    },
    version: 1,
  }
}

function response(manifest: TerrainTextureManifest, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 503,
    json: async () => manifest,
    arrayBuffer: async () => new ArrayBuffer(0),
  } as Response
}

function decodePixels(
  manifest: TerrainTextureManifest,
): (fileName: (typeof TERRAIN_TEXTURE_FILES)[number]) => DecodedTerrainTexture {
  return (fileName) => {
    const file = manifest.files[fileName]
    return {
      data: Uint8Array.from(
        { length: file.width * file.height * 4 },
        (_, index) => index % 256,
      ),
      width: file.width,
      height: file.height,
    }
  }
}

afterEach(() => {
  disposeTerrainTextureArrays()
  vi.restoreAllMocks()
})

describe('terrain texture manifest', () => {
  it('validates the committed manifest', () => {
    expect(
      parseTerrainTextureManifest(committedManifest).terrainOrder,
    ).toHaveLength(21)
  })

  it('rejects unsupported versions', () => {
    expect(() =>
      parseTerrainTextureManifest({ ...smallManifest(), version: 2 }),
    ).toThrow('unsupported version 2')
  })

  it('rejects missing terrains', () => {
    const manifest = smallManifest()
    manifest.terrainOrder = ['Grass']
    expect(() => parseTerrainTextureManifest(manifest)).toThrow(
      'terrainOrder must include every terrain',
    )
  })

  it('rejects an invalid terrain layer index', () => {
    const manifest = smallManifest()
    manifest.terrains.Grass.capDiffuseLayer = 2
    expect(() => parseTerrainTextureManifest(manifest)).toThrow(
      'capDiffuseLayer must be -1 or a valid layer index',
    )
  })
})

describe('terrain texture array loading', () => {
  it('maps tiers to only the strips they need', () => {
    expect(getTerrainTextureStrips('low')).toEqual([])
    expect(getTerrainTextureStrips('medium')).toEqual([
      'caps-diffuse.png',
      'sides-diffuse.png',
    ])
    expect(getTerrainTextureStrips('high')).toEqual([
      'caps-diffuse-pbr.png',
      'sides-diffuse.png',
      'caps-orm.png',
      'sides-orm.png',
      'caps-normal.png',
      'sides-normal.png',
    ])
  })

  it('slices rows into layers in manifest order and flips texture Y on upload', async () => {
    const data = Uint8Array.from({ length: 4 * 4 }, (_, index) => index)
    const layers = sliceTextureArrayLayers(data, 1, 4, 2)
    expect(layers.map((layer) => [...layer])).toEqual([
      [...data.slice(0, 8)],
      [...data.slice(8, 16)],
    ])

    const manifest = smallManifest()
    const fetcher = vi.fn(async () => response(manifest))
    const result = await loadTerrainTextureArrays('medium', {
      fetch: fetcher,
      decodeImage: async (_bytes, fileName) => decodePixels(manifest)(fileName),
    })
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return

    const texture = result.textures['caps-diffuse.png']
    expect(texture?.flipY).toBe(true)
    expect(texture?.image.data.slice(0, 16)).toEqual(
      decodePixels(manifest)('caps-diffuse.png').data.slice(0, 16),
    )
  })

  it('deduplicates requests and reports completed-strip progress', async () => {
    const manifest = smallManifest()
    const fetcher = vi.fn(async () => response(manifest))
    const decodeImage = vi.fn(
      async (
        _bytes: ArrayBuffer,
        fileName: (typeof TERRAIN_TEXTURE_FILES)[number],
      ) => decodePixels(manifest)(fileName),
    )
    const progress: Array<[number, number]> = []
    const options = {
      fetch: fetcher,
      decodeImage,
      onProgress: (loaded: number, total: number) =>
        progress.push([loaded, total]),
    }

    const [first, second] = await Promise.all([
      loadTerrainTextureArrays('medium', options),
      loadTerrainTextureArrays('medium', options),
    ])
    expect(first.status).toBe('ready')
    expect(second.status).toBe('ready')
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(decodeImage).toHaveBeenCalledTimes(2)
    expect(progress).toContainEqual([2, 2])
    if (first.status === 'ready' && second.status === 'ready') {
      expect(second.textures['caps-diffuse.png']).toBe(
        first.textures['caps-diffuse.png'],
      )
      expect(first.textures['caps-diffuse.png']?.colorSpace).toBe(
        SRGBColorSpace,
      )
      expect(first.textures['sides-diffuse.png']?.wrapS).toBe(
        ClampToEdgeWrapping,
      )
      expect(first.textures['sides-diffuse.png']?.wrapT).toBe(
        ClampToEdgeWrapping,
      )
      expect(first.textures['sides-diffuse.png']?.generateMipmaps).toBe(true)
      expect(first.textures['sides-diffuse.png']?.anisotropy).toBe(4)
      expect(getCachedTerrainTextureArrays('medium')).toEqual({
        manifest,
        textures: first.textures,
      })
      expect(getCachedTerrainTextureArrays('low')).toBeNull()
    }
  })

  it('loads the complete High-tier PBR set with data color spaces', async () => {
    const manifest = smallManifest()
    const fetcher = vi.fn(async () => response(manifest))
    const result = await loadTerrainTextureArrays('high', {
      fetch: fetcher,
      decodeImage: async (_bytes, fileName) => decodePixels(manifest)(fileName),
    })

    expect(result.status).toBe('ready')
    expect(fetcher).toHaveBeenCalledTimes(7)
    if (result.status !== 'ready') return
    expect(Object.keys(result.textures).sort()).toEqual(
      getTerrainTextureStrips('high').sort(),
    )
    expect(result.textures['caps-orm.png']?.colorSpace).toBe(NoColorSpace)
    expect(result.textures['sides-normal.png']?.colorSpace).toBe(NoColorSpace)
  })

  it('reports the retained texture-array and manifest CPU sizes', async () => {
    const manifest = smallManifest()
    const result = await loadTerrainTextureArrays('medium', {
      fetch: async () => response(manifest),
      decodeImage: async (_bytes, fileName) => decodePixels(manifest)(fileName),
    })

    expect(result.status).toBe('ready')
    expect(getTerrainTextureArrayStats()).toEqual({
      cpuBytes: 2 * 4 * 4 * 2,
      manifestBytes: JSON.stringify(manifest).length * 2,
      textureArrayCount: 2,
    })
  })

  it('retries failed strips and disposes cached GPU textures', async () => {
    const manifest = smallManifest()
    let capFetches = 0
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('caps-diffuse.png') && capFetches++ === 0) {
        return response(manifest, false)
      }
      return response(manifest)
    })
    const options = {
      fetch: fetcher,
      decodeImage: async (
        _bytes: ArrayBuffer,
        fileName: (typeof TERRAIN_TEXTURE_FILES)[number],
      ) => decodePixels(manifest)(fileName),
    }

    const failed = await loadTerrainTextureArrays('medium', options)
    expect(failed.status).toBe('error')
    const loaded = await loadTerrainTextureArrays('medium', options)
    expect(loaded.status).toBe('ready')
    expect(capFetches).toBe(2)
    if (loaded.status !== 'ready') return

    const texture = loaded.textures['caps-diffuse.png']
    const disposed = vi.fn()
    texture?.addEventListener('dispose', disposed)
    disposeTerrainTextureArrays()
    expect(disposed).toHaveBeenCalledOnce()

    await loadTerrainTextureArrays('medium', options)
    expect(fetcher).toHaveBeenCalledWith('/textures/manifest.json')
    expect(capFetches).toBe(3)
  })

  it('does not continue loading strips after disposal during manifest fetch', async () => {
    const manifest = smallManifest()
    let finishManifest: ((result: Response) => void) | undefined
    const fetcher = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finishManifest = resolve
        }),
    )
    const loading = loadTerrainTextureArrays('medium', {
      fetch: fetcher,
      decodeImage: async (_bytes, fileName) => decodePixels(manifest)(fileName),
    })

    disposeTerrainTextureArrays()
    finishManifest?.(response(manifest))
    const result = await loading

    expect(result.status).toBe('error')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
