// Converts Virtualscape's castle/fortress .sgl models into public/vs-*.glb.
//
//   node scripts/virtualscape/convert-fortress.mjs <path to VirtualScape folder>
//
// The Virtualscape install is only read. Its .sgl and .bmp files stay out of
// this repo; only the GLBs are written. Needs ImageMagick (`magick`) for the
// few real textures, which are embedded as JPEG like the other textured GLBs.
import bmp from 'bmp-js'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MeshoptSimplifier } from 'meshoptimizer'
import {
  bounds,
  materialKey,
  mergeByMaterial,
  parseSgl,
  simplifyByPosition,
  transformMesh,
  triangleCount,
  uniformBmpColor,
  walkableTop,
  buildGlb,
} from './sgl.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))

// Virtualscape levels are 0.4 tall, Hexoscape's are 0.35 (HEXGRID_HEX_HEIGHT).
// Hexes have radius 1 in both, so only Y is scaled.
const LEVEL_SCALE = 0.35 / 0.4
const SCALE = [1, LEVEL_SCALE, 1]
const APOTHEM = Math.sqrt(3) / 2
// Ladders and battlements sit on the hex edge toward (+X, -Z) after mirroring.
// Hexoscape's models are drawn on the +X edge with the edge at x = 0
// (getLadderBattlementOptions adds the apothem), so turn and slide them there.
const ON_EDGE = { rotateYDegrees: -60, translate: [-APOTHEM, 0, 0] }

// Above this many triangles a primitive is simplified to within the given
// error (a fraction of the mesh's size).
const DECIMATE_ABOVE = 1500

export const FORTRESS_MODELS = [
  {
    out: 'vs-castle-base.glb',
    nodes: [
      { name: 'VsCastleBaseCorner', sgl: 'ChateauBaseAngle' },
      { name: 'VsCastleBaseStraight', sgl: 'ChateauBaseDroit' },
      { name: 'VsCastleBaseEnd', sgl: 'ChateauBaseFin' },
    ],
    error: 0.002,
  },
  {
    out: 'vs-castle-wall.glb',
    nodes: [
      { name: 'VsCastleWallCorner', sgl: 'ChateauMurAngle' },
      { name: 'VsCastleWallStraight', sgl: 'ChateauMurDroit' },
      { name: 'VsCastleWallEnd', sgl: 'ChateauMurFin' },
    ],
    error: 0.002,
  },
  {
    out: 'vs-fortress-door.glb',
    // ChateauPorte.sgl is the arch plus the door; keep only the door.
    nodes: [{ name: 'VsFortressDoor', sgl: 'ChateauPorte', only: ['PORTE'] }],
  },
  {
    out: 'vs-fortress-arch.glb',
    nodes: [{ name: 'VsFortressArch', sgl: 'ChateauArche' }],
  },
  {
    out: 'vs-fortress-ladder.glb',
    nodes: [{ name: 'VsFortressLadder', sgl: 'ChateauEchelle', ...ON_EDGE }],
  },
  {
    out: 'vs-fortress-battlement.glb',
    nodes: [
      { name: 'VsFortressBattlement', sgl: 'ChateauMeurtriere', ...ON_EDGE },
    ],
  },
  {
    out: 'vs-fortress-banner.glb',
    nodes: [{ name: 'VsFortressBanner', sgl: 'ChateauDrapeau' }],
    error: 0.002,
  },
]

function findTexture(textureDir, key) {
  if (!existsSync(textureDir)) return null
  const file = readdirSync(textureDir).find(
    (name) => name.toLowerCase() === `${key}.bmp`,
  )
  return file ? join(textureDir, file) : null
}

