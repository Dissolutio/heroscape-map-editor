import { inflateSync } from 'node:zlib'
import {
  Document,
  G,
  Page,
  Path,
  Polygon,
  Svg,
  renderToBuffer,
} from '@react-pdf/renderer'
import { type ReactElement, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import {
  type ObjectiveMarker,
  getObjectiveMarkerFootprint,
} from '../data/objectiveMarkers'
import {
  PdfObjectiveMarkerLegendPaths,
  PdfObjectiveMarkerPaths,
} from '../pdf-map/PdfObjectiveMarkers'
import {
  get1HexOutlineSvgPolygonPoints,
  get2HexOutlineSvgPolygonPoints,
  get2HexPdfPolygonPointsAt00,
  get2HexSvgPolygonPointsAt00,
  getHexagonPdfPolygonPointsAt00,
  getHexagonSvgPolygonPointsAt00,
} from '../pdf-svg-shared/hexPolygonPoints'
import {
  getObjectiveMarkerExportGeometry,
  getPdfLegendObjectiveMarkers,
  getPdfVisibleObjectiveMarkers,
  getSvgObjectiveMarkerFooterHeight,
  getSvgVisibleObjectiveMarkers,
} from '../pdf-svg-shared/objectiveMarkerExport'
import {
  SvgObjectiveMarkerLegend,
  SvgObjectiveMarkerOverlay,
} from '../svg-map/SvgObjectiveMarkerOverlay'
import type { OpenTypeFont } from '../svg-map/exportSvg'
import {
  PDF_BORDER_WIDTH,
  SVG_BORDER_WIDTH,
  SVG_HEX_APOTHEM,
  SVG_HEX_RADIUS,
} from '../utils/constants'
import { hexUtilsHexToPixel } from '../utils/map-utils'

const marker = (options: Partial<ObjectiveMarker> = {}): ObjectiveMarker => ({
  uid: 'marker-1',
  anchor: { q: 0, r: 0, s: 0, altitude: 2 },
  size: 1,
  rotation: 0,
  style: 'black',
  content: { kind: 'number', value: 1 },
  ...options,
})

const mockFont = (): OpenTypeFont => ({
  getAdvanceWidth: (text, fontSize) => text.length * fontSize * 0.5,
  getPath: vi.fn((text, x, y) => ({
    toPathData: () => `M${x} ${y}L${x + text.length} ${y}`,
  })),
})

const elementChildren = (element: ReactElement) => {
  const children = element.props.children
  return (Array.isArray(children) ? children : [children]).filter(
    Boolean,
  ) as ReactElement[]
}

const rotatePoint = (point: { x: number; y: number }, degrees: number) => {
  const radians = (degrees * Math.PI) / 180
  return {
    x: Math.cos(radians) * point.x - Math.sin(radians) * point.y,
    y: Math.sin(radians) * point.x + Math.cos(radians) * point.y,
  }
}

describe('shared objective-marker export geometry', () => {
  it('uses the land-tile footprint and border helpers for both sizes', () => {
    const single = getObjectiveMarkerExportGeometry(marker())
    const double = getObjectiveMarkerExportGeometry(marker({ size: 2 }))
    const singleOuter = getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS).corners
    const singleBorder = get1HexOutlineSvgPolygonPoints(
      SVG_HEX_RADIUS,
      SVG_BORDER_WIDTH,
    ).corners
    const doubleOuter = get2HexSvgPolygonPointsAt00(SVG_HEX_RADIUS).corners
    const doubleBorder = get2HexOutlineSvgPolygonPoints(
      SVG_HEX_RADIUS,
      SVG_BORDER_WIDTH,
    ).corners

    expect(single.outerPoints).toEqual(singleOuter)
    expect(single.svgBorderPoints).toEqual(singleBorder)
    expect(double.outerPoints).toEqual(
      doubleOuter.map(({ x, y }) => ({
        x: x - SVG_HEX_APOTHEM,
        y,
      })),
    )
    expect(double.svgBorderPoints).toEqual(
      doubleBorder.map(({ x, y }) => ({
        x: x - SVG_HEX_APOTHEM,
        y,
      })),
    )
    expect(single.facePoints).toEqual(
      getHexagonPdfPolygonPointsAt00(SVG_HEX_RADIUS, PDF_BORDER_WIDTH * 2)
        .corners,
    )
    expect(double.facePoints).toEqual(
      get2HexPdfPolygonPointsAt00(
        SVG_HEX_RADIUS,
        PDF_BORDER_WIDTH * 2,
      ).corners.map(({ x, y }) => ({
        x: x - SVG_HEX_APOTHEM,
        y,
      })),
    )
  })

  it('aligns the two-hex land footprint for all marker rotations', () => {
    const baseLandPoints = get2HexSvgPolygonPointsAt00(SVG_HEX_RADIUS).corners
    const anchor = marker({ size: 2 }).anchor
    const anchorPixel = hexUtilsHexToPixel(anchor)

    for (let rotation = 0; rotation < 6; rotation += 1) {
      const current = marker({
        size: 2,
        rotation: rotation as ObjectiveMarker['rotation'],
      })
      const geometry = getObjectiveMarkerExportGeometry(current)
      const actual = geometry.outerPoints.map((point) => {
        const rotated = rotatePoint(point, geometry.rotationDegrees)
        return {
          x: geometry.center.x + rotated.x,
          y: geometry.center.y + rotated.y,
        }
      })
      const expected = baseLandPoints.map((point) => {
        const rotated = rotatePoint(point, rotation * 60)
        return {
          x: anchorPixel.x + rotated.x,
          y: anchorPixel.y + rotated.y,
        }
      })

      expect(actual).toHaveLength(expected.length)
      actual.forEach((point, index) => {
        expect(point.x).toBeCloseTo(expected[index].x)
        expect(point.y).toBeCloseTo(expected[index].y)
      })
      expect(geometry.rotationDegrees).toBe(rotation * 60)
    }
  })

  it('keeps two-hex export text centered on the origin hex for every rotation', () => {
    const anchor = marker({ size: 2 }).anchor
    const origin = hexUtilsHexToPixel(anchor)

    for (let rotation = 0; rotation < 6; rotation += 1) {
      const current = marker({
        size: 2,
        rotation: rotation as ObjectiveMarker['rotation'],
      })
      const geometry = getObjectiveMarkerExportGeometry(current)
      const radians = (geometry.rotationDegrees * Math.PI) / 180
      const textX =
        geometry.center.x +
        Math.cos(radians) * geometry.textPosition.x -
        Math.sin(radians) * geometry.textPosition.y
      const textY =
        geometry.center.y +
        Math.sin(radians) * geometry.textPosition.x +
        Math.cos(radians) * geometry.textPosition.y

      expect(textX).toBeCloseTo(origin.x)
      expect(textY).toBeCloseTo(origin.y)
      expect(getObjectiveMarkerFootprint(current)).toHaveLength(2)
    }
  })

  it('keeps one-hex text at the marker center', () => {
    const geometry = getObjectiveMarkerExportGeometry(marker({ rotation: 4 }))

    expect(geometry.textPosition).toEqual({ x: 0, y: 0 })
    expect(geometry.rotationDegrees).toBe(240)
  })

  it('applies SVG and PDF placed-level and overlay visibility rules', () => {
    const markers = [
      marker({ uid: 'lower', anchor: { q: 0, r: 0, s: 0, altitude: 1 } }),
      marker({ uid: 'upper', anchor: { q: 1, r: -1, s: 0, altitude: 3 } }),
    ]

    expect(
      getSvgVisibleObjectiveMarkers(markers, 2, 4, false).map(
        (item) => item.uid,
      ),
    ).toEqual(['lower'])
    expect(
      getSvgVisibleObjectiveMarkers(markers, 4, 4, true).map(
        (item) => item.uid,
      ),
    ).toEqual(['lower', 'upper'])
    expect(getSvgVisibleObjectiveMarkers(markers, 3, 4, true)).toEqual([])

    expect(
      getPdfVisibleObjectiveMarkers(markers, 3, false, true).map(
        (item) => item.uid,
      ),
    ).toEqual(['upper'])
    expect(getPdfVisibleObjectiveMarkers(markers, 3, false, false)).toEqual([])
    expect(
      getPdfVisibleObjectiveMarkers(markers, 3, true, false).map(
        (item) => item.uid,
      ),
    ).toEqual(['lower', 'upper'])
    expect(getPdfLegendObjectiveMarkers(markers, false, false)).toEqual([])
    expect(getPdfLegendObjectiveMarkers(markers, true, false)).toEqual(markers)
  })

  it('reserves the SVG legend and buried-key footer without clipping', () => {
    expect(getSvgObjectiveMarkerFooterHeight(0, false, 12)).toBe(0)
    expect(getSvgObjectiveMarkerFooterHeight(0, true, 12)).toBe(18)
    expect(getSvgObjectiveMarkerFooterHeight(1, false, 12)).toBeCloseTo(35.4)
    expect(getSvgObjectiveMarkerFooterHeight(1, true, 12)).toBeCloseTo(61.2)
  })
})

