import { describe, expect, it } from 'vitest'
import { Pieces } from '../types'
import { getSeatedObstacleDefinition } from './seatedObstacles'

describe('seated obstacle definitions', () => {
  it('uses the listed default base and footprint for each obstacle', () => {
    const expected = [
      [Pieces.hive, Pieces.swampWater6, 'six-hex', 'built-in'],
      [Pieces.marvel, Pieces.concrete6, 'six-hex', 'separate'],
      [Pieces.marvelBroken, Pieces.concrete6, 'six-hex', 'separate'],
      [Pieces.marvelNoUpper, Pieces.concrete6, 'six-hex', 'separate'],
      [Pieces.marvelNoUpperBroken, Pieces.concrete6, 'six-hex', 'separate'],
      [Pieces.glacier1, Pieces.ice1, 'same-size', 'built-in'],
      [Pieces.glacier3, Pieces.ice3, 'same-size', 'built-in'],
      [Pieces.glacier4, Pieces.ice4, 'same-size', 'built-in'],
      [Pieces.glacier6, Pieces.ice6, 'six-hex', 'built-in'],
      [Pieces.outcrop1, Pieces.shadow1, 'one-per-hex', 'built-in'],
      [Pieces.lavaRockOutcrop1, Pieces.lava1, 'one-per-hex', 'built-in'],
      [Pieces.lavaRockOutcrop3, Pieces.lava1, 'one-per-hex', 'built-in'],
      [Pieces.toxicOutcrop1, Pieces.toxicWater1, 'one-per-hex', 'built-in'],
      [Pieces.toxicOutcrop3, Pieces.toxicWater1, 'one-per-hex', 'built-in'],
    ] as const

    for (const [pieceID, defaultBaseID, baseFootprint, baseMode] of expected) {
      expect(getSeatedObstacleDefinition(pieceID)).toMatchObject({
        baseMode,
        defaultBaseID,
        baseFootprint,
      })
    }
  })

  it('uses classic Rock Outcrop 3 bases only on classic-only maps', () => {
    expect(getSeatedObstacleDefinition(Pieces.outcrop3, ['S'])).toMatchObject({
      baseMode: 'built-in',
      allowedBaseIDs: [Pieces.shadow3],
      defaultBaseID: Pieces.shadow3,
      baseFootprint: 'same-size',
    })
    for (const setsUsed of [[], ['C'], ['S', 'C']]) {
      expect(
        getSeatedObstacleDefinition(Pieces.outcrop3, setsUsed),
      ).toMatchObject({
        baseMode: 'built-in',
        allowedBaseIDs: [Pieces.shadow1, Pieces.lava1, Pieces.toxicWater1],
        defaultBaseID: Pieces.shadow1,
        baseFootprint: 'one-per-hex',
      })
    }
  })

  it('ignores community sets when determining the map era', () => {
    expect(
      getSeatedObstacleDefinition(Pieces.outcrop3, ['S', 'FF']),
    ).toMatchObject({
      defaultBaseID: Pieces.shadow3,
      baseFootprint: 'same-size',
    })
    expect(
      getSeatedObstacleDefinition(Pieces.outcrop3, ['C', 'FF']),
    ).toMatchObject({
      defaultBaseID: Pieces.shadow1,
      baseFootprint: 'one-per-hex',
    })
    expect(getSeatedObstacleDefinition(Pieces.outcrop3, ['FF'])).toMatchObject({
      defaultBaseID: Pieces.shadow1,
      baseFootprint: 'one-per-hex',
    })
  })

  it('allows contemporary bases beneath any contemporary outcrop', () => {
    for (const pieceID of [
      Pieces.outcrop1,
      Pieces.lavaRockOutcrop1,
      Pieces.lavaRockOutcrop3,
      Pieces.toxicOutcrop1,
      Pieces.toxicOutcrop3,
    ]) {
      expect(getSeatedObstacleDefinition(pieceID)?.allowedBaseIDs).toEqual([
        Pieces.shadow1,
        Pieces.lava1,
        Pieces.toxicWater1,
      ])
    }
  })
})
