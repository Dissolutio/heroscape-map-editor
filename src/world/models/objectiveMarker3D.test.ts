import { describe, expect, it } from 'vitest'
import { makeTable, place } from '../../__tests__/helpers/board'
import {
  type ObjectiveMarker,
  getObjectiveMarkerFootprint,
} from '../../data/objectiveMarkers'
import { Pieces } from '../../types'
import {
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEXCAP_HEIGHT,
  HEXGRID_HEX_HEIGHT,
} from '../../utils/constants'
import { genBoardHexID, getBoardHex3DCoords } from '../../utils/map-utils'
import {
  DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS,
  getObjectiveMarker3DPosition,
  getObjectiveMarker3DTextPosition,
  getObjectiveMarkerBridgeExtents,
  getObjectiveMarkerExportTextPosition,
  getObjectiveMarkerOutlinePoints,
  getObjectiveMarkerShapeOptions,
  getObjectiveMarkerTextFontSize,
  isObjectiveMarkerVisibleAtLevel,
} from './objectiveMarker3D'

const marker = (options: Partial<ObjectiveMarker> = {}): ObjectiveMarker => ({
  uid: 'test-marker',
  anchor: { q: 2, r: 2, s: -4, altitude: 0 },
  size: 1,
  rotation: 0,
  style: 'black',
  content: { kind: 'number', value: 1 },
  ...options,
})

function cross(
  a: { x: number; z: number },
  b: { x: number; z: number },
  c: { x: number; z: number },
) {
  return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)
}

function segmentsIntersect(
  a: { x: number; z: number },
  b: { x: number; z: number },
  c: { x: number; z: number },
  d: { x: number; z: number },
) {
  const epsilon = 1e-10
  const onSegment = (
    start: { x: number; z: number },
    end: { x: number; z: number },
    point: { x: number; z: number },
  ) =>
    point.x >= Math.min(start.x, end.x) - epsilon &&
    point.x <= Math.max(start.x, end.x) + epsilon &&
    point.z >= Math.min(start.z, end.z) - epsilon &&
    point.z <= Math.max(start.z, end.z) + epsilon
  const abC = cross(a, b, c)
  const abD = cross(a, b, d)
  const cdA = cross(c, d, a)
  const cdB = cross(c, d, b)

  if (
    ((abC > epsilon && abD < -epsilon) || (abC < -epsilon && abD > epsilon)) &&
    ((cdA > epsilon && cdB < -epsilon) || (cdA < -epsilon && cdB > epsilon))
  ) {
    return true
  }
  return (
    (Math.abs(abC) <= epsilon && onSegment(a, b, c)) ||
    (Math.abs(abD) <= epsilon && onSegment(a, b, d)) ||
    (Math.abs(cdA) <= epsilon && onSegment(c, d, a)) ||
    (Math.abs(cdB) <= epsilon && onSegment(c, d, b))
  )
}

function isSimplePolygon(points: { x: number; z: number }[]) {
  if (points.length < 3) return false
  for (let first = 0; first < points.length; first += 1) {
    const firstEnd = points[(first + 1) % points.length]
    const firstStart = points[first]
    if (!firstStart || !firstEnd) return false
    if (
      Math.abs(firstStart.x - firstEnd.x) < 1e-10 &&
      Math.abs(firstStart.z - firstEnd.z) < 1e-10
    ) {
      return false
    }
    const nextEnd = points[(first + 2) % points.length]
    if (!nextEnd) return false
    const outgoingX = firstEnd.x - firstStart.x
    const outgoingZ = firstEnd.z - firstStart.z
    const nextX = nextEnd.x - firstEnd.x
    const nextZ = nextEnd.z - firstEnd.z
    if (
      Math.abs(cross(firstStart, firstEnd, nextEnd)) < 1e-10 &&
      outgoingX * nextX + outgoingZ * nextZ < -1e-10
    ) {
      return false
    }

    for (let second = first + 1; second < points.length; second += 1) {
      const secondEnd = points[(second + 1) % points.length]
      const secondStart = points[second]
      if (!secondStart || !secondEnd) return false
      if (
        second === first ||
        second === first + 1 ||
        (first === 0 && second === points.length - 1)
      ) {
        continue
      }
      if (segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd)) {
        return false
      }
    }
  }
  return true
}

