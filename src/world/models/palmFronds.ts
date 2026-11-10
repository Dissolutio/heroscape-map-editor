import { BufferAttribute, BufferGeometry, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import type { GraphicsTier } from '../../local-storage/settings'

export type PalmStyle = 'laur' | 'ticalla'

export type PalmFrondRing = {
  count: number
  length: number
  droop: number
  baseY: number
  width: number
  segments: number
  phase: number
}

export type PalmFrondTransform = {
  position: [number, number, number]
  rotation: [number, number, number]
  length: number
  droopScale: number
  widthScale: number
}

export const PALM_FROND_BLADE_WIDTH: Record<PalmStyle, number> = {
  laur: 1.45,
  ticalla: 1.45,
}
export const PALM_FROND_FOLD = 0.16

export function applyPalmFrondInstances(
  mesh: InstancedMesh,
  instances: PalmFrondTransform[],
) {
  const object = new Object3D()
  instances.forEach((instance, index) => {
    object.position.set(...instance.position)
    object.rotation.set(...instance.rotation)
    object.scale.set(instance.length, instance.droopScale, instance.widthScale)
    object.updateMatrix()
    mesh.setMatrixAt(index, object.matrix)
  })
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
}

export const PALM_FROND_BASE_DROOP = 0.8
export const PALM_FROND_BASE_WIDTH: Record<PalmStyle, number> = {
  laur: 0.38,
  ticalla: 0.44,
}

const ringProfiles: Record<
  PalmStyle,
  Record<Exclude<GraphicsTier, 'low'>, PalmFrondRing[]>
> = {
  laur: {
    medium: [
      {
        count: 7,
        length: 2.35,
        droop: 1.05,
        baseY: 4.68,
        width: 0.38,
        segments: 5,
        phase: 0,
      },
      {
        count: 7,
        length: 1.85,
        droop: 0.64,
        baseY: 4.76,
        width: 0.34,
        segments: 5,
        phase: 0.5,
      },
      {
        count: 5,
        length: 1.02,
        droop: -0.24,
        baseY: 4.77,
        width: 0.27,
        segments: 5,
        phase: 0.2,
      },
    ],
    high: [
      {
        count: 8,
        length: 2.35,
        droop: 1.05,
        baseY: 4.68,
        width: 0.38,
        segments: 5,
        phase: 0,
      },
      {
        count: 8,
        length: 1.85,
        droop: 0.64,
        baseY: 4.76,
        width: 0.34,
        segments: 5,
        phase: 0.5,
      },
      {
        count: 6,
        length: 1.02,
        droop: -0.24,
        baseY: 4.77,
        width: 0.27,
        segments: 5,
        phase: 0.2,
      },
    ],
  },
  ticalla: {
    medium: [
      {
        count: 7,
        length: 2.22,
        droop: 0.82,
        baseY: 4.68,
        width: 0.46,
        segments: 5,
        phase: 0,
      },
      {
        count: 7,
        length: 1.82,
        droop: 0.48,
        baseY: 4.76,
        width: 0.42,
        segments: 5,
        phase: 0.5,
      },
      {
        count: 5,
        length: 1.12,
        droop: -0.2,
        baseY: 4.78,
        width: 0.34,
        segments: 5,
        phase: 0.2,
      },
    ],
    high: [
      {
        count: 8,
        length: 2.22,
        droop: 0.82,
        baseY: 4.68,
        width: 0.46,
        segments: 5,
        phase: 0,
      },
      {
        count: 8,
        length: 1.82,
        droop: 0.48,
        baseY: 4.76,
        width: 0.42,
        segments: 5,
        phase: 0.5,
      },
      {
        count: 6,
        length: 1.12,
        droop: -0.2,
        baseY: 4.78,
        width: 0.34,
        segments: 5,
        phase: 0.2,
      },
    ],
  },
}

export function getPalmFrondRings(
  style: PalmStyle,
  tier: GraphicsTier,
): PalmFrondRing[] {
  if (tier === 'low') return []
  return ringProfiles[style][tier]
}

function seedNumber(seed: string): number {
  let value = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0 || 1
}

function makeRandom(seed: number) {
  let value = seed
  return () => {
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    return (value >>> 0) / 4294967296
  }
}

export function buildPalmFrondInstances(
  seed: string,
  style: PalmStyle,
  tier: GraphicsTier,
): PalmFrondTransform[][] {
  const random = makeRandom(seedNumber(`${seed}:${style}:${tier}`))
  return getPalmFrondRings(style, tier).map((ring) =>
    Array.from({ length: ring.count }, (_, index) => {
      const angle =
        ((index + ring.phase) * Math.PI * 2) / ring.count +
        (random() - 0.5) * 0.16
      return {
        position: [
          (random() - 0.5) * 0.08,
          ring.baseY + (random() - 0.5) * 0.1,
          (random() - 0.5) * 0.08,
        ],
        rotation: [
          (random() - 0.5) * (style === 'laur' ? 0.19 : 0.13),
          angle,
          (random() - 0.5) * (style === 'laur' ? 0.2 : 0.12),
        ],
        length: ring.length * (0.94 + random() * 0.12),
        droopScale: ring.droop / PALM_FROND_BASE_DROOP,
        widthScale: ring.width / PALM_FROND_BASE_WIDTH[style],
      }
    }),
  )
}

export function buildPalmFrondGeometry(
  ring: Pick<PalmFrondRing, 'segments' | 'width' | 'droop'>,
): BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const halfWidthAt = (along: number) =>
    ring.width * Math.sin(Math.PI * along) ** 0.72 * 0.5

  for (let step = 0; step <= ring.segments; step += 1) {
    const along = step / ring.segments
    const curve = -ring.droop * along * along
    const width = halfWidthAt(along)
    positions.push(
      along,
      curve,
      -width,
      along,
      curve + PALM_FROND_FOLD,
      0,
      along,
      curve,
      width,
    )
    uvs.push(along, 0, along, 0.5, along, 1)

    if (step < ring.segments) {
      const left = step * 3
      indices.push(
        left,
        left + 3,
        left + 1,
        left + 1,
        left + 3,
        left + 4,
        left + 1,
        left + 4,
        left + 2,
        left + 2,
        left + 4,
        left + 5,
      )
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  )
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
