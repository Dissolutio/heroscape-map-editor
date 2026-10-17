import {
  LEVEL_LOGO_VIEWBOX_HEIGHT,
  LEVEL_LOGO_VIEWBOX_WIDTH,
} from './levelLogoShapes'
import {
  LEVEL_LOGO_DECIMAL_POINT_ADVANCE_WIDTH,
  LEVEL_LOGO_DECIMAL_POINT_PATH,
  LEVEL_LOGO_DIGIT_ADVANCE_WIDTHS,
  LEVEL_LOGO_DIGIT_PATHS,
  LEVEL_LOGO_LABEL_ADVANCE_WIDTH,
} from './levelLogoTextPaths'

/** Vertical space reserved above the plaque artwork for the "LEVEL 01" text. */
export const LEVEL_LOGO_TEXT_BLOCK_HEIGHT = 7

export const LEVEL_LOGO_WIDTH = LEVEL_LOGO_VIEWBOX_WIDTH
export const LEVEL_LOGO_HEIGHT =
  LEVEL_LOGO_VIEWBOX_HEIGHT + LEVEL_LOGO_TEXT_BLOCK_HEIGHT
export const LEVEL_LOGO_ASPECT_RATIO = LEVEL_LOGO_WIDTH / LEVEL_LOGO_HEIGHT
export const LEVEL_LOGO_VIEWBOX = `0 0 ${LEVEL_LOGO_WIDTH} ${LEVEL_LOGO_HEIGHT}`

export const LEVEL_LOGO_TEXT_FILL = '#3A2665'
export const LEVEL_LOGO_TEXT_STROKE = '#ffffff'
export const LEVEL_LOGO_LABEL_STROKE_WIDTH = 1.2
export const LEVEL_LOGO_NUMBER_STROKE_WIDTH = 1.2

export const LEVEL_LOGO_LABEL_BASELINE_Y = 8
export const LEVEL_LOGO_LABEL_X =
  (LEVEL_LOGO_WIDTH - LEVEL_LOGO_LABEL_ADVANCE_WIDTH) / 2
export const LEVEL_LOGO_NUMBER_BASELINE_Y = 17.5

/**
 * Width used when rendering level logo in PDF pages.
 * Correlates with the height calculation and outlier label margin alignment.
 */
export const LEVEL_LOGO_PDF_WIDTH = 60
export const LEVEL_LOGO_OVERLAY_LAYER_PDF_FONT_SIZE = 14
export const LEVEL_LOGO_OVERLAY_LAYER_PDF_LINE_HEIGHT = 1.4
export const NO_LEVEL_LOGO_OVERLAY_LAYER_PDF_FONT_SIZE = 10
export const NO_LEVEL_LOGO_OVERLAY_LAYER_PDF_LINE_HEIGHT = 1.2

/**
 * Calculates the rendered height of a level logo given its width.
 * Uses the fixed aspect ratio to maintain proportions at any scale.
 */
export const getLevelLogoPdfHeight = (width: number): number =>
  width / LEVEL_LOGO_ASPECT_RATIO

/**
 * Margin applied to outlier level labels (e.g., "Glyphs and Start Zones")
 * to align them vertically with regular levels that have a logo rendered.
 * Derived from the PDF logo width and its calculated height.
 */
export const LEVEL_LOGO_OUTLIER_LABEL_MARGIN =
  (getLevelLogoPdfHeight(LEVEL_LOGO_PDF_WIDTH) -
    LEVEL_LOGO_OVERLAY_LAYER_PDF_FONT_SIZE *
      LEVEL_LOGO_OVERLAY_LAYER_PDF_LINE_HEIGHT) /
  2

/**
 * Maps never exceed 99 levels, so a 2-digit zero-padded number is enough.
 * Half levels (fluid stacked on fluid) keep the padding and add ".5": "01.5".
 */
export const formatLevelNumber = (level: number) => {
  const halfLevels = Math.min(99 * 2 + 1, Math.max(0, Math.round(level * 2)))
  const whole = String(Math.floor(halfLevels / 2)).padStart(2, '0')
  return halfLevels % 2 ? `${whole}.5` : whole
}

export type LevelLogoDigit = { d: string; x: number }

// Every character of the level number is drawn from a traced outline, never
// live text, so exported SVGs scale cleanly in other software.
const getGlyph = (char: string) =>
  char === '.'
    ? {
        d: LEVEL_LOGO_DECIMAL_POINT_PATH,
        advance: LEVEL_LOGO_DECIMAL_POINT_ADVANCE_WIDTH,
      }
    : {
        d: LEVEL_LOGO_DIGIT_PATHS[Number(char)],
        advance: LEVEL_LOGO_DIGIT_ADVANCE_WIDTHS[Number(char)],
      }

export const getLevelNumberDigits = (level: number): LevelLogoDigit[] => {
  const glyphs = formatLevelNumber(level).split('').map(getGlyph)
  const totalWidth = glyphs.reduce((sum, glyph) => sum + glyph.advance, 0)
  let x = (LEVEL_LOGO_WIDTH - totalWidth) / 2
  return glyphs.map((glyph) => {
    const placed = { d: glyph.d, x }
    x += glyph.advance
    return placed
  })
}
