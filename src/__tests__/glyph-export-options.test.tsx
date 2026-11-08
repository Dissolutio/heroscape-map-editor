import { G } from '@react-pdf/renderer'
import { Children, createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import {
  getGlyphExportOptions,
  makeGlyphCoordinateLookup,
} from '../pdf-svg-shared/glyphExportOptions'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import { PdfGlyphPower, PdfMultiHex1 } from '../pdf-map/PdfMapShapes'
import useBoundStore from '../store/store'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { type BoardHex, HexTerrain, Pieces } from '../types'
import { svgColors } from '../world/maphex/hexColors'
import type { BuriedMarksByUID } from '../utils/tileMarks'

const makeHex = (
  inventoryID: string,
  terrain: string,
  altitude: number,
): BoardHex => ({
  id: `${altitude}~0~0`,
  q: 0,
  r: 0,
  s: 0,
  altitude,
  pieceID: `${altitude}~0~0~0~${inventoryID}`,
  inventoryID,
  terrain,
  pieceRotation: 0,
  isObstacleOrigin: true,
})

const outcropHex = makeHex(Pieces.outcrop1, HexTerrain.outcrop, 1)
const grassHex = makeHex(Pieces.grass1, HexTerrain.grass, 1)
const glyphHex = makeHex(Pieces.glyphPower, HexTerrain.glyphPower, 2)
const boardHexes = {
  [outcropHex.id]: outcropHex,
  [glyphHex.id]: glyphHex,
}
const landWithGlyph = {
  [grassHex.id]: grassHex,
  [glyphHex.id]: glyphHex,
}

const initialState = useBoundStore.getState()

const setExportState = (
  options: {
    isHideHeightsOnGlyphs?: boolean
  } = {},
) => {
  useBoundStore.setState({
    boardHexes,
    boardPieces: [],
    viewingLevel: 2,
    is2DOverlayLevelEnabled: false,
    isShow2DExportTileLetters: false,
    isShow2DExportBuriedMarks: false,
    isHideHeightsOnGlyphs: false,
    ...options,
  })
}

const renderSvgHex = (hex: BoardHex) =>
  (() => {
    const settings = useBoundStore.getState()
    return renderToStaticMarkup(
      createElement(
        'svg',
        { xmlns: 'http://www.w3.org/2000/svg' },
        createElement(SvgMapHex, {
          hex,
          buriedMarksByUID: {} as BuriedMarksByUID,
          viewingLevel: 2,
          overlayLevel: 3,
          isVisible: true,
          isSubLevel: false,
          isOverlayViewing: false,
          is2DOverlayLevelEnabled: false,
          isShow2DExportTileLetters: settings.isShow2DExportTileLetters,
          isShow2DExportBuriedMarks: settings.isShow2DExportBuriedMarks,
          glyphCoordinates: makeGlyphCoordinateLookup(settings.boardHexes),
          glyphExportSettings: settings,
        }),
      ),
    )
  })()

const renderPdfHex = (hex: BoardHex) => {
  const settings = useBoundStore.getState()
  return PdfMapHex({
    hex,
    viewingLevel: 2,
    isOverlayViewing: true,
    isPdfColorBorders: false,
    isShowPdfOverlayOnPlacedLevel: false,
    isShowPdfTileLetters: false,
    isShowPdfBuriedMarks: false,
    buriedMarksByUID: {} as BuriedMarksByUID,
    useLegacyStartZones: false,
    glyphCoordinates: makeGlyphCoordinateLookup(settings.boardHexes),
    glyphExportSettings: settings,
  })
}

const childElements = (element: ReactElement | null) => {
  if (!element) throw new Error('Expected PDF hex output')
  return Children.toArray(element.props.children) as ReactElement[]
}

afterEach(() => {
  useBoundStore.setState({
    boardHexes: initialState.boardHexes,
    boardPieces: initialState.boardPieces,
    viewingLevel: initialState.viewingLevel,
    is2DOverlayLevelEnabled: initialState.is2DOverlayLevelEnabled,
    isShow2DExportTileLetters: initialState.isShow2DExportTileLetters,
    isShow2DExportBuriedMarks: initialState.isShow2DExportBuriedMarks,
    isHideHeightsOnGlyphs: initialState.isHideHeightsOnGlyphs,
  })
})

describe('shared glyph export options', () => {
  it.each([HexTerrain.glyphPower, HexTerrain.glyphTreasure])(
    'recognizes %s as a glyph space',
    (terrain) => {
      const hex = makeHex(Pieces.glyphPower, terrain, 1)
      expect(
        getGlyphExportOptions(
          hex,
          makeGlyphCoordinateLookup({ [hex.id]: hex }),
          {
            isHideHeightsOnGlyphs: true,
          },
        ),
      ).toEqual({ hideHeight: true })
    },
  )

  it('recognizes land at a glyph coordinate', () => {
    expect(
      getGlyphExportOptions(
        grassHex,
        makeGlyphCoordinateLookup(landWithGlyph),
        {
          isHideHeightsOnGlyphs: true,
        },
      ),
    ).toEqual({ hideHeight: true })
  })

  it('does not treat start zones as glyph spaces', () => {
    const startZone = makeHex(Pieces.startZone1, HexTerrain.startZone, 2)
    expect(
      getGlyphExportOptions(
        startZone,
        makeGlyphCoordinateLookup({ [startZone.id]: startZone }),
        {
          isHideHeightsOnGlyphs: true,
        },
      ),
    ).toEqual({ hideHeight: false })
  })
})

describe('SVG and PDF glyph exports', () => {
  it('always renders glyph fills, outlines, and symbols in SVG', () => {
    setExportState()
    const markup = renderSvgHex(glyphHex)
    const fills = [...markup.matchAll(/<polygon[^>]*fill="([^"]+)"/g)].map(
      (match) => match[1],
    )

    expect(fills[0]).toBe(svgColors.glyphPower)
    expect(fills[1]).toBe(svgColors.glyphBorder)
    expect(markup).toContain('>?</text>')
  })

  it('hides height text on a lower hex at a glyph coordinate in SVG', () => {
    setExportState()
    const height = String(piecesSoFar[Pieces.outcrop1].height)
    expect(renderSvgHex(outcropHex)).toContain(`>${height}</text>`)

    setExportState({ isHideHeightsOnGlyphs: true })
    expect(renderSvgHex(outcropHex)).not.toContain(`>${height}</text>`)
  })

  it('always renders glyph fills, outlines, and symbols in PDF', () => {
    setExportState()
    const glyph = renderPdfHex(glyphHex)
    const [shape, text] = childElements(glyph)
    const polygon = PdfGlyphPower(shape.props)

    expect(polygon.props.fill).toBe(svgColors.glyphPower)
    expect(polygon.props.stroke).toBe(svgColors.glyphBorder)
    expect(text.props.children).toBe(piecesSoFar[Pieces.glyphPower].glyphLetter)
    expect(text.props.fill).toBe(svgColors.glyphText)
  })

  it('hides height text on a lower hex at a glyph coordinate in PDF', () => {
    setExportState()
    expect(childElements(renderPdfHex(outcropHex))).toHaveLength(2)

    setExportState({ isHideHeightsOnGlyphs: true })
    expect(
      getGlyphExportOptions(
        outcropHex,
        makeGlyphCoordinateLookup(useBoundStore.getState().boardHexes),
        useBoundStore.getState(),
      ).hideHeight,
    ).toBe(true)
    const hiddenHeight = childElements(renderPdfHex(outcropHex))
    expect(hiddenHeight).toHaveLength(1)
    expect(hiddenHeight[0]?.type).toBe(PdfMultiHex1)
  })

  it('keeps start-zone PDF rendering outside glyph exports', () => {
    const startZone = makeHex(Pieces.startZone1, HexTerrain.startZone, 2)
    setExportState()
    const renderedStartZone = PdfMapHex({
      hex: startZone,
      viewingLevel: 2,
      isOverlayViewing: true,
      isPdfColorBorders: false,
      isShowPdfOverlayOnPlacedLevel: false,
      isShowPdfTileLetters: false,
      isShowPdfBuriedMarks: false,
      buriedMarksByUID: {} as BuriedMarksByUID,
      useLegacyStartZones: false,
    })

    expect(renderedStartZone?.type).toBe(G)
  })
})
