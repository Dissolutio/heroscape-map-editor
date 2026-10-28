import { describe, expect, it } from 'vitest'
import {
  BufferGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshBasicMaterial,
  Scene,
  DataArrayTexture,
  RGBAFormat,
  UnsignedByteType,
} from 'three'
import {
  getMonotonicLeakMetrics,
  getSceneMemoryStats,
  type LeakSample,
} from './performance'

const sample = (value: number): LeakSample => ({
  sceneObjects: value,
  geometries: value,
  textures: value,
  programs: value,
  jsHeapBytes: value,
  storeSubscribers: value,
  pendingTimers: value,
  pendingAnimationFrames: value,
})

describe('performance leak metrics', () => {
  it('flags metrics that grow monotonically across repeated samples', () => {
    expect(getMonotonicLeakMetrics([sample(1), sample(2), sample(3)])).toEqual([
      'sceneObjects',
      'geometries',
      'textures',
      'programs',
      'jsHeapBytes',
      'storeSubscribers',
      'pendingTimers',
      'pendingAnimationFrames',
    ])
  })

  describe('performance scene memory stats', () => {
    it('counts geometry, instance and texture arrays without double-counting', () => {
      const scene = new Scene()
      const geometry = new BufferGeometry()
      geometry.setAttribute(
        'position',
        new Float32BufferAttribute(new Float32Array(12), 3),
      )
      geometry.setAttribute(
        'landColor',
        new InstancedBufferAttribute(new Float32Array(6), 3),
      )
      const texture = new DataArrayTexture(new Uint8Array(16), 2, 2, 1)
      texture.format = RGBAFormat
      texture.type = UnsignedByteType
      const mesh = new InstancedMesh(
        geometry,
        new MeshBasicMaterial({ map: texture }),
        2,
      )
      scene.add(mesh)

      expect(getSceneMemoryStats(scene)).toEqual({
        typedArrayBytes: 12 * 4 + 6 * 4 + 2 * 16 * 4 + 16,
        geometryTypedArrayBytes: 12 * 4,
        textureCpuBytes: 16,
        instanceMeshCount: 1,
        instanceMatrixBytes: 2 * 16 * 4,
        instanceAttributeCount: 1,
        instanceAttributeBytes: 6 * 4,
      })
    })
  })

  it('does not flag stable, decreasing, or unavailable metrics', () => {
    const first = sample(3)
    const second = { ...sample(3), sceneObjects: 4, jsHeapBytes: null }
    const third = { ...sample(2), jsHeapBytes: null }

    expect(getMonotonicLeakMetrics([first, second, third])).toEqual([])
    expect(getMonotonicLeakMetrics([first, second])).toEqual([])
  })
})
