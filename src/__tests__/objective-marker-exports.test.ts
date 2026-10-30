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
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import {
  getObjectiveMarkerFootprint,
  type ObjectiveMarker,
} from '../data/objectiveMarkers'
import {
  getObjectiveMarkerExportGeometry,
  getPdfLegendObjectiveMarkers,
  getPdfVisibleObjectiveMarkers,
  getSvgObjectiveMarkerFooterHeight,
  getSvgVisibleObjectiveMarkers,
} from '../pdf-svg-shared/objectiveMarkerExport'
import {
  PdfObjectiveMarkerLegendPaths,
  PdfObjectiveMarkerPaths,
} from '../pdf-map/PdfObjectiveMarkers'
import type { OpenTypeFont } from '../svg-map/exportSvg'
import {
  SvgObjectiveMarkerLegend,
  SvgObjectiveMarkerOverlay,
} from '../svg-map/SvgObjectiveMarkerOverlay'
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

describe('shared objective-marker export geometry', () => {
  it('uses the shared outline for single- and two-hex markers', () => {
    const single = getObjectiveMarkerExportGeometry(marker())
    const double = getObjectiveMarkerExportGeometry(
      marker({ size: 2, rotation: 3 }),
    )

    expect(single.outerPoints).toHaveLength(6)
    expect(single.facePoints).toHaveLength(6)
    expect(double.outerPoints.length).toBeGreaterThan(6)
    expect(double.facePoints.length).toBe(double.outerPoints.length)
    expect(double.rotationDegrees).toBe(180)
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
    const [, label] = elementChildren(row)

    expect(output.type).toBe(Svg)
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
