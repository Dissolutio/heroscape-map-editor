import {
  LEVEL_LOGO_ASPECT_RATIO,
  LEVEL_LOGO_LABEL_BASELINE_Y,
  LEVEL_LOGO_LABEL_STROKE_WIDTH,
  LEVEL_LOGO_LABEL_X,
  LEVEL_LOGO_NUMBER_BASELINE_Y,
  LEVEL_LOGO_NUMBER_STROKE_WIDTH,
  LEVEL_LOGO_TEXT_BLOCK_HEIGHT,
  LEVEL_LOGO_TEXT_FILL,
  LEVEL_LOGO_TEXT_STROKE,
  LEVEL_LOGO_WIDTH,
  getLevelNumberDigits,
} from '../pdf-svg-shared/levelLogoLayout'
import { levelLogoShapes } from '../pdf-svg-shared/levelLogoShapes'
import { LEVEL_LOGO_LABEL_PATH } from '../pdf-svg-shared/levelLogoTextPaths'

const SVG_NS = 'http://www.w3.org/2000/svg'
const INTER_FONT_FILE_PATH = '/fonts/Inter_18pt-Bold.ttf'
/** Level logo occupies this fraction of the exported map's width. */
const LEVEL_LOGO_WIDTH_RATIO = 0.2

type OpenTypePath = {
  toPathData: (decimalPlaces?: number) => string
}

type OpenTypeFont = {
  getAdvanceWidth: (
    text: string,
    fontSize: number,
    options?: { kerning?: boolean },
  ) => number
  getPath: (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    options?: { kerning?: boolean },
  ) => OpenTypePath
}

let interFontPromise: Promise<OpenTypeFont | null> | null = null

type ClipperPoint = { X: number; Y: number }
type ClipperPath = ClipperPoint[]

type ClipperLibModule = {
  ClipperOffset: new () => {
    AddPaths: (paths: ClipperPath[], joinType: number, endType: number) => void
    Execute: (solution: ClipperPath[], delta: number) => void
  }
  JoinType: { jtRound: number }
  EndType: { etClosedPolygon: number }
}

let clipperLibPromise: Promise<ClipperLibModule | null> | null = null

/** Coordinates are scaled up before handing them to clipper-lib, which requires integers. */
const CLIPPER_SCALE = 1000

async function getClipperLib(): Promise<ClipperLibModule | null> {
  if (!clipperLibPromise) {
    clipperLibPromise = (async () => {
      try {
        const clipperModule = (await import('clipper-lib')) as {
          default?: ClipperLibModule
        } & ClipperLibModule
        return clipperModule.default ?? clipperModule
      } catch (err) {
        console.warn('Could not load clipper-lib for level logo outline.', err)
        return null
      }
    })()
  }
  return clipperLibPromise
}

/** Flattens an SVG path's `M`/`L`/`C`/`Q`/`Z` commands into closed point rings (curves sampled into line segments). */
function pathDataToRings(d: string): Array<Array<[number, number]>> {
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []
  const rings: Array<Array<[number, number]>> = []
  let current: Array<[number, number]> = []
  let cx = 0
  let cy = 0
  let i = 0
  const CURVE_STEPS = 8
  const readNums = (count: number) => {
    const nums: number[] = []
    for (let k = 0; k < count; k += 1) {
      nums.push(Number(tokens[i]))
      i += 1
    }
    return nums
  }
  while (i < tokens.length) {
    const cmd = String(tokens[i]).toUpperCase()
    i += 1
    if (cmd === 'M') {
      if (current.length) rings.push(current)
      const [x, y] = readNums(2)
      cx = x
      cy = y
      current = [[x, y]]
    } else if (cmd === 'L') {
      const [x, y] = readNums(2)
      cx = x
      cy = y
      current.push([x, y])
    } else if (cmd === 'C') {
      const [x1, y1, x2, y2, x, y] = readNums(6)
      for (let s = 1; s <= CURVE_STEPS; s += 1) {
        const t = s / CURVE_STEPS
        const mt = 1 - t
        const px =
          mt * mt * mt * cx +
          3 * mt * mt * t * x1 +
          3 * mt * t * t * x2 +
          t * t * t * x
        const py =
          mt * mt * mt * cy +
          3 * mt * mt * t * y1 +
          3 * mt * t * t * y2 +
          t * t * t * y
        current.push([px, py])
      }
      cx = x
      cy = y
    } else if (cmd === 'Q') {
      const [x1, y1, x, y] = readNums(4)
      for (let s = 1; s <= CURVE_STEPS; s += 1) {
        const t = s / CURVE_STEPS
        const mt = 1 - t
        const px = mt * mt * cx + 2 * mt * t * x1 + t * t * x
        const py = mt * mt * cy + 2 * mt * t * y1 + t * t * y
        current.push([px, py])
      }
      cx = x
      cy = y
    } else if (cmd === 'Z') {
      if (current.length) rings.push(current)
      current = []
    }
  }
  if (current.length) rings.push(current)
  return rings
}

const outlinePathDataCache = new Map<string, string>()

