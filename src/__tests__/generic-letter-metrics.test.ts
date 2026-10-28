import opentype from 'opentype.js'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getPdfBuriedMarkOffset } from '../pdf-map/pdfBuriedMarkPosition'
import { terrainTileLetters } from '../utils/tileLetters'

const terrainLetters = Array.from(
  new Set(Object.values(terrainTileLetters).map(({ letter }) => letter)),
)

let font: ReturnType<typeof opentype.loadSync> | null = null
try {
  font = opentype.loadSync(
    resolve(process.cwd(), 'public/fonts/Inter_18pt-Bold.ttf'),
  )
} catch {
  font = null
}

describe('PDF terrain-letter metrics', () => {
  it.each(terrainLetters)(
    'registers an advance width for terrain letter "%s"',
    (letter) => {
      expect(() => getPdfBuriedMarkOffset(letter, 20)).not.toThrow()
    },
  )

  if (font) {
    it.each(terrainLetters)(
      'uses the Inter Bold advance width for "%s"',
      (letter) => {
        const offset = getPdfBuriedMarkOffset(letter, 20)
        const advanceWidth = font?.charToGlyph(letter).advanceWidth
        expect(advanceWidth).toBeDefined()
        expect(offset?.x).toBeCloseTo(
          (20 * (advanceWidth ?? 0)) / (2 * font.unitsPerEm),
        )
      },
    )
  } else {
    it.skip('compares metrics to Inter Bold when the TTF can be loaded', () => {
      expect(font).not.toBeNull()
    })
  }
})
