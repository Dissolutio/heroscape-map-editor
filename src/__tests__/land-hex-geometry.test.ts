import { describe, expect, it } from 'vitest'
import {
  buildCapGeometry,
  buildFluidGeometry,
  buildSideGeometry,
} from '../world/models/LandHexInstanced'

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

  it('maps side-image top rows to face tops, including half-height fluids', () => {
    const solid = buildSideGeometry(0).getAttribute('landSideUv')
    const fluid = buildFluidGeometry(0).getAttribute('landSideUv')

    for (let side = 0; side < 6; side += 1) {
      const start = side * 4
      expect([solid.getX(start), solid.getY(start)]).toEqual([0, 1])
      expect([solid.getX(start + 1), solid.getY(start + 1)]).toEqual([0, 0])
      expect([solid.getX(start + 2), solid.getY(start + 2)]).toEqual([1, 0])
      expect([solid.getX(start + 3), solid.getY(start + 3)]).toEqual([1, 1])

      const fluidStart = 18 + start
      for (let vertex = 0; vertex < 4; vertex += 1) {
        expect([
          fluid.getX(fluidStart + vertex),
          fluid.getY(fluidStart + vertex),
        ]).toEqual([solid.getX(start + vertex), solid.getY(start + vertex)])
      }
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
