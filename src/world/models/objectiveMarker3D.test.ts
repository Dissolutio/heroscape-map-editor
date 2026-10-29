import { describe, expect, it } from 'vitest'
import {
  getObjectiveMarkerFootprint,
  type ObjectiveMarker,
} from '../../data/objectiveMarkers'
import { makeTable, place } from '../../__tests__/helpers/board'
import {
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEXCAP_HEIGHT,
  HEXGRID_HEX_HEIGHT,
} from '../../utils/constants'
import { genBoardHexID, getBoardHex3DCoords } from '../../utils/map-utils'
import { Pieces } from '../../types'
import {
  getObjectiveMarker3DPosition,
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
      lengthScale: 1,
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
    expect(position?.lengthScale).toBe(Math.sqrt(3))
    expect(position?.radius).toBe(0.68)
    expect(position?.x).toBe((expected[0].x + expected[1].x) / 2)
    expect(position?.z).toBe((expected[0].z + expected[1].z) / 2)
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