/**
 * Computes a real filled vector outline (via polygon offsetting) instead of an SVG
 * stroke, since stroke-width doesn't scale correctly when the exported SVG is
 * opened and resized in Adobe Illustrator.
 */
async function getOutlinePathData(
  pathData: string,
  radius: number,
): Promise<string | null> {
  const cacheKey = `${pathData}|${radius}`
  const cached = outlinePathDataCache.get(cacheKey)
  if (cached !== undefined) return cached

  const ClipperLib = await getClipperLib()
  if (!ClipperLib) return null

  const rings = pathDataToRings(pathData)
  const clipperPaths: ClipperPath[] = rings.map((ring) =>
    ring.map(([x, y]) => ({
      X: Math.round(x * CLIPPER_SCALE),
      Y: Math.round(y * CLIPPER_SCALE),
    })),
  )

  const offset = new ClipperLib.ClipperOffset()
  offset.AddPaths(
    clipperPaths,
    ClipperLib.JoinType.jtRound,
    ClipperLib.EndType.etClosedPolygon,
  )
  const solution: ClipperPath[] = []
  offset.Execute(solution, radius * CLIPPER_SCALE)

  const outlinePathData = solution
    .map((ring) => {
      if (!ring.length) return ''
      const points = ring.map(
        (p) => `${p.X / CLIPPER_SCALE} ${p.Y / CLIPPER_SCALE}`,
      )
      return `M${points.join('L')}Z`
    })
    .join('')

  outlinePathDataCache.set(cacheKey, outlinePathData)
  return outlinePathData
}

