import {
  BufferGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
} from 'three'
import { describe, expect, it } from 'vitest'
import {
  applyPalmFrondInstances,
  buildPalmFrondGeometry,
  buildPalmFrondInstances,
  getPalmFrondRings,
} from './palmFronds'

describe('palm frond generation', () => {
  it('is deterministic for a piece seed and changes with a different seed', () => {
    const first = buildPalmFrondInstances('piece-1', 'laur', 'high')
    expect(buildPalmFrondInstances('piece-1', 'laur', 'high')).toEqual(first)
    expect(buildPalmFrondInstances('piece-2', 'laur', 'high')).not.toEqual(
      first,
    )
  })

  it('uses the expected tier-specific frond counts for both palms', () => {
    for (const style of ['laur', 'ticalla'] as const) {
      expect(getPalmFrondRings(style, 'low')).toEqual([])
      expect(
        getPalmFrondRings(style, 'medium').reduce(
          (total, ring) => total + ring.count,
          0,
        ),
      ).toBe(19)
      expect(
        getPalmFrondRings(style, 'high').reduce(
          (total, ring) => total + ring.count,
          0,
        ),
      ).toBe(22)
    }
  })

  it('builds a segmented frond with the configured triangle count', () => {
    const geometry = buildPalmFrondGeometry({
      segments: 5,
      width: 0.2,
      droop: 0.8,
    })

    expect(geometry.getAttribute('position').count).toBe(12)
    expect(geometry.index?.count).toBe(30)
    expect(geometry.getAttribute('uv').count).toBe(12)
    geometry.dispose()
  })

  it('rewrites matrices and bounds on a mesh rebuilt with a new material', () => {
    const instances = buildPalmFrondInstances(
      'palm-rebuild',
      'ticalla',
      'high',
    ).flat()
    const geometry = buildPalmFrondGeometry({
      segments: 5,
      width: 0.44,
      droop: 0.8,
    })
    const firstMaterial = new MeshBasicMaterial()
    const firstMesh = new InstancedMesh(
      geometry,
      firstMaterial,
      instances.length,
    )
    applyPalmFrondInstances(firstMesh, instances)

    const rebuiltMaterial = new MeshBasicMaterial({ color: 'yellow' })
    const rebuiltMesh = new InstancedMesh(
      geometry,
      rebuiltMaterial,
      instances.length,
    )
    applyPalmFrondInstances(rebuiltMesh, instances)

    const expectedMatrices = new Float32Array(instances.length * 16)
    const object = new Object3D()
    instances.forEach((instance, index) => {
      object.position.set(...instance.position)
      object.rotation.set(...instance.rotation)
      object.scale.set(
        instance.length,
        instance.droopScale,
        instance.widthScale,
      )
      object.updateMatrix()
      expectedMatrices.set(object.matrix.elements, index * 16)
    })

    expect(rebuiltMesh.instanceMatrix.array).toEqual(expectedMatrices)
    expect(rebuiltMesh.boundingSphere?.center.y).toBeGreaterThan(3.5)

    firstMesh.dispose()
    rebuiltMesh.dispose()
    geometry.dispose()
    firstMaterial.dispose()
    rebuiltMaterial.dispose()
  })
})
