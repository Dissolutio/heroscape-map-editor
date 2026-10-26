import { inflateSync } from 'node:zlib'
import { Document, G, Page, Svg, renderToBuffer } from '@react-pdf/renderer'
import { type ComponentType, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import {
  PdfMultiHex1,
  PdfMultiHex2,
  PdfMultiHex3,
  PdfMultiHex7,
  PdfMultiHex24,
} from '../pdf-map/PdfMapShapes'
import {
  ASPHALT_BORDER_COLOR,
  ASPHALT_SUBLEVEL_BORDER_COLOR,
  getExportBorderColor,
} from '../pdf-svg-shared/exportBorderColor'
import useBoundStore from '../store/store'
import {
  SvgMultiHex1,
  SvgMultiHex2,
  SvgMultiHex3,
  SvgMultiHex7,
  SvgMultiHex24,
} from '../svg-map/SvgMapShapes'
import { type BoardHex, HexTerrain, Pieces } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { svgColors, svgSubLevelColors } from '../world/maphex/hexColors'

const originalColorBorder = '#abcdef'
const initialColorOutlines = useBoundStore.getState().isPdfColorBorders

const pdfColorOperator = (color: string) =>
  color
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => String(Number.parseInt(channel, 16) / 255))
    .join(' ') ?? ''

afterEach(() => {
  useBoundStore.setState({ isPdfColorBorders: initialColorOutlines })
})

