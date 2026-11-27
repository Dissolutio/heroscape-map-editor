// Virtualscape .sgl model reader and a small GLB writer.
//
// The .sgl format, as decoded from Virtualscape's own model files:
//   u32 meshCount
//   per mesh:
//     char[255]  name, NUL padded. It doubles as the material name: Virtualscape
//                loads Textures/<name>.bmp (case-insensitive, without a
//                trailing " (n)" copy suffix).
//     u32        vertexCount (a multiple of 3: unindexed triangle list)
//     f32[3 * n] positions
//     f32[3 * n] normals
//     f32[2 * n] UVs, origin top-left (same as glTF)
// All little-endian. +Y is up, one hex has radius 1 and one level is 0.4.
// The models are left-handed (Direct3D): triangles wind clockwise. Mirroring
// Z turns them into right-handed, counter-clockwise three.js triangles, so the
// vertex order is kept as is.

const NAME_BYTES = 255

/** @param {Uint8Array} bytes */
export function parseSgl(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 0
  const need = (count, what) => {
    if (offset + count > bytes.byteLength) {
      throw new Error(
        `.sgl truncated reading ${what} at byte ${offset} (size ${bytes.byteLength})`,
      )
    }
  }
  need(4, 'mesh count')
  const meshCount = view.getUint32(offset, true)
  offset += 4
  const meshes = []
  for (let m = 0; m < meshCount; m += 1) {
    need(NAME_BYTES + 4, `mesh ${m} header`)
    const rawName = bytes.subarray(offset, offset + NAME_BYTES)
    const end = rawName.indexOf(0)
    const name = new TextDecoder('latin1').decode(
      end === -1 ? rawName : rawName.subarray(0, end),
    )
    offset += NAME_BYTES
    const vertexCount = view.getUint32(offset, true)
    offset += 4
    if (vertexCount % 3 !== 0) {
      throw new Error(`.sgl mesh "${name}" has ${vertexCount} vertices`)
    }
    const readFloats = (count, what) => {
      need(count * 4, what)
      const out = new Float32Array(count)
      for (let i = 0; i < count; i += 1) {
        out[i] = view.getFloat32(offset, true)
        offset += 4
      }
      return out
    }
    const positions = readFloats(vertexCount * 3, `"${name}" positions`)
    const normals = readFloats(vertexCount * 3, `"${name}" normals`)
    const uvs = readFloats(vertexCount * 2, `"${name}" UVs`)
    meshes.push({ name, positions, normals, uvs })
  }
  if (offset !== bytes.byteLength) {
    throw new Error(
      `.sgl has ${bytes.byteLength - offset} unread bytes after ${meshCount} meshes`,
    )
  }
  return meshes
}

/** The material (and texture file stem) a mesh name refers to. */
export function materialKey(meshName) {
  return meshName
    .replace(/\s*\(\d+\)\s*$/, '')
    .trim()
    .toLowerCase()
}

/**
 * Maps a Virtualscape mesh into Hexoscape's frame: mirror Z (left- to
 * right-handed), then rotate about +Y by `rotateYDegrees` (three.js sense,
 * +X turns toward -Z), then translate, then scale. Normals follow, using the
 * inverse-transpose for the scale. Returns a new mesh.
 */
export function transformMesh(
  mesh,
  {
    rotateYDegrees = 0,
    translate = [0, 0, 0],
    scale = [1, 1, 1],
    mirrorZ = true,
  } = {},
) {
  const theta = (rotateYDegrees * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  const rotate = (x, z) => [x * cos + z * sin, -x * sin + z * cos]
  const positions = new Float32Array(mesh.positions.length)
  const normals = new Float32Array(mesh.normals.length)
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const zSign = mirrorZ ? -1 : 1
    const [px, pz] = rotate(mesh.positions[i], zSign * mesh.positions[i + 2])
    positions[i] = (px + translate[0]) * scale[0]
    positions[i + 1] = (mesh.positions[i + 1] + translate[1]) * scale[1]
    positions[i + 2] = (pz + translate[2]) * scale[2]
    const [nx, nz] = rotate(mesh.normals[i], zSign * mesh.normals[i + 2])
    const sx = nx / scale[0]
    const sy = mesh.normals[i + 1] / scale[1]
    const sz = nz / scale[2]
    const length = Math.hypot(sx, sy, sz) || 1
    normals[i] = sx / length
    normals[i + 1] = sy / length
    normals[i + 2] = sz / length
  }
  // A mirror (or an odd count of negative scales) flips the winding.
  const flips = (mirrorZ ? 1 : 0) + scale.filter((s) => s < 0).length
  const positionsOut = positions
  const normalsOut = normals
  const uvsOut = mesh.uvs.slice()
  // .sgl triangles are clockwise; one flip makes them counter-clockwise.
  if (flips % 2 === 0) {
    reverseTriangleOrder(positionsOut, 3)
    reverseTriangleOrder(normalsOut, 3)
    reverseTriangleOrder(uvsOut, 2)
  }
  return {
    name: mesh.name,
    positions: positionsOut,
    normals: normalsOut,
    uvs: uvsOut,
  }
}