describe('SVG objective-marker markup', () => {
  it('reuses marker footprint paths in the legend with a neutral outline', () => {
    const markers = [marker()]
    const overlay = SvgObjectiveMarkerOverlay({ markers })
    const legend = SvgObjectiveMarkerLegend({
      markers,
      x: 0,
      y: 0,
      fontSize: 12,
      rowHeight: 18,
    })
    if (!overlay || !legend) throw new Error('Expected marker SVG elements')
    const [markerGroup] = elementChildren(overlay)
    const [mapFace, mapBorder] = elementChildren(markerGroup)
    const [legendRow] = elementChildren(legend)
    const [legendShape] = elementChildren(legendRow)
    const [legendFace, legendBorder, neutralOutline] =
      elementChildren(legendShape)

    expect(legendFace?.props.points).toBe(mapFace?.props.points)
    expect(legendBorder?.props.points).toBe(mapBorder?.props.points)
    expect(neutralOutline?.props.points).toBe(mapFace?.props.points)
    expect(neutralOutline?.props.stroke).toBe('#888888')
    expect(neutralOutline?.props.strokeWidth).toBe(3)
  })

  it('renders rotated marker symbols, style colors, text, and named rows', () => {
    const markers = [
      marker({ content: { kind: 'number', value: 12 }, name: 'North' }),
      marker({
        uid: 'marker-2',
        anchor: { q: 2, r: -2, s: 0, altitude: 2 },
        style: 'white',
        size: 2,
        rotation: 2,
        content: { kind: 'text', value: 'A2' },
        name: 'South',
      }),
    ]
    const markup = renderToStaticMarkup(
      createElement(
        'svg',
        null,
        createElement(SvgObjectiveMarkerOverlay, { markers }),
        createElement(SvgObjectiveMarkerLegend, {
          markers,
          x: 0,
          y: 200,
          fontSize: 12,
          rowHeight: 18,
        }),
      ),
    )

    expect(markup).toContain('data-testid="objective-marker-overlay"')
    expect(markup).toContain('data-objective-marker-uid="marker-1"')
    expect(markup).toContain('rotate(120)')
    expect(markup).toContain('fill="#111111"')
    expect(markup).toContain('fill="#ffffff"')
    expect(markup).toContain('stroke="#888888"')
    expect(markup).toContain('>12</text>')
    expect(markup).toContain('>A2</text>')
    expect(markup).toContain('data-testid="objective-marker-legend"')
    expect(markup).toContain('>North</text>')
    expect(markup).toContain('>South</text>')
  })

  it('emits no marker or legend markup for empty inputs', () => {
    const markup = renderToStaticMarkup(
      createElement(
        'svg',
        null,
        createElement(SvgObjectiveMarkerOverlay, { markers: [] }),
        createElement(SvgObjectiveMarkerLegend, {
          markers: [],
          x: 0,
          y: 0,
          fontSize: 12,
          rowHeight: 18,
        }),
      ),
    )

    expect(markup).not.toContain('objective-marker')
    expect(markup).not.toContain('<polygon')
    expect(markup).not.toContain('<text')
  })
})

