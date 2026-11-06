import { Text } from '@react-pdf/renderer'
import {
  Children,
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { getPieceGameHeight, piecesSoFar } from '../data/pieces'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import useBoundStore from '../store/store'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { type BoardHex, HexTerrain, Pieces } from '../types'
import type { BuriedMarksByUID } from '../utils/tileMarks'

type PdfTextProps = { children?: ReactNode }

const makeTreeHex = (inventoryID: string): BoardHex => ({
  id: '0~0~0',
  q: 0,
  r: 0,
  s: 0,
  altitude: 0,
  pieceID: `0~0~0~0~${inventoryID}`,
  inventoryID,
  terrain: HexTerrain.tree,
  pieceRotation: 0,
  isObstacleOrigin: true,
})

const initialState = useBoundStore.getState()

const setExportState = (hex: BoardHex) => {
  useBoundStore.setState({
    boardHexes: { [hex.id]: hex },
    boardPieces: [],
    viewingLevel: 0,
    is2DOverlayLevelEnabled: false,
    isShow2DExportTileLetters: false,
    isShow2DExportBuriedMarks: false,
    isHideHeightsOnGlyphs: false,
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
    viewingLevel: 0,
    isOverlayViewing: true,
    isPdfColorBorders: false,
    isShowPdfOverlayOnPlacedLevel: false,
    isShowPdfTileLetters: false,
    isShowPdfBuriedMarks: false,
    buriedMarksByUID: {} as BuriedMarksByUID,
    useLegacyStartZones: false,
  })

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

describe('printed piece heights', () => {
  it.each([
    [Pieces.tree10, 9, 10],
    [Pieces.tree12, 11, 12],
  ])(
    'keeps %s physical clearance while resolving its game height',
    (pieceID, physicalHeight, gameHeight) => {
      expect(piecesSoFar[pieceID].height).toBe(physicalHeight)
      expect(getPieceGameHeight(pieceID)).toBe(gameHeight)
    },
  )

  it('uses the physical height when no game-height override is needed', () => {
    expect(getPieceGameHeight(Pieces.tree11)).toBe(11)
  })

  it.each([
    Pieces.laurWallShort,
    Pieces.laurWallShortStackable,
    Pieces.laurWallLong,
    Pieces.laurWallLongStackable,
    Pieces.laurWallArch,
  ])('uses the rules height for %s without changing physical height', (id) => {
    expect(piecesSoFar[id].height).toBe(12)
    expect(getPieceGameHeight(id)).toBe(10)
  })

  it.each([
    Pieces.laurWallRuin1,
    Pieces.laurWallRuin2,
    Pieces.laurWallRuin3,
  ])('omits a game-height label for %s', (id) => {
    expect(getPieceGameHeight(id)).toBeUndefined()
  })

  it.each([
    [Pieces.tree10, 10],
    [Pieces.tree12, 12],
  ])('renders %s game height in both SVG and PDF', (pieceID, gameHeight) => {
    const hex = makeTreeHex(pieceID)
    setExportState(hex)

    expect(renderSvgHex(hex)).toContain(`>${gameHeight}</text>`)

    const pdf = renderPdfHex(hex)
    if (!pdf) throw new Error('Expected PDF hex output')
    const text = Children.toArray(pdf.props.children).filter(
      (child): child is ReactElement<PdfTextProps> =>
        isValidElement(child) && child.type === Text,
    )
    expect(text.map((element) => element.props.children)).toContain(gameHeight)
  })
})
