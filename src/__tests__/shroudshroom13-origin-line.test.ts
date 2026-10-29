import { Line } from '@react-pdf/renderer'
import {
  Children,
  createElement,
  type ReactElement,
  type ReactNode,
  isValidElement,
} from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import {
  getShroudshroom13OriginLine,
  SHROUDSHROOM13_ORIGIN_LINE_COLOR,
  SHROUDSHROOM13_ORIGIN_LINE_SUBLEVEL_COLOR,
  SHROUDSHROOM13_ORIGIN_LINE_WIDTH,
} from '../pdf-svg-shared/shroudshroom13OriginLine'
import useBoundStore from '../store/store'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { type BoardHex, HexTerrain, Pieces } from '../types'
import { SVG_HEX_RADIUS } from '../utils/constants'
import type { BuriedMarksByUID } from '../utils/tileMarks'
import { renderToStaticMarkup } from 'react-dom/server'

const makeHex = (
  inventoryID: string,
  terrain: string,
  pieceRotation = 0,
  isObstacleOrigin = true,
): BoardHex =>
  ({
    id: '0~0~0',
    q: 0,
    r: 0,
    s: 0,
    altitude: 1,
    pieceID: `0~0~0~${pieceRotation}~${inventoryID}`,
    inventoryID,
    terrain,
    pieceRotation,
    isObstacleOrigin,
  }) as BoardHex

const makeVisibleHex = (
  inventoryID: string,
  terrain: string,
  pieceRotation = 0,
  isObstacleOrigin = true,
) => ({
  ...makeHex(inventoryID, terrain, pieceRotation, isObstacleOrigin),
  altitude: 0,
})

const shroudshroom13Hex = makeHex(
  Pieces.shroudshroom13,
  HexTerrain.shroudshroom,
)
const initialState = useBoundStore.getState()

const renderSvgHex = (hex: BoardHex) =>
  renderToStaticMarkup(
    createElement(
      'svg',
      { xmlns: 'http://www.w3.org/2000/svg' },
      createElement(SvgMapHex, {
        hex,
        buriedMarksByUID: {} as BuriedMarksByUID,
      }),
    ),
  )

const renderPdfHex = (hex: BoardHex) =>
  PdfMapHex({
    hex,
    viewingLevel: 1,
    isOverlayViewing: true,
    isPdfColorBorders: false,
    isShowPdfOverlayOnPlacedLevel: false,
    isShowPdfTileLetters: false,
    isShowPdfBuriedMarks: false,
    buriedMarksByUID: {} as BuriedMarksByUID,
    useLegacyStartZones: false,
  })

const findPdfLines = (element: ReactElement | null): ReactElement[] => {
  if (!element || !isValidElement(element)) return []
  if (element.type === Line) return [element]
  const children = (element.props as { children?: ReactNode }).children
  return Children.toArray(children).flatMap((child) =>
    isValidElement(child) ? findPdfLines(child) : [],
  )
}

afterEach(() => {
  useBoundStore.setState({
    boardHexes: initialState.boardHexes,
    boardPieces: initialState.boardPieces,
    viewingLevel: initialState.viewingLevel,
    is2DOverlayLevelEnabled: initialState.is2DOverlayLevelEnabled,
  })
})

