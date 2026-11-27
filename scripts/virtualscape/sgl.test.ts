import { describe, expect, it } from 'vitest'
import {
  buildGlb,
  materialKey,
  mergeByMaterial,
  parseSgl,
  readGlbJson,
  simplifyByPosition,
  srgbByteToLinear,
  transformMesh,
  uniformBmpColor,
  walkableTop,
  weld,
} from './sgl.mjs'

type SampleMesh = {
  name: string
  // one entry per vertex: [x, y, z, nx, ny, nz, u, v]
  vertices: number[][]
}

// A hand-written .sgl: u32 mesh count; per mesh a 255-byte name, u32 vertex
// count, then positions, normals and UVs as little-endian f32.
function writeSgl(meshes: SampleMesh[]) {
  const size = meshes.reduce(
    (sum, mesh) => sum + 255 + 4 + mesh.vertices.length * 32,
    4,
  )
  const bytes = new Uint8Array(size)
  const view = new DataView(bytes.buffer)
  let offset = 0
  view.setUint32(offset, meshes.length, true)
  offset += 4
  for (const mesh of meshes) {
    bytes.set(new TextEncoder().encode(mesh.name), offset)
    offset += 255
    view.setUint32(offset, mesh.vertices.length, true)
    offset += 4
    for (const [start, count] of [
      [0, 3],
      [3, 3],
      [6, 2],
    ]) {
      for (const vertex of mesh.vertices) {
        for (let i = start; i < start + count; i += 1) {
          view.setFloat32(offset, vertex[i], true)
          offset += 4
        }
      }
    }
  }
  return bytes
}

// A flat triangle at height 2, wound clockwise seen from above in the
// left-handed .sgl space, with its normal pointing up.
const UP_TRIANGLE: SampleMesh = {
  name: 'TILE',
  vertices: [
    [0, 2, 0, 0, 1, 0, 0, 0],
    [1, 2, 0, 0, 1, 0, 1, 0],
    [0, 2, 1, 0, 1, 0, 0, 1],
  ],
}

const geometricNormal = (positions: Float32Array, t = 0) => {
  const p = (i: number) => [...positions.subarray(i * 3, i * 3 + 3)]
  const [a, b, c] = [p(t * 3), p(t * 3 + 1), p(t * 3 + 2)]
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  return [
    e1[1] * e2[2] - e1[2] * e2[1],
    e1[2] * e2[0] - e1[0] * e2[2],
    e1[0] * e2[1] - e1[1] * e2[0],
  ]
}

describe('parseSgl', () => {
  it('reads names, positions, normals and UVs', () => {
    const [mesh] = parseSgl(writeSgl([UP_TRIANGLE]))
    expect(mesh.name).toBe('TILE')
    expect([...mesh.positions]).toEqual([0, 2, 0, 1, 2, 0, 0, 2, 1])
    expect([...mesh.normals]).toEqual([0, 1, 0, 0, 1, 0, 0, 1, 0])
    expect([...mesh.uvs]).toEqual([0, 0, 1, 0, 0, 1])
  })

  it('reads several meshes', () => {
    const meshes = parseSgl(
      writeSgl([UP_TRIANGLE, { ...UP_TRIANGLE, name: 'FER (2)' }]),
    )
    expect(meshes.map((mesh) => mesh.name)).toEqual(['TILE', 'FER (2)'])
  })

  it('rejects truncated files and trailing bytes', () => {
    const bytes = writeSgl([UP_TRIANGLE])
    expect(() => parseSgl(bytes.subarray(0, bytes.length - 4))).toThrow(
      /truncated/,
    )
    const longer = new Uint8Array(bytes.length + 4)
    longer.set(bytes)
    expect(() => parseSgl(longer)).toThrow(/unread bytes/)
  })

  it('rejects a vertex count that is not whole triangles', () => {
    const bytes = writeSgl([
      { name: 'BAD', vertices: UP_TRIANGLE.vertices.slice(0, 2) },
    ])
    expect(() => parseSgl(bytes)).toThrow(/2 vertices/)
  })
})

describe('materialKey', () => {
  it('drops copy suffixes and case, like Virtualscape texture lookup', () => {
    expect(materialKey('FER (1)')).toBe('fer')
    expect(materialKey('BOULON (12)')).toBe('boulon')
    expect(materialKey('FORTRESS_STRAIGHT_TOWER_BRICKS003')).toBe(
      'fortress_straight_tower_bricks003',
    )
  })
})

