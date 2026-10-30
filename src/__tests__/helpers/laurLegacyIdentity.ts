import type { CubeCoordinate } from '../../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../../utils/hex-utils'

const normalizeRotation = (rotation: number) => {
  const halfSteps = rotation * 2
  if (!Number.isInteger(halfSteps)) return null
  return (((halfSteps % 12) + 12) % 12) / 2
}

const coordKey = ({ q, r, s }: CubeCoordinate) => `${q},${r},${s}`

export function legacyLaurAddonCanonicalKey(
  anchor: CubeCoordinate,
  rotation: number,
) {
  const normalized = normalizeRotation(rotation)
  if (normalized === null) return null

  if (Number.isInteger(normalized)) {
    const neighbor = hexUtilsAdd(anchor, HEX_DIRECTIONS[normalized])
    const [first, second] = [coordKey(anchor), coordKey(neighbor)].sort()
    return `side:${first}|${second}`
  }

  const direction = Math.floor(normalized)
  const nextDirection = (direction + 1) % 6
  const cells = [
    anchor,
    hexUtilsAdd(anchor, HEX_DIRECTIONS[direction]),
    hexUtilsAdd(anchor, HEX_DIRECTIONS[nextDirection]),
  ]
    .map(coordKey)
    .sort()
  return `vertex:${cells.join('|')}`
}