describe('Shroudshroom13 origin line', () => {
  it.each([0, 1, 2, 3, 4, 5])(
    'points from the origin away from the three-hex centroid at rotation %i',
    (rotation) => {
      const line = getShroudshroom13OriginLine(rotation, SVG_HEX_RADIUS)
      const apothem = (Math.sqrt(3) * SVG_HEX_RADIUS) / 2
      const centers = [
        { x: 0, y: 0 },
        { x: 2 * apothem, y: 0 },
        { x: apothem, y: 1.5 * SVG_HEX_RADIUS },
      ]
      const angle = (rotation * Math.PI) / 3
      const centroid = centers
        .map(({ x, y }) => ({
          x: (x * Math.cos(angle) - y * Math.sin(angle)) / centers.length,
          y: (x * Math.sin(angle) + y * Math.cos(angle)) / centers.length,
        }))
        .reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), {
          x: 0,
          y: 0,
        })
      const awayDotProduct = line.x2 * -centroid.x + line.y2 * -centroid.y
      const vertices = Array.from({ length: 6 }, (_, index) => {
        const vertexAngle = -Math.PI / 2 + (index * Math.PI) / 3
        return {
          x: SVG_HEX_RADIUS * Math.cos(vertexAngle),
          y: SVG_HEX_RADIUS * Math.sin(vertexAngle),
        }
      })

      expect(line.x1).toBe(0)
      expect(line.y1).toBe(0)
      expect(Math.hypot(line.x2, line.y2)).toBeCloseTo(SVG_HEX_RADIUS)
      expect(awayDotProduct).toBeGreaterThan(0)
      expect(
        Math.min(
          ...vertices.map((vertex) =>
            Math.hypot(line.x2 - vertex.x, line.y2 - vertex.y),
          ),
        ),
      ).toBeCloseTo(0)
    },
  )

  it('renders exactly one SVG origin line only for Shroudshroom13', () => {
    const svgHex = { ...shroudshroom13Hex, altitude: 0 }
    useBoundStore.setState({
      boardHexes: { [svgHex.id]: svgHex },
      boardPieces: [],
      viewingLevel: 1,
      is2DOverlayLevelEnabled: false,
    })

    const svg = renderSvgHex(svgHex)
    const markedLines = svg.match(/<line\b(?=[^>]*stroke="#808080")/g) ?? []
    const [svgLine] = svg.match(/<line\b[^>]*>/g) ?? []
    const expectedLine = getShroudshroom13OriginLine(0, SVG_HEX_RADIUS)

    expect(markedLines).toHaveLength(1)
    expect(svgLine).toContain(`x1="${expectedLine.x1}"`)
    expect(svgLine).toContain(`y1="${expectedLine.y1}"`)
    expect(svgLine).toContain(`x2="${expectedLine.x2}"`)
    expect(svgLine).toContain(`y2="${expectedLine.y2}"`)
    expect(svg).toContain('stroke-width="1"')
    expect(svg).toContain('stroke-linecap="round"')
    expect(
      renderSvgHex(
        makeVisibleHex(
          Pieces.shroudshroom13,
          HexTerrain.shroudshroom,
          0,
          false,
        ),
      ),
    ).not.toContain('<line')
    expect(
      renderSvgHex(
        makeVisibleHex(Pieces.shroudshroom7, HexTerrain.shroudshroom),
      ),
    ).not.toContain('<line')
    expect(
      renderSvgHex(
        makeVisibleHex(Pieces.shroudshroom10, HexTerrain.shroudshroom),
      ),
    ).not.toContain('<line')
    expect(
      renderSvgHex(makeVisibleHex(Pieces.outcrop1, HexTerrain.outcrop)),
    ).not.toContain('<line')
  })

  it('renders the same line geometry in the PDF component', () => {
    const hex = makeHex(Pieces.shroudshroom13, HexTerrain.shroudshroom, 4)
    useBoundStore.setState({
      boardHexes: { [hex.id]: hex },
      boardPieces: [],
      viewingLevel: 1,
      is2DOverlayLevelEnabled: false,
    })

    const [line] = findPdfLines(renderPdfHex(hex))

    expect(line).toBeDefined()
    expect(line.props).toMatchObject({
      ...getShroudshroom13OriginLine(4, SVG_HEX_RADIUS),
      stroke: SHROUDSHROOM13_ORIGIN_LINE_COLOR,
      strokeWidth: SHROUDSHROOM13_ORIGIN_LINE_WIDTH,
      strokeLinecap: 'round',
    })
    const sublevelPdfHex = { ...hex, altitude: 0 }
    useBoundStore.setState({
      boardHexes: { [sublevelPdfHex.id]: sublevelPdfHex },
    })
    expect(findPdfLines(renderPdfHex(sublevelPdfHex))[0]?.props).toMatchObject({
      stroke: SHROUDSHROOM13_ORIGIN_LINE_SUBLEVEL_COLOR,
    })
  })
})
