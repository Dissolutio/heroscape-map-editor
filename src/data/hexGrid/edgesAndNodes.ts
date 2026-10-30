import type { CubeCoordinate } from '../../types'
import { HEXGRID_HEX_RADIUS } from '../../utils/constants'
import { HEX_DIRECTIONS, cubeToPixel, hexUtilsAdd } from '../../utils/hex-utils'

type Brand<Value, Name extends string> = Value & {
  readonly __brand: Name
}

export type IntegerCubeCoordinate = Readonly<CubeCoordinate>
export type HexEdgeId = Brand<string, 'HexEdgeId'>
export type HexNodeId = Brand<string, 'HexNodeId'>
export type HexFeatureId = HexEdgeId | HexNodeId

type ScaledCubeCoordinate = {
  q: number
  r: number
  s: number
}

const direction = (index: number) => HEX_DIRECTIONS[mod(index, 6)]
const mod = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor

function assertIntegerCube(coords: IntegerCubeCoordinate) {
  if (
    !Number.isSafeInteger(coords.q) ||
    !Number.isSafeInteger(coords.r) ||
    !Number.isSafeInteger(coords.s) ||
    coords.q + coords.r + coords.s !== 0
  ) {
    throw new RangeError('Expected an integer cube coordinate')
  }
}

function assertIndex(index: number) {
  if (!Number.isSafeInteger(index)) {
    throw new RangeError('Expected an integer direction')
  }
}

function assertScaledCube(coords: ScaledCubeCoordinate) {
  if (
    !Number.isSafeInteger(coords.q) ||
    !Number.isSafeInteger(coords.r) ||
    !Number.isSafeInteger(coords.s) ||
    coords.q + coords.r + coords.s !== 0
  ) {
    throw new RangeError('Invalid edge or node id')
  }
}

function scaledKey(kind: 'edge' | 'node', coords: ScaledCubeCoordinate) {
  assertScaledCube(coords)
  return `${kind}:${coords.q},${coords.r},${coords.s}`
}

function parseScaledKey(
  kind: 'edge' | 'node',
  id: string,
): ScaledCubeCoordinate {
  const match = new RegExp(`^${kind}:(-?\\d+),(-?\\d+),(-?\\d+)$`).exec(id)
  if (!match) throw new RangeError(`Invalid ${kind} id`)
  const coords = {
    q: Number(match[1]),
    r: Number(match[2]),
    s: Number(match[3]),
  }
  assertScaledCube(coords)
  return coords
}

function fromScaled(
  coords: ScaledCubeCoordinate,
  scale: number,
): CubeCoordinate {
  const result = {
    q: coords.q / scale,
    r: coords.r / scale,
    s: coords.s / scale,
  }
  return result
}

function sortHexes(hexes: CubeCoordinate[]) {
  return hexes.sort((a, b) => a.q - b.q || a.r - b.r || a.s - b.s) as [
    CubeCoordinate,
    CubeCoordinate,
    ...CubeCoordinate[],
  ]
}

export function edgeIdFromHex(
  hex: IntegerCubeCoordinate,
  edgeIndex: number,
): HexEdgeId {
  assertIntegerCube(hex)
  assertIndex(edgeIndex)
  const edgeDirection = direction(edgeIndex)
  return scaledKey('edge', {
    q: 2 * hex.q + edgeDirection.q,
    r: 2 * hex.r + edgeDirection.r,
    s: 2 * hex.s + edgeDirection.s,
  }) as HexEdgeId
}

export function nodeIdFromHexCorner(
  hex: IntegerCubeCoordinate,
  cornerIndex: number,
): HexNodeId {
  assertIntegerCube(hex)
  assertIndex(cornerIndex)
  const first = direction(cornerIndex)
  const second = direction(cornerIndex + 1)
  return scaledKey('node', {
    q: 3 * hex.q + first.q + second.q,
    r: 3 * hex.r + first.r + second.r,
    s: 3 * hex.s + first.s + second.s,
  }) as HexNodeId
}

export function nodeIdFromHexRotation(
  hex: IntegerCubeCoordinate,
  rotation: number,
): HexNodeId {
  const halfSteps = rotation * 2
  if (!Number.isSafeInteger(halfSteps) || mod(halfSteps, 2) !== 1) {
    throw new RangeError('Expected a half-step vertex rotation')
  }
  return nodeIdFromHexCorner(hex, (mod(halfSteps, 12) - 1) / 2)
}

