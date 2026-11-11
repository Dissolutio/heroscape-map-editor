import {
  BufferGeometry,
  Color,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
} from 'three'
import { describe, expect, it } from 'vitest'
import { getPalmHighlightMaterialOptions } from './PalmFrondCanopy'
import {
  MODEL_HIGHLIGHT_EMISSIVE,
  MODEL_HIGHLIGHT_EMISSIVE_INTENSITY,
} from './texturedModelMaterial'
import {
  PALM_CANOPY_TRUNK_OVERLAP,
  PALM_FROND_FOLD,
  PALM_TRUNK_TOP_Y,
  applyPalmFrondInstances,
  buildPalmFrondGeometry,
  buildPalmFrondInstances,
  getPalmFrondRings,
  shouldRenderPalmCrownHub,
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

  it('seats the lowest ring just below each trunk top', () => {
    for (const style of ['laur', 'ticalla'] as const) {
      for (const tier of ['medium', 'high'] as const) {
        const rings = getPalmFrondRings(style, tier)
        const lowestBaseY = Math.min(...rings.map((ring) => ring.baseY))
        const trunkTopY = PALM_TRUNK_TOP_Y[style]

        expect(lowestBaseY).toBeCloseTo(
          trunkTopY - PALM_CANOPY_TRUNK_OVERLAP,
          6,
        )
        expect(lowestBaseY).toBeGreaterThanOrEqual(trunkTopY - 0.1)
        expect(lowestBaseY).toBeLessThanOrEqual(trunkTopY + 0.1)
      }
    }
  })

  it('renders the crown hub only for procedural graphics tiers', () => {
    expect(shouldRenderPalmCrownHub('low')).toBe(false)
    expect(shouldRenderPalmCrownHub('medium')).toBe(true)
    expect(shouldRenderPalmCrownHub('high')).toBe(true)
  })

  it('builds a segmented frond with the configured triangle count', () => {
    const geometry = buildPalmFrondGeometry({
      segments: 5,
      width: 0.2,
      droop: 0.8,
    })

    expect(geometry.getAttribute('position').count).toBe(18)
    expect(geometry.index?.count).toBe(60)
    expect(geometry.getAttribute('uv').count).toBe(18)
    geometry.dispose()
  })

  it('raises the center row and maps its UVs to the middle', () => {
    const geometry = buildPalmFrondGeometry({
      segments: 5,
      width: 0.2,
      droop: 0.8,
    })
    const positions = geometry.getAttribute('position')
    const uvs = geometry.getAttribute('uv')

    for (let step = 0; step <= 5; step += 1) {
      const left = step * 3
      const center = left + 1
      const right = left + 2
      expect(positions.getY(center) - positions.getY(left)).toBeCloseTo(
        PALM_FROND_FOLD,
        6,
      )
      expect(positions.getY(center) - positions.getY(right)).toBeCloseTo(
        PALM_FROND_FOLD,
        6,
      )
      expect(uvs.getY(center)).toBe(0.5)
    }

    geometry.dispose()
  })

  it('uses the shared emissive highlight values for palm materials', () => {
    const highlighted = new MeshStandardMaterial(
      getPalmHighlightMaterialOptions(true),
    )
    const unhighlighted = new MeshStandardMaterial(
      getPalmHighlightMaterialOptions(false),
    )

    expect(highlighted.color.getHex()).toBe(new Color('white').getHex())
    expect(highlighted.emissive.getHex()).toBe(
      new Color(MODEL_HIGHLIGHT_EMISSIVE).getHex(),
    )
    expect(highlighted.emissiveIntensity).toBe(
      MODEL_HIGHLIGHT_EMISSIVE_INTENSITY,
    )
    expect(unhighlighted.emissive.getHex()).toBe(new Color('black').getHex())
    expect(unhighlighted.emissiveIntensity).toBe(0)

    highlighted.dispose()
    unhighlighted.dispose()
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
