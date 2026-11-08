import { describe, expect, it } from 'vitest'
import {
  buildCapGeometry,
  buildFluidGeometry,
  buildSideGeometry,
} from '../world/models/LandHexInstanced'
import { HEX_DIRECTIONS, cubeToPixel } from '../utils/hex-utils'

describe('per-hex land geometry', () => {
  it('draws all six side quads, each from its own four vertices', () => {
    const geometry = buildSideGeometry(0)
    const index = geometry.getIndex()
    const directions = geometry.getAttribute('landDirection')
    expect(geometry.getAttribute('position').count).toBe(24)
    expect(index?.count).toBe(36)
    for (let side = 0; side < 6; side += 1) {
      const used = new Set<number>()
      for (let i = side * 6; i < side * 6 + 6; i += 1) {
        used.add(index?.getX(i) ?? -1)
      }
      // the quad's six indices reference exactly its four vertices
      expect([...used].sort((a, b) => a - b)).toEqual([
        side * 4,
        side * 4 + 1,
        side * 4 + 2,
        side * 4 + 3,
      ])
      for (const vertex of used) {
        expect(directions.getX(vertex)).toBe(side)
      }
    }
  })

  it('aligns solid and fluid side quads with all six hex directions', () => {
    const geometries = [
      { geometry: buildSideGeometry(0), sideVertexOffset: 0 },
      { geometry: buildFluidGeometry(0), sideVertexOffset: 18 },
    ]

    for (const { geometry, sideVertexOffset } of geometries) {
      const positions = geometry.getAttribute('position')
      for (let side = 0; side < 6; side += 1) {
        const first = sideVertexOffset + side * 4
        const opposite = first + 2
        const midpoint = {
          x: (positions.getX(first) + positions.getX(opposite)) / 2,
          z: (positions.getZ(first) + positions.getZ(opposite)) / 2,
        }
        const direction = cubeToPixel(HEX_DIRECTIONS[side])
        const alignment =
          (midpoint.x * direction.x + midpoint.z * direction.y) /
          (Math.hypot(midpoint.x, midpoint.z) *
            Math.hypot(direction.x, direction.y))

        expect(alignment).toBeGreaterThan(0.999)
      }
    }
  })

  it('maps side-image top rows to face tops, including half-height fluids', () => {
    const solid = buildSideGeometry(0).getAttribute('landSideUv')
    const fluid = buildFluidGeometry(0).getAttribute('landSideUv')

    for (let side = 0; side < 6; side += 1) {
      const start = side * 4
      expect([solid.getX(start), solid.getY(start)]).toEqual([1, 0])
      expect([solid.getX(start + 1), solid.getY(start + 1)]).toEqual([1, 1])
      expect([solid.getX(start + 2), solid.getY(start + 2)]).toEqual([0, 1])
      expect([solid.getX(start + 3), solid.getY(start + 3)]).toEqual([0, 0])

      const fluidStart = 18 + start
      for (let vertex = 0; vertex < 4; vertex += 1) {
        expect([
          fluid.getX(fluidStart + vertex),
          fluid.getY(fluidStart + vertex),
        ]).toEqual([solid.getX(start + vertex), solid.getY(start + vertex)])
      }
    }
  })

  it('side u increases to the right of a viewer facing each face, so images are not mirrored', () => {
    const geometry = buildSideGeometry(0)
    const position = geometry.getAttribute('position')
    const uv = geometry.getAttribute('landSideUv')
    for (let side = 0; side < 6; side += 1) {
      const lowU = side * 4 + 3 // u = 0 corner, bottom
      const highU = side * 4 // u = 1 corner, bottom
      expect(uv.getX(lowU)).toBe(0)
      expect(uv.getX(highU)).toBe(1)
      // outward normal of the face, from the midpoint of its bottom edge
      const mx = (position.getX(lowU) + position.getX(highU)) / 2
      const mz = (position.getZ(lowU) + position.getZ(highU)) / 2
      const length = Math.hypot(mx, mz)
      const normal = [mx / length, 0, mz / length]
      // viewer's right when looking at the face from outside: up x normal
      const right = [normal[2], 0, -normal[0]]
      const along = [
        position.getX(highU) - position.getX(lowU),
        0,
        position.getZ(highU) - position.getZ(lowU),
      ]
      expect(along[0] * right[0] + along[2] * right[2]).toBeGreaterThan(0)
    }
  })

  it('every side quad faces away from the hex center', () => {
    const geometry = buildSideGeometry(0)
    const position = geometry.getAttribute('position')
    const index = geometry.getIndex()
    for (let side = 0; side < 6; side += 1) {
      const [a, b, c] = [0, 1, 2].map((k) => index?.getX(side * 6 + k) ?? 0)
      const p = (i: number) => [
        position.getX(i),
        position.getY(i),
        position.getZ(i),
      ]
      const [pa, pb, pc] = [p(a), p(b), p(c)]
      const u = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]]
      const v = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]]
      const normal = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ]
      // outward means pointing the same way as the quad's midpoint from the center
      const mid = [(pa[0] + pc[0]) / 2, (pa[2] + pc[2]) / 2]
      expect(normal[0] * mid[0] + normal[2] * mid[1]).toBeGreaterThan(0)
    }
  })

  it('cap triangles reference their own vertices', () => {
    const geometry = buildCapGeometry(0)
    const index = geometry.getIndex()
    expect(geometry.getAttribute('position').count).toBe(18)
    for (let i = 0; i < 18; i += 1) expect(index?.getX(i)).toBe(i)
  })

  it('fluid triangles preserve cap and side faces and point outward', () => {
    const geometry = buildFluidGeometry(0)
    const position = geometry.getAttribute('position')
    const directions = geometry.getAttribute('landDirection')
    const index = geometry.getIndex()
    const capVertexCount = 18
    const capIndexCount = 18
    expect(position.count).toBe(42)
    expect(index?.count).toBe(54)

    for (let side = 0; side < 6; side += 1) {
      const start = capIndexCount + side * 6
      const used = new Set<number>()
      for (let i = start; i < start + 6; i += 1) {
        used.add(index?.getX(i) ?? -1)
      }
      expect([...used].sort((a, b) => a - b)).toEqual([
        capVertexCount + side * 4,
        capVertexCount + side * 4 + 1,
        capVertexCount + side * 4 + 2,
        capVertexCount + side * 4 + 3,
      ])
    }

    const point = (vertex: number) => [
      position.getX(vertex),
      position.getY(vertex),
      position.getZ(vertex),
    ]
    for (let i = 0; i < (index?.count ?? 0); i += 3) {
      const vertices = [
        index?.getX(i) ?? -1,
        index?.getX(i + 1) ?? -1,
        index?.getX(i + 2) ?? -1,
      ]
      const [a, b, c] = vertices.map(point)
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
      const normal = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ]
      const direction = directions.getX(vertices[0])

      for (const vertex of vertices.slice(1)) {
        expect(directions.getX(vertex)).toBe(direction)
      }

      if (direction < 0) {
        expect(normal[1]).toBeGreaterThan(0)
      } else {
        const midpoint = [(a[0] + c[0]) / 2, (a[2] + c[2]) / 2]
        expect(
          normal[0] * midpoint[0] + normal[2] * midpoint[1],
        ).toBeGreaterThan(0)
      }
    }
  })

  it('keeps land geometry within the WebGL vertex-attribute budget', () => {
    for (const geometry of [
      buildCapGeometry(1),
      buildSideGeometry(1),
      buildFluidGeometry(1),
    ]) {
      const locationCount = Object.keys(geometry.attributes).length + 4 + 1
      expect(locationCount).toBeLessThanOrEqual(14)
    }
  })
})