export function hexesForEdge(
  edge: HexEdgeId,
): [CubeCoordinate, CubeCoordinate] {
  const point = parseScaledKey('edge', edge)
  for (let index = 0; index < 6; index++) {
    const step = direction(index)
    const anchor = {
      q: (point.q - step.q) / 2,
      r: (point.r - step.r) / 2,
      s: (point.s - step.s) / 2,
    }
    if (
      Number.isInteger(anchor.q) &&
      Number.isInteger(anchor.r) &&
      Number.isInteger(anchor.s)
    ) {
      return sortHexes([anchor, hexUtilsAdd(anchor, step)]) as [
        CubeCoordinate,
        CubeCoordinate,
      ]
    }
  }
  throw new RangeError('Invalid edge id')
}

export function hexesForNode(
  node: HexNodeId,
): [CubeCoordinate, CubeCoordinate, CubeCoordinate] {
  const point = parseScaledKey('node', node)
  for (let corner = 0; corner < 6; corner++) {
    const first = direction(corner)
    const second = direction(corner + 1)
    const anchor = {
      q: (point.q - first.q - second.q) / 3,
      r: (point.r - first.r - second.r) / 3,
      s: (point.s - first.s - second.s) / 3,
    }
    if (
      Number.isInteger(anchor.q) &&
      Number.isInteger(anchor.r) &&
      Number.isInteger(anchor.s)
    ) {
      return sortHexes([
        anchor,
        hexUtilsAdd(anchor, first),
        hexUtilsAdd(anchor, second),
      ]) as [CubeCoordinate, CubeCoordinate, CubeCoordinate]
    }
  }
  throw new RangeError('Invalid node id')
}

function directionBetween(from: CubeCoordinate, to: CubeCoordinate) {
  const delta = {
    q: to.q - from.q,
    r: to.r - from.r,
    s: to.s - from.s,
  }
  const index = Array.from({ length: 6 }, (_, candidate) => candidate).find(
    (candidate) => {
      const step = direction(candidate)
      return step.q === delta.q && step.r === delta.r && step.s === delta.s
    },
  )
  if (index === undefined) throw new RangeError('Hexes are not neighbors')
  return index
}

export function edgesForHex(hex: IntegerCubeCoordinate): HexEdgeId[] {
  assertIntegerCube(hex)
  return Array.from({ length: 6 }, (_, index) => edgeIdFromHex(hex, index))
}

export function nodesForHex(hex: IntegerCubeCoordinate): HexNodeId[] {
  assertIntegerCube(hex)
  return Array.from({ length: 6 }, (_, index) =>
    nodeIdFromHexCorner(hex, index),
  )
}

export function edgesForNode(
  node: HexNodeId,
): [HexEdgeId, HexEdgeId, HexEdgeId] {
  const [first, second, third] = hexesForNode(node)
  return [
    edgeIdFromHex(first, directionBetween(first, second)),
    edgeIdFromHex(second, directionBetween(second, third)),
    edgeIdFromHex(third, directionBetween(third, first)),
  ]
}

export function nodesForEdge(edge: HexEdgeId): [HexNodeId, HexNodeId] {
  const [first, second] = hexesForEdge(edge)
  const corner = directionBetween(first, second)
  return [
    nodeIdFromHexCorner(first, corner),
    nodeIdFromHexCorner(first, corner + 5),
  ]
}

export function hexDistance(
  first: IntegerCubeCoordinate,
  second: IntegerCubeCoordinate,
) {
  assertIntegerCube(first)
  assertIntegerCube(second)
  return Math.max(
    Math.abs(first.q - second.q),
    Math.abs(first.r - second.r),
    Math.abs(first.s - second.s),
  )
}

export function hexesAreAdjacent(
  first: IntegerCubeCoordinate,
  second: IntegerCubeCoordinate,
) {
  return hexDistance(first, second) === 1
}

export function edgesShareNode(first: HexEdgeId, second: HexEdgeId) {
  const nodes = new Set(nodesForEdge(first))
  return nodesForEdge(second).some((node) => nodes.has(node))
}

export function nodesShareEdge(first: HexNodeId, second: HexNodeId) {
  const edges = new Set(edgesForNode(first))
  return edgesForNode(second).some((edge) => edges.has(edge))
}

function toWorldPoint(
  coords: ScaledCubeCoordinate,
  scale: number,
  hexRadius: number,
) {
  const point = cubeToPixel(fromScaled(coords, scale))
  return { x: point.x * hexRadius, z: point.y * hexRadius }
}

export function edgeToWorldPoint(
  edge: HexEdgeId,
  hexRadius = HEXGRID_HEX_RADIUS,
) {
  return toWorldPoint(parseScaledKey('edge', edge), 2, hexRadius)
}

export function nodeToWorldPoint(
  node: HexNodeId,
  hexRadius = HEXGRID_HEX_RADIUS,
) {
  return toWorldPoint(parseScaledKey('node', node), 3, hexRadius)
}