function reverseTriangleOrder(array, stride) {
  for (let t = 0; t < array.length; t += stride * 3) {
    for (let k = 0; k < stride; k += 1) {
      const a = array[t + k]
      array[t + k] = array[t + 2 * stride + k]
      array[t + 2 * stride + k] = a
    }
  }
}

/** Unindexed triangle lists, merged into one indexed primitive per material. */
export function mergeByMaterial(meshes) {
  const groups = new Map()
  for (const mesh of meshes) {
    const key = materialKey(mesh.name)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(mesh)
  }
  return [...groups].map(([material, parts]) => {
    const merged = concatMeshes(parts)
    return { material, ...weld(merged) }
  })
}

function concatMeshes(parts) {
  const total = parts.reduce((sum, part) => sum + part.positions.length / 3, 0)
  const positions = new Float32Array(total * 3)
  const normals = new Float32Array(total * 3)
  const uvs = new Float32Array(total * 2)
  let v = 0
  for (const part of parts) {
    positions.set(part.positions, v * 3)
    normals.set(part.normals, v * 3)
    uvs.set(part.uvs, v * 2)
    v += part.positions.length / 3
  }
  return { positions, normals, uvs }
}

/** Shares identical vertices (same position, normal and UV). */
export function weld({ positions, normals, uvs }) {
  const vertexCount = positions.length / 3
  const lookup = new Map()
  const remap = new Uint32Array(vertexCount)
  const outPositions = []
  const outNormals = []
  const outUvs = []
  const q = (value, step) => Math.round(value / step)
  for (let i = 0; i < vertexCount; i += 1) {
    const key = [
      q(positions[i * 3], 1e-5),
      q(positions[i * 3 + 1], 1e-5),
      q(positions[i * 3 + 2], 1e-5),
      q(normals[i * 3], 1e-3),
      q(normals[i * 3 + 1], 1e-3),
      q(normals[i * 3 + 2], 1e-3),
      q(uvs[i * 2], 1e-5),
      q(uvs[i * 2 + 1], 1e-5),
    ].join(',')
    let index = lookup.get(key)
    if (index === undefined) {
      index = outPositions.length / 3
      lookup.set(key, index)
      outPositions.push(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2],
      )
      outNormals.push(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2])
      outUvs.push(uvs[i * 2], uvs[i * 2 + 1])
    }
    remap[i] = index
  }
  // Drop triangles that collapse to a line or a point.
  const indices = []
  for (let t = 0; t < vertexCount; t += 3) {
    const a = remap[t]
    const b = remap[t + 1]
    const c = remap[t + 2]
    if (a !== b && b !== c && a !== c) indices.push(a, b, c)
  }
  return {
    positions: new Float32Array(outPositions),
    normals: new Float32Array(outNormals),
    uvs: new Float32Array(outUvs),
    indices: new Uint32Array(indices),
  }
}

/** Drops vertices no index refers to. */
export function compact(primitive) {
  const used = new Map()
  const indices = new Uint32Array(primitive.indices.length)
  const positions = []
  const normals = []
  const uvs = []
  primitive.indices.forEach((oldIndex, i) => {
    let newIndex = used.get(oldIndex)
    if (newIndex === undefined) {
      newIndex = used.size
      used.set(oldIndex, newIndex)
      positions.push(
        ...primitive.positions.subarray(oldIndex * 3, oldIndex * 3 + 3),
      )
      normals.push(
        ...primitive.normals.subarray(oldIndex * 3, oldIndex * 3 + 3),
      )
      uvs.push(...primitive.uvs.subarray(oldIndex * 2, oldIndex * 2 + 2))
    }
    indices[i] = newIndex
  })
  return {
    ...primitive,
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices,
  }
}

