#!/usr/bin/env node
/**
 * Derive the edge/node footprints of the Fortified Wall and Ruins 2/3 from
 * their 3D models, at rotation 0 and relative to the piece origin.
 *
 *   node scripts/derive-wall-footprints.mjs          # print the tables
 *   node scripts/derive-wall-footprints.mjs --check  # also compare the
 *                                                    # rotated tables with
 *                                                    # the 3D placement at
 *                                                    # rotations 1-5
 *   node scripts/derive-wall-footprints.mjs --json   # machine-readable
 *   node scripts/derive-wall-footprints.mjs --ascii  # with diagrams
 *   node scripts/derive-wall-footprints.mjs --write  # regenerate
 *                                    # src/data/hexGrid/wallFootprints.ts
 *
 * The models are placed the way src/world/MapBoardPiece3D.tsx places them:
 * the Fortified Wall at the origin hex center, the ruins at the origin hex
 * center plus getRuinsOptions(rotation) (src/world/models/piece-adjustments.ts),
 * both on the level the wall stands on. No scale is applied.
 *
 * Method: every triangle is sampled on a dense barycentric grid. Each sample
 * is snapped (in x/z) to the nearest edge midpoint, node or hex center. A
 * sample nearest an edge or node marks that cell, and the cell's height is the
 * highest sample on it. A sample nearest a hex center is part of no cell (the
 * walls fill no hex cells); the script reports how many there are.
 *
 * Heights are rounded to whole levels (HEXGRID_HEX_HEIGHT world units per
 * level). A cell whose rounded height is 0, or that only a handful of samples
 * touch (bevels and slivers spilling over a Voronoi boundary), is dropped.
 *
 * --write regenerates src/data/hexGrid/wallFootprints.ts (then run biome
 * format on it).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// src/utils/constants.ts
const HEX_RADIUS = 1
const HEX_APOTHEM = (Math.sqrt(3) / 2) * HEX_RADIUS
const LEVEL_HEIGHT = 0.35
// Samples per world unit along each triangle side.
const SAMPLES_PER_UNIT = 40
// A cell needs at least this many samples to count.
const MIN_SAMPLES = 25

// src/utils/hex-utils.ts HEX_DIRECTIONS: E, SE, SW, W, NW, NE
const DIRECTIONS = [
  { q: 1, r: 0, s: -1 },
  { q: 0, r: 1, s: -1 },
  { q: -1, r: 1, s: 0 },
  { q: -1, r: 0, s: 1 },
  { q: 0, r: -1, s: 1 },
  { q: 1, r: -1, s: 0 },
]

// src/world/models/piece-adjustments.ts getRuinsOptions
const ruinsOptions = (rotation) =>
  [
    { rotationY: 0, xAdd: -HEX_APOTHEM + 0.04, zAdd: 0.7 },
    { rotationY: -Math.PI / 3, xAdd: -HEX_APOTHEM - 0.1, zAdd: -0.4 },
    { rotationY: (-Math.PI * 2) / 3, xAdd: -0.1, zAdd: -HEX_RADIUS - 0.03 },
    { rotationY: Math.PI, xAdd: HEX_APOTHEM - 0.04, zAdd: -0.7 },
    { rotationY: (Math.PI * 2) / 3, xAdd: HEX_APOTHEM + 0.1, zAdd: 0.4 },
    { rotationY: Math.PI / 3, xAdd: 0.04, zAdd: HEX_RADIUS + 0.03 },
  ][rotation]

const pieces = [
  {
    id: 'fw',
    file: 'public/FortifiedWall.glb',
    meshes: ['FortifiedWall'],
    placement: (rotation) => ({
      rotationY: (rotation * -Math.PI) / 3,
      xAdd: 0,
      zAdd: 0,
    }),
  },
  {
    id: 'rs2',
    file: 'public/ruins2-textured.glb',
    meshes: ['Ruin_Small_Face', 'Ruin_Small_Columns'],
    placement: ruinsOptions,
  },
  {
    id: 'rs3',
    file: 'public/ruins3-textured.glb',
    meshes: ['Ruin_Large_Face', 'Ruin_Large_Columns'],
    placement: ruinsOptions,
  },
]

function readTriangles(file, meshNames) {
  const buffer = fs.readFileSync(path.join(root, file))
  const jsonLength = buffer.readUInt32LE(12)
  const gltf = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString())
  const binStart = 20 + jsonLength + 8
  const triangles = []
  for (const node of gltf.nodes) {
    if (!meshNames.includes(node.name)) continue
    if (node.translation || node.rotation || node.scale || node.matrix) {
      throw new Error(`${file} ${node.name}: node transforms are not handled`)
    }
    for (const primitive of gltf.meshes[node.mesh].primitives) {
      const read = (accessorIndex, components) => {
        const accessor = gltf.accessors[accessorIndex]
        const view = gltf.bufferViews[accessor.bufferView]
        const offset =
          binStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
        const out = []
        const Array_ = {
          5126: Float32Array,
          5125: Uint32Array,
          5123: Uint16Array,
          5121: Uint8Array,
        }[accessor.componentType]
        const stride = view.byteStride ?? Array_.BYTES_PER_ELEMENT * components
        for (let i = 0; i < accessor.count; i++) {
          const values = new Array_(
            buffer.buffer.slice(
              buffer.byteOffset + offset + i * stride,
              buffer.byteOffset +
                offset +
                i * stride +
                Array_.BYTES_PER_ELEMENT * components,
            ),
          )
          out.push(components === 1 ? values[0] : [...values])
        }
        return out
      }
      const positions = read(primitive.attributes.POSITION, 3)
      const indices =
        primitive.indices === undefined
          ? positions.map((_, i) => i)
          : read(primitive.indices, 1)
      for (let i = 0; i < indices.length; i += 3) {
        triangles.push([
          positions[indices[i]],
          positions[indices[i + 1]],
          positions[indices[i + 2]],
        ])
      }
    }
  }
  return triangles
}

const cubeToWorld = ({ q, r }) => ({
  x: HEX_RADIUS * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r),
  z: HEX_RADIUS * ((3 / 2) * r),
})
const scaledToWorld = (c, scale) =>
  cubeToWorld({ q: c.q / scale, r: c.r / scale, s: c.s / scale })
const key = (kind, c) => `${kind}:${c.q},${c.r},${c.s}`

function sampleTriangle([a, b, c], visit) {
  const length = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
  const steps = Math.max(
    1,
    Math.ceil(
      Math.max(length(a, b), length(b, c), length(c, a)) * SAMPLES_PER_UNIT,
    ),
  )
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps - i; j++) {
      const u = i / steps
      const v = j / steps
      const w = 1 - u - v
      visit(
        a[0] * w + b[0] * u + c[0] * v,
        a[1] * w + b[1] * u + c[1] * v,
        a[2] * w + b[2] * u + c[2] * v,
      )
    }
  }
}

function cubeRound({ q, r }) {
  const s = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  const rs = Math.round(s)
  const dq = Math.abs(rq - q)
  const dr = Math.abs(rr - r)
  const ds = Math.abs(rs - s)
  if (dq > dr && dq > ds) rq = -rr - rs
  else if (dr > ds) rr = -rq - rs
  return { q: rq, r: rr, s: -rq - rr }
}
const worldToCube = (x, z) =>
  cubeRound({
    q: ((Math.sqrt(3) / 3) * x - z / 3) / HEX_RADIUS,
    r: ((2 / 3) * z) / HEX_RADIUS,
  })

// The 6 grid lines around a hex: edge i (direction i) runs from corner i-1
// to corner i, like nodesForEdge in src/data/hexGrid/edgesAndNodes.ts.
function hexSides(hex) {
  const corner = (i) => {
    const d = DIRECTIONS[(i + 6) % 6]
    const e = DIRECTIONS[(i + 7) % 6]
    return {
      q: 3 * hex.q + d.q + e.q,
      r: 3 * hex.r + d.r + e.r,
      s: 3 * hex.s + d.s + e.s,
    }
  }
  return DIRECTIONS.map((d, i) => {
    const from = corner(i - 1)
    const to = corner(i)
    return {
      edge: key('edge', {
        q: 2 * hex.q + d.q,
        r: 2 * hex.r + d.r,
        s: 2 * hex.s + d.s,
      }),
      from: key('node', from),
      to: key('node', to),
      a: scaledToWorld(from, 3),
      b: scaledToWorld(to, 3),
    }
  })
}
const sidesCache = new Map()
const sidesOf = (hex) => {
  const id = key('hex', hex)
  if (!sidesCache.has(id)) sidesCache.set(id, hexSides(hex))
  return sidesCache.get(id)
}

// Distance (in edge lengths) from a corner within which a sample counts for
// the node rather than the edge.
const NODE_RADIUS = 0.25
const EDGE_BINS = 20

export function deriveFootprint(piece, rotation) {
  const triangles = readTriangles(piece.file, piece.meshes)
  const { rotationY, xAdd, zAdd } = piece.placement(rotation)
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  const edges = new Map()
  const nodes = new Map()
  let interiorSamples = 0
  let totalSamples = 0
  let interiorTop = 0
  for (const triangle of triangles) {
    sampleTriangle(triangle, (mx, my, mz) => {
      // three.js rotation about Y, then the group position
      const x = mx * cos + mz * sin + xAdd
      const z = -mx * sin + mz * cos + zAdd
      totalSamples++
      let best
      let bestDistance = Number.POSITIVE_INFINITY
      let bestT = 0
      for (const side of sidesOf(worldToCube(x, z))) {
        const dx = side.b.x - side.a.x
        const dz = side.b.z - side.a.z
        const t = Math.min(
          1,
          Math.max(
            0,
            ((x - side.a.x) * dx + (z - side.a.z) * dz) / (dx * dx + dz * dz),
          ),
        )
        const distance = Math.hypot(
          side.a.x + t * dx - x,
          side.a.z + t * dz - z,
        )
        if (distance < bestDistance) {
          bestDistance = distance
          best = side
          bestT = t
        }
      }
      // Farther from every grid line than the middle of a hex side's
      // half-apothem: the sample is in a hex interior.
      if (bestDistance > HEX_APOTHEM / 2) {
        interiorSamples++
        interiorTop = Math.max(interiorTop, my)
        return
      }
      if (bestT < NODE_RADIUS || bestT > 1 - NODE_RADIUS) {
        const id = bestT < 0.5 ? best.from : best.to
        const node = nodes.get(id) ?? { top: 0, samples: 0 }
        node.top = Math.max(node.top, my)
        node.samples++
        nodes.set(id, node)
        return
      }
      const edge = edges.get(best.edge) ?? { top: 0, bins: new Set() }
      edge.top = Math.max(edge.top, my)
      edge.bins.add(
        Math.min(
          EDGE_BINS - 1,
          Math.floor(
            ((bestT - NODE_RADIUS) / (1 - 2 * NODE_RADIUS)) * EDGE_BINS,
          ),
        ),
      )
      edges.set(best.edge, edge)
    })
  }
  const result = {}
  for (const [id, edge] of edges) {
    const levels = Math.round(edge.top / LEVEL_HEIGHT)
    // The wall must run along at least half of the edge's middle span.
    if (levels < 1 || edge.bins.size < EDGE_BINS / 2) continue
    result[id] = levels
  }
  for (const [id, node] of nodes) {
    const levels = Math.round(node.top / LEVEL_HEIGHT)
    if (levels < 1 || node.samples < MIN_SAMPLES) continue
    result[id] = levels
  }
  return {
    cells: Object.fromEntries(Object.entries(result).sort()),
    interiorSamples,
    totalSamples,
    interiorTopLevels: Math.round(interiorTop / LEVEL_HEIGHT),
  }
}

// Rotate a scaled cube coordinate like hexUtilsRotateVector.
function rotateScaled(c, rotation) {
  let v = c
  for (let i = 0; i < rotation; i++) v = { q: -v.r, r: -v.s, s: -v.q }
  return v
}
function rotateTable(cells, rotation) {
  const out = {}
  for (const [id, levels] of Object.entries(cells)) {
    const [kind, rest] = id.split(':')
    const [q, r, s] = rest.split(',').map(Number)
    const rotated = rotateScaled({ q, r, s }, rotation)
    out[key(kind, rotated)] = levels
  }
  return out
}

// ASCII diagram, pointy-top hexes 8 columns wide and 4 lines apart. Filled edges and nodes show their height in levels
// (A = 10); the origin hex center is O.
const HEIGHT_CHARS = '0123456789ABCDEFGHIJ'
export function asciiDiagram(cells) {
  const marks = new Map()
  const at = (x, y) => `${x},${y}`
  const hexes = new Map()
  const addHex = (q, r) => hexes.set(`${q},${r}`, { q, r })
  addHex(0, 0)
  for (const id of Object.keys(cells)) {
    const [kind, rest] = id.split(':')
    const [q, r] = rest.split(',').map(Number)
    const scale = kind === 'edge' ? 2 : 3
    // every hex this cell touches
    for (const d of DIRECTIONS) {
      const hq = (q - d.q) / scale
      const hr = (r - d.r) / scale
      if (kind === 'edge' && Number.isInteger(hq) && Number.isInteger(hr)) {
        addHex(hq, hr)
        addHex(hq + d.q, hr + d.r)
      }
    }
    if (kind === 'node') {
      DIRECTIONS.forEach((d, i) => {
        const e = DIRECTIONS[(i + 1) % 6]
        const hq = (q - d.q - e.q) / 3
        const hr = (r - d.r - e.r) / 3
        if (Number.isInteger(hq) && Number.isInteger(hr)) addHex(hq, hr)
      })
    }
  }
  // Edge i of a hex and corner i (between edge i and edge i+1), as text
  // offsets from the hex center.
  const edgeOffsets = [
    [4, 0, '|'],
    [2, 2, '/'],
    [-2, 2, '\\'],
    [-4, 0, '|'],
    [-2, -2, '/'],
    [2, -2, '\\'],
  ]
  const cornerOffsets = [
    [4, 1],
    [0, 3],
    [-4, 1],
    [-4, -1],
    [0, -3],
    [4, -1],
  ]
  for (const { q, r } of hexes.values()) {
    const cx = 8 * q + 4 * r
    const cy = 4 * r
    DIRECTIONS.forEach((d, i) => {
      const edge = key('edge', {
        q: 2 * q + d.q,
        r: 2 * r + d.r,
        s: -2 * q - 2 * r + d.s,
      })
      const [ex, ey, char] = edgeOffsets[i]
      const height = cells[edge]
      marks.set(at(cx + ex, cy + ey), height ? HEIGHT_CHARS[height] : char)
      const e = DIRECTIONS[(i + 1) % 6]
      const node = key('node', {
        q: 3 * q + d.q + e.q,
        r: 3 * r + d.r + e.r,
        s: -3 * q - 3 * r + d.s + e.s,
      })
      const [nx, ny] = cornerOffsets[i]
      if (cells[node])
        marks.set(at(cx + nx, cy + ny), HEIGHT_CHARS[cells[node]])
      else if (!marks.has(at(cx + nx, cy + ny)))
        marks.set(at(cx + nx, cy + ny), '+')
    })
    if (q === 0 && r === 0) marks.set(at(cx, cy), 'O')
  }
  const points = [...marks.keys()].map((p) => p.split(',').map(Number))
  const minX = Math.min(...points.map(([x]) => x))
  const maxX = Math.max(...points.map(([x]) => x))
  const minY = Math.min(...points.map(([, y]) => y))
  const maxY = Math.max(...points.map(([, y]) => y))
  const lines = []
  for (let y = minY; y <= maxY; y++) {
    let line = ''
    for (let x = minX; x <= maxX; x++) line += marks.get(at(x, y)) ?? ' '
    lines.push(line.trimEnd())
  }
  return lines
}

function tsSource(tables) {
  const names = { fw: 'fortifiedWall', rs2: 'ruins2', rs3: 'ruins3' }
  const titles = { fw: 'Fortified Wall', rs2: 'Ruins 2', rs3: 'Ruins 3' }
  const body = Object.entries(tables)
    .map(([id, cells]) => {
      const diagram = asciiDiagram(cells)
        .map((line) => `   *   ${line}`.trimEnd())
        .join('\n')
      const rows = Object.entries(cells)
        .map(([cell, levels]) => `    '${cell}': ${levels},`)
        .join('\n')
      return `  /**
   * ${titles[id]}, rotation 0. Numbers are levels (A = 10), O is the origin hex.
   *
${diagram}
   */
  [Pieces.${names[id]}]: {
${rows}
  },`
    })
    .join('\n')
  return `// GENERATED by scripts/derive-wall-footprints.mjs from the 3D models.
