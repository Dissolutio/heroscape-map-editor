import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type GlbJson = {
  accessors: Array<{
    min?: number[]
    max?: number[]
  }>
  meshes: Array<{
    name: string
    primitives: Array<{
      attributes: Record<string, number>
      material?: number
    }>
  }>
  materials?: Array<{
    pbrMetallicRoughness?: {
      baseColorTexture?: { index: number }
    }
  }>
}

function readGlbJson(path: string): GlbJson {
  const buffer = readFileSync(resolve(process.cwd(), path))
  const jsonChunkLength = buffer.readUInt32LE(12)
  return JSON.parse(
    buffer.toString('utf8', 20, 20 + jsonChunkLength),
  ) as GlbJson
}

function getHiveBounds(path: string) {
  const glb = readGlbJson(path)
  const hiveMesh = glb.meshes[0]
  const positionAccessor =
    glb.accessors[hiveMesh.primitives[0].attributes.POSITION]
  if (!positionAccessor.min || !positionAccessor.max) {
    throw new Error(`${path} is missing position bounds`)
  }
  return { glb, hiveMesh, min: positionAccessor.min, max: positionAccessor.max }
}

describe('textured Marro Hive model', () => {
  it('preserves the original model bounds and sits on the ground', () => {
    const oldHive = getHiveBounds('public/uncolored-decimated-marro-hive-6.glb')
    const newHive = getHiveBounds('public/marro-hive-6-textured.glb')

    expect(oldHive.hiveMesh.name).toBe('Marro_Hive')
    expect(newHive.hiveMesh.name).toBe('Marro_Hive_VS')
    for (let axis = 0; axis < 3; axis += 1) {
      expect(
        Math.abs(newHive.min[axis] - oldHive.min[axis]),
      ).toBeLessThanOrEqual(0.25)
      expect(
        Math.abs(newHive.max[axis] - oldHive.max[axis]),
      ).toBeLessThanOrEqual(0.25)
    }
    expect(newHive.min[1]).toBeCloseTo(0, 2)
    expect(newHive.hiveMesh.primitives[0].attributes.TEXCOORD_0).toBeDefined()
    expect(
      newHive.glb.materials?.[newHive.hiveMesh.primitives[0].material ?? -1]
        ?.pbrMetallicRoughness?.baseColorTexture,
    ).toBeDefined()
  })
})
