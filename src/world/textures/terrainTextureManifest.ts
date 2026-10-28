export const TERRAIN_TEXTURE_FILES = [
  'caps-diffuse.png',
  'caps-diffuse-pbr.png',
  'caps-orm.png',
  'caps-normal.png',
  'sides-diffuse.png',
  'sides-orm.png',
  'sides-normal.png',
] as const

export type TerrainTextureFileName = (typeof TERRAIN_TEXTURE_FILES)[number]

export type TerrainTextureFile = {
  colorSpace: 'srgb' | 'data'
  frameHeight: number
  frameWidth: number
  height: number
  layers: number
  width: number
}

export type TerrainTextureLayers = {
  allowRandomRotation: boolean
  capDiffuseLayer: number
  capDiffusePbrLayer: number
  capNormalLayer: number
  capOrmLayer: number
  flatColor: string | null
  isFluid: boolean
  sideDiffuseLayer: number
  sideNormalLayer: number
  sideOrmLayer: number
}

export type TerrainTextureManifest = {
  files: Record<TerrainTextureFileName, TerrainTextureFile>
  normalConvention: 'opengl'
  terrainOrder: string[]
  terrains: Record<string, TerrainTextureLayers>
  version: 1
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isPositiveInteger = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) > 0

const layerFields = [
  'capDiffuseLayer',
  'capDiffusePbrLayer',
  'capOrmLayer',
  'capNormalLayer',
  'sideDiffuseLayer',
  'sideOrmLayer',
  'sideNormalLayer',
] as const

const layerFiles: Record<(typeof layerFields)[number], TerrainTextureFileName> =
  {
    capDiffuseLayer: 'caps-diffuse.png',
    capDiffusePbrLayer: 'caps-diffuse-pbr.png',
    capOrmLayer: 'caps-orm.png',
    capNormalLayer: 'caps-normal.png',
    sideDiffuseLayer: 'sides-diffuse.png',
    sideOrmLayer: 'sides-orm.png',
    sideNormalLayer: 'sides-normal.png',
  }

function invalidManifest(message: string): never {
  throw new Error(`Invalid terrain texture manifest: ${message}`)
}

export function parseTerrainTextureManifest(
  json: unknown,
): TerrainTextureManifest {
  if (!isRecord(json)) invalidManifest('expected an object')
  if (json.version !== 1) {
    invalidManifest(`unsupported version ${String(json.version)} (expected 1)`)
  }
  if (json.normalConvention !== 'opengl') {
    invalidManifest('normalConvention must be "opengl"')
  }
  if (!isRecord(json.files)) invalidManifest('files must be an object')

  const fileNames = Object.keys(json.files)
  if (
    fileNames.length !== TERRAIN_TEXTURE_FILES.length ||
    TERRAIN_TEXTURE_FILES.some(
      (name) => !Object.prototype.hasOwnProperty.call(json.files, name),
    ) ||
    fileNames.some(
      (name) => !TERRAIN_TEXTURE_FILES.includes(name as TerrainTextureFileName),
    )
  ) {
    invalidManifest('files must list each supported texture strip exactly once')
  }

  const files = {} as Record<TerrainTextureFileName, TerrainTextureFile>
  for (const name of TERRAIN_TEXTURE_FILES) {
    const file = json.files[name]
    if (!isRecord(file)) invalidManifest(`files.${name} must be an object`)
    if (
      !isPositiveInteger(file.width) ||
      !isPositiveInteger(file.height) ||
      !isPositiveInteger(file.frameWidth) ||
      !isPositiveInteger(file.frameHeight) ||
      !isPositiveInteger(file.layers) ||
      file.width !== file.frameWidth ||
      file.height !== file.frameHeight * file.layers
    ) {
      invalidManifest(`files.${name} has invalid strip dimensions`)
    }

    const expectedColorSpace = name.includes('diffuse') ? 'srgb' : 'data'
    if (file.colorSpace !== expectedColorSpace) {
      invalidManifest(
        `files.${name}.colorSpace must be "${expectedColorSpace}"`,
      )
    }
    files[name] = file as unknown as TerrainTextureFile
  }

  if (
    !Array.isArray(json.terrainOrder) ||
    json.terrainOrder.length === 0 ||
    !json.terrainOrder.every(
      (name) => typeof name === 'string' && name.length > 0,
    ) ||
    new Set(json.terrainOrder).size !== json.terrainOrder.length
  ) {
    invalidManifest('terrainOrder must contain unique terrain names')
  }
  if (!isRecord(json.terrains)) invalidManifest('terrains must be an object')

  const terrainOrder = json.terrainOrder as string[]
  const terrains = json.terrains
  if (
    terrainOrder.length !== Object.keys(terrains).length ||
    terrainOrder.some(
      (name) => !Object.prototype.hasOwnProperty.call(terrains, name),
    )
  ) {
    invalidManifest('terrainOrder must include every terrain exactly once')
  }

  const validatedTerrains: Record<string, TerrainTextureLayers> = {}
  for (const name of terrainOrder) {
    const terrain = terrains[name]
    if (!isRecord(terrain)) {
      invalidManifest(`terrains.${name} must be an object`)
    }
    for (const field of layerFields) {
      const layer = terrain[field]
      const file = files[layerFiles[field]]
      if (
        !Number.isInteger(layer) ||
        Number(layer) < -1 ||
        Number(layer) >= file.layers
      ) {
        invalidManifest(
          `terrains.${name}.${field} must be -1 or a valid layer index`,
        )
      }
    }
    if (
      typeof terrain.allowRandomRotation !== 'boolean' ||
      typeof terrain.isFluid !== 'boolean' ||
      !(
        terrain.flatColor === null ||
        (typeof terrain.flatColor === 'string' &&
          /^#[0-9a-fA-F]{6}$/.test(terrain.flatColor))
      )
    ) {
      invalidManifest(`terrains.${name} has invalid terrain metadata`)
    }
    validatedTerrains[name] = terrain as unknown as TerrainTextureLayers
  }

  return {
    files,
    normalConvention: 'opengl',
    terrainOrder,
    terrains: validatedTerrains,
    version: 1,
  }
}