/**
 * Simplifies a solid-colour primitive: welds it by position alone (the .sgl
 * normals are mostly per-face, which leaves nothing shared to collapse), runs
 * `simplifyIndices(indices, positions) -> indices`, then rebuilds normals,
 * keeping edges sharper than `creaseDegrees` hard. UVs are dropped to 0, so
 * only use this on primitives whose texture is one flat colour.
 */
export function simplifyByPosition(
  primitive,
  simplifyIndices,
  creaseDegrees = 40,
) {
  const welded = weld({
    positions: primitive.positions,
    normals: new Float32Array(primitive.positions.length),
    uvs: new Float32Array((primitive.positions.length / 3) * 2),
  })
  const source = {
    ...welded,
    indices: Uint32Array.from(primitive.indices, (i) =>
      positionIndexOf(welded.positions, primitive.positions, i),
    ),
  }
  const indices = simplifyIndices(source.indices, source.positions)
  return withCreaseNormals(
    source.positions,
    indices,
    creaseDegrees,
    primitive.material,
  )
}

function positionIndexOf(weldedPositions, positions, i) {
  // weld() keeps first-seen order, so build the lookup lazily once per array.
  let lookup = positionLookups.get(weldedPositions)
  if (!lookup) {
    lookup = new Map()
    for (let v = 0; v < weldedPositions.length / 3; v += 1) {
      lookup.set(positionKey(weldedPositions, v), v)
    }
    positionLookups.set(weldedPositions, lookup)
  }
  return lookup.get(positionKey(positions, i))
}

const positionLookups = new WeakMap()

function positionKey(positions, v) {
  return [0, 1, 2]
    .map((axis) => Math.round(positions[v * 3 + axis] / 1e-5))
    .join(',')
}

/** Flat face normals averaged per vertex across faces within the crease angle. */
export function withCreaseNormals(positions, indices, creaseDegrees, material) {
  const faceCount = indices.length / 3
  const faceNormals = new Float32Array(faceCount * 3)
  const facesOfVertex = new Map()
  for (let f = 0; f < faceCount; f += 1) {
    const [a, b, c] = [indices[f * 3], indices[f * 3 + 1], indices[f * 3 + 2]]
    const e1 = [0, 1, 2].map((k) => positions[b * 3 + k] - positions[a * 3 + k])
    const e2 = [0, 1, 2].map((k) => positions[c * 3 + k] - positions[a * 3 + k])
    const n = [
      e1[1] * e2[2] - e1[2] * e2[1],
      e1[2] * e2[0] - e1[0] * e2[2],
      e1[0] * e2[1] - e1[1] * e2[0],
    ]
    const length = Math.hypot(...n) || 1
    faceNormals.set(
      n.map((value) => value / length),
      f * 3,
    )
    for (const v of [a, b, c]) {
      if (!facesOfVertex.has(v)) facesOfVertex.set(v, [])
      facesOfVertex.get(v).push(f)
    }
  }
  const cosCrease = Math.cos((creaseDegrees * Math.PI) / 180)
  const dot = (f, g) =>
    faceNormals[f * 3] * faceNormals[g * 3] +
    faceNormals[f * 3 + 1] * faceNormals[g * 3 + 1] +
    faceNormals[f * 3 + 2] * faceNormals[g * 3 + 2]
  const outPositions = []
  const outNormals = []
  const outIndices = new Uint32Array(indices.length)
  const made = new Map()
  for (let f = 0; f < faceCount; f += 1) {
    for (let k = 0; k < 3; k += 1) {
      const v = indices[f * 3 + k]
      const smoothWith = facesOfVertex
        .get(v)
        .filter((g) => dot(f, g) >= cosCrease)
      const n = [0, 0, 0]
      for (const g of smoothWith) {
        for (let axis = 0; axis < 3; axis += 1)
          n[axis] += faceNormals[g * 3 + axis]
      }
      const length = Math.hypot(...n) || 1
      const normal = n.map((value) => value / length)
      const key = `${v}|${normal.map((value) => Math.round(value * 1000)).join(',')}`
      let index = made.get(key)
      if (index === undefined) {
        index = outPositions.length / 3
        made.set(key, index)
        outPositions.push(
          positions[v * 3],
          positions[v * 3 + 1],
          positions[v * 3 + 2],
        )
        outNormals.push(...normal)
      }
      outIndices[f * 3 + k] = index
    }
  }
  return {
    material,
    positions: new Float32Array(outPositions),
    normals: new Float32Array(outNormals),
    uvs: new Float32Array((outPositions.length / 3) * 2),
    indices: outIndices,
  }
}

