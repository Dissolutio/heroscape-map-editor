// Piecewise height fit for the Virtualscape fortress models.
//
// A model is a body (from its true bottom up to its shoulder, the surface the
// next piece rests on) plus, on walls and bases, a receiver: the male
// connector above the shoulder that goes inside the piece on top. The body
// is stretched so its bottom and shoulder land on the classic model's bottom
// and top; the receiver keeps its real height and rides on top. Anything
// below the true bottom (a peg) is dropped. A covered top drops the receiver.

export type HeightFit = {
  /** True bottom and shoulder in the model's own (GLB) frame. */
  srcBottom: number
  srcShoulder: number
  /** Classic bottom and top in the classic model's frame. */
  dstBottom: number
  dstTop: number
}

// Sculpted surfaces vary by a hundredth or so around the shoulder and the
// bottom; only geometry clearly past them counts as receiver or peg.
export const SHOULDER_TOLERANCE = 0.02
export const BOTTOM_TOLERANCE = 0.005

export function remapHeight(y: number, fit: HeightFit) {
  if (y > fit.srcShoulder) return fit.dstTop + (y - fit.srcShoulder)
  const clamped = Math.max(y, fit.srcBottom)
  const stretch =
    (fit.dstTop - fit.dstBottom) / (fit.srcShoulder - fit.srcBottom)
  return fit.dstBottom + (clamped - fit.srcBottom) * stretch
}

export type IndexedMesh = {
  positions: ArrayLike<number>
  normals: ArrayLike<number> | null
  /** Triangle indices; null means an unindexed triangle list. */
  index: ArrayLike<number> | null
}

/**
 * Remaps every vertex height, fixes the normals of the stretched body, drops
 * pegs (triangles wholly below the bottom) and, unless `keepReceiver`, the
 * receiver (triangles reaching clearly above the shoulder). Vertices no kept
 * triangle uses are dropped too; `keptVertices` lists the source vertex of
 * each output vertex, for carrying UVs and other attributes over.
 */
export function fitMeshHeights(
  mesh: IndexedMesh,
  fit: HeightFit,
  { keepReceiver }: { keepReceiver: boolean },
) {
  const vertexCount = mesh.positions.length / 3
  const positions = new Float32Array(mesh.positions.length)
  const normals = mesh.normals ? new Float32Array(mesh.normals.length) : null
  const stretch =
    (fit.dstTop - fit.dstBottom) / (fit.srcShoulder - fit.srcBottom)
  for (let v = 0; v < vertexCount; v += 1) {
    const y = mesh.positions[v * 3 + 1]
    positions[v * 3] = mesh.positions[v * 3]
    positions[v * 3 + 1] = remapHeight(y, fit)
    positions[v * 3 + 2] = mesh.positions[v * 3 + 2]
    if (normals && mesh.normals) {
      const isBody = y <= fit.srcShoulder
      const nx = mesh.normals[v * 3]
      const ny = mesh.normals[v * 3 + 1] / (isBody ? stretch : 1)
      const nz = mesh.normals[v * 3 + 2]
      const length = Math.hypot(nx, ny, nz) || 1
      normals[v * 3] = nx / length
      normals[v * 3 + 1] = ny / length
      normals[v * 3 + 2] = nz / length
    }
  }
  const sourceIndex =
    mesh.index ?? Array.from({ length: vertexCount }, (_, i) => i)
  const newIndexOf = new Map<number, number>()
  const keptVertices: number[] = []
  const index: number[] = []
  for (let t = 0; t + 2 < sourceIndex.length; t += 3) {
    const corners = [sourceIndex[t], sourceIndex[t + 1], sourceIndex[t + 2]]
    const ys = corners.map((v) => mesh.positions[v * 3 + 1])
    const isPeg = Math.max(...ys) < fit.srcBottom - BOTTOM_TOLERANCE
    const isReceiver = Math.max(...ys) > fit.srcShoulder + SHOULDER_TOLERANCE
    if (isPeg || (isReceiver && !keepReceiver)) continue
    for (const v of corners) {
      let newIndex = newIndexOf.get(v)
      if (newIndex === undefined) {
        newIndex = keptVertices.length
        newIndexOf.set(v, newIndex)
        keptVertices.push(v)
      }
      index.push(newIndex)
    }
  }
  return {
    positions: gather(positions, keptVertices, 3),
    normals: normals ? gather(normals, keptVertices, 3) : null,
    index: Uint32Array.from(index),
    keptVertices: Uint32Array.from(keptVertices),
  }
}

/** The `itemSize`-wide items of `values` at `vertices`, in that order. */
export function gather(
  values: ArrayLike<number>,
  vertices: ArrayLike<number>,
  itemSize: number,
) {
  const out = new Float32Array(vertices.length * itemSize)
  for (let i = 0; i < vertices.length; i += 1) {
    for (let k = 0; k < itemSize; k += 1) {
      out[i * itemSize + k] = values[vertices[i] * itemSize + k]
    }
  }
  return out
}

/**
 * A model's true bottom and shoulder in its own frame. With `walkableTop`
 * (the converter's walkway height, to 0.01) the shoulder is the highest point
 * of the body below the receiver; without it, the model's top (arch,
 * battlement: nothing of theirs goes inside the next piece).
 */
export function measureSource(
  meshes: IndexedMesh[],
  walkableTop: number | null,
): Pick<HeightFit, 'srcBottom' | 'srcShoulder'> {
  const { min, max } = heightRange(meshes)
  if (walkableTop === null) return { srcBottom: min, srcShoulder: max }
  let srcShoulder = walkableTop
  for (const mesh of meshes) {
    const index =
      mesh.index ??
      Array.from({ length: mesh.positions.length / 3 }, (_, i) => i)
    for (let t = 0; t + 2 < index.length; t += 3) {
      const top = Math.max(
        mesh.positions[index[t] * 3 + 1],
        mesh.positions[index[t + 1] * 3 + 1],
        mesh.positions[index[t + 2] * 3 + 1],
      )
      if (top <= walkableTop + SHOULDER_TOLERANCE) {
        srcShoulder = Math.max(srcShoulder, top)
      }
    }
  }
  return { srcBottom: min, srcShoulder }
}

/** Lowest and highest height of a set of meshes. */
export function heightRange(meshes: Array<{ positions: ArrayLike<number> }>) {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const { positions } of meshes) {
    for (let i = 1; i < positions.length; i += 3) {
      min = Math.min(min, positions[i])
      max = Math.max(max, positions[i])
    }
  }
  return { min, max }
}
