import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type GlbJson = {
  accessors: Array<{
    min?: number[]
    max?: number[]
  }>
  bufferViews?: Array<unknown>
  images?: Array<{
    bufferView?: number
    mimeType?: string
  }>
  materials?: Array<{
    doubleSided?: boolean
    pbrMetallicRoughness?: {
      baseColorTexture?: { index: number }
    }
  }>
  meshes: Array<{
    name: string
    primitives: Array<{
      attributes: Record<string, number>
      material?: number
    }>
  }>
  samplers?: Array<{
    wrapS?: number
    wrapT?: number
  }>
  textures?: Array<{ sampler?: number; source?: number }>
}

function readGlbJson(path: string): GlbJson {
  const buffer = readFileSync(resolve(process.cwd(), path))
  if (buffer.toString('ascii', 0, 4) !== 'glTF') {
    throw new Error(`${path} is not a GLB file`)
  }
  const jsonChunkLength = buffer.readUInt32LE(12)
  return JSON.parse(
    buffer.toString('utf8', 20, 20 + jsonChunkLength),
  ) as GlbJson
}

function getCombinedBounds(glb: GlbJson) {
  const bounds = glb.meshes.flatMap((mesh) =>
    mesh.primitives.map((primitive) => {
      const position = glb.accessors[primitive.attributes.POSITION]
      if (!position?.min || !position.max) {
        throw new Error(`Mesh ${mesh.name} is missing position bounds`)
      }
      return { min: position.min, max: position.max }
    }),
  )
  return {
    min: [0, 1, 2].map((axis) =>
      Math.min(...bounds.map((bound) => bound.min[axis])),
    ),
    max: [0, 1, 2].map((axis) =>
      Math.max(...bounds.map((bound) => bound.max[axis])),
    ),
  }
}

function expectTexturedMesh(glb: GlbJson, meshName: string) {
  const mesh = glb.meshes.find((item) => item.name === meshName)
  if (!mesh) throw new Error(`Missing mesh ${meshName}`)
  const primitive = mesh.primitives[0]
  expect(primitive.attributes.TEXCOORD_0).toBeDefined()
  const textureIndex =
    glb.materials?.[primitive.material ?? -1]?.pbrMetallicRoughness
      ?.baseColorTexture?.index
  expect(glb.materials?.[primitive.material ?? -1]?.doubleSided).toBe(true)
  expect(textureIndex).toBeDefined()
  const texture = glb.textures?.[textureIndex ?? -1]
  expect(texture).toBeDefined()
  const sampler = glb.samplers?.[texture?.sampler ?? -1]
  expect(sampler?.wrapS).toBe(10497)
  expect(sampler?.wrapT).toBe(10497)
  const image = glb.images?.[texture?.source ?? -1]
  expect(image?.mimeType).toBe('image/jpeg')
  expect(image?.bufferView).toBeDefined()
  expect(glb.bufferViews?.[image?.bufferView ?? -1]).toBeDefined()
}

const recordedOldBounds = {
  ruins2: {
    min: [-0.25, 0, -1.38],
    max: [3.67, 3.41, 0.6],
  },
  ruins3: {
    min: [-0.22, 0.01, -1.37],
    max: [5.23, 3.43, 0.5],
  },
}

function expectBoundsClose(
  actual: ReturnType<typeof getCombinedBounds>,
  expected: { min: number[]; max: number[] },
) {
  for (let axis = 0; axis < 3; axis += 1) {
    expect(Math.abs(actual.min[axis] - expected.min[axis])).toBeLessThanOrEqual(
      0.25,
    )
    expect(Math.abs(actual.max[axis] - expected.max[axis])).toBeLessThanOrEqual(
      0.25,
    )
  }
}

describe('textured ruin models', () => {
  it('keeps Ruins 2 geometry bounds, UVs, textures, and repeat samplers', () => {
    const ruins2 = readGlbJson('public/ruins2-textured.glb')
    expect(ruins2.meshes.map((mesh) => mesh.name)).toEqual([
      'Ruin_Small_Face',
      'Ruin_Small_Columns',
    ])
    expectTexturedMesh(ruins2, 'Ruin_Small_Face')
    expectTexturedMesh(ruins2, 'Ruin_Small_Columns')
    expectBoundsClose(getCombinedBounds(ruins2), recordedOldBounds.ruins2)
  })

  it('keeps Ruins 3 geometry bounds, UVs, textures, and repeat samplers', () => {
    const ruins3 = readGlbJson('public/ruins3-textured.glb')
    expect(ruins3.meshes.map((mesh) => mesh.name)).toEqual([
      'Ruin_Large_Face',
      'Ruin_Large_Columns',
    ])
    expectTexturedMesh(ruins3, 'Ruin_Large_Face')
    expectTexturedMesh(ruins3, 'Ruin_Large_Columns')
    expectBoundsClose(getCombinedBounds(ruins3), recordedOldBounds.ruins3)
  })
})
