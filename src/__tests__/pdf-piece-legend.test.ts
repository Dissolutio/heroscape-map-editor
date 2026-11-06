import { readFileSync } from 'node:fs'
import { Document, Font, renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { SETTINGS_DEFAULTS } from '../local-storage/settings'
import { PdfPieceLegend } from '../pdf-map/PdfPieceLegend'
import type { BoardPiece } from '../types'

Font.register({
  family: 'Inter',
  src: `data:font/ttf;base64,${readFileSync(
    new URL('../../public/fonts/Inter_18pt-Bold.ttf', import.meta.url),
  ).toString('base64')}`,
})

const makePiece = (inventoryID: string, index: number): BoardPiece => ({
  uid: `legend-${index}`,
  inventoryID,
  altitude: 0,
  rotation: 0,
  pieceCoords: { q: index, r: -index, s: 0 },
})

describe('PDF piece key', () => {
  it('is disabled by default', () => {
    expect(SETTINGS_DEFAULTS.isShowPdfPieceLegend).toBe(false)
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
