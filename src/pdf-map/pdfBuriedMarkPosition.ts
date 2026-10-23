const INTER_UNITS_PER_EM = 2048
const INTER_CAP_HEIGHT = 1490
const MARK_FONT_SCALE = 0.58
// Tuned against the rasterized output because React-PDF's central baseline
// renders the marks low relative to the SVG dy position.
const PDF_RENDERER_BASELINE_CORRECTION_EM = 0.058

// Advance widths from public/fonts/Inter_18pt-Bold.ttf, in font units.
const terrainLetterAdvanceWidths: Record<string, number> = {
  A: 1514,
  C: 1509,
  D: 1469,
  F: 1200,
  G: 1530,
  M: 1891,
  R: 1342,
  S: 1340,
  W: 2106,
  '?': 1149,
}

const markYOffsetEm =
  -0.6 * MARK_FONT_SCALE +
  ((1 - MARK_FONT_SCALE) * (INTER_CAP_HEIGHT / INTER_UNITS_PER_EM)) / 2 -
  PDF_RENDERER_BASELINE_CORRECTION_EM

export const getPdfBuriedMarkOffset = (letter: string, fontSize: number) => {
  if (!letter) return null

  const advanceWidth = terrainLetterAdvanceWidths[letter]
  if (advanceWidth === undefined) {
    throw new Error(`No PDF glyph metrics are registered for "${letter}"`)
  }

  return {
    x: (fontSize * advanceWidth) / (2 * INTER_UNITS_PER_EM),
    y: fontSize * markYOffsetEm,
  }
}