describe('transformMesh', () => {
  it('mirrors Z and keeps the stored winding, which becomes counter-clockwise', () => {
    const [mesh] = parseSgl(writeSgl([UP_TRIANGLE]))
    // In the left-handed source the winding is clockwise: the cross product
    // points opposite the stored normal.
    expect(geometricNormal(mesh.positions)[1]).toBeLessThan(0)
    const out = transformMesh(mesh)
    expect([...out.positions]).toEqual([0, 2, 0, 1, 2, 0, 0, 2, -1])
    expect(geometricNormal(out.positions)[1]).toBeGreaterThan(0)
    expect(out.normals[1]).toBeCloseTo(1)
  })

  it('reverses the winding when not mirroring', () => {
    const [mesh] = parseSgl(writeSgl([UP_TRIANGLE]))
    const out = transformMesh(mesh, { mirrorZ: false })
    expect(geometricNormal(out.positions)[1]).toBeGreaterThan(0)
  })

  it('scales Y and keeps normals unit length', () => {
    const [mesh] = parseSgl(
      writeSgl([
        {
          name: 'SLOPE',
          vertices: [
            [0, 0, 0, Math.SQRT1_2, Math.SQRT1_2, 0, 0, 0],
            [1, 1, 0, Math.SQRT1_2, Math.SQRT1_2, 0, 0, 0],
            [0, 0, 1, Math.SQRT1_2, Math.SQRT1_2, 0, 0, 0],
          ],
        },
      ]),
    )
    const out = transformMesh(mesh, { scale: [1, 0.875, 1] })
    expect(out.positions[4]).toBeCloseTo(0.875)
    const n = [...out.normals.subarray(0, 3)]
    expect(Math.hypot(...n)).toBeCloseTo(1)
    // Squashing Y makes the slope's normal steeper toward Y.
    expect(n[1]).toBeGreaterThan(Math.SQRT1_2)
  })

  it('turns an edge piece from the (+X, -Z) edge onto the +X edge', () => {
    // After mirroring, Virtualscape's edge pieces face (0.5, 0, -0.866).
    const outward = [0.5, 0, Math.sqrt(3) / 2] // before the mirror
    const [mesh] = parseSgl(
      writeSgl([
        {
          name: 'EDGE',
          vertices: [0, 1, 2].map(() => [
            outward[0],
            0,
            outward[2],
            outward[0],
            0,
            outward[2],
            0,
            0,
          ]),
        },
      ]),
    )
    const out = transformMesh(mesh, {
      rotateYDegrees: -60,
      translate: [-Math.sqrt(3) / 2, 0, 0],
    })
    expect(out.normals[0]).toBeCloseTo(1)
    expect(out.normals[2]).toBeCloseTo(0)
    // The point one apothem out lands on the edge, which is now x = 0.
    expect(out.positions[0]).toBeCloseTo(1 - Math.sqrt(3) / 2)
    expect(out.positions[2]).toBeCloseTo(0)
  })
})

describe('mergeByMaterial and weld', () => {
  it('merges copies of a material and shares identical vertices', () => {
    const meshes = parseSgl(
      writeSgl([
        { ...UP_TRIANGLE, name: 'FER (1)' },
        { ...UP_TRIANGLE, name: 'FER (2)' },
        UP_TRIANGLE,
      ]),
    ).map((mesh) => transformMesh(mesh))
    const primitives = mergeByMaterial(meshes)
    expect(primitives.map((p) => p.material)).toEqual(['fer', 'tile'])
    // Two identical triangles: three shared vertices, two triangles.
    expect(primitives[0].positions.length / 3).toBe(3)
    expect(primitives[0].indices.length / 3).toBe(2)
  })

  it('drops triangles that collapse when welded', () => {
    const welded = weld({
      positions: new Float32Array([0, 0, 0, 0, 0, 0, 1, 0, 0]),
      normals: new Float32Array(9),
      uvs: new Float32Array(6),
    })
    expect(welded.indices.length).toBe(0)
  })
})

describe('walkableTop', () => {
  it('is the height with the most upward-facing area', () => {
    const meshes = parseSgl(
      writeSgl([
        UP_TRIANGLE,
        {
          name: 'TILE',
          // a bigger triangle at height 1
          vertices: [
            [0, 1, 0, 0, 1, 0, 0, 0],
            [3, 1, 0, 0, 1, 0, 1, 0],
            [0, 1, 3, 0, 1, 0, 0, 1],
          ],
        },
      ]),
    ).map((mesh) => transformMesh(mesh))
    expect(walkableTop(mergeByMaterial(meshes))).toBe(1)
  })
})

