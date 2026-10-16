/**
 * INVENTORY AND TERRAIN CONSTRAINTS
 *
 * A map can be limited to what a person actually owns: the boxed sets they
 * picked, their personal inventory, or an inventory file they loaded. These
 * functions turn any of those into one "what can I still place" inventory.
 * This is the foundation for the TODO items "display inventory in the pen mode
 * selector", "convert this map to fit my inventory" and "which sets could build
 * this map".
 */
import { describe, expect, it } from 'vitest'
import { terrainSetsByShortID } from '../data/terrainSets'
import { blankPieceInventory } from '../inventory/blankInventory'
import {
  normalizePieceInventory,
  parsePieceInventoryRows,
} from '../utils/piece-inventory'
import {
  getAvailableLandPrefixesForInventory,
  getConstrainedLandInventoryByTerrainAndSizeFromInventory,
  getEffectiveTerrainConstraintInventory,
  getSetConstrainedInventory,
  hasActiveTerrainConstraints,
} from '../utils/terrain-constraints'

describe('normalizePieceInventory', () => {
  it('returns a full inventory: every known piece present, defaulting to 0', () => {
    const result = normalizePieceInventory(undefined)
    expect(Object.keys(result).sort()).toEqual(
      Object.keys(blankPieceInventory).sort(),
    )
    expect(Object.values(result).every((n) => n === 0)).toBe(true)
  })

  it('clamps negatives to 0, floors fractions, zeroes NaN, and drops unknown pieces', () => {
    const result = normalizePieceInventory({
      g1: -3,
      g2: 2.9,
      g3: Number.NaN,
      'not-a-piece': 5,
    })
    expect(result).toMatchObject({ g1: 0, g2: 2, g3: 0 })
    expect(result).not.toHaveProperty('not-a-piece')
  })
})

describe('parsePieceInventoryRows (CSV/TSV rows from a loaded inventory file)', () => {
  it('accepts the common header spellings for the id and count columns', () => {
    const { inventory, importedRows } = parsePieceInventoryRows([
      { ID: 'g1', Count: '4' },
      { id: 'g2', qty: '3' },
      { 'Piece ID': 'g3', Quantity: '2' },
      { PieceID: 'g7', count: '1' },
    ])
    expect(importedRows).toBe(4)
    expect(inventory).toMatchObject({ g1: 4, g2: 3, g3: 2, g7: 1 })
  })

  it('skips rows for pieces it does not know, and reads bad counts as 0', () => {
    const { inventory, importedRows } = parsePieceInventoryRows([
      { ID: 'not-a-piece', Count: '9' },
      { ID: 'g1', Count: 'lots' },
      { ID: '', Count: '2' },
    ])
    expect(importedRows).toBe(1) // only g1 counted as a row
    expect(inventory.g1).toBe(0)
  })
})

describe('set-based constraints', () => {
  const [setID] = Object.keys(terrainSetsByShortID)
  const setInventory = terrainSetsByShortID[
    setID as keyof typeof terrainSetsByShortID
  ].inventory as Record<string, number>
  const [pieceInSet, perSet] =
    Object.entries(setInventory).find(([, n]) => n > 0) ?? []

  it('two copies of a set doubles its pieces; unknown set ids are ignored', () => {
    expect(pieceInSet).toBeDefined()
    const single = getSetConstrainedInventory([setID])
    const double = getSetConstrainedInventory([setID, setID, 'not-a-set'])
    expect(single[pieceInSet as string]).toBe(perSet)
    expect(double[pieceInSet as string]).toBe((perSet as number) * 2)
  })

  it('"none" (or no source) means no constraint at all', () => {
    expect(getEffectiveTerrainConstraintInventory({})).toEqual({})
    expect(
      getEffectiveTerrainConstraintInventory({
        terrainConstraintSource: 'none',
        setsUsed: [setID],
      }),
    ).toEqual({})
    expect(
      hasActiveTerrainConstraints({ terrainConstraintSource: 'none' }),
    ).toBe(false)
  })

  it('"setsUsed" is only active once at least one set is chosen', () => {
    expect(
      hasActiveTerrainConstraints({
        terrainConstraintSource: 'setsUsed',
        setsUsed: [],
      }),
    ).toBe(false)
    expect(
      hasActiveTerrainConstraints({
        terrainConstraintSource: 'setsUsed',
        setsUsed: [setID],
      }),
    ).toBe(true)
  })

  it('personal inventory and file inventory are normalized to full inventories', () => {
    const personal = getEffectiveTerrainConstraintInventory({
      terrainConstraintSource: 'personalInventory',
      userPieceInventory: { g1: 2 },
    })
    expect(personal.g1).toBe(2)
    expect(personal.g2).toBe(0)
    const fromFile = getEffectiveTerrainConstraintInventory({
      terrainConstraintSource: 'inventoryFile',
      customConstraintInventory: { r3: 1 },
    })
    expect(fromFile.r3).toBe(1)
  })
})

describe('what an inventory makes available', () => {
  it('lists the land prefixes that have at least one piece in stock', () => {
    const prefixes = getAvailableLandPrefixesForInventory({
      g1: 1,
      r3: 0,
      w3: 2,
    })
    expect(prefixes.has('g')).toBe(true) // grass
    expect(prefixes.has('w')).toBe(true) // water
    expect(prefixes.has('r')).toBe(false) // rock is out of stock
  })

  it('maps each terrain to its in-stock sizes, one piece per size', () => {
    const lookup = getConstrainedLandInventoryByTerrainAndSizeFromInventory({
      g1: 1,
      g3: 2,
      g7: 0,
      r1: 0,
    })
    expect(Object.fromEntries(lookup.get('grass') ?? [])).toEqual({
      1: 'g1',
      3: 'g3',
    })
    expect(lookup.has('rock')).toBe(false)
  })
})
