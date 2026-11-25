import { describe, expect, it } from 'vitest'
import { Pieces } from '../types'
import { getSeatedObstacleDefinition } from './seatedObstacles'

describe('seated obstacle definitions', () => {
  it('uses the listed default base and footprint for each obstacle', () => {
    const expected = [
      [Pieces.hive, Pieces.swampWater6, 'six-hex'],
      [Pieces.marvel, Pieces.concrete6, 'six-hex'],
      [Pieces.marvelBroken, Pieces.concrete6, 'six-hex'],
      [Pieces.marvelNoUpper, Pieces.concrete6, 'six-hex'],
      [Pieces.marvelNoUpperBroken, Pieces.concrete6, 'six-hex'],
      [Pieces.glacier1, Pieces.ice1, 'same-size'],
      [Pieces.glacier3, Pieces.ice3, 'same-size'],
      [Pieces.glacier4, Pieces.ice4, 'same-size'],
      [Pieces.glacier6, Pieces.ice6, 'six-hex'],
      [Pieces.outcrop1, Pieces.shadow1, 'one-per-hex'],
      [Pieces.lavaRockOutcrop1, Pieces.lava1, 'one-per-hex'],
      [Pieces.lavaRockOutcrop3, Pieces.lava1, 'one-per-hex'],
      [Pieces.toxicOutcrop1, Pieces.toxicWater1, 'one-per-hex'],
      [Pieces.toxicOutcrop3, Pieces.toxicWater1, 'one-per-hex'],
    ] as const

    for (const [pieceID, defaultBaseID, baseFootprint] of expected) {
      expect(getSeatedObstacleDefinition(pieceID)).toMatchObject({
        defaultBaseID,
        baseFootprint,
      })
    }
  })

  it('uses classic Rock Outcrop 3 bases only on classic-only maps', () => {
    expect(getSeatedObstacleDefinition(Pieces.outcrop3, ['S'])).toMatchObject({
      allowedBaseIDs: [Pieces.shadow3],
      defaultBaseID: Pieces.shadow3,
      baseFootprint: 'same-size',
    })
    for (const setsUsed of [[], ['C'], ['S', 'C']]) {
      expect(
        getSeatedObstacleDefinition(Pieces.outcrop3, setsUsed),
      ).toMatchObject({
        allowedBaseIDs: [Pieces.shadow1, Pieces.lava1, Pieces.toxicWater1],
        defaultBaseID: Pieces.shadow1,
        baseFootprint: 'one-per-hex',
      })
    }
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
