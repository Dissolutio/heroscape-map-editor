import { describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { getLaurAddonExportSymbol } from '../pdf-svg-shared/laurAddonExportSymbol'
import { HexTerrain, Pieces } from '../types'

describe('Laur add-on export symbols', () => {
  it.each([
    [Pieces.laurWallLong, 'long'],
    [Pieces.laurWallArch, 'arch'],
    [Pieces.laurWallShort, 'short'],
    [Pieces.laurWallRuin1, 'ruin'],
    [Pieces.laurWallShortStackable, 'short'],
    [Pieces.laurWallLongStackable, 'long'],
    [Pieces.laurWallRuin2, 'ruin'],
    [Pieces.laurWallRuin3, 'ruin'],
  ] as const)('%s maps to the %s symbol', (inventoryID, symbol) => {
    expect(getLaurAddonExportSymbol(inventoryID)).toBe(symbol)
  })

  it('every Laur wall add-on has an export symbol', () => {
    const unrenderedAddons = Object.values(piecesSoFar)
      .filter((piece) => piece.terrain === HexTerrain.laurWallAddon)
      .filter((piece) => getLaurAddonExportSymbol(piece.id) === undefined)
      .map((piece) => piece.id)

    expect(unrenderedAddons).toEqual([])
  })
})
