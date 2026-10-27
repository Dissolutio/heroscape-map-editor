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

  it('keeps SVG map markup unchanged for either PDF border setting', () => {
    const fixtures = [
      [Pieces.asphalt1, HexTerrain.asphalt, SvgMultiHex1, false],
      [Pieces.asphalt2, HexTerrain.asphalt, SvgMultiHex2, false],
      [Pieces.asphalt3, HexTerrain.asphalt, SvgMultiHex3, false],
      [Pieces.asphalt7, HexTerrain.asphalt, SvgMultiHex7, false],
      [Pieces.asphalt24, HexTerrain.asphalt, SvgMultiHex24, false],
      [Pieces.asphalt1, HexTerrain.asphalt, SvgMultiHex1, true],
      [Pieces.grass1, HexTerrain.grass, SvgMultiHex1, false],
      [Pieces.grass2, HexTerrain.grass, SvgMultiHex2, false],
      [Pieces.water1, HexTerrain.water, SvgMultiHex1, false],
    ] as [
      string,
      HexTerrain,
      ComponentType<{ hex: BoardHex; isSubLevel?: boolean }>,
      boolean,
    ][]
    const renderSvgMap = (isPdfColorBorders: boolean) => {
      useBoundStore.setState({ isPdfColorBorders })
      return renderToStaticMarkup(
        createElement(
          'svg',
          { xmlns: 'http://www.w3.org/2000/svg' },
          ...fixtures.map(
            ([inventoryID, terrain, Shape, isSubLevel], index) => {
              const hex = {
                boardPieceID: `${inventoryID}-board-piece-${index}`,
                inventoryID,
                altitude: isSubLevel ? 0 : 1,
                rotation: 0,
                boardHexID: `${index}~0~${-index}`,
                pieceCoords: { q: index, r: 0, s: -index },
                terrain,
              } as unknown as BoardHex
              const positionIndex = isSubLevel ? 0 : index
              return createElement(
                'g',
                {
                  key: index,
                  transform: `translate(${positionIndex * 150} 0)`,
                },
                createElement(Shape, { hex, isSubLevel }),
              )
            },
          ),
        ),
      )
    }

    const markupWithColorSettingOn = renderSvgMap(true)
    const markupWithColorSettingOff = renderSvgMap(false)

    expect(markupWithColorSettingOff).toBe(markupWithColorSettingOn)
    expect(markupWithColorSettingOff).toContain(`fill="${svgColors.outline1}"`)
    expect(markupWithColorSettingOff).toContain(`fill="${svgColors.outline2}"`)
    expect(markupWithColorSettingOff).toContain(`fill="${svgColors.outline3}"`)
    expect(markupWithColorSettingOff).toContain(`fill="${svgColors.outline7}"`)
    expect(markupWithColorSettingOff).toContain(`fill="${svgColors.outline24}"`)
    expect(markupWithColorSettingOff).toContain(
      `fill="${svgSubLevelColors.outline1}"`,
    )
    expect(markupWithColorSettingOff).toContain(
      `fill="${svgColors.outlineWater}"`,
    )
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
