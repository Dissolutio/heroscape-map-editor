import {
  ClampToEdgeWrapping,
  DataArrayTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three'
import type { GraphicsTier } from '../../local-storage/settings'
import {
  parseTerrainTextureManifest,
  type TerrainTextureFile,
  type TerrainTextureFileName,
  type TerrainTextureManifest,
} from './terrainTextureManifest'

export type { GraphicsTier } from '../../local-storage/settings'
export type TextureLoadStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'fallback'
  | 'error'

export type DecodedTerrainTexture = {
  data: Uint8Array | Uint8ClampedArray
  height: number
  width: number
}

export type TerrainTextureArrays = Partial<
  Record<TerrainTextureFileName, DataArrayTexture>
>

export type LoadTerrainTextureArraysResult =
  | {
      manifest: TerrainTextureManifest
      status: 'ready'
      textures: TerrainTextureArrays
    }
  | {
      error: Error
      status: 'error'
    }

export type LoadTerrainTextureArraysOptions = {
  decodeImage?: (
    bytes: ArrayBuffer,
    fileName: TerrainTextureFileName,
  ) => Promise<DecodedTerrainTexture>
  fetch?: typeof fetch
  onProgress?: (loaded: number, total: number) => void
  textureBaseUrl?: string
}

const tierStrips: Record<
  Exclude<GraphicsTier, 'low'>,
  TerrainTextureFileName[]
> = {
  medium: ['caps-diffuse.png', 'sides-diffuse.png'],
  high: [
    'caps-diffuse-pbr.png',
    'caps-diffuse.png',
    'sides-diffuse.png',
    'caps-orm.png',
    'sides-orm.png',
    'caps-normal.png',
    'sides-normal.png',
  ],
}

export const HIGH_TIER_PBR_TEXTURE_UNITS = 6

export function hasHighTierPbrTextureUnitBudget(maxTextureImageUnits: number) {
  return (
    Number.isInteger(maxTextureImageUnits) &&
    maxTextureImageUnits >= HIGH_TIER_PBR_TEXTURE_UNITS
  )
}

const stripPromises = new Map<
  TerrainTextureFileName,
  Promise<DataArrayTexture>
>()
const loadedTextures = new Map<TerrainTextureFileName, DataArrayTexture>()
let manifestPromise: Promise<TerrainTextureManifest> | undefined
let loadedManifest: TerrainTextureManifest | undefined
let generation = 0

export function getTerrainTextureArrayStats() {
  let cpuBytes = 0
  for (const texture of loadedTextures.values()) {
    const data = texture.source.data?.data
    if (ArrayBuffer.isView(data)) cpuBytes += data.byteLength
  }
  return {
    cpuBytes,
    manifestBytes: loadedManifest
      ? JSON.stringify(loadedManifest).length * 2
      : 0,
    textureArrayCount: loadedTextures.size,
  }
}

export function getTerrainTextureStrips(
  tier: GraphicsTier,
): TerrainTextureFileName[] {
  return tier === 'low' ? [] : [...tierStrips[tier]]
}

export function getCachedTerrainTextureArrays(
  tier: GraphicsTier,
): { manifest: TerrainTextureManifest; textures: TerrainTextureArrays } | null {
  if (tier === 'low' || !loadedManifest) return null
  const fileNames = tierStrips[tier]
  if (fileNames.some((fileName) => !loadedTextures.has(fileName))) return null
  return {
    manifest: loadedManifest,
    textures: Object.fromEntries(
      fileNames.map((fileName) => [fileName, loadedTextures.get(fileName)]),
    ) as TerrainTextureArrays,
  }
}

/**
 * Reverses the row order of one RGBA layer. WebGL rejects FLIP_Y for 3D
 * texture uploads (Chrome logs INVALID_OPERATION and the array stays empty),
 * so layers are flipped here instead of with `texture.flipY`.
 */
export function flipTextureLayerRows(
  layer: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const rowBytes = width * 4
  if (layer.length !== rowBytes * height) {
    throw new Error('Texture layer dimensions do not match its RGBA data')
  }
  const flipped = new Uint8Array(layer.length)
  for (let row = 0; row < height; row++) {
    flipped.set(
      layer.subarray(row * rowBytes, (row + 1) * rowBytes),
      (height - 1 - row) * rowBytes,
    )
  }
  return flipped
}

export function sliceTextureArrayLayers(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  layerCount: number,
): Uint8Array[] {
  if (
    !Number.isInteger(width) ||
    width <= 0 ||
    !Number.isInteger(height) ||
    height <= 0 ||
    !Number.isInteger(layerCount) ||
    layerCount <= 0 ||
    height % layerCount !== 0 ||
    data.length !== width * height * 4
  ) {
    throw new Error('Texture strip dimensions or RGBA data are invalid')
  }

  const bytesPerLayer = (width * height * 4) / layerCount
  return Array.from({ length: layerCount }, (_, index) =>
    Uint8Array.from(
      data.subarray(index * bytesPerLayer, (index + 1) * bytesPerLayer),
    ),
  )
}

async function decodeTextureImage(
  bytes: ArrayBuffer,
): Promise<DecodedTerrainTexture> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('This browser does not support texture image decoding')
  }
  const bitmap = await createImageBitmap(
    new Blob([bytes], { type: 'image/png' }),
  )
  try {
    const canvas =
      typeof OffscreenCanvas === 'function'
        ? new OffscreenCanvas(bitmap.width, bitmap.height)
        : Object.assign(document.createElement('canvas'), {
            width: bitmap.width,
            height: bitmap.height,
          })
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Could not create a texture image canvas')
    context.drawImage(bitmap, 0, 0)
    const image = context.getImageData(0, 0, bitmap.width, bitmap.height)
    return {
      data: image.data,
      width: image.width,
      height: image.height,
    }
  } finally {
    bitmap.close()
  }
}