describe('SVG/PDF export border color decision', () => {
  it.each(Object.values(HexTerrain))(
    'preserves the established border policy for %s',
    (terrain) => {
      for (const [isSubLevel, fallback] of [
        [false, '#000000'],
        [true, '#808080'],
      ] as const) {
        const isFluid = isFluidTerrainHex(terrain)
        const isSolid = isSolidTerrainHex(terrain)
        const coloredBorder = `${originalColorBorder}${isSubLevel ? 'sub' : ''}`
        const defaultBorderColor = isSolid ? fallback : coloredBorder
        expect(
          getExportBorderColor({
            terrain,
            isFluid,
            isSubLevel,
            useTerrainBorderColor: true,
            colorBorder: coloredBorder,
            defaultBorderColor: fallback,
          }),
        ).toBe(coloredBorder)

        expect(
          getExportBorderColor({
            terrain,
            isFluid,
            isSubLevel,
            useTerrainBorderColor: false,
            colorBorder: coloredBorder,
            defaultBorderColor,
          }),
        ).toBe(
          isFluid
            ? coloredBorder
            : isSolid && terrain === HexTerrain.asphalt
              ? isSubLevel
                ? ASPHALT_SUBLEVEL_BORDER_COLOR
                : ASPHALT_BORDER_COLOR
              : defaultBorderColor,
        )
      }
    },
  )

  it.each([
    [Pieces.asphalt1, SvgMultiHex1, svgColors.outline1],
    [Pieces.asphalt2, SvgMultiHex2, svgColors.outline2],
    [Pieces.asphalt3, SvgMultiHex3, svgColors.outline3],
    [Pieces.asphalt7, SvgMultiHex7, svgColors.outline7],
    [Pieces.asphalt24, SvgMultiHex24, svgColors.outline24],
  ] as [
    string,
    ComponentType<{ hex: BoardHex; isSubLevel?: boolean }>,
    string,
  ][])(
    'changes only the border color in SVG for %s with color outlines off',
    (inventoryID, Shape, coloredBorder) => {
      const hex = {
        boardPieceID: `${inventoryID}-board-piece`,
        inventoryID,
        altitude: 0,
        rotation: 0,
        boardHexID: '0~0~0',
        pieceCoords: { q: 0, r: 0, s: 0 },
        terrain: HexTerrain.asphalt,
      } as unknown as BoardHex

      useBoundStore.setState({ isPdfColorBorders: true })
      const coloredMarkup = renderToStaticMarkup(createElement(Shape, { hex }))
      useBoundStore.setState({ isPdfColorBorders: false })
      const grayscaleMarkup = renderToStaticMarkup(
        createElement(Shape, { hex }),
      )

      expect(grayscaleMarkup).toContain(`fill="${ASPHALT_BORDER_COLOR}"`)
      expect(coloredMarkup).toContain(`fill="${coloredBorder}"`)
      expect(
        grayscaleMarkup.replace(
          `fill="${ASPHALT_BORDER_COLOR}"`,
          `fill="${coloredBorder}"`,
        ),
      ).toBe(coloredMarkup)
    },
  )

  it('keeps the sub-level Asphalt shade and changes only its SVG border', () => {
    const hex = {
      boardPieceID: `${Pieces.asphalt1}-board-piece`,
      inventoryID: Pieces.asphalt1,
      altitude: 0,
      rotation: 0,
      boardHexID: '0~0~0',
      pieceCoords: { q: 0, r: 0, s: 0 },
      terrain: HexTerrain.asphalt,
    } as unknown as BoardHex

    useBoundStore.setState({ isPdfColorBorders: true })
    const coloredMarkup = renderToStaticMarkup(
      createElement(SvgMultiHex1, { hex, isSubLevel: true }),
    )
    useBoundStore.setState({ isPdfColorBorders: false })
    const grayscaleMarkup = renderToStaticMarkup(
      createElement(SvgMultiHex1, { hex, isSubLevel: true }),
    )

    expect(grayscaleMarkup).toContain('fill="#7A7A7A"')
    expect(grayscaleMarkup).toContain(`fill="${ASPHALT_SUBLEVEL_BORDER_COLOR}"`)
    expect(
      grayscaleMarkup.replace(
        `fill="${ASPHALT_SUBLEVEL_BORDER_COLOR}"`,
        `fill="${svgSubLevelColors.outline1}"`,
      ),
    ).toBe(coloredMarkup)
  })

  it('renders the gray Asphalt border in PDF output with color outlines off', async () => {
    const pdfShapes = [
      [Pieces.asphalt1, PdfMultiHex1, svgColors.outline1, false],
      [Pieces.asphalt2, PdfMultiHex2, svgColors.outline2, false],
      [Pieces.asphalt3, PdfMultiHex3, svgColors.outline3, false],
      [Pieces.asphalt7, PdfMultiHex7, svgColors.outline7, false],
      [Pieces.asphalt24, PdfMultiHex24, svgColors.outline24, false],
      [Pieces.asphalt1, PdfMultiHex1, svgSubLevelColors.outline1, true],
    ] as const
    const renderPdf = async (useTerrainBorderColor: boolean) =>
      renderToBuffer(
        createElement(
          Document,
          null,
          createElement(
            Page,
            { size: [600, 200] },
            createElement(
              Svg,
              { width: 600, height: 200, viewBox: '0 0 600 200' },
              ...pdfShapes.map(([inventoryID, Shape, , isSubLevel], index) => {
                const hex = {
                  boardPieceID: `${inventoryID}-board-piece`,
                  inventoryID,
                  altitude: 0,
                  rotation: 0,
                  boardHexID: '0~0~0',
                  pieceCoords: { q: 0, r: 0, s: 0 },
                  terrain: HexTerrain.asphalt,
                } as unknown as BoardHex
                return createElement(
                  G,
                  {
                    key: `${inventoryID}-${isSubLevel}`,
                    transform: `translate(${index * 100} 100)`,
                  },
                  createElement(Shape, {
                    hex,
                    isSubLevel,
                    useTerrainBorderColor,
                  }),
                )
              }),
            ),
          ),
        ),
      )
    const [coloredPdf, grayscalePdf] = await Promise.all([
      renderPdf(true),
      renderPdf(false),
    ])
    const getPdfContent = (pdf: Buffer) =>
      [
        ...pdf
          .toString('latin1')
          .matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g),
      ]
        .map((match) => {
          try {
            return inflateSync(Buffer.from(match[1], 'latin1')).toString(
              'latin1',
            )
          } catch {
            return match[1]
          }
        })
        .join('\n')

    const coloredContent = getPdfContent(coloredPdf)
    const grayscaleContent = getPdfContent(grayscalePdf)
    const coloredStrokes = pdfShapes.map(
      ([, , borderColor]) => `${pdfColorOperator(borderColor)} SCN`,
    )
    let strokeIndex = 0
    const normalizedGrayscaleContent = grayscaleContent.replace(
      /[\d.]+ [\d.]+ [\d.]+ SCN/g,
      () => coloredStrokes[strokeIndex++],
    )

    expect(strokeIndex).toBe(pdfShapes.length)
    expect(grayscaleContent).toContain(
      `${pdfColorOperator(ASPHALT_BORDER_COLOR)} SCN`,
    )
    expect(grayscaleContent).toContain(
      `${pdfColorOperator(ASPHALT_SUBLEVEL_BORDER_COLOR)} SCN`,
    )
    expect(normalizedGrayscaleContent).toBe(coloredContent)
  })
})
