import {
  LEVEL_LOGO_VIEWBOX_HEIGHT,
  LEVEL_LOGO_VIEWBOX_WIDTH,
} from './levelLogoShapes'
import {
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

/** Maps never exceed 99 levels, so a 2-digit zero-padded number is enough. */
export const formatLevelNumber = (level: number) =>
  String(Math.min(99, Math.max(0, Math.round(level)))).padStart(2, '0')

export type LevelLogoDigit = { d: string; x: number }

export const getLevelNumberDigits = (level: number): LevelLogoDigit[] => {
  const digits = formatLevelNumber(level).split('').map(Number)
  const totalWidth = digits.reduce(
    (sum, digit) => sum + LEVEL_LOGO_DIGIT_ADVANCE_WIDTHS[digit],
    0,
  )
  let x = (LEVEL_LOGO_WIDTH - totalWidth) / 2
  return digits.map((digit) => {
    const placed = { d: LEVEL_LOGO_DIGIT_PATHS[digit], x }
    x += LEVEL_LOGO_DIGIT_ADVANCE_WIDTHS[digit]
    return placed
  })
}
