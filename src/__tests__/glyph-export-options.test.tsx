import { G } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { getGlyphExportOptions } from '../pdf-svg-shared/glyphExportOptions'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import { PdfMultiHex1 } from '../pdf-map/PdfMapShapes'
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
    isTransparentGlyphSpaces?: boolean
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
    isTransparentGlyphSpaces: false,
    isHideHeightsOnGlyphs: false,
    ...options,
  })
}

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
    viewingLevel: 2,
    isOverlayViewing: true,
    isPdfColorBorders: false,
    isShowPdfOverlayOnPlacedLevel: false,
    isShowPdfTileLetters: false,
    isShowPdfBuriedMarks: false,
    buriedMarksByUID: {} as BuriedMarksByUID,
    useLegacyStartZones: false,
  })

const childElements = (element: ReactElement | null) => {
  if (!element) throw new Error('Expected PDF hex output')
  return element.props.children as ReactElement[]
}

afterEach(() => {
  useBoundStore.setState({
    boardHexes: initialState.boardHexes,
    boardPieces: initialState.boardPieces,
    viewingLevel: initialState.viewingLevel,
    is2DOverlayLevelEnabled: initialState.is2DOverlayLevelEnabled,
    isShow2DExportTileLetters: initialState.isShow2DExportTileLetters,
    isShow2DExportBuriedMarks: initialState.isShow2DExportBuriedMarks,
    isTransparentGlyphSpaces: initialState.isTransparentGlyphSpaces,
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
          { [hex.id]: hex },
          {
            isTransparentGlyphSpaces: true,
            isHideHeightsOnGlyphs: true,
          },
        ),
      ).toEqual({ isTransparent: true, hideHeight: true })
    },
  )

  it('recognizes land at a glyph coordinate', () => {
    expect(
      getGlyphExportOptions(grassHex, landWithGlyph, {
        isTransparentGlyphSpaces: true,
        isHideHeightsOnGlyphs: true,
      }),
    ).toEqual({ isTransparent: false, hideHeight: true })
  })

  it('does not treat start zones as glyph spaces', () => {
    const startZone = makeHex(Pieces.startZone1, HexTerrain.startZone, 2)
    expect(
      getGlyphExportOptions(
        startZone,
        { [startZone.id]: startZone },
        {
          isTransparentGlyphSpaces: true,
          isHideHeightsOnGlyphs: true,
        },
      ),
    ).toEqual({ isTransparent: false, hideHeight: false })
  })
})

describe('SVG and PDF glyph exports', () => {
  it('keeps the glyph outline and symbol with a transparent SVG fill', () => {
    setExportState()
    const defaultMarkup = renderSvgHex(glyphHex)
    const defaultFills = [
      ...defaultMarkup.matchAll(/<polygon[^>]*fill="([^"]+)"/g),
    ].map((match) => match[1])

    setExportState({ isTransparentGlyphSpaces: true })
    const transparentMarkup = renderSvgHex(glyphHex)
    const transparentFills = [
      ...transparentMarkup.matchAll(/<polygon[^>]*fill="([^"]+)"/g),
    ].map((match) => match[1])

    expect(defaultFills[0]).not.toBe('none')
    expect(transparentFills[0]).toBe('none')
    expect(transparentFills[1]).toBe(svgColors.glyphBorder)
    expect(transparentMarkup).toContain('>?</text>')
  })

  it('hides height text on a lower hex at a glyph coordinate in SVG', () => {
    setExportState()
    const height = String(piecesSoFar[Pieces.outcrop1].height)
    expect(renderSvgHex(outcropHex)).toContain(`>${height}</text>`)

    setExportState({ isHideHeightsOnGlyphs: true })
    expect(renderSvgHex(outcropHex)).not.toContain(`>${height}</text>`)
  })

  it('sets transparent PDF glyph attributes and preserves the symbol', () => {
    setExportState()
    const defaultGlyph = renderPdfHex(glyphHex)
    const [defaultShape, defaultText] = childElements(defaultGlyph)
    const defaultPolygon = PdfMultiHex1(defaultShape.props)

    setExportState({ isTransparentGlyphSpaces: true })
    const transparentGlyph = renderPdfHex(glyphHex)
    const [transparentShape, transparentText] = childElements(transparentGlyph)
    const transparentPolygon = PdfMultiHex1(transparentShape.props)

    expect(defaultPolygon.props.fill).not.toBe('none')
    expect(defaultPolygon.props.stroke).toBe(transparentPolygon.props.stroke)
    expect(transparentPolygon.props.fill).toBe('none')
    expect(defaultText.props.children).toBe(
      piecesSoFar[Pieces.glyphPower].glyphLetter,
    )
    expect(transparentText.props.fill).toBe(svgColors.glyphText)
  })

  it('hides height text on a lower hex at a glyph coordinate in PDF', () => {
    setExportState()
    expect(childElements(renderPdfHex(outcropHex))).toHaveLength(2)

    setExportState({ isHideHeightsOnGlyphs: true })
    const hiddenHeight = childElements(renderPdfHex(outcropHex))
    expect(hiddenHeight).toHaveLength(1)
    expect(hiddenHeight[0]?.type).toBe(PdfMultiHex1)
  })

  it('keeps start-zone PDF rendering outside the glyph fill option', () => {
    const startZone = makeHex(Pieces.startZone1, HexTerrain.startZone, 2)
    setExportState({ isTransparentGlyphSpaces: true })
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
