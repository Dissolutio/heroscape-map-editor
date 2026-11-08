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
  textures?: Array<{ source?: number }>
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

function expectBoundsClose(
  oldBounds: ReturnType<typeof getMeshBounds>,
  newBounds: ReturnType<typeof getMeshBounds>,
  tolerance: number,
  oldScale: [number, number, number] = [1, 1, 1],
  newScale: [number, number, number] = [1, 1, 1],
) {
  for (let axis = 0; axis < 3; axis += 1) {
    expect(
      Math.abs(
        oldBounds.min[axis] * oldScale[axis] -
          newBounds.min[axis] * newScale[axis],
      ),
    ).toBeLessThanOrEqual(tolerance)
    expect(
      Math.abs(
        oldBounds.max[axis] * oldScale[axis] -
          newBounds.max[axis] * newScale[axis],
      ),
    ).toBeLessThanOrEqual(tolerance)
  }
}

function expectTexturedMesh(glb: GlbJson, meshName: string) {
  const { mesh } = getMeshBounds(glb, meshName)
  const primitive = mesh.primitives[0]
  expect(primitive.attributes.TEXCOORD_0).toBeDefined()
  const textureIndex =
    glb.materials?.[primitive.material ?? -1]?.pbrMetallicRoughness
      ?.baseColorTexture?.index
  expect(textureIndex).toBeDefined()
  const imageIndex = glb.textures?.[textureIndex ?? -1]?.source
  const image = glb.images?.[imageIndex ?? -1]
  expect(image?.mimeType).toBe('image/jpeg')
  expect(image?.bufferView).toBeDefined()
  expect(glb.bufferViews?.[image?.bufferView ?? -1]).toBeDefined()
}

describe('textured evergreen tree models', () => {
  it('keeps the forest evergreen geometry, UVs, and embedded texture', () => {
    const oldTree = readGlbJson(
      'public/forgotten-forest-tree-low-poly-colored.glb',
    )
    const newTree = readGlbJson('public/forgotten-forest-tree-textured.glb')
    const oldBounds = getMeshBounds(oldTree, 'Tree10_scanned')
    const newBounds = getMeshBounds(newTree, 'Tree10_scanned')

    expectTexturedMesh(newTree, 'Tree10_scanned')
    expectBoundsClose(
      oldBounds,
      newBounds,
      0.25,
      [0.04, 0.04, 0.04],
      [0.04, 0.04, 0.04],
    )
  })

  it('keeps the large evergreen parts aligned and embeds tree and rock textures', () => {
    const oldTree = readGlbJson('public/big-tree-415.glb')
    const newTree = readGlbJson('public/big-tree-415-textured.glb')

    expect(newTree.meshes.map((mesh) => mesh.name)).toEqual([
      'BigTreeBoulders',
      'BigTreeTree',
      'BigTreeBase',
    ])
    expectTexturedMesh(newTree, 'BigTreeBoulders')
    expectTexturedMesh(newTree, 'BigTreeTree')

    expectBoundsClose(
      getMeshBounds(oldTree, 'BigTreeBoulders'),
      getMeshBounds(newTree, 'BigTreeBoulders'),
      0.3,
    )
    expectBoundsClose(
      getMeshBounds(oldTree, 'BigTreeTree'),
      getMeshBounds(newTree, 'BigTreeTree'),
      0.25,
      [1, 1, 1],
      [1, 0.875, 1],
    )
    expectBoundsClose(
      getMeshBounds(oldTree, 'BigTreeBase'),
      getMeshBounds(newTree, 'BigTreeBase'),
      0.25,
    )
  })
})