function parseFirstNumericValue(value: string | null, fallback: number) {
  if (!value) return fallback
  const [firstToken] = value.trim().split(/[\s,]+/)
  const parsed = Number.parseFloat(firstToken)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseDyToPx(dyValue: string | null, fontSizePx: number) {
  if (!dyValue) return 0
  const [firstToken] = dyValue.trim().split(/[\s,]+/)
  if (firstToken.endsWith('em')) {
    return parseFirstNumericValue(firstToken, 0) * fontSizePx
  }
  return parseFirstNumericValue(firstToken, 0)
}

async function getInterFont() {
  if (!interFontPromise) {
    interFontPromise = (async () => {
      try {
        const opentypeModule = (await import('opentype.js')) as {
          parse?: (fontData: ArrayBuffer) => OpenTypeFont
          default?: {
            parse?: (fontData: ArrayBuffer) => OpenTypeFont
          }
        }
        const parse = opentypeModule.parse ?? opentypeModule.default?.parse
        if (!parse) {
          throw new Error('Could not resolve opentype.js parse function')
        }

        const res = await fetch(INTER_FONT_FILE_PATH)
        if (!res.ok) {
          throw new Error(`Failed to fetch font: ${res.status}`)
        }
        const arrayBuffer = await res.arrayBuffer()
        return parse(arrayBuffer)
      } catch (err) {
        console.warn('Could not convert SVG text to paths.', err)
        return null
      }
    })()
  }

  return interFontPromise
}

async function replaceTextNodesWithPaths(
  sourceSvg: SVGSVGElement,
  clonedSvg: SVGSVGElement,
) {
  const interFont = await getInterFont()
  if (!interFont) {
    return
  }

  const sourceTextNodes = Array.from(sourceSvg.querySelectorAll('text'))
  const clonedTextNodes = Array.from(clonedSvg.querySelectorAll('text'))
  const count = Math.min(sourceTextNodes.length, clonedTextNodes.length)

  for (let i = 0; i < count; i += 1) {
    const sourceText = sourceTextNodes[i]
    const clonedText = clonedTextNodes[i]
    const textContent = sourceText.textContent ?? ''

    if (!textContent.trim()) {
      clonedText.remove()
      continue
    }

    const computedStyle = window.getComputedStyle(sourceText)
    const fontSizePx = parseFirstNumericValue(computedStyle.fontSize, 16)
    const x = parseFirstNumericValue(sourceText.getAttribute('x'), 0)
    const y =
      parseFirstNumericValue(sourceText.getAttribute('y'), 0) +
      parseDyToPx(sourceText.getAttribute('dy'), fontSizePx)

    const textAnchor = (
      sourceText.getAttribute('text-anchor') ||
      computedStyle.textAnchor ||
      'start'
    ).trim()

    let xWithAnchor = x
    const advanceWidth = interFont.getAdvanceWidth(textContent, fontSizePx, {
      kerning: true,
    })

    if (textAnchor === 'middle') {
      xWithAnchor -= advanceWidth / 2
    } else if (textAnchor === 'end') {
      xWithAnchor -= advanceWidth
    }

    const pathData = interFont
      .getPath(textContent, xWithAnchor, y, fontSizePx, {
        kerning: true,
      })
      .toPathData(3)

    const pathNode = document.createElementNS(SVG_NS, 'path')
    pathNode.setAttribute('d', pathData)

    const fill = sourceText.getAttribute('fill') || computedStyle.fill
    pathNode.setAttribute('fill', fill || 'black')

    const opacity = sourceText.getAttribute('opacity') || computedStyle.opacity
    if (opacity && opacity !== '1') {
      pathNode.setAttribute('opacity', opacity)
    }

    const transform = clonedText.getAttribute('transform')
    if (transform) {
      pathNode.setAttribute('transform', transform)
    }

    clonedText.replaceWith(pathNode)
  }
}

function appendLogoTextPath(
  group: SVGGElement,
  pathData: string,
  transform: string | null,
  fill: string,
) {
  const pathNode = document.createElementNS(SVG_NS, 'path')
  pathNode.setAttribute('d', pathData)
  if (transform) {
    pathNode.setAttribute('transform', transform)
  }
  pathNode.setAttribute('fill', fill)
  group.appendChild(pathNode)
}

async function appendLogoTextOutline(
  group: SVGGElement,
  pathData: string,
  transform: string,
  radius: number,
) {
  const outlinePathData = await getOutlinePathData(pathData, radius)
  // fall back to the plain glyph (no outline) if clipper-lib failed to load
  appendLogoTextPath(
    group,
    outlinePathData ?? pathData,
    transform,
    LEVEL_LOGO_TEXT_STROKE,
  )
}

/**
 * Draws the level plaque above the map in the exported SVG only. The viewBox is
 * grown upwards so the logo never overlaps the map itself.
 */
async function prependLevelLogo(clonedSvg: SVGSVGElement, level: number) {
  const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = (
    clonedSvg.getAttribute('viewBox') ?? ''
  )
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  if (
    ![viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight].every(Number.isFinite) ||
    !viewBoxWidth ||
    !viewBoxHeight
  ) {
    return
  }

  const logoWidth = viewBoxWidth * LEVEL_LOGO_WIDTH_RATIO
  const logoHeight = logoWidth / LEVEL_LOGO_ASPECT_RATIO
  const scale = logoWidth / LEVEL_LOGO_WIDTH

  clonedSvg.setAttribute(
    'viewBox',
    `${viewBoxX} ${viewBoxY - logoHeight} ${viewBoxWidth} ${viewBoxHeight + logoHeight}`,
  )

  const logoGroup = document.createElementNS(SVG_NS, 'g')
  logoGroup.setAttribute(
    'transform',
    `translate(${viewBoxX} ${viewBoxY - logoHeight}) scale(${scale})`,
  )

  const artGroup = document.createElementNS(SVG_NS, 'g')
  artGroup.setAttribute(
    'transform',
    `translate(0 ${LEVEL_LOGO_TEXT_BLOCK_HEIGHT})`,
  )
  for (const shape of levelLogoShapes) {
    const pathNode = document.createElementNS(SVG_NS, 'path')
    pathNode.setAttribute('d', shape.d)
    pathNode.setAttribute('fill', shape.fill)
    artGroup.appendChild(pathNode)
  }
  logoGroup.appendChild(artGroup)

  // the outline is drawn before the fill copy: emulates paint-order:stroke
  const digits = getLevelNumberDigits(level)
  const labelTransform = `translate(${LEVEL_LOGO_LABEL_X} ${LEVEL_LOGO_LABEL_BASELINE_Y})`
  const digitTransform = (x: number) =>
    `translate(${x} ${LEVEL_LOGO_NUMBER_BASELINE_Y})`
  await appendLogoTextOutline(
    logoGroup,
    LEVEL_LOGO_LABEL_PATH,
    labelTransform,
    LEVEL_LOGO_LABEL_STROKE_WIDTH / 2,
  )
  for (const digit of digits) {
    await appendLogoTextOutline(
      logoGroup,
      digit.d,
      digitTransform(digit.x),
      LEVEL_LOGO_NUMBER_STROKE_WIDTH / 2,
    )
  }
  appendLogoTextPath(
    logoGroup,
    LEVEL_LOGO_LABEL_PATH,
    labelTransform,
    LEVEL_LOGO_TEXT_FILL,
  )
  for (const digit of digits) {
    appendLogoTextPath(
      logoGroup,
      digit.d,
      digitTransform(digit.x),
      LEVEL_LOGO_TEXT_FILL,
    )
  }

  clonedSvg.appendChild(logoGroup)
}

export async function serializeSvgWithEmbeddedFont(
  svgElement: SVGSVGElement,
  levelLogoLevel?: number,
): Promise<string> {
  const sourceSvg = svgElement
  const clonedSvg = sourceSvg.cloneNode(true) as SVGSVGElement

  await replaceTextNodesWithPaths(sourceSvg, clonedSvg)

  if (levelLogoLevel !== undefined) {
    await prependLevelLogo(clonedSvg, levelLogoLevel)
  }

  if (!clonedSvg.getAttribute('xmlns')) {
    clonedSvg.setAttribute('xmlns', SVG_NS)
  }

  const serializer = new XMLSerializer()
  return serializer.serializeToString(clonedSvg)
}

export function downloadSvgString(filename: string, svgContent: string) {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
  const link = document.createElement('a')
  link.download = filename
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}
