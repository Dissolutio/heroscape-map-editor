import { describe, expect, it } from 'vitest'
import {
  buildCapGeometry,
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
})
