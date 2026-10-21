import { describe, expect, it } from 'vitest'
import { getPossibleRotationsForPenMode } from '../controls/getPossibleRotationsForPenMode'
import {
  getLaurAddonCanonicalKey,
  resolveLaurAddonEdge,
} from '../data/laurAddonPlacement'
import type { CubeCoordinate } from '../types'
import { cubeToPixel, HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { Pieces } from '../types'

const anchor = { q: 5, r: 5, s: -10 }
const integerRotations = [0, 1, 2, 3, 4, 5]
const halfStepRotations = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]
const allRotations = integerRotations.flatMap((rotation) => [
  rotation,
  rotation + 0.5,
])

function featurePoint(at: CubeCoordinate, rotation: number) {
  const center = cubeToPixel(at)
  if (Number.isInteger(rotation)) {
    const direction = cubeToPixel(HEX_DIRECTIONS[rotation])
    return { x: center.x + direction.x / 2, z: center.y + direction.y / 2 }
  }
  const direction = Math.floor(rotation)
  const first = cubeToPixel(HEX_DIRECTIONS[direction])
  const second = cubeToPixel(HEX_DIRECTIONS[(direction + 1) % 6])
  return {
    x: center.x + (first.x + second.x) / 3,
    z: center.y + (first.y + second.y) / 3,
  }
}

describe('resolveLaurAddonEdge', () => {
  it.each(allRotations)(
    'resolves the nearest side or vertex at rotation %s',
    (rotation) => {
      expect(
        resolveLaurAddonEdge(
          anchor,
          featurePoint(anchor, rotation),
          0,
          allRotations,
        ),
      ).toMatchObject({ rotation })
    },
  )

  it.each(integerRotations)(
    'uses one canonical side identity from either adjacent hex (%s)',
    (rotation) => {
      const neighbor = hexUtilsAdd(anchor, HEX_DIRECTIONS[rotation])
      expect(getLaurAddonCanonicalKey(anchor, rotation)).toBe(
        getLaurAddonCanonicalKey(neighbor, (rotation + 3) % 6),
      )
    },
  )

  it.each(halfStepRotations)(
    'uses one canonical vertex identity from all three adjacent hexes (%s)',
    (rotation) => {
      const direction = Math.floor(rotation)
      const firstNeighbor = hexUtilsAdd(anchor, HEX_DIRECTIONS[direction])
      const secondNeighbor = hexUtilsAdd(
        anchor,
        HEX_DIRECTIONS[(direction + 1) % 6],
      )
      const key = getLaurAddonCanonicalKey(anchor, rotation)
      const adjacentRotation = (at: CubeCoordinate) =>
        halfStepRotations.find(
          (candidate) => getLaurAddonCanonicalKey(at, candidate) === key,
        )
      expect(adjacentRotation(firstNeighbor)).toBeDefined()
      expect(adjacentRotation(secondNeighbor)).toBeDefined()
    },
  )

  it('keeps the pen rotation when the hit is exactly at the hex center', () => {
    const center = cubeToPixel(anchor)
    expect(
      resolveLaurAddonEdge(
        anchor,
        { x: center.x, z: center.y },
        2.5,
        allRotations,
      )?.rotation,
    ).toBe(2.5)
  })

  it.each([
    [Pieces.laurWallLong, halfStepRotations],
    [Pieces.laurWallArch, halfStepRotations],
    [Pieces.laurWallLongStackable, halfStepRotations],
    [Pieces.laurWallShort, integerRotations],
    [Pieces.laurWallShortStackable, integerRotations],
    [Pieces.laurWallRuin1, allRotations],
    [Pieces.laurWallRuin2, allRotations],
    [Pieces.laurWallRuin3, allRotations],
  ])('honors allowed rotations for %s', (pieceID, rotations) => {
    expect(getPossibleRotationsForPenMode(pieceID)).toEqual(rotations)
  })

  it('does not mutate the anchor or world hit point', () => {
    const frozenAnchor = Object.freeze({ ...anchor })
    const center = cubeToPixel(anchor)
    const hitPoint = Object.freeze({
      x: center.x + 0.4,
      z: center.y + 0.2,
    })
    const before = { anchor: { ...anchor }, hitPoint: { ...hitPoint } }
    resolveLaurAddonEdge(frozenAnchor, hitPoint, 0, allRotations)
    expect({ anchor: frozenAnchor, hitPoint }).toEqual(before)
  })
})