async function loadManifest(
  fetcher: typeof fetch,
  textureBaseUrl: string,
): Promise<TerrainTextureManifest> {
  if (!manifestPromise) {
    const request = fetcher(`${textureBaseUrl}/manifest.json`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Could not load terrain texture manifest (${response.status})`,
          )
        }
        return parseTerrainTextureManifest(await response.json())
      })
      .catch((error: unknown) => {
        if (manifestPromise === request) manifestPromise = undefined
        throw error
      })
    manifestPromise = request
  }
  return manifestPromise
}

function createArrayTexture(
  decoded: DecodedTerrainTexture,
  file: TerrainTextureFile,
  fileName: TerrainTextureFileName,
): DataArrayTexture {
  if (decoded.width !== file.width || decoded.height !== file.height) {
    throw new Error(
      `${fileName} decoded as ${decoded.width}x${decoded.height}; ` +
        `expected ${file.width}x${file.height}`,
    )
  }
  const layers = sliceTextureArrayLayers(
    decoded.data,
    decoded.width,
    decoded.height,
    file.layers,
  )
  const pixels = new Uint8Array(decoded.data.length)
  layers.forEach((layer, index) =>
    pixels.set(
      flipTextureLayerRows(layer, file.frameWidth, file.frameHeight),
      index * layer.length,
    ),
  )
  const texture = new DataArrayTexture(
    pixels,
    file.frameWidth,
    file.frameHeight,
    file.layers,
  )
  texture.format = RGBAFormat
  texture.type = UnsignedByteType
  texture.colorSpace =
    file.colorSpace === 'srgb' ? SRGBColorSpace : NoColorSpace
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.generateMipmaps = true
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.anisotropy = 4
  // Never set flipY or premultiplyAlpha: WebGL forbids them for 3D uploads.
  texture.flipY = false
  texture.unpackAlignment = 1
  texture.needsUpdate = true
  return texture
}

function errorFrom(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

function loadStrip(
  fileName: TerrainTextureFileName,
  file: TerrainTextureFile,
  fetcher: typeof fetch,
  decodeImage: LoadTerrainTextureArraysOptions['decodeImage'],
  textureBaseUrl: string,
): Promise<DataArrayTexture> {
  const cached = stripPromises.get(fileName)
  if (cached) return cached

  const loadGeneration = generation
  const request = fetcher(`${textureBaseUrl}/${fileName}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Could not load ${fileName} (${response.status})`)
      }
      const bytes = await response.arrayBuffer()
      const decode = decodeImage ?? decodeTextureImage
      const texture = createArrayTexture(
        await decode(bytes, fileName),
        file,
        fileName,
      )
      if (loadGeneration !== generation) {
        texture.dispose()
        throw new Error('Texture loading was disposed before it completed')
      }
      loadedTextures.set(fileName, texture)
      return texture
    })
    .catch((error: unknown) => {
      if (stripPromises.get(fileName) === request) {
        stripPromises.delete(fileName)
      }
      throw error
    })
  stripPromises.set(fileName, request)
  return request
}

export async function loadTerrainTextureArrays(
  tier: Exclude<GraphicsTier, 'low'>,
  options: LoadTerrainTextureArraysOptions = {},
): Promise<LoadTerrainTextureArraysResult> {
  const fetcher = options.fetch ?? fetch
  const textureBaseUrl = (options.textureBaseUrl ?? '/textures').replace(
    /\/$/,
    '',
  )
  const fileNames = getTerrainTextureStrips(tier)
  const loadGeneration = generation
  let loaded = 0

  try {
    options.onProgress?.(loaded, fileNames.length)
    const manifest = await loadManifest(fetcher, textureBaseUrl)
    if (loadGeneration !== generation) {
      throw new Error('Texture loading was disposed before it completed')
    }
    const textures = await Promise.all(
      fileNames.map((fileName) =>
        loadStrip(
          fileName,
          manifest.files[fileName],
          fetcher,
          options.decodeImage,
          textureBaseUrl,
        ).then((texture) => {
          loaded += 1
          options.onProgress?.(loaded, fileNames.length)
          return [fileName, texture] as const
        }),
      ),
    )
    if (loadGeneration !== generation) {
      throw new Error('Texture loading was disposed before it completed')
    }
    loadedManifest = manifest
    return {
      manifest,
      status: 'ready',
      textures: Object.fromEntries(textures),
    }
  } catch (error) {
    return { error: errorFrom(error), status: 'error' }
  }
}

export function disposeTerrainTextureArrays(): void {
  generation += 1
  for (const texture of loadedTextures.values()) texture.dispose()
  loadedTextures.clear()
  stripPromises.clear()
  manifestPromise = undefined
  loadedManifest = undefined
}
