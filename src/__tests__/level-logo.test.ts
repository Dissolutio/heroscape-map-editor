/**
 * LEVEL LOGO NUMBERS (pdf-svg-shared/levelLogoLayout.ts)
 *
 * The "LEVEL 01" plaque in PDF and SVG exports draws its number from glyph
 * outlines traced from the font (levelLogoTextPaths.ts), never from live
 * text, so exported SVGs scale cleanly in Illustrator. Half levels (fluid
 * stacked on fluid) use a traced "." as well.
 */
import { describe, expect, it } from 'vitest'
import {
  LEVEL_LOGO_WIDTH,
  formatLevelNumber,
  getLevelNumberDigits,
} from '../pdf-svg-shared/levelLogoLayout'
import {
  LEVEL_LOGO_DECIMAL_POINT_ADVANCE_WIDTH,
  LEVEL_LOGO_DECIMAL_POINT_PATH,
  LEVEL_LOGO_DIGIT_PATHS,
} from '../pdf-svg-shared/levelLogoTextPaths'

describe('formatLevelNumber', () => {
  it.each([
    [0, '00'],
    [1, '01'],
    [12, '12'],
    [99, '99'],
    [1.5, '01.5'],
    [10.5, '10.5'],
    [0.5, '00.5'],
  ])('%s -> %s', (level, text) => {
    expect(formatLevelNumber(level)).toBe(text)
  })
})

describe('getLevelNumberDigits', () => {
  it('uses only traced outlines, including the decimal point', () => {
    const glyphs = getLevelNumberDigits(1.5)
    expect(glyphs.map((g) => g.d)).toEqual([
      LEVEL_LOGO_DIGIT_PATHS[0],
      LEVEL_LOGO_DIGIT_PATHS[1],
      LEVEL_LOGO_DECIMAL_POINT_PATH,
      LEVEL_LOGO_DIGIT_PATHS[5],
    ])
    expect(glyphs.every((g) => g.d.startsWith('M'))).toBe(true)
  })

  it('advances past the decimal point by its own width', () => {
    const [, one, dot, five] = getLevelNumberDigits(1.5)
    expect(five.x - dot.x).toBeCloseTo(LEVEL_LOGO_DECIMAL_POINT_ADVANCE_WIDTH)
    expect(dot.x).toBeGreaterThan(one.x)
  })

  it('stays centred on the plaque', () => {
    for (const level of [1, 1.5, 10.5]) {
      const glyphs = getLevelNumberDigits(level)
      const left = glyphs[0].x
      expect(left).toBeGreaterThan(0)
      expect(left).toBeLessThan(LEVEL_LOGO_WIDTH / 2)
    }
  })
})