export function triangleCount(primitives) {
  return primitives.reduce((sum, p) => sum + p.indices.length / 3, 0)
}

export function bounds(primitives) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const { positions } of primitives) {
    for (let i = 0; i < positions.length; i += 3) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], positions[i + axis])
        max[axis] = Math.max(max[axis], positions[i + axis])
      }
    }
  }
  return { min, max }
}

/** sRGB 0..255 to the linear 0..1 glTF wants in baseColorFactor. */
export function srgbByteToLinear(value) {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/**
 * A bmp-js decode result ({ width, height, data } with ABGR bytes), reduced to
 * its one colour when every pixel is the same, else null.
 */
export function uniformBmpColor({ width, height, data }) {
  const first = [data[3], data[2], data[1]]
  for (let p = 0; p < width * height; p += 1) {
    if (
      data[p * 4 + 3] !== first[0] ||
      data[p * 4 + 2] !== first[1] ||
      data[p * 4 + 1] !== first[2]
    ) {
      return null
    }
  }
  return first
}

const FLOAT = 5126
const UNSIGNED_SHORT = 5123
const UNSIGNED_INT = 5125
const ARRAY_BUFFER = 34962
const ELEMENT_ARRAY_BUFFER = 34963

/**
 * The height of the largest upward-facing area (to `step`): the surface a
 * piece is stood on, such as a wall's walkway or a base's top.
 */
export function walkableTop(primitives, step = 0.01) {
  const areaAt = new Map()
  for (const { positions, indices } of primitives) {
    for (let t = 0; t < indices.length; t += 3) {
      const [a, b, c] = [indices[t], indices[t + 1], indices[t + 2]]
      const e1 = [0, 1, 2].map(
        (k) => positions[b * 3 + k] - positions[a * 3 + k],
      )
      const e2 = [0, 1, 2].map(
        (k) => positions[c * 3 + k] - positions[a * 3 + k],
      )
      const n = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
      ]
      const twiceArea = Math.hypot(...n)
      if (!twiceArea || n[1] / twiceArea < 0.95) continue
      const y =
        (positions[a * 3 + 1] + positions[b * 3 + 1] + positions[c * 3 + 1]) / 3
      const bucket = Math.round(y / step)
      areaAt.set(bucket, (areaAt.get(bucket) ?? 0) + twiceArea / 2)
    }
  }
  let best = null
  for (const [bucket, area] of areaAt) {
    if (best === null || area > best.area) best = { bucket, area }
  }
  return best === null ? null : Math.round(best.bucket * step * 1e4) / 1e4
}

/**
 * Writes a binary glTF 2.0 file.
 * nodes: [{ name, extras?, primitives: [{ material, positions, normals, uvs, indices }] }]
 * materials: { [key]: { name, color?: [r,g,b] (sRGB bytes), image?: { mimeType, bytes } } }
 */
