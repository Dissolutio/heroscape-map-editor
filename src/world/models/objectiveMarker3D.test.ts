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
    const points = getObjectiveMarkerOutlinePoints(2)
    const scale = DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS.hexScale
    const leftBridgeTop = points[2]
    const rightBridgeTop = points[3]

    expect(points).toHaveLength(16)
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
    expect(leftBridgeTop.x).toBeLessThan(0)
    expect(rightBridgeTop.x).toBeGreaterThan(0)
    expect(leftBridgeTop.z).toBeCloseTo(scale / 2)
    expect(rightBridgeTop.z).toBeCloseTo(scale / 2)
  })

  it('extends bridge overlap into both lobes without widening it', () => {
    const options = {
      ...DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS,
      bridgeWidthRatio: 0.5,
      bridgeOverlap: 0,
    }
    const noOverlap = getObjectiveMarkerOutlinePoints(2, options)
    const overlapping = getObjectiveMarkerOutlinePoints(2, {
      ...options,
      bridgeOverlap: 0.04,
    })
    const leftBridgeTop = overlapping[2]
    const rightBridgeTop = overlapping[3]
    const leftBridgeBottom = overlapping[11]
    const rightBridgeBottom = overlapping[10]

    expect(leftBridgeTop?.x).toBeCloseTo((noOverlap[2]?.x ?? 0) - 0.04)
    expect(rightBridgeTop?.x).toBeCloseTo((noOverlap[3]?.x ?? 0) + 0.04)
    expect(leftBridgeBottom?.x).toBeCloseTo((noOverlap[11]?.x ?? 0) - 0.04)
    expect(rightBridgeBottom?.x).toBeCloseTo((noOverlap[10]?.x ?? 0) + 0.04)
    expect(leftBridgeTop?.z).toBeCloseTo(noOverlap[2]?.z ?? 0)
    expect(rightBridgeTop?.z).toBeCloseTo(noOverlap[3]?.z ?? 0)
    expect(leftBridgeBottom?.z).toBeCloseTo(noOverlap[11]?.z ?? 0)
    expect(rightBridgeBottom?.z).toBeCloseTo(noOverlap[10]?.z ?? 0)
    expect(options.bridgeOverlap).toBe(0)
  })

  it('extends bridge overlap symmetrically without crossing endpoints', () => {
    const noOverlap = getObjectiveMarkerOutlinePoints(2, {
      ...DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS,
      bridgeOverlap: 0,
    })
    const points = getObjectiveMarkerOutlinePoints(2, {
      ...DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS,
      bridgeOverlap: 0.5,
    })

    expect(points[2]?.x).toBeLessThanOrEqual(points[3]?.x ?? Number.NEGATIVE_INFINITY)
    expect(points[2]?.x).toBeCloseTo((noOverlap[2]?.x ?? 0) - 0.5)
    expect(points[3]?.x).toBeCloseTo((noOverlap[3]?.x ?? 0) + 0.5)
  })

  it('keeps expanded two-hex selection outlines from crossing at the bridge', () => {
    const points = getObjectiveMarkerOutlinePoints(2, {
      ...DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS,
      hexScale: DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS.hexScale * 1.14,
    })

    expect(points[2]?.x).toBeLessThan(points[3]?.x ?? Number.NEGATIVE_INFINITY)
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
