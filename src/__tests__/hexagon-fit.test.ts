import { describe, expect, it } from 'vitest'
import {
  getHexagonTableFit,
  getMapTableFootprintCoords,
} from '../data/fitMapToPieces'
import { trimAndNormalizeMap } from '../data/convertMapShape'
import type { BoardPiece, CubeCoordinate, HexMap } from '../types'
import mountainsOfModi from './fixtures/mountains-of-modi.json'

const modiFixture = mountainsOfModi as {
  hexMap: HexMap
  boardPieces: BoardPiece[]
}

function getExtents(coords: readonly CubeCoordinate[]) {
  return coords.reduce(
    (extents, { q, r, s }) => ({
      minQ: Math.min(extents.minQ, q),
      maxQ: Math.max(extents.maxQ, q),
      minR: Math.min(extents.minR, r),
      maxR: Math.max(extents.maxR, r),
      minS: Math.min(extents.minS, s),
      maxS: Math.max(extents.maxS, s),
    }),
    {
      minQ: Number.POSITIVE_INFINITY,
      maxQ: Number.NEGATIVE_INFINITY,
      minR: Number.POSITIVE_INFINITY,
      maxR: Number.NEGATIVE_INFINITY,
      minS: Number.POSITIVE_INFINITY,
      maxS: Number.NEGATIVE_INFINITY,
    },
  )
}

function centerScore(
  extents: ReturnType<typeof getExtents>,
  centerQ: number,
  centerR: number,
  radius: number,
) {
  const centerS = -centerQ - centerR
  const qSlackLow = extents.minQ - (centerQ - radius)
  const qSlackHigh = centerQ + radius - extents.maxQ
  const rSlackLow = extents.minR - (centerR - radius)
  const rSlackHigh = centerR + radius - extents.maxR
  const sSlackLow = extents.minS - (centerS - radius)
  const sSlackHigh = centerS + radius - extents.maxS
  return (
    Math.abs(qSlackLow - qSlackHigh) +
    Math.abs(rSlackLow - rSlackHigh) +
    Math.abs(sSlackLow - sSlackHigh)
  )
}

function minimumCenterScore(
  extents: ReturnType<typeof getExtents>,
  radius: number,
) {
  let minimum = Number.POSITIVE_INFINITY
  for (
    let centerQ = extents.maxQ - radius;
    centerQ <= extents.minQ + radius;
    centerQ += 1
  ) {
    for (
      let centerR = extents.maxR - radius;
      centerR <= extents.minR + radius;
      centerR += 1
    ) {
      const centerS = -centerQ - centerR
      if (centerS < extents.maxS - radius || centerS > extents.minS + radius) {
        continue
      }
      minimum = Math.min(
        minimum,
        centerScore(extents, centerQ, centerR, radius),
      )
    }
  }
  return minimum
}

function centerFromFit(
  fit: NonNullable<ReturnType<typeof getHexagonTableFit>>,
) {
  const offsetQ =
    fit.radius % 2 === 0 ? fit.radius / 2 : Math.floor(fit.radius / 2 + 0.5)
  return {
    q: fit.originQ + offsetQ,
    r: fit.originR + fit.radius,
  }
}

describe('getHexagonTableFit', () => {
  it('centers a single hex at radius zero', () => {
    const fit = getHexagonTableFit([{ q: 5, r: -3, s: -2 }])

    expect(fit).toEqual({ radius: 0, originQ: 5, originR: -3 })
  })

  it('centers a straight line of five hexes at radius two', () => {
    const coords = Array.from({ length: 5 }, (_, index) => {
      const q = index - 2
      return { q, r: 0, s: -q }
    })

    const fit = getHexagonTableFit(coords)

    expect(fit).toEqual({ radius: 2, originQ: -1, originR: -2 })
    if (!fit) throw new Error('Expected the line to fit')
    expect(centerFromFit(fit)).toEqual({ q: 0, r: 0 })
  })

  it('finds a smaller fit than the old q/r midpoint for lopsided content', () => {
    const coords = [
      { q: 0, r: 0, s: 0 },
      { q: 4, r: 0, s: -4 },
      { q: 0, r: 4, s: -4 },
    ]
    const extents = getExtents(coords)
    const oldCenterQ = Math.floor((extents.minQ + extents.maxQ) / 2)
    const oldCenterR = Math.floor((extents.minR + extents.maxR) / 2)
    const oldCenterS = -oldCenterQ - oldCenterR
    const oldRadius = Math.max(
      Math.abs(extents.minQ - oldCenterQ),
      Math.abs(extents.maxQ - oldCenterQ),
      Math.abs(extents.minR - oldCenterR),
      Math.abs(extents.maxR - oldCenterR),
      Math.abs(extents.minS - oldCenterS),
      Math.abs(extents.maxS - oldCenterS),
    )
    const fit = getHexagonTableFit(coords)

    expect(oldRadius).toBe(4)
    expect(fit?.radius).toBe(3)
  })

  it('adds margin around the same selected center', () => {
    const coords = [
      { q: 0, r: 0, s: 0 },
      { q: 4, r: 0, s: -4 },
      { q: 0, r: 4, s: -4 },
    ]
    const withoutMargin = getHexagonTableFit(coords)
    const withMargin = getHexagonTableFit(coords, 0, 1)

    expect(withoutMargin).not.toBeNull()
    expect(withMargin).not.toBeNull()
    if (!withoutMargin || !withMargin) {
      throw new Error('Expected both margins to fit')
    }
    expect(withMargin.radius).toBe(withoutMargin.radius + 1)
    expect(centerFromFit(withMargin)).toEqual(centerFromFit(withoutMargin))
  })

  it('trims Mountains of Modi to its smallest, best-centered hexagon', () => {
    const result = trimAndNormalizeMap(
      modiFixture.hexMap,
      modiFixture.boardPieces,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)

    const footprints = getMapTableFootprintCoords(
      result.hexMap,
      result.boardPieces,
    )
    const radius = result.hexMap.length - 1
    const fit = getHexagonTableFit(footprints)
    if (!fit) throw new Error('Expected the trimmed footprint to fit')
    const extents = getExtents(footprints)
    const centerQ = radius % 2 === 0 ? radius / 2 : Math.floor(radius / 2 + 0.5)
    const centerR = radius

    expect(modiFixture.hexMap.length).toBe(13)
    expect(result.hexMap.length).toBe(10)
    expect(result.hexMap.width).toBe(10)
    expect(fit.radius).toBe(radius)
    expect(getHexagonTableFit(footprints, 0, 0, radius - 1)).toBeNull()
    // Not all six sides touch the rim; the chosen center has the minimum
    // possible three-axis slack score at this smallest radius.
    expect(centerScore(extents, centerQ, centerR, radius)).toBe(
      minimumCenterScore(extents, radius),
    )
  })
})
