/**
 * The Void Mat's 3D outline and texture coordinates, at rotation 0 and
 * relative to its origin hex center (the piece's group rotates it).
 *
 * The mat is the 14 template hexes (tileTemplates.ts) plus a printed ring of
 * half hexes. Its outline is the hexagon through six ring hex centers, given
 * here in template axial coordinates (q, r).
 *
 * The texture, public/textures/void-mat.webp, is page 1 of
 * assets-src/void-and-pylons/printable-void-terrain-mats.pdf trimmed to that
 * outline (scripts/textures/build-void-mat.mjs). The page prints the grid
 * flat-top: its columns are PDF axial q, and r runs down a column. Turned
 * 30 degrees it is the template, with template (q, r) at PDF
 * (q + r, -q). Trimmed, the image's left edge runs through the centers of
 * PDF column -1 and its top corner is the center of PDF hex (1, -2), so with
 * hex radius 1 a PDF hex center is at x = 1.5 (q + 1),
 * y = sqrt(3) (r + q / 2 + 1.5), in an image 7.5 wide and 5.5 sqrt(3) high.
 */
import { cubeToPixel } from '../../utils/hex-utils'

const SQRT3 = Math.sqrt(3)

/** The outline's corners, template axial (q, r), clockwise on screen. */
export const VOID_MAT_OUTLINE_AXIAL: readonly (readonly [number, number])[] = [
  [0, -1],
  [2, -1],
  [2, 2],
  [-1, 5],
  [-3, 5],
  [-3, 2],
]

const IMAGE_WIDTH = 7.5
const IMAGE_HEIGHT = 5.5 * SQRT3

/** Texture coordinates (v up, three.js default flipY) of a template point. */
export function voidMatUV(q: number, r: number): [number, number] {
  const pdfQ = q + r
  const pdfR = -q
  const x = 1.5 * (pdfQ + 1)
  const y = SQRT3 * (pdfR + pdfQ / 2 + 1.5)
  return [x / IMAGE_WIDTH, 1 - y / IMAGE_HEIGHT]
}

/** World x/z offset of a template point from the origin hex center. */
export function voidMatPoint(q: number, r: number): [number, number] {
  const { x, y } = cubeToPixel({ q, r, s: -q - r })
  return [x, y]
}

/**
 * A flat fan of triangles over the outline, facing up (+y), as position
 * (x, 0, z) and uv arrays plus indices.
 */
export function buildVoidMatGeometryArrays() {
  const corners = VOID_MAT_OUTLINE_AXIAL
  const centerQ = corners.reduce((sum, [q]) => sum + q, 0) / corners.length
  const centerR = corners.reduce((sum, [, r]) => sum + r, 0) / corners.length
  const points = [[centerQ, centerR] as const, ...corners]
  const positions = points.flatMap(([q, r]) => {
    const [x, z] = voidMatPoint(q, r)
    return [x, 0, z]
  })
  const uvs = points.flatMap(([q, r]) => voidMatUV(q, r))
  const indices: number[] = []
  for (let i = 1; i <= corners.length; i += 1) {
    const next = i === corners.length ? 1 : i + 1
    // Clockwise on screen (z down) is counter-clockwise seen from above
    // (+y), so the fan faces up.
    indices.push(0, next, i)
  }
  return { positions, uvs, indices }
}

/** One printed hex from the mat, centered on its template origin. */
export function buildVoidMarkerGeometryArrays() {
  const corners = Array.from({ length: 6 }, (_, index) => {
    const angle = (index * Math.PI) / 3
    const x = Math.cos(angle)
    const z = Math.sin(angle)
    const q = x / Math.sqrt(3) - z / 3
    const r = (2 * z) / 3
    return [q, r] as const
  })
  const points = [[0, 0] as const, ...corners]
  const positions = points.flatMap(([q, r]) => {
    const [x, z] = voidMatPoint(q, r)
    return [x, 0, z]
  })
  const uvs = points.flatMap(([q, r]) => voidMatUV(q, r))
  const indices: number[] = []
  for (let i = 1; i <= corners.length; i += 1) {
    const next = i === corners.length ? 1 : i + 1
    indices.push(0, next, i)
  }
  return { positions, uvs, indices }
}
