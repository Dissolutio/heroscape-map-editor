import { describe, expect, it } from 'vitest'
import { Pieces, type BoardPiece } from '../types'
import {
  getPiecesMissingFromCollection,
  getSetsToBuildMap,
} from '../utils/setsToBuildMap'

const pieces = (...inventoryIDs: string[]): BoardPiece[] =>
  inventoryIDs.map((inventoryID, index) => ({
    uid: `piece-${index}`,
    inventoryID,
    altitude: 0,
    rotation: 0,
    pieceCoords: { q: index, r: 0, s: -index },
  }))

describe('sets needed to build a map', () => {
  it('returns the one set containing a unique piece', () => {
    expect(getSetsToBuildMap(pieces(Pieces.shipBow)).sets).toEqual([
      {
        setID: 'X',
        name: 'Shores of Valhlla',
        abbreviation: 'ShoV',
        count: 1,
      },
    ])
  })

  it('counts multiple copies of a set when its inventory is exceeded', () => {
    const mapPieces = pieces(...Array(11).fill(Pieces.castleBaseCorner))
    expect(getSetsToBuildMap(mapPieces).sets).toEqual([
      {
        setID: 'N',
        name: 'Fortress of the Archkyrie',
        abbreviation: 'FotA',
        count: 2,
      },
    ])
  })

  it('selects both sets when their inventories cover different pieces', () => {
    expect(
      getSetsToBuildMap(pieces(Pieces.castleBaseCorner, Pieces.shipBow)).sets,
    ).toMatchObject([
      { setID: 'N', count: 1 },
      { setID: 'X', count: 1 },
    ])
  })

  it('lists pieces that are not in any set', () => {
    expect(getSetsToBuildMap(pieces('custom-piece')).notInAnySet).toEqual([
      { inventoryID: 'custom-piece', title: 'custom-piece', count: 1 },
    ])
  })

  it('reports Generic pieces and start zones separately from set demand', () => {
    const result = getSetsToBuildMap(
      pieces(Pieces.generic1, Pieces.startZone1, Pieces.shipBow),
    )

    expect(result.sets.map(({ setID }) => setID)).toEqual(['X'])
    expect(result.ignored).toEqual([
      { inventoryID: Pieces.generic1, title: 'Generic 1-hex', count: 1 },
      {
        inventoryID: Pieces.startZone1,
        title: 'Start Zone: Player 1',
        count: 1,
      },
    ])
  })

  it('matches the greedy fallback on a small map', () => {
    const mapPieces = pieces(Pieces.shipBow)
    const exact = getSetsToBuildMap(mapPieces)
    const greedy = getSetsToBuildMap(mapPieces, 0)

    expect(exact.approximate).toBe(false)
    expect(greedy.approximate).toBe(true)
    expect(greedy.sets).toEqual(exact.sets)
  })

  it('breaks equal-size ties by preferring lower set IDs', () => {
    const first = getSetsToBuildMap(pieces(Pieces.grass1))
    const second = getSetsToBuildMap(pieces(Pieces.grass1))

    expect(first.sets.map(({ setID }) => setID)).toEqual(['A'])
    expect(second.sets).toEqual(first.sets)
  })

  it('reports only pieces missing from a personal collection', () => {
    expect(
      getPiecesMissingFromCollection(
        pieces(Pieces.shipBow, Pieces.castleBaseCorner),
        { [Pieces.shipBow]: 1 },
      ),
    ).toEqual([
      {
        inventoryID: Pieces.castleBaseCorner,
        title: 'Fortress Wall Base (Corner)',
        count: 1,
      },
    ])
  })

  it('keeps large maps within the set-copy budget using the greedy fallback', () => {
    const mapPieces = pieces(...Array(30_000).fill(Pieces.castleBaseCorner))
    const startedAt = performance.now()
    const result = getSetsToBuildMap(mapPieces)

    expect(performance.now() - startedAt).toBeLessThan(500)
    expect(result.approximate).toBe(true)
    expect(result.sets).toMatchObject([{ setID: 'N', count: 3_000 }])
  })
})
