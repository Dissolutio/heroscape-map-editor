import { describe, expect, it } from 'vitest'
import { terrainSetsByShortID } from '../data/terrainSets'
import { type BoardPiece, Pieces } from '../types'
import {
  DEFAULT_VISIBLE_OPTION_COUNT,
  EXCLUDED_SET_IDS,
  JUNGLE_PIECE_EQUIVALENTS,
  formatSetKindTotals,
  getPiecesMissingFromCollection,
  getSetsToBuildMapCatalog,
} from '../utils/setsToBuildMap'

const pieces = (...inventoryIDs: string[]): BoardPiece[] =>
  inventoryIDs.map((inventoryID, index) => ({
    uid: `piece-${index}`,
    inventoryID,
    altitude: 0,
    rotation: 0,
    pieceCoords: { q: index, r: 0, s: -index },
  }))

const category = (
  mapPieces: BoardPiece[],
  id: 'contemporary' | 'classic' | 'mixed',
) =>
  getSetsToBuildMapCatalog(mapPieces).categories.find((item) => item.id === id)

describe('sets to build this map', () => {
  it('assigns a kind to every terrain set', () => {
    const kinds = Object.fromEntries(
      Object.values(terrainSetsByShortID).map((set) => [set.id, set.kind]),
    )

    expect(kinds).toEqual(
      expect.objectContaining({
        C: 'masterSet',
        S: 'masterSet',
        T: 'masterSet',
        U: 'masterSet',
        EE: 'promo',
      }),
    )
    expect(
      Object.values(kinds).every((kind) =>
        ['masterSet', 'expansion', 'promo'].includes(kind),
      ),
    ).toBe(true)
  })

  it('formats option totals by kind in the required order', () => {
    expect(
      formatSetKindTotals([
        { kind: 'expansion', count: 3 },
        { kind: 'promo', count: 1 },
        { kind: 'masterSet', count: 1 },
      ]),
    ).toBe('1 Master Set, 3 Expansions, 1 Promo')
  })

  it('excludes MSTK, TOTK, and TOTK2 from every catalog option', () => {
    const result = getSetsToBuildMapCatalog(
      pieces(Pieces.grass1, Pieces.shipBow, Pieces.castleBaseCorner),
    )
    const ids = result.categories.flatMap((item) =>
      item.options.flatMap((option) => option.sets.map((set) => set.setID)),
    )

    expect(EXCLUDED_SET_IDS).toEqual(['A', 'B', 'DD'])
    expect(ids).not.toContain('A')
    expect(ids).not.toContain('B')
    expect(ids).not.toContain('DD')
  })

  it('reports the Classic blocker for Contemporary-only Laur walls', () => {
    const result = getSetsToBuildMapCatalog(pieces(Pieces.laurWallShort))
    const classic = result.categories.find((item) => item.id === 'classic')

    expect(result.categories.map((item) => item.id)).toEqual([
      'contemporary',
      'classic',
    ])
    expect(classic?.reason).toContain('Laur Wall')
    expect(classic?.reason).toContain('no Classic set has')
    expect(result.categories.some((item) => item.id === 'mixed')).toBe(false)
  })

  it('reports the Contemporary blocker for Classic-only Marvel ruins', () => {
    const result = getSetsToBuildMapCatalog(pieces(Pieces.marvel))
    const contemporary = result.categories.find(
      (item) => item.id === 'contemporary',
    )

    expect(result.categories.map((item) => item.id)).toEqual([
      'contemporary',
      'classic',
    ])
    expect(contemporary?.reason).toContain('Warehouse Ruin')
    expect(contemporary?.reason).toContain('no Contemporary set has')
  })

  it('uses Mixed alone when Laur walls and Marvel ruins both block pure catalogs', () => {
    const result = getSetsToBuildMapCatalog(
      pieces(Pieces.laurWallShort, Pieces.marvel),
    )

    expect(result.categories.map((item) => item.id)).toEqual([
      'mixed',
      'contemporary',
      'classic',
    ])
    expect(
      result.categories[0]?.options[0]?.sets.map((set) => set.setID),
    ).toEqual(expect.arrayContaining(['O']))
    expect(result.categories[1]?.reason).toContain('Warehouse Ruin')
    expect(result.categories[1]?.reason).toContain('no Contemporary set has')
    expect(result.categories[2]?.reason).toContain('Laur Wall')
    expect(result.categories[2]?.reason).toContain('no Classic set has')
  })

  it('maps Ticalla palms to GaLE in Contemporary recommendations', () => {
    const result = category(pieces(Pieces.palm14), 'contemporary')

    expect(result?.options[0]?.sets.map((set) => set.setID)).toContain('L')
  })

  it('maps GaLE palms to Ticalla Jungle in Classic recommendations', () => {
    const result = category(pieces(Pieces.laurPalm13), 'classic')

    expect(result?.options[0]?.sets.map((set) => set.setID)).toContain('M')
  })

  it('omits Mixed options that only add boxes to a valid pure option', () => {
    const result = getSetsToBuildMapCatalog(pieces(Pieces.grass1))
    const mixed = result.categories.find((item) => item.id === 'mixed')

    expect(result.categories.map((item) => item.id)).toEqual([
      'contemporary',
      'classic',
      'mixed',
    ])
    expect(mixed?.options).toEqual([])
    expect(mixed?.reason).toContain('do not offer a better combination')
  })

  it('exports the complete one-to-one jungle interchange table', () => {
    expect(JUNGLE_PIECE_EQUIVALENTS).toEqual([
      { laur: Pieces.laurPalm13, ticalla: Pieces.palm14 },
      { laur: Pieces.laurPalm14, ticalla: Pieces.palm15 },
      { laur: Pieces.laurPalm15, ticalla: Pieces.palm16 },
      { laur: Pieces.laurBrush10, ticalla: Pieces.brush9 },
    ])
  })

  it('canonicalizes Mixed jungle options to GaLE without duplicate distributions', () => {
    const result = getSetsToBuildMapCatalog(
      pieces(Pieces.laurWallShort, Pieces.laurPalm13, Pieces.marvel),
    )
    const mixed = result.categories.find((item) => item.id === 'mixed')
    const signatures = mixed?.options.map((option) =>
      option.sets
        .filter((set) => set.setID !== 'L')
        .map((set) => `${set.setID}:${set.count}`)
        .join(','),
    )

    expect(
      mixed?.options.every((option) =>
        option.sets.every((set) => set.setID !== 'M'),
      ),
    ).toBe(true)
    expect(new Set(signatures).size).toBe(signatures?.length)
  })

  it('returns only irreducible Mixed options within the box and count ceilings', () => {
    const mapPieces = pieces(Pieces.shipBow, Pieces.castleBaseCorner)
    const options = category(mapPieces, 'mixed')?.options ?? []
    const minimum = Math.min(...options.map((option) => option.boxCount))

    expect(options.length).toBeLessThanOrEqual(20)
    expect(DEFAULT_VISIBLE_OPTION_COUNT).toBe(6)
    expect(options.every((option) => option.boxCount <= minimum + 2)).toBe(true)

    const sets = options.map((option) =>
      option.sets.reduce<Record<string, number>>((counts, set) => {
        counts[set.setID] = set.count
        return counts
      }, {}),
    )
    for (const [index, option] of sets.entries()) {
      for (const other of sets.slice(index + 1)) {
        const optionContainsOther = Object.entries(other).every(
          ([id, count]) => (option[id] ?? 0) >= count,
        )
        const otherContainsOption = Object.entries(option).every(
          ([id, count]) => (other[id] ?? 0) >= count,
        )
        expect(optionContainsOther).toBe(false)
        expect(otherContainsOption).toBe(false)
      }
    }

    for (const option of options) {
      for (const set of option.sets) {
        const remaining = option.sets.map((item) => ({
          id: item.setID,
          count: item.count - (item.setID === set.setID ? 1 : 0),
        }))
        const stillBuildable = [Pieces.shipBow, Pieces.castleBaseCorner].every(
          (pieceID) =>
            remaining.reduce((total, item) => {
              const inventory =
                terrainSetsByShortID[
                  item.id as keyof typeof terrainSetsByShortID
                ]?.inventory
              return total + item.count * (inventory?.[pieceID] ?? 0)
            }, 0) > 0,
        )
        expect(stillBuildable).toBe(false)
      }
    }
  })

  it('keeps unlisted and ignored pieces separate from catalog feasibility', () => {
    const result = getSetsToBuildMapCatalog(
      pieces('custom-piece', Pieces.generic1, Pieces.startZone1),
    )

    expect(result.notInAnySet).toEqual([
      { inventoryID: 'custom-piece', title: 'custom-piece', count: 1 },
    ])
    expect(result.categories.every((item) => item.options.length > 0)).toBe(
      true,
    )
    expect(result.ignored.map((item) => item.inventoryID)).toEqual([
      Pieces.generic1,
      Pieces.startZone1,
    ])
  })

  it('does not mark a finished search with no Mixed options as approximate', () => {
    const result = getSetsToBuildMapCatalog(pieces(Pieces.grass1))
    const mixed = result.categories.find((item) => item.id === 'mixed')

    expect(mixed?.options).toEqual([])
    expect(result.categories.every((item) => !item.approximate)).toBe(true)
    expect(mixed?.reason).not.toContain('Approximate')
  })

  it('reports approximate options promptly when the time budget is zero', () => {
    const startedAt = performance.now()
    const result = getSetsToBuildMapCatalog(
      pieces(...Array(5_000).fill(Pieces.grass1)),
      0,
    )

    expect(performance.now() - startedAt).toBeLessThan(500)
    expect(result.categories.some((item) => item.approximate)).toBe(true)
  })

  it('reports pieces missing from a personal collection', () => {
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

  it('covers Ticalla palms with matching Laur jungle trees', () => {
    expect(
      getPiecesMissingFromCollection(
        pieces(Pieces.palm14, Pieces.palm15, Pieces.palm16),
        {
          [Pieces.laurPalm13]: 1,
          [Pieces.laurPalm14]: 1,
          [Pieces.laurPalm15]: 1,
        },
      ),
    ).toEqual([])
  })

  it('names the map jungle piece and offers its interchangeable equivalent', () => {
    const missing = getPiecesMissingFromCollection(
      pieces(Pieces.palm14, Pieces.palm14, Pieces.palm14),
      { [Pieces.laurPalm13]: 2 },
    )

    expect(missing).toHaveLength(1)
    expect(missing[0]).toMatchObject({
      inventoryID: Pieces.palm14,
      count: 1,
    })
    expect(missing[0]?.title).toContain('(or the Laur equivalent)')
  })
})