describe('PDF objective-marker primitives', () => {
  it('renders PDF polygons and path text, not DOM text nodes', () => {
    const font = mockFont()
    const output = PdfObjectiveMarkerPaths({
      markers: [marker({ content: { kind: 'text', value: 'Q2' } })],
      font,
    })
    if (!output) throw new Error('Expected PDF marker output')
    const [group] = elementChildren(output)
    const [outer, face, text] = elementChildren(group)

    expect(group.type).toBe(G)
    expect(outer?.type).toBe(Polygon)
    expect(face?.type).toBe(Polygon)
    expect(outer?.props.points).toBe(
      getObjectiveMarkerExportGeometry(
        marker({ content: { kind: 'text', value: 'Q2' } }),
      )
        .outerPoints.map(({ x, y }) => `${x},${y}`)
        .join(' '),
    )
    expect(text?.type).toBe(Path)
    expect(text?.props.d).toContain('M')
    expect(text?.props.children).toBeUndefined()
    expect(font.getPath).toHaveBeenCalledWith(
      'Q2',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      { kerning: true },
    )
  })

  it('renders the marker and its text as vector paths in PDF output', async () => {
    const pdf = await renderToBuffer(
      createElement(
        Document,
        null,
        createElement(
          Page,
          { size: [220, 180] },
          createElement(
            Svg,
            { width: 220, height: 180, viewBox: '0 0 220 180' },
            createElement(PdfObjectiveMarkerPaths, {
              markers: [marker({ content: { kind: 'text', value: 'R2' } })],
              font: mockFont(),
            }),
          ),
        ),
      ),
    )
    const content = [
      ...pdf
        .toString('latin1')
        .matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g),
    ]
      .map((match) => {
        try {
          return inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1')
        } catch {
          return match[1]
        }
      })
      .join('\n')

    expect(pdf.toString('latin1')).toContain('%PDF-')
    expect(content).toMatch(/-?[\d.]+ -?[\d.]+ m/)
    expect(content).not.toContain(' Tj')
  })

  it('uses path text for names in the PDF legend', () => {
    const font = mockFont()
    const output = PdfObjectiveMarkerLegendPaths({
      markers: [marker({ name: 'East Gate' })],
      font,
    })
    if (!output) throw new Error('Expected PDF legend output')
    const [row] = elementChildren(output)
    const [markerGroup, label] = elementChildren(row)
    const [outer, face, outline] = elementChildren(markerGroup)

    expect(output.type).toBe(Svg)
    expect(outer?.type).toBe(Polygon)
    expect(face?.type).toBe(Polygon)
    expect(outline?.type).toBe(Polygon)
    expect(outline?.props.stroke).toBe('#888888')
    expect(outline?.props.strokeWidth).toBe(4)
    expect(outline?.props.points).toBe(outer?.props.points)
    expect(label?.type).toBe(Path)
    expect(label?.props.d).toContain('M')
    expect(font.getPath).toHaveBeenCalledWith('East Gate', 42, 9, 9, {
      kerning: true,
    })
  })

  it('returns no PDF primitives for an empty marker list', () => {
    expect(PdfObjectiveMarkerPaths({ markers: [], font: null })).toBeNull()
    expect(
      PdfObjectiveMarkerLegendPaths({ markers: [], font: null }),
    ).toBeNull()
  })
})