function loadMaterial(textureDir, key) {
  const file = findTexture(textureDir, key)
  if (!file) {
    console.warn(`  ! no texture for "${key}", using white`)
    return { name: key, color: [255, 255, 255], source: 'missing' }
  }
  const decoded = bmp.decode(readFileSync(file))
  const color = uniformBmpColor(decoded)
  if (color) return { name: key, color, source: `${file} (solid colour)` }
  // Real image: JPEG, at most 1024 px on a side (they are all smaller).
  const bytes = execFileSync('magick', [
    file,
    '-resize',
    '1024x1024>',
    '-strip',
    '-quality',
    '90',
    'jpeg:-',
  ])
  return {
    name: key,
    image: { mimeType: 'image/jpeg', bytes: new Uint8Array(bytes) },
    source: `${file} (${decoded.width}x${decoded.height})`,
  }
}

function simplify(primitive, error, material) {
  const before = primitive.indices.length / 3
  // Only solid-colour primitives: simplifying drops their (unused) UVs.
  if (!error || before <= DECIMATE_ABOVE || material.image) return primitive
  return simplifyByPosition(primitive, (indices, positions) => {
    const [simplified] = MeshoptSimplifier.simplify(
      indices,
      positions,
      3,
      0,
      error,
    )
    return simplified
  })
}

export async function convertFortressModels(virtualscapeDir, outDir) {
  await MeshoptSimplifier.ready
  const objects = join(virtualscapeDir, 'Objets 3D')
  const report = []
  for (const model of FORTRESS_MODELS) {
    const materials = {}
    let sourceTriangles = 0
    // One glTF node per material, so three.js keeps the names as given:
    // the node name alone for one material, else <name>_<material>.
    const nodes = model.nodes.flatMap((node) => {
      const folder = join(objects, node.sgl)
      const meshes = parseSgl(
        new Uint8Array(readFileSync(join(folder, `${node.sgl}.sgl`))),
      ).filter((mesh) => !node.only || node.only.includes(mesh.name))
      sourceTriangles += meshes.reduce(
        (sum, mesh) => sum + mesh.positions.length / 9,
        0,
      )
      const transformed = meshes.map((mesh) =>
        transformMesh(mesh, {
          rotateYDegrees: node.rotateYDegrees,
          translate: node.translate,
          scale: SCALE,
        }),
      )
      const merged = mergeByMaterial(transformed)
      const top = walkableTop(merged)
      return merged.map((primitive) => {
        const key = primitive.material
        if (!materials[key]) {
          materials[key] = loadMaterial(join(folder, 'Textures'), key)
        }
        return {
          name: merged.length > 1 ? `${node.name}_${key}` : node.name,
          extras: { walkableTop: top, source: `${node.sgl}.sgl` },
          primitives: [simplify(primitive, model.error, materials[key])],
        }
      })
    })
    const glb = buildGlb({ nodes, materials })
    writeFileSync(join(outDir, model.out), glb)
    report.push({
      out: model.out,
      sgl: model.nodes.map((n) => `${n.sgl}.sgl`).join(', '),
      sourceTriangles,
      triangles: nodes.reduce((s, n) => s + triangleCount(n.primitives), 0),
      bytes: glb.byteLength,
      nodes: nodes.map((n) => ({
        name: n.name,
        triangles: triangleCount(n.primitives),
        ...bounds(n.primitives),
      })),
      materials: Object.values(materials).map((m) => m.source),
    })
  }
  return report
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = process.argv[2]
  if (!source) {
    console.error(
      'usage: node scripts/virtualscape/convert-fortress.mjs <VirtualScape folder>',
    )
    process.exit(1)
  }
  const report = await convertFortressModels(source, join(root, 'public'))
  const round = (v) => Math.round(v * 1000) / 1000
  for (const entry of report) {
    console.log(
      `${entry.out}: ${entry.sourceTriangles} -> ${entry.triangles} tris, ${entry.bytes} bytes (${entry.sgl})`,
    )
    for (const node of entry.nodes) {
      console.log(
        `  ${node.name}: ${node.triangles} tris, min ${node.min.map(round)} max ${node.max.map(round)}`,
      )
    }
    for (const source of entry.materials) console.log(`  material ${source}`)
  }
}

export { materialKey }
