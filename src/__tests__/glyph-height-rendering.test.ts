import { Children, createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import useBoundStore from '../store/store'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { type BoardHex, HexTerrain, Pieces } from '../types'
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
const glyphHex = makeHex(Pieces.glyphPower, HexTerrain.glyphPower, 2)
const initialState = useBoundStore.getState()

const setExportState = () => {
  useBoundStore.setState({
    boardHexes: {
      [outcropHex.id]: outcropHex,
      [glyphHex.id]: glyphHex,
    },
    boardPieces: [],
    viewingLevel: 2,
  })
}

const renderSvgHex = () =>
  renderToStaticMarkup(
    createElement(
      'svg',
      { xmlns: 'http://www.w3.org/2000/svg' },
      createElement(SvgMapHex, {
        hex: outcropHex,
        buriedMarksByUID: {} as BuriedMarksByUID,
        viewingLevel: 2,
      }),
    ),
  )

const renderPdfHex = () =>
  PdfMapHex({
    hex: outcropHex,
    viewingLevel: 2,
    isOverlayViewing: true,
    isPdfColorBorders: false,
    isShowPdfOverlayOnPlacedLevel: false,
    isShowPdfTileLetters: false,
    isShowPdfBuriedMarks: false,
    buriedMarksByUID: {} as BuriedMarksByUID,
    useLegacyStartZones: false,
  })

const pdfChildren = (element: ReactElement | null) => {
  if (!element) throw new Error('Expected PDF hex output')
  return Children.toArray(element.props.children) as ReactElement[]
}

afterEach(() => {
  useBoundStore.setState({
    boardHexes: initialState.boardHexes,
    boardPieces: initialState.boardPieces,
    viewingLevel: initialState.viewingLevel,
  })
})

describe('glyph height rendering', () => {
  it('keeps height labels visible at glyph coordinates in SVG and PDF', () => {
    setExportState()
    const height = piecesSoFar[Pieces.outcrop1].height

    expect(renderSvgHex()).toContain(`>${height}</text>`)
    expect(pdfChildren(renderPdfHex())[1]?.props.children).toBe(height)
  })
})
