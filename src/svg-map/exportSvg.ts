const SVG_NS = 'http://www.w3.org/2000/svg'
const INTER_FONT_FILE_PATH = '/fonts/Inter_18pt-Bold.ttf'

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

export async function serializeSvgWithEmbeddedFont(
  svgElement: SVGSVGElement,
): Promise<string> {
  const sourceSvg = svgElement
  const clonedSvg = sourceSvg.cloneNode(true) as SVGSVGElement

  await replaceTextNodesWithPaths(sourceSvg, clonedSvg)

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