describe('simplifyByPosition', () => {
  it('welds by position and rebuilds normals with a crease angle', () => {
    // Two triangles of a folded quad (90 degrees) with per-face normals.
    const meshes = parseSgl(
      writeSgl([
        {
          name: 'WALL',
          vertices: [
            [0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 1, 0, 1, 0, 0, 0],
            [1, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0],
            [0, 1, 0, 1, 0, 0, 0, 0],
            [0, 0, 1, 1, 0, 0, 0, 0],
          ],
        },
      ]),
    ).map((mesh) => transformMesh(mesh))
    const [primitive] = mergeByMaterial(meshes)
    expect(primitive.positions.length / 3).toBe(6)
    let positionsSeen = 0
    const out = simplifyByPosition(primitive, (indices, positions) => {
      positionsSeen = positions.length / 3
      return indices
    })
    // The simplifier sees the 4 shared corners, not 6 split vertices.
    expect(positionsSeen).toBe(4)
    // The 90 degree fold stays hard: the shared edge is split again.
    expect(out.positions.length / 3).toBe(6)
    expect(out.indices.length / 3).toBe(2)
  })
})

describe('uniformBmpColor', () => {
  it('finds one colour in bmp-js ABGR data', () => {
    const data = new Uint8Array([0, 14, 194, 255, 0, 14, 194, 255])
    expect(uniformBmpColor({ width: 2, height: 1, data })).toEqual([
      255, 194, 14,
    ])
    data[5] = 0
    expect(uniformBmpColor({ width: 2, height: 1, data })).toBeNull()
  })
})

describe('buildGlb', () => {
  it('writes a valid GLB with bounds, extras, colours and images', () => {
    const meshes = parseSgl(
      writeSgl([UP_TRIANGLE, { ...UP_TRIANGLE, name: 'PORTE' }]),
    ).map((mesh) => transformMesh(mesh))
    const [tile, porte] = mergeByMaterial(meshes)
    const image = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
    const glb = buildGlb({
      nodes: [
        { name: 'Tile', extras: { walkableTop: 2 }, primitives: [tile] },
        { name: 'Door', primitives: [porte] },
      ],
      materials: {
        tile: { color: [192, 192, 192] },
        porte: { image: { mimeType: 'image/jpeg', bytes: image } },
      },
    })
    const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength)
    expect(view.getUint32(0, true)).toBe(0x46546c67)
    expect(view.getUint32(8, true)).toBe(glb.byteLength)
    expect(glb.byteLength % 4).toBe(0)
    const json = readGlbJson(glb)
    expect(json.nodes.map((n: { name: string }) => n.name)).toEqual([
      'Tile',
      'Door',
    ])
    expect(json.nodes[0].extras).toEqual({ walkableTop: 2 })
    const position =
      json.accessors[json.meshes[0].primitives[0].attributes.POSITION]
    expect(position.count).toBe(3)
    expect(position.min).toEqual([0, 2, -1])
    expect(position.max).toEqual([1, 2, 0])
    const [tileMaterial, doorMaterial] = json.materials
    expect(tileMaterial.pbrMetallicRoughness.baseColorFactor[0]).toBeCloseTo(
      srgbByteToLinear(192),
    )
    expect(doorMaterial.pbrMetallicRoughness.baseColorTexture).toEqual({
      index: 0,
    })
    expect(json.images[0].mimeType).toBe('image/jpeg')
    const imageView = json.bufferViews[json.images[0].bufferView]
    const binStart = 20 + view.getUint32(12, true) + 8
    expect([
      ...glb.subarray(
        binStart + imageView.byteOffset,
        binStart + imageView.byteOffset + 4,
      ),
    ]).toEqual([...image])
  })

  it('refuses a primitive whose material is missing', () => {
    const [mesh] = parseSgl(writeSgl([UP_TRIANGLE])).map((m) =>
      transformMesh(m),
    )
    const [primitive] = mergeByMaterial([mesh])
    expect(() =>
      buildGlb({
        nodes: [{ name: 'X', primitives: [primitive] }],
        materials: {},
      }),
    ).toThrow(/no material/)
  })
})