// Rerun \`node scripts/derive-wall-footprints.mjs --write\` after a model
// changes; do not edit by hand.
import { Pieces } from '../../types'
import type { ObstructionEntry } from '../vertical-obstruction-templates'

/**
 * The edges and nodes a wall piece fills, at rotation 0, relative to the
 * piece origin: an edge or node id here is the absolute id of a wall whose
 * origin is hex 0,0,0. Each cell blocks the levels of its obstruction entry
 * (a number n blocks levels 1..n, level 1 being the level the wall stands
 * on). See src/data/hexGrid/pieceCells.ts.
 */
export type EdgeNodeFootprint = Readonly<Record<string, ObstructionEntry>>

export const wallFootprints: Record<string, EdgeNodeFootprint> = {
${body}
}
`
}

const args = new Set(process.argv.slice(2))
const output = {}
for (const piece of pieces) {
  const derived = deriveFootprint(piece, 0)
  output[piece.id] = derived.cells
  if (!args.has('--json') && !args.has('--write')) {
    console.log(
      `\n${piece.id}: ${Object.keys(derived.cells).length} cells; ` +
        `${derived.interiorSamples}/${derived.totalSamples} samples fell ` +
        `inside hex interiors (up to ${derived.interiorTopLevels} levels), ignored`,
    )
    for (const [id, levels] of Object.entries(derived.cells)) {
      console.log(`  '${id}': ${levels},`)
    }
    if (args.has('--ascii')) {
      for (const line of asciiDiagram(derived.cells)) console.log(`    ${line}`)
    }
  }
  if (args.has('--check')) {
    for (let rotation = 1; rotation < 6; rotation++) {
      const placed = deriveFootprint(piece, rotation).cells
      const rotated = rotateTable(derived.cells, rotation)
      const ids = new Set([...Object.keys(placed), ...Object.keys(rotated)])
      const diffs = [...ids].filter((id) => placed[id] !== rotated[id])
      console.log(
        `  rotation ${rotation}: ${
          diffs.length === 0
            ? 'matches the rotated table'
            : `${diffs.length} differences: ${diffs
                .map(
                  (id) => `${id} placed=${placed[id]} rotated=${rotated[id]}`,
                )
                .join('; ')}`
        }`,
      )
    }
  }
}
if (args.has('--json')) console.log(JSON.stringify(output, null, 2))
if (args.has('--write')) {
  const target = path.join(root, 'src/data/hexGrid/wallFootprints.ts')
  fs.writeFileSync(target, tsSource(output))
  console.log(`wrote ${path.relative(root, target)}`)
}
