#!/usr/bin/env node
/**
 * Derive the cell footprints of the Fortified Wall, Ruins 2/3, Ship Wall and
 * Ship Bow from their 3D models, at rotation 0 and relative to the piece
 * origin.
 *
 *   node scripts/derive-cell-footprints.mjs          # print the tables
 *   node scripts/derive-cell-footprints.mjs --check  # also compare the
 *                                                    # rotated tables with
 *                                                    # the 3D placement at
 *                                                    # rotations 1-5
 *   node scripts/derive-cell-footprints.mjs --json   # machine-readable
 *   node scripts/derive-cell-footprints.mjs --ascii  # with diagrams
 *   node scripts/derive-cell-footprints.mjs --write  # regenerate
 *                                    # src/data/hexGrid/pieceFootprints.ts
 *
 * The models are placed the way src/world/MapBoardPiece3D.tsx places them:
 * the Fortified Wall and the ships at the origin hex center (ships rotated by
 * getObstaclRotation), the ruins at the origin hex center plus
 * getRuinsOptions(rotation) (src/world/models/piece-adjustments.ts), all on
 * the level the piece stands on (for ships, the full level from
 * getShipPlacementAltitude). No scale is applied.
 *
 * Method: every triangle of every mesh is sampled on a dense barycentric
 * grid, and each sample is projected (in x/z) onto the nearest hex grid line.
 * Within a quarter edge of a corner it counts for that node, otherwise for
 * that edge. An edge counts when the model runs along at least half of its
 * middle span; a node when enough samples land on it.
 *
 * - Walls (`kind: 'wall'`) are thick: a sample within half an apothem of a
 *   grid line counts for it, and walls fill no hex cells.
 * - Hulls (`kind: 'hull'`, the ships) cover hex interiors. A sample counts
 *   for an edge only within REACH of the grid line, and for a node only
 *   within REACH of the corner point (the model really reaches it). A hex cell counts when the model covers its center region:
 *   at least 4 of 7 probe points (the center and 6 points 0.25 out) have a
 *   sample within 0.1.
 *
 * Each cell's levels run from the lowest to the highest sample on it (lowest
 * floored, highest rounded to whole levels of HEXGRID_HEX_HEIGHT). For hulls
 * they are then clamped to the piece's verticalObstructionTemplates: a hex
 * cell to its template hex's entry, an edge or node to the span of the
 * template hexes it borders. The template wins; --check lists each clamp.
 *
 * --write regenerates src/data/hexGrid/pieceFootprints.ts (then run biome
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

// src/world/models/piece-adjustments.ts getObstaclRotation
const obstacleRotation = (rotation) =>
  [
    0,
    -Math.PI / 3,
    (-2 * Math.PI) / 3,
    -Math.PI,
    (2 * Math.PI) / 3,
    Math.PI / 3,
  ][rotation]

// The ships' tile templates (src/data/tileTemplates.ts) and obstruction
// entries (src/data/vertical-obstruction-templates.ts), index by index.
// edge-node-cells.test.ts checks the generated table stays within the real
// templates.
const shipWallTemplate = [
  [
    { q: 0, r: 0 },
    { from: 1, to: 9 },
  ],
  [
    { q: 1, r: 0 },
    { from: 1, to: 9 },
  ],
  [
    { q: 2, r: 0 },
    { from: 1, to: 9 },
  ],
  [
    { q: 3, r: 0 },
    { from: 1, to: 1 },
  ],
  // the notch hexes
  [
    { q: 1, r: -1 },
    { from: 2, to: 2 },
  ],
  [
    { q: 2, r: -1 },
    { from: 2, to: 2 },
  ],
]
const shipBowTemplate = [
  [
    { q: 0, r: 0 },
    { from: 1, to: 13 },
  ],
  [
    { q: 1, r: 0 },
    { from: 1, to: 12 },
  ],
  [
    { q: 0, r: -1 },
    { from: 1, to: 13 },
  ],
  [
    { q: 2, r: 0 },
    { from: 1, to: 10 },
  ],
  [
    { q: 1, r: -2 },
    { from: 1, to: 12 },
  ],
  [
    { q: 3, r: 0 },
    { from: 1, to: 1 },
  ],
  [
    { q: -1, r: 0 },
    { from: 3, to: 13 },
  ],
  // the notch hexes
  [
    { q: 1, r: -1 },
    { from: 2, to: 6 },
  ],
  [
    { q: 2, r: -1 },
    { from: 2, to: 6 },
  ],
]

const pieces = [
  {
    id: 'fw',
    kind: 'wall',
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
    kind: 'wall',
    file: 'public/ruins2-textured.glb',
    meshes: ['Ruin_Small_Face', 'Ruin_Small_Columns'],
    placement: ruinsOptions,
  },
  {
    id: 'rs3',
    kind: 'wall',
    file: 'public/ruins3-textured.glb',
    meshes: ['Ruin_Large_Face', 'Ruin_Large_Columns'],
    placement: ruinsOptions,
  },
  {
    id: 'sl',
    kind: 'hull',
    file: 'public/ship-wall_v2.glb',
    meshes: ['ShipWall', 'ShipWallForwardBuildable', 'ShipWallAftBuildable'],
    placement: (rotation) => ({
      rotationY: obstacleRotation(rotation),
      xAdd: 0,
      zAdd: 0,
    }),
    template: shipWallTemplate,
  },
  {
    id: 'sb',
    kind: 'hull',
    file: 'public/ship-bow_v3.glb',
    meshes: [
      'ShipBow',
      'ShipBowIron',
      'ShipBowFigureheadWings',
      'ShipBowFigureheadMane',
      'ShipBowFigureheadHooves',
      'ShipBowFigureheadBody',
      'ShipBowFigureheadTongue',
      'ShipBowFigureheadBeak',
      'ShipBowFigureheadEyes',
      'ShipBowFigureheadTail',
      'ShipBowAftBuildable',
      'ShipBowForwardBuildable',
    ],
    placement: (rotation) => ({
      rotationY: obstacleRotation(rotation),
      xAdd: 0,
      zAdd: 0,
    }),
    template: shipBowTemplate,
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

// Hulls: how close to a grid line a sample must be to reach it.
const REACH = 0.12
// Hulls: the probe points of a hex's center region.
const CENTER_PROBES = [
  [0, 0],
  ...Array.from({ length: 6 }, (_, i) => [
    0.25 * Math.cos((i * Math.PI) / 3),
    0.25 * Math.sin((i * Math.PI) / 3),
  ]),
]
const PROBE_RADIUS = 0.1
const MIN_PROBES = 4

const span = () => ({ min: Number.POSITIVE_INFINITY, max: 0 })
const widen = (range, y) => {
  range.min = Math.min(range.min, y)
  range.max = Math.max(range.max, y)
}
// 1-based levels from model heights: the lowest sample's level, floored, to
// the highest, rounded.
const toLevels = ({ min, max }) => {
  const from = Math.floor(Math.max(0, min) / LEVEL_HEIGHT + 1e-6) + 1
  const to = Math.max(from, Math.round(max / LEVEL_HEIGHT))
  return { from, to }
}

export function deriveFootprint(piece, rotation) {
  const triangles = readTriangles(piece.file, piece.meshes)
  const { rotationY, xAdd, zAdd } = piece.placement(rotation)
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  const isHull = piece.kind === 'hull'
  const lineReach = isHull ? REACH : HEX_APOTHEM / 2
  const edges = new Map()
  const nodes = new Map()
  const hexes = new Map()
  let interiorSamples = 0
  let totalSamples = 0
  let interiorTop = 0
  for (const triangle of triangles) {
    sampleTriangle(triangle, (mx, my, mz) => {
      // three.js rotation about Y, then the group position
      const x = mx * cos + mz * sin + xAdd
      const z = -mx * sin + mz * cos + zAdd
      totalSamples++
      const hex = worldToCube(x, z)
      let best
      let bestDistance = Number.POSITIVE_INFINITY
      let bestT = 0
      for (const side of sidesOf(hex)) {
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
      if (isHull) {
        const center = cubeToWorld(hex)
        const dx = x - center.x
        const dz = z - center.z
        if (Math.hypot(dx, dz) <= HEX_APOTHEM / 2) {
          const id = key('hex', hex)
          const cell = hexes.get(id) ?? { levels: span(), probes: new Set() }
          widen(cell.levels, my)
          CENTER_PROBES.forEach(([px, pz], i) => {
            if (Math.hypot(dx - px, dz - pz) <= PROBE_RADIUS) cell.probes.add(i)
          })
          hexes.set(id, cell)
        }
      }
      if (bestDistance > lineReach) {
        interiorSamples++
        interiorTop = Math.max(interiorTop, my)
        return
      }
      // Hulls reach a node only when a sample comes within REACH of the
      // corner point itself; near the end of a side but short of the corner
      // still counts for the side.
      const toCorner =
        (bestT < 0.5 ? bestT : 1 - bestT) *
        Math.hypot(best.b.x - best.a.x, best.b.z - best.a.z)
      const isNodeSample = isHull
        ? Math.hypot(bestDistance, toCorner) <= REACH
        : bestT < NODE_RADIUS || bestT > 1 - NODE_RADIUS
      if (isNodeSample) {
        const id = bestT < 0.5 ? best.from : best.to
        const node = nodes.get(id) ?? { levels: span(), samples: 0 }
        widen(node.levels, my)
        node.samples++
        nodes.set(id, node)
        return
      }
      const edge = edges.get(best.edge) ?? { levels: span(), bins: new Set() }
      widen(edge.levels, my)
      edges.set(best.edge, edge)
      if (bestT < NODE_RADIUS || bestT > 1 - NODE_RADIUS) return
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
  const derived = {}
  for (const [id, edge] of edges) {
    // The model must run along at least half of the edge's middle span.
    if (edge.bins.size < EDGE_BINS / 2) continue
    derived[id] = toLevels(edge.levels)
  }
  for (const [id, node] of nodes) {
    if (node.samples < MIN_SAMPLES) continue
    derived[id] = toLevels(node.levels)
  }
  for (const [id, hex] of hexes) {
    if (hex.probes.size < MIN_PROBES) continue
    derived[id] = toLevels(hex.levels)
  }
  const { cells, clamps } = isHull
    ? clampToTemplate(derived, piece.template, rotation)
    : { cells: derived, clamps: [] }
  const result = {}
  for (const [id, levels] of Object.entries(cells)) {
    if (levels.to < 1) continue
    // Walls stand from their base: a plain height.
    result[id] = isHull && levels.from > 1 ? levels : levels.to
  }
  return {
    cells: Object.fromEntries(Object.entries(result).sort()),
    clamps,
    interiorSamples,
    totalSamples,
    interiorTopLevels: Math.round(interiorTop / LEVEL_HEIGHT),
  }
}

// The template hexes a cell borders (a hex cell: itself).
function templateHexesOf(id) {
  const [kind, rest] = id.split(':')
  const [q, r] = rest.split(',').map(Number)
  if (kind === 'hex') return [{ q, r }]
  const scale = kind === 'edge' ? 2 : 3
  const out = []
  DIRECTIONS.forEach((d, i) => {
    const e = DIRECTIONS[(i + 1) % 6]
    const offset = kind === 'edge' ? d : { q: d.q + e.q, r: d.r + e.r }
    const hq = (q - offset.q) / scale
    const hr = (r - offset.r) / scale
    if (Number.isInteger(hq) && Number.isInteger(hr)) {
      out.push({ q: hq, r: hr })
      if (kind === 'edge') out.push({ q: hq + d.q, r: hr + d.r })
    }
  })
  return out
}

// Keep each cell within the obstruction template of the template hexes it
// borders (at rotation `rotation`). Returns the clamps made.
function clampToTemplate(cells, template, rotation) {
  const entries = new Map(
    template.map(([hex, levels]) => {
      const rotated = rotateScaled(
        { q: hex.q, r: hex.r, s: -hex.q - hex.r },
        rotation,
      )
      return [`${rotated.q},${rotated.r}`, levels]
    }),
  )
  const out = {}
  const clamps = []
  for (const [id, levels] of Object.entries(cells)) {
    const allowed = [
      ...new Set(templateHexesOf(id).map(({ q, r }) => `${q + 0},${r + 0}`)),
    ]
      .map((hex) => entries.get(hex))
      .filter(Boolean)
    if (allowed.length === 0) {
      clamps.push(
        `${id} levels ${levels.from}-${levels.to}: borders no template hex, dropped`,
      )
      continue
    }
    const from = Math.max(levels.from, Math.min(...allowed.map((a) => a.from)))
    const to = Math.min(levels.to, Math.max(...allowed.map((a) => a.to)))
    if (from > to) {
      clamps.push(
        `${id} levels ${levels.from}-${levels.to}: outside the template, dropped`,
      )
      continue
    }
    if (from !== levels.from || to !== levels.to) {
      clamps.push(`${id} levels ${levels.from}-${levels.to} -> ${from}-${to}`)
    }
    out[id] = { from, to }
  }
  return { cells: out, clamps }
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
const topOf = (entry) => (typeof entry === 'number' ? entry : entry.to)
export function asciiDiagram(cells) {
  const marks = new Map()
  const at = (x, y) => `${x},${y}`
  const hexes = new Map()
  const addHex = (q, r) => hexes.set(`${q},${r}`, { q, r })
  addHex(0, 0)
  for (const id of Object.keys(cells)) {
    const [kind, rest] = id.split(':')
    const [q, r] = rest.split(',').map(Number)
    if (kind === 'hex') {
      addHex(q, r)
      continue
    }
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
      marks.set(
        at(cx + ex, cy + ey),
        height ? HEIGHT_CHARS[topOf(height)] : char,
      )
      const e = DIRECTIONS[(i + 1) % 6]
      const node = key('node', {
        q: 3 * q + d.q + e.q,
        r: 3 * r + d.r + e.r,
        s: -3 * q - 3 * r + d.s + e.s,
      })
      const [nx, ny] = cornerOffsets[i]
      if (cells[node])
        marks.set(at(cx + nx, cy + ny), HEIGHT_CHARS[topOf(cells[node])])
      else if (!marks.has(at(cx + nx, cy + ny)))
        marks.set(at(cx + nx, cy + ny), '+')
    })
    const hexCell = cells[key('hex', { q, r, s: -q - r })]
    // a filled hex cell: its top level, in brackets (O marks the origin)
    if (hexCell) {
      marks.set(at(cx - 1, cy), q === 0 && r === 0 ? 'O' : '[')
      marks.set(at(cx, cy), HEIGHT_CHARS[topOf(hexCell)])
      marks.set(at(cx + 1, cy), ']')
    } else if (q === 0 && r === 0) marks.set(at(cx, cy), 'O')
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
  const names = {
    fw: 'fortifiedWall',
    rs2: 'ruins2',
    rs3: 'ruins3',
    sl: 'shipWall',
    sb: 'shipBow',
  }
  const titles = {
    fw: 'Fortified Wall',
    rs2: 'Ruins 2',
    rs3: 'Ruins 3',
    sl: 'Ship Wall',
    sb: 'Ship Bow',
  }
  const body = Object.entries(tables)
    .map(([id, cells]) => {
      const diagram = asciiDiagram(cells)
        .map((line) => `   *   ${line}`.trimEnd())
        .join('\n')
      const rows = Object.entries(cells)
        .map(
          ([cell, levels]) =>
            `    '${cell}': ${
              typeof levels === 'number'
                ? levels
                : `{ from: ${levels.from}, to: ${levels.to} }`
            },`,
        )
        .join('\n')
      return `  /**
   * ${titles[id]}, rotation 0. Numbers are top levels (A = 10); O is the
   * origin hex; [n] / On is a filled hex cell.
   *
${diagram}
   */
  [Pieces.${names[id]}]: {
${rows}
  },`
    })
    .join('\n')
  return `// GENERATED by scripts/derive-cell-footprints.mjs from the 3D models.
