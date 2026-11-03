import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import {
  PdfGlyphPower,
  PdfGlyphTreasure,
  PdfMultiHex1,
} from '../pdf-map/PdfMapShapes'
import { getHexagonPdfPolygonPointsAt00 } from '../pdf-svg-shared/hexPolygonPoints'
import useBoundStore from '../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../types'
import { PDF_BORDER_WIDTH, SVG_HEX_RADIUS } from '../utils/constants'
import { svgColors, svgSubLevelColors } from '../world/maphex/hexColors'
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

const initialState = useBoundStore.getState()

const setExportState = (
  hexes: BoardHex[],
  options: {
    isTransparentGlyphSpaces?: boolean
    isHideHeightsOnGlyphs?: boolean
  } = {},
) => {
  useBoundStore.setState({
    boardHexes: Object.fromEntries(hexes.map((hex) => [hex.id, hex])),
    boardPieces: [],
    viewingLevel: 0,
    is2DOverlayLevelEnabled: false,
    isShow2DExportTileLetters: false,
    isShow2DExportBuriedMarks: false,
    isTransparentGlyphSpaces: false,
    isHideHeightsOnGlyphs: false,
    ...options,
  })
}

const renderPdfHex = (
  hex: BoardHex,
  options: {
    viewingLevel?: number
    isOverlayViewing?: boolean
    isShowPdfOverlayOnPlacedLevel?: boolean
  } = {},
) =>
  PdfMapHex({
    hex,
    viewingLevel: options.viewingLevel ?? hex.altitude,
    isOverlayViewing: options.isOverlayViewing ?? true,
    isPdfColorBorders: false,
    isShowPdfOverlayOnPlacedLevel:
      options.isShowPdfOverlayOnPlacedLevel ?? false,
    isShowPdfTileLetters: false,
    isShowPdfBuriedMarks: false,
    buriedMarksByUID: {} as BuriedMarksByUID,
    useLegacyStartZones: false,
  })

type PdfChildProps = {
  children?: ReactNode
  fill?: string
  isSubLevel?: boolean
  isTransparent?: boolean
}

const childElements = (element: ReactElement | null) => {
  if (!element) throw new Error('Expected PDF hex output')
  return Children.toArray(element.props.children).filter(
    (child): child is ReactElement<PdfChildProps> => isValidElement(child),
  )
}

const polygonForHex = (hex: BoardHex, child: ReactElement) => {
  const shape =
    hex.terrain === HexTerrain.glyphPower ? PdfGlyphPower : PdfGlyphTreasure
  return shape(child.props)
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

describe('PDF glyph rendering', () => {
  it.each([
    [
      'power',
      PdfGlyphPower,
      svgColors.glyphPower,
      svgSubLevelColors.glyphPower,
    ],
    [
      'treasure',
      PdfGlyphTreasure,
      svgColors.glyphTreasure,
      svgSubLevelColors.glyphTreasure,
    ],
  ] as const)(
    'renders the %s glyph at the full hex radius and uses matching level colors',
    (_name, GlyphShape, levelFill, subLevelFill) => {
      const expectedPoints = getHexagonPdfPolygonPointsAt00(
        SVG_HEX_RADIUS,
        PDF_BORDER_WIDTH,
      ).points
      const levelShape = GlyphShape({})
      const subLevelShape = GlyphShape({ isSubLevel: true })

      expect(levelShape.props.points).toBe(expectedPoints)
      expect(subLevelShape.props.points).toBe(expectedPoints)
      expect(levelShape.props.fill).toBe(levelFill)
      expect(subLevelShape.props.fill).toBe(subLevelFill)
      expect(levelShape.props.stroke).toBe(svgColors.glyphBorder)
      expect(subLevelShape.props.stroke).toBe(svgSubLevelColors.glyphBorder)
      expect(levelShape.props.strokeWidth).toBe(PDF_BORDER_WIDTH)
      expect(subLevelShape.props.strokeWidth).toBe(PDF_BORDER_WIDTH)
    },
  )

  it('uses the normal palette for overlay-viewed sub-level glyphs', () => {
    const subLevelGlyph = makeHex(Pieces.glyphPower, HexTerrain.glyphPower, 0)
    setExportState([subLevelGlyph])
    const children = childElements(
      renderPdfHex(subLevelGlyph, {
        viewingLevel: 1,
        isOverlayViewing: true,
      }),
    )
    const [shape, text] = children
    const polygon = polygonForHex(subLevelGlyph, shape)

    expect(shape.type).toBe(PdfGlyphPower)
    expect(polygon.props.fill).toBe(svgColors.glyphPower)
    expect(text.props.fill).toBe(svgColors.glyphText)
  })

  it('preserves transparency and the glyph letter', () => {
    const namedGlyphEntry = Object.entries(piecesSoFar).find(
      ([, piece]) =>
        piece.terrain === HexTerrain.glyphPower &&
        piece.glyphLetter !== undefined &&
        piece.glyphLetter !== '?',
    )
    expect(namedGlyphEntry).toBeDefined()
    if (!namedGlyphEntry) return

    const [inventoryID, piece] = namedGlyphEntry
    const namedGlyph = makeHex(inventoryID, HexTerrain.glyphPower, 0)
    setExportState([namedGlyph])
    const normalChildren = childElements(renderPdfHex(namedGlyph))
    const normalPolygon = polygonForHex(namedGlyph, normalChildren[0])

    setExportState([namedGlyph], { isTransparentGlyphSpaces: true })
    const transparentChildren = childElements(renderPdfHex(namedGlyph))
    const transparentPolygon = polygonForHex(namedGlyph, transparentChildren[0])

    expect(normalPolygon.props.fill).toBe(svgColors.glyphPower)
    expect(transparentPolygon.props.fill).toBe('none')
    expect(transparentPolygon.props.stroke).toBe(svgColors.glyphBorder)
    expect(normalChildren[1].props.children).toBe(piece.glyphLetter)
    expect(transparentChildren[1].props.children).toBe(piece.glyphLetter)
    expect(transparentChildren[1].props.fill).toBe(svgColors.glyphText)
  })

  it('still hides height text under glyph coordinates when enabled', () => {
    const outcrop = makeHex(Pieces.outcrop1, HexTerrain.outcrop, 0)
    const glyph = makeHex(Pieces.glyphPower, HexTerrain.glyphPower, 1)
    setExportState([outcrop, glyph])

    expect(
      childElements(renderPdfHex(outcrop, { viewingLevel: 1 })),
    ).toHaveLength(2)

    setExportState([outcrop, glyph], { isHideHeightsOnGlyphs: true })
    const hiddenHeight = childElements(
      renderPdfHex(outcrop, { viewingLevel: 1 }),
    )
    expect(hiddenHeight).toHaveLength(1)
    expect(hiddenHeight[0].type).toBe(PdfMultiHex1)
  })
})
