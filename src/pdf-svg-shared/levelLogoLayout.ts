import {
  LEVEL_LOGO_VIEWBOX_HEIGHT,
  LEVEL_LOGO_VIEWBOX_WIDTH,
} from './levelLogoShapes'
import {
  LEVEL_LOGO_DIGIT_ADVANCE_WIDTHS,
  LEVEL_LOGO_DIGIT_PATHS,
} from './levelLogoTextPaths'

/** Vertical space reserved above the plaque artwork for the "LEVEL 01" text. */
export const LEVEL_LOGO_TEXT_BLOCK_HEIGHT = 12

export const LEVEL_LOGO_WIDTH = LEVEL_LOGO_VIEWBOX_WIDTH
export const LEVEL_LOGO_HEIGHT =
  LEVEL_LOGO_VIEWBOX_HEIGHT + LEVEL_LOGO_TEXT_BLOCK_HEIGHT
export const LEVEL_LOGO_ASPECT_RATIO = LEVEL_LOGO_WIDTH / LEVEL_LOGO_HEIGHT
export const LEVEL_LOGO_VIEWBOX = `0 0 ${LEVEL_LOGO_WIDTH} ${LEVEL_LOGO_HEIGHT}`

export const LEVEL_LOGO_TEXT_FILL = '#3A2665'
export const LEVEL_LOGO_TEXT_STROKE = '#ffffff'
export const LEVEL_LOGO_LABEL_STROKE_WIDTH = 0.8
export const LEVEL_LOGO_NUMBER_STROKE_WIDTH = 1.2

// x/baseline the glyph paths in levelLogoTextPaths.ts were baked at; changing
// these requires regenerating that file.
export const LEVEL_LOGO_TEXT_X = 2.5
export const LEVEL_LOGO_NUMBER_BASELINE_Y = 16.5

/** Maps never exceed 99 levels, so a 2-digit zero-padded number is enough. */
export const formatLevelNumber = (level: number) =>
  String(Math.min(99, Math.max(0, Math.round(level)))).padStart(2, '0')

export type LevelLogoDigit = { d: string; x: number }

export const getLevelNumberDigits = (level: number): LevelLogoDigit[] => {
  let x = LEVEL_LOGO_TEXT_X
  return formatLevelNumber(level)
    .split('')
    .map((char) => {
      const digit = Number(char)
      const placed = { d: LEVEL_LOGO_DIGIT_PATHS[digit], x }
      x += LEVEL_LOGO_DIGIT_ADVANCE_WIDTHS[digit]
      return placed
    })
}