export function buildGlb({ nodes, materials }) {
  const chunks = []
  let byteLength = 0
  const bufferViews = []
  const accessors = []
  const addView = (bytes, target) => {
    const padding = (4 - (byteLength % 4)) % 4
    if (padding) {
      chunks.push(new Uint8Array(padding))
      byteLength += padding
    }
    const view = {
      buffer: 0,
      byteOffset: byteLength,
      byteLength: bytes.byteLength,
    }
    if (target) view.target = target
    chunks.push(
      new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    )
    byteLength += bytes.byteLength
    bufferViews.push(view)
    return bufferViews.length - 1
  }
  const addAccessor = (array, type, componentType, target, withBounds) => {
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3 }[type]
    const accessor = {
      bufferView: addView(array, target),
      componentType,
      count: array.length / size,
      type,
    }
    if (withBounds) {
      const { min, max } = bounds([{ positions: array }])
      accessor.min = min
      accessor.max = max
    }
    accessors.push(accessor)
    return accessors.length - 1
  }

  const materialKeys = Object.keys(materials)
  const images = []
  const textures = []
  const gltfMaterials = materialKeys.map((key) => {
    const material = materials[key]
    const pbr = { metallicFactor: 0, roughnessFactor: 0.9 }
    if (material.image) {
      images.push({
        bufferView: addView(material.image.bytes),
        mimeType: material.image.mimeType,
      })
      textures.push({ sampler: 0, source: images.length - 1 })
      pbr.baseColorTexture = { index: textures.length - 1 }
    } else {
      const [r, g, b] = material.color ?? [255, 255, 255]
      pbr.baseColorFactor = [
        srgbByteToLinear(r),
        srgbByteToLinear(g),
        srgbByteToLinear(b),
        1,
      ]
    }
    return { name: material.name ?? key, pbrMetallicRoughness: pbr }
  })

  const meshes = nodes.map((node) => ({
    name: node.name,
    primitives: node.primitives.map((primitive) => {
      const vertexCount = primitive.positions.length / 3
      const indices =
        vertexCount <= 0xffff
          ? Uint16Array.from(primitive.indices)
          : Uint32Array.from(primitive.indices)
      const materialIndex = materialKeys.indexOf(primitive.material)
      if (materialIndex === -1) {
        throw new Error(`no material "${primitive.material}" for ${node.name}`)
      }
      return {
        attributes: {
          POSITION: addAccessor(
            primitive.positions,
            'VEC3',
            FLOAT,
            ARRAY_BUFFER,
            true,
          ),
          NORMAL: addAccessor(primitive.normals, 'VEC3', FLOAT, ARRAY_BUFFER),
          TEXCOORD_0: addAccessor(primitive.uvs, 'VEC2', FLOAT, ARRAY_BUFFER),
        },
        indices: addAccessor(
          indices,
          'SCALAR',
          indices instanceof Uint16Array ? UNSIGNED_SHORT : UNSIGNED_INT,
          ELEMENT_ARRAY_BUFFER,
        ),
        material: materialIndex,
      }
    }),
  }))

  const json = {
    asset: { version: '2.0', generator: 'hexoscape scripts/virtualscape' },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes: nodes.map((node, i) => ({
      name: node.name,
      mesh: i,
      ...(node.extras ? { extras: node.extras } : {}),
    })),
    meshes,
    materials: gltfMaterials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: align4(byteLength) }],
  }
  if (images.length) {
    json.images = images
    json.textures = textures
    json.samplers = [
      { magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 },
    ]
  }

  const jsonBytes = padTo4(new TextEncoder().encode(JSON.stringify(json)), 0x20)
  const binBytes = padTo4(concatBytes(chunks, byteLength), 0)
  const total = 12 + 8 + jsonBytes.byteLength + 8 + binBytes.byteLength
  const out = new Uint8Array(total)
  const view = new DataView(out.buffer)
  view.setUint32(0, 0x46546c67, true) // glTF
  view.setUint32(4, 2, true)
  view.setUint32(8, total, true)
  view.setUint32(12, jsonBytes.byteLength, true)
  view.setUint32(16, 0x4e4f534a, true) // JSON
  out.set(jsonBytes, 20)
  const binHeader = 20 + jsonBytes.byteLength
  view.setUint32(binHeader, binBytes.byteLength, true)
  view.setUint32(binHeader + 4, 0x004e4942, true) // BIN
  out.set(binBytes, binHeader + 8)
  return out
}

/** Reads back the JSON chunk of a GLB. */
export function readGlbJson(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const length = view.getUint32(12, true)
  return JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + length)))
}

function align4(n) {
  return Math.ceil(n / 4) * 4
}

function padTo4(bytes, fill) {
  const padded = new Uint8Array(align4(bytes.byteLength)).fill(fill)
  padded.set(bytes)
  return padded
}

function concatBytes(chunks, length) {
  const out = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}
