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

    expect(result.categories.map((item) => item.id)).toEqual(['contemporary'])
    expect(result.reasons.join(' ')).toContain('Classic')
    expect(result.reasons.join(' ')).toContain('Laur Wall')
    expect(result.reasons.join(' ')).toContain('no Classic set has')
  })

  it('reports the Contemporary blocker for Classic-only Marvel ruins', () => {
    const result = getSetsToBuildMapCatalog(pieces(Pieces.marvel))

    expect(result.categories.map((item) => item.id)).toEqual(['classic'])
    expect(result.reasons.join(' ')).toContain('Contemporary')
    expect(result.reasons.join(' ')).toContain('Warehouse Ruin')
    expect(result.reasons.join(' ')).toContain('no Contemporary set has')
  })

  it('uses Mixed alone when Laur walls and Marvel ruins both block pure catalogs', () => {
    const result = getSetsToBuildMapCatalog(
      pieces(Pieces.laurWallShort, Pieces.marvel),
    )

    expect(result.categories.map((item) => item.id)).toEqual(['mixed'])
    expect(
      result.categories[0]?.options[0]?.sets.map((set) => set.setID),
    ).toEqual(expect.arrayContaining(['O']))
    expect(result.reasons.join(' ')).toContain('Laur Wall')
    expect(result.reasons.join(' ')).toContain('Warehouse Ruin')
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

    expect(result.categories.map((item) => item.id)).toEqual([
      'contemporary',
      'classic',
    ])
    expect(result.reasons.join(' ')).toContain(
      'do not offer a better combination',
    )
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

  it('does not mark a finished search with no Mixed option as approximate', () => {
    const result = getSetsToBuildMapCatalog(pieces(Pieces.grass1))

    expect(result.categories.some((item) => item.id === 'mixed')).toBe(false)
    expect(result.categories.every((item) => !item.approximate)).toBe(true)
    expect(result.reasons.join(' ')).not.toContain('Approximate')
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
})