// Rerun \`node scripts/derive-cell-footprints.mjs --write\` after a model
// changes; do not edit by hand.
import { Pieces } from '../../types'
import type { ObstructionEntry } from '../vertical-obstruction-templates'

/**
 * The cells a piece fills, at rotation 0, relative to the piece origin: a
 * hex, edge or node id here is the absolute id for a piece whose origin is
 * hex 0,0,0. Each cell blocks the levels of its obstruction entry (a number n
 * blocks levels 1..n, \`{ from, to }\` levels from..to; level 1 is the level
 * the piece stands on). See src/data/hexGrid/pieceCells.ts.
 */
export type CellFootprint = Readonly<Record<string, ObstructionEntry>>

export const pieceFootprints: Record<string, CellFootprint> = {
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
      console.log(`  '${id}': ${JSON.stringify(levels)},`)
    }
    for (const clamp of derived.clamps) console.log(`  template wins: ${clamp}`)
    if (args.has('--ascii')) {
      for (const line of asciiDiagram(derived.cells)) console.log(`    ${line}`)
    }
  }
  if (args.has('--check')) {
    for (let rotation = 0; rotation < 6; rotation++) {
      const placed = deriveFootprint(piece, rotation).cells
      const rotated = rotateTable(derived.cells, rotation)
      const ids = new Set([...Object.keys(placed), ...Object.keys(rotated)])
      const diffs = [...ids].filter(
        (id) => JSON.stringify(placed[id]) !== JSON.stringify(rotated[id]),
      )
      console.log(
        `  rotation ${rotation}: ${
          diffs.length === 0
            ? 'matches the rotated table'
            : `${diffs.length} differences: ${diffs
                .map(
                  (id) =>
                    `${id} placed=${JSON.stringify(placed[id])} rotated=${JSON.stringify(rotated[id])}`,
                )
                .join('; ')}`
        }`,
      )
    }
  }
}
if (args.has('--json')) console.log(JSON.stringify(output, null, 2))
if (args.has('--write')) {
  const target = path.join(root, 'src/data/hexGrid/pieceFootprints.ts')
  fs.writeFileSync(target, tsSource(output))
  console.log(`wrote ${path.relative(root, target)}`)
}