describe('objective marker 3D helpers', () => {
  it('positions a one-hex token just above its supported cap', () => {
    const board = makeTable(5)
    const target = marker()
    const position = getObjectiveMarker3DPosition(target, board.boardHexes)
    const highQualityPosition = getObjectiveMarker3DPosition(
      target,
      board.boardHexes,
      true,
    )
    const expected = getBoardHex3DCoords(target.anchor)

    expect(position).toMatchObject({
      x: expected.x,
      y: expected.y + HEXGRID_HEXCAP_HEIGHT / 2 + 0.012,
      z: expected.z,
      rotationY: 0,
    })
    expect(highQualityPosition?.y).toBe(
      expected.y - HEXGRID_HEXCAP_HEIGHT / 2 + 0.012,
    )
  })

  it('centers a two-hex token and rotates it in six 60-degree steps', () => {
    const board = makeTable(5)
    const target = marker({
      size: 2,
      rotation: 2,
    })
    const footprint = getObjectiveMarkerFootprint(target)
    const expected = footprint.map(getBoardHex3DCoords)
    const position = getObjectiveMarker3DPosition(target, board.boardHexes)

    expect(footprint).toHaveLength(2)
    for (let rotation = 0; rotation < 6; rotation += 1) {
      const rotated = getObjectiveMarker3DPosition(
        marker({
          size: 2,
          rotation: rotation as ObjectiveMarker['rotation'],
        }),
        board.boardHexes,
      )
      expect(rotated?.rotationY).toBe(
        rotation === 0 ? 0 : (-rotation * Math.PI) / 3,
      )
    }
    expect(position?.x).toBe((expected[0].x + expected[1].x) / 2)
    expect(position?.z).toBe((expected[0].z + expected[1].z) / 2)
  })

  it('centers 3D text at the rotated two-hex midpoint', () => {
    const board = makeTable(5)
    const target = marker({
      size: 2,
      rotation: 4,
    })
    const position = getObjectiveMarker3DPosition(target, board.boardHexes)
    if (!position) throw new Error('Expected a supported marker')
    const textPosition = getObjectiveMarker3DTextPosition(target, position)

    expect(textPosition).toEqual({ x: 0, z: 0 })
    expect(position.rotationY).toBe((-target.rotation * Math.PI) / 3)
  })

  it('preserves anchor-relative export text positioning separately from 3D', () => {
    const board = makeTable(5)
    const target = marker({ size: 2, rotation: 4 })
    const position = getObjectiveMarker3DPosition(target, board.boardHexes)
    if (!position) throw new Error('Expected a supported marker')
    const textPosition = getObjectiveMarkerExportTextPosition(target, position)
    const cos = Math.cos(position.rotationY)
    const sin = Math.sin(position.rotationY)
    const worldX = position.x + cos * textPosition.x + sin * textPosition.z
    const worldZ = position.z - sin * textPosition.x + cos * textPosition.z
    const anchor = getBoardHex3DCoords(target.anchor)

    expect(textPosition.x).not.toBe(0)
    expect(worldX).toBeCloseTo(anchor.x)
    expect(worldZ).toBeCloseTo(anchor.z)
  })

  it('builds a symmetric plain regular hex outline for one-hex markers', () => {
    const points = getObjectiveMarkerOutlinePoints(1)
    const scale = 0.76

    expect(points).toHaveLength(6)
    for (const { x, z } of points) {
      expect(Math.hypot(x, z)).toBeCloseTo(scale)
    }
    for (const point of points) {
      expect(
        points.some(
          (other) =>
            Math.abs(other.x + point.x) < 1e-10 &&
            Math.abs(other.z - point.z) < 1e-10,
        ),
      ).toBe(true)
      expect(
        points.some(
          (other) =>
            Math.abs(other.x - point.x) < 1e-10 &&
            Math.abs(other.z + point.z) < 1e-10,
        ),
      ).toBe(true)
    }
  })

  it('builds a symmetric two-hex outline whose bridge covers the cell gap', () => {
    const defaultPoints = getObjectiveMarkerOutlinePoints(2)
    const options = {
      ...DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS,
      bridgeWidthRatio: 0.5,
    }
    const points = getObjectiveMarkerOutlinePoints(2, options)
    const scale = DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS.hexScale
    const extents = getObjectiveMarkerBridgeExtents(options)
    const bridgeTopPoints = points.filter(
      (point) => Math.abs(point.z - extents.halfWidth) < 1e-10,
    )
    const leftBridgeTop = bridgeTopPoints[0]
    const rightBridgeTop = bridgeTopPoints[1]

    expect(defaultPoints).toHaveLength(12)
    expect(isSimplePolygon(defaultPoints)).toBe(true)
    expect(points).toHaveLength(16)
    expect(isSimplePolygon(points)).toBe(true)
    for (const point of points) {
      expect(
        points.some(
          (other) =>
            Math.abs(other.x + point.x) < 1e-10 &&
            Math.abs(other.z - point.z) < 1e-10,
        ),
      ).toBe(true)
      expect(
        points.some(
          (other) =>
            Math.abs(other.x - point.x) < 1e-10 &&
            Math.abs(other.z + point.z) < 1e-10,
        ),
      ).toBe(true)
    }
    if (!leftBridgeTop || !rightBridgeTop) {
      throw new Error('Expected bridge outline points')
    }
    expect(leftBridgeTop.x).toBeCloseTo(extents.leftHexInnerX)
    expect(rightBridgeTop.x).toBeCloseTo(extents.rightHexInnerX)
    expect(leftBridgeTop.x).toBeLessThan(0)
    expect(rightBridgeTop.x).toBeGreaterThan(0)
    expect(leftBridgeTop.z).toBeCloseTo(scale / 4)
    expect(rightBridgeTop.z).toBeCloseTo(scale / 4)
  })

  it('extends bridge overlap into both lobes without changing the union contour', () => {
    const options = {
      ...DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS,
      bridgeWidthRatio: 0.5,
      bridgeOverlap: 0,
    }
    const withOverlapOptions = {
      ...options,
      bridgeOverlap: 0.04,
    }
    const noOverlapExtents = getObjectiveMarkerBridgeExtents(options)
    const overlapExtents = getObjectiveMarkerBridgeExtents(withOverlapOptions)
    const noOverlapContour = getObjectiveMarkerOutlinePoints(2, options)
    const overlapContour = getObjectiveMarkerOutlinePoints(
      2,
      withOverlapOptions,
    )

    expect(overlapExtents.bridgeLeftX).toBeCloseTo(
      overlapExtents.leftHexInnerX - 0.04,
    )
    expect(overlapExtents.bridgeRightX).toBeCloseTo(
      overlapExtents.rightHexInnerX + 0.04,
    )
    expect(overlapExtents.bridgeLeftX).toBeLessThan(
      overlapExtents.leftHexInnerX,
    )
    expect(overlapExtents.bridgeRightX).toBeGreaterThan(
      overlapExtents.rightHexInnerX,
    )
    expect(overlapExtents.halfWidth).toBeCloseTo(noOverlapExtents.halfWidth)
    expect(overlapContour).toEqual(noOverlapContour)
    expect(isSimplePolygon(overlapContour)).toBe(true)
    expect(options.bridgeOverlap).toBe(0)
  })

  it('keeps a symmetric simple contour for expanded two-hex selection outlines', () => {
    const points = getObjectiveMarkerOutlinePoints(2, {
      ...DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS,
      hexScale: DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS.hexScale * 1.14,
      bridgeWidthRatio: 0.5,
    })

    expect(isSimplePolygon(points)).toBe(true)
    for (const point of points) {
      expect(
        points.some(
          (other) =>
            Math.abs(other.x + point.x) < 1e-10 &&
            Math.abs(other.z - point.z) < 1e-10,
        ),
      ).toBe(true)
      expect(
        points.some(
          (other) =>
            Math.abs(other.x - point.x) < 1e-10 &&
            Math.abs(other.z + point.z) < 1e-10,
        ),
      ).toBe(true)
    }
  })

  it('reads development startup shape dials while retaining their defaults', () => {
    expect(
      getObjectiveMarkerShapeOptions('?markerBridge=1&markerHexScale=0.92'),
    ).toEqual(DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS)
    expect(
      getObjectiveMarkerShapeOptions(
        '?markerBridge=0.8&markerHexScale=1.1&markerBridgeOverlap=0.12',
      ),
    ).toEqual({
      hexScale: 1.1,
      bridgeWidthRatio: 0.8,
      bridgeOverlap: 0.12,
    })
  })

  it('sits above a fluid cap at its physical surface height', () => {
    const table = makeTable(5)
    const target = marker({ anchor: { ...marker().anchor, altitude: 0 } })
    const water = place({
      board: table,
      pieceID: Pieces.water1,
      at: target.anchor,
      altitude: 0,
    })
    const surface = { ...target.anchor, altitude: 1 }
    const position = getObjectiveMarker3DPosition(
      { ...target, anchor: surface },
      water.board.boardHexes,
    )
    const hex = getBoardHex3DCoords(surface)

    expect(position?.y).toBe(
      hex.y -
        (HEXGRID_HEX_HEIGHT - HEXGRID_HEX_HEIGHT * HEXGRID_HEXCAP_FLUID_SCALE) +
        0.0015 +
        0.012,
    )
  })

  it('does not render a marker without a supported cap across its footprint', () => {
    const board = makeTable(5)
    const target = marker({ size: 2 })
    const unsupportedHex = getObjectiveMarkerFootprint(target)[1]
    if (!unsupportedHex) throw new Error('Expected a two-hex footprint')
    const supportID = genBoardHexID(unsupportedHex)
    const unsupportedBoard = {
      ...board.boardHexes,
      [supportID]: { ...board.boardHexes[supportID], isCap: false },
    }

    expect(getObjectiveMarker3DPosition(target, unsupportedBoard)).toBeNull()
  })

  it('fits up to three characters and filters above the viewing level', () => {
    const one = marker()
    const three = marker({ content: { kind: 'text', value: 'ABC' } })
    const twoHex = marker({ size: 2, content: { kind: 'text', value: 'ABC' } })

    expect(getObjectiveMarkerTextFontSize(one)).toBe(0.42)
    expect(getObjectiveMarkerTextFontSize(three)).toBeLessThan(
      getObjectiveMarkerTextFontSize(one),
    )
    expect(getObjectiveMarkerTextFontSize(twoHex)).toBeGreaterThan(
      getObjectiveMarkerTextFontSize(three),
    )
    expect(isObjectiveMarkerVisibleAtLevel(one, 0)).toBe(true)
    expect(
      isObjectiveMarkerVisibleAtLevel(
        marker({ anchor: { ...one.anchor, altitude: 1 } }),
        0,
      ),
    ).toBe(false)
  })
})
