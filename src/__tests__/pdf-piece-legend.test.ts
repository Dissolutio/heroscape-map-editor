import { Document, renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { SETTINGS_DEFAULTS } from '../local-storage/settings'
import { PdfPieceLegend } from '../pdf-map/PdfPieceLegend'
import { getPdfPieceLegendEntries } from '../pdf-svg-shared/pieceLegend'
import { type BoardPiece, HexTerrain, Pieces } from '../types'

const makePiece = (inventoryID: string, index: number): BoardPiece => ({
  uid: `legend-${index}`,
  inventoryID,
  altitude: 0,
  rotation: 0,
  pieceCoords: { q: index, r: -index, s: 0 },
})

describe('PDF piece legend', () => {
  it('is disabled by default', () => {
    expect(SETTINGS_DEFAULTS.isShowPdfPieceLegend).toBe(false)
  })

  it('lists and groups pieces from the map in land, obstacle, gameplay order', () => {
    const mapPieces = [
      makePiece(Pieces.ropeLadder, 0),
      makePiece(Pieces.glyphPower, 1),
      makePiece(Pieces.laurWallLong, 2),
      makePiece(Pieces.tree11, 3),
      makePiece(Pieces.ladder, 4),
      makePiece(Pieces.grass1, 5),
      makePiece(Pieces.grass1, 6),
      makePiece(Pieces.startZone1, 7),
    ]

    const entries = getPdfPieceLegendEntries(mapPieces)

    expect(
      entries.map(({ inventoryID, category, count }) => ({
        inventoryID,
        category,
        count,
      })),
    ).toEqual([
      { inventoryID: Pieces.grass1, category: 'land', count: 2 },
      { inventoryID: Pieces.tree11, category: 'obstacles', count: 1 },
      { inventoryID: Pieces.laurWallLong, category: 'obstacles', count: 1 },
      { inventoryID: Pieces.ladder, category: 'abstract', count: 1 },
      { inventoryID: Pieces.glyphPower, category: 'abstract', count: 1 },
      { inventoryID: Pieces.ropeLadder, category: 'abstract', count: 1 },
      { inventoryID: Pieces.startZone1, category: 'abstract', count: 1 },
    ])
    expect(
      entries.find((entry) => entry.inventoryID === Pieces.glyphPower),
    ).toMatchObject({
      title: 'Power Glyph',
      terrain: HexTerrain.glyphPower,
      symbol: 'glyph',
    })
    expect(
      entries.find((entry) => entry.inventoryID === Pieces.laurWallLong),
    ).toMatchObject({ symbol: 'laur-long' })
    expect(
      entries.find((entry) => entry.inventoryID === Pieces.ropeLadder),
    ).toMatchObject({ symbol: 'rope-ladder' })
    expect(
      entries.find((entry) => entry.inventoryID === Pieces.ladder),
    ).toMatchObject({ symbol: 'ladder' })
    expect(
      entries.find((entry) => entry.inventoryID === Pieces.startZone1),
    ).toMatchObject({ symbol: 'start-zone' })
  })

  it('produces an entry for every registered piece without throwing', () => {
    const registeredPieceIDs = Object.keys(piecesSoFar)
    const allRegisteredPieces = registeredPieceIDs.map((inventoryID, index) =>
      makePiece(inventoryID, index),
    )

    expect(() => getPdfPieceLegendEntries(allRegisteredPieces)).not.toThrow()
    expect(
      getPdfPieceLegendEntries(allRegisteredPieces).map(
        (entry) => entry.inventoryID,
      ),
    ).toEqual(expect.arrayContaining(registeredPieceIDs))
    expect(getPdfPieceLegendEntries(allRegisteredPieces)).toHaveLength(
      registeredPieceIDs.length,
    )
  })

  it('renders all registered families without throwing', async () => {
    const allRegisteredPieces = Object.keys(piecesSoFar).map(
      (inventoryID, index) => makePiece(inventoryID, index),
    )
    const pdf = await renderToBuffer(
      createElement(
        Document,
        null,
        createElement(PdfPieceLegend, { boardPieces: allRegisteredPieces }),
      ),
    )

    expect(pdf.byteLength).toBeGreaterThan(0)
  })
})
