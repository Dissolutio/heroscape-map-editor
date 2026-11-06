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
  textures?: Array<{
    sampler?: number
    source?: number
  }>
}

function readGlbJson(path: string): GlbJson {
  const buffer = readFileSync(resolve(process.cwd(), path))
  const jsonChunkLength = buffer.readUInt32LE(12)
  return JSON.parse(
    buffer.toString('utf8', 20, 20 + jsonChunkLength),
  ) as GlbJson
}

function getMeshBounds(glb: GlbJson, name: string) {
  const mesh = glb.meshes.find((item) => item.name === name)
  if (!mesh) throw new Error(`Missing mesh ${name}`)
  const positionIndex = mesh.primitives[0].attributes.POSITION
  const accessor = glb.accessors[positionIndex]
  if (!accessor.min || !accessor.max) {
    throw new Error(`Mesh ${name} is missing position bounds`)
  }
  return { mesh, min: accessor.min, max: accessor.max }
}

function expectTexturedMesh(glb: GlbJson, meshName: string) {
  const { mesh } = getMeshBounds(glb, meshName)
  const primitive = mesh.primitives[0]
  expect(primitive.attributes.TEXCOORD_0).toBeDefined()
  const textureIndex =
    glb.materials?.[primitive.material ?? -1]?.pbrMetallicRoughness
      ?.baseColorTexture?.index
  expect(textureIndex).toBeDefined()
  const texture = glb.textures?.[textureIndex ?? -1]
  const image = glb.images?.[texture?.source ?? -1]
  expect(image?.mimeType).toBe('image/jpeg')
  expect(image?.bufferView).toBeDefined()
  expect(glb.bufferViews?.[image?.bufferView ?? -1]).toBeDefined()
  const sampler = glb.samplers?.[texture?.sampler ?? -1]
  expect(sampler?.wrapS).toBe(10497)
  expect(sampler?.wrapT).toBe(10497)
}

describe('textured Road Wall model', () => {
  it('keeps both textured meshes and the original wall bounds', () => {
    const glb = readGlbJson('public/road-wall-textured.glb')
    const oldBounds = {
      min: [0, 0, -0.17],
      max: [6.93, 1.27, 0.5],
    }

    expect(glb.meshes.map((mesh) => mesh.name)).toEqual([
      'RoadWall',
      'RoadWallRoad',
    ])
    expectTexturedMesh(glb, 'RoadWall')
    expectTexturedMesh(glb, 'RoadWallRoad')

    const newBounds = getMeshBounds(glb, 'RoadWall')
    for (let axis = 0; axis < 3; axis += 1) {
      expect(
        Math.abs(newBounds.min[axis] - oldBounds.min[axis]),
      ).toBeLessThanOrEqual(0.1)
      expect(
        Math.abs(newBounds.max[axis] - oldBounds.max[axis]),
      ).toBeLessThanOrEqual(0.1)
    }
  })
})
