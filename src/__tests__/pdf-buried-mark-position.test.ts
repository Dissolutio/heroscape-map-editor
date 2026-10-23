import { describe, expect, it } from 'vitest'
import { getPdfBuriedMarkOffset } from '../pdf-map/pdfBuriedMarkPosition'

describe('PDF buried-mark offset', () => {
  it('scales horizontal and superscript offsets with the letter size', () => {
    const offset = getPdfBuriedMarkOffset('G', 20)
    const doubleSizeOffset = getPdfBuriedMarkOffset('G', 40)

    expect(doubleSizeOffset?.x).toBeCloseTo((20 * 1530) / 2048)
    expect(doubleSizeOffset?.y).toBeCloseTo(-0.2532 * 40)
    expect(offset?.x).toBeCloseTo((20 * 1530) / (2 * 2048))
    expect(offset?.y).toBeCloseTo(-0.2532 * 20)
    expect(doubleSizeOffset?.x).toBeCloseTo((offset?.x ?? 0) * 2)
    expect(doubleSizeOffset?.y).toBeCloseTo((offset?.y ?? 0) * 2)
  })

  it.each([
    ['G', 1530],
    ['R', 1342],
    ['S', 1340],
    ['W', 2106],
  ])('uses the registered Inter advance for %s', (letter, advanceWidth) => {
    expect(getPdfBuriedMarkOffset(letter, 20)?.x).toBeCloseTo(
      (20 * advanceWidth) / (2 * 2048),
    )
  })

  it('returns no offset for a marks-only tile', () => {
    expect(getPdfBuriedMarkOffset('', 20)).toBeNull()
  })

  it('reports unsupported terrain letters instead of guessing their width', () => {
    expect(() => getPdfBuriedMarkOffset('X', 20)).toThrow(
      'No PDF glyph metrics are registered for "X"',
    )
  })
})
