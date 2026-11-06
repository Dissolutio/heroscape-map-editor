import { Document, Font, renderToBuffer } from '@react-pdf/renderer'
import {
  Children,
  createElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { PdfLadderOverlayStack } from '../pdf-map/PdfLadderOverlay'
import { PdfMapLevels6PerPage } from '../pdf-map/PdfMap6LevelsPerPage'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import { PdfLadder, PdfMultiHex1 } from '../pdf-map/PdfMapShapes'
import { getHexagonPdfPolygonPointsAt00 } from '../pdf-svg-shared/hexPolygonPoints'
import { getLadderOverlayLevels } from '../pdf-svg-shared/ladderStack'
import useBoundStore from '../store/store'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../types'
import { PDF_BORDER_WIDTH, SVG_HEX_RADIUS } from '../utils/constants'
import { renderToStaticMarkup } from 'react-dom/server'
import { type Board, makeTable, place } from './helpers/board'
import type { BuriedMarksByUID } from '../utils/tileMarks'

type PdfProps = Record<string, unknown> & { children?: ReactNode }
type PdfElement = ReactElement<PdfProps>

// Walks a react-pdf element tree, calling function components (none of the PDF
// map components use hooks) and visiting every host element, e.g. 'PAGE'.
const walk = (node: ReactNode, visit: (element: PdfElement) => void) => {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit)
    return
  }
  if (!isValidElement(node)) return
  const element = node as PdfElement
  if (typeof element.type === 'function') {
    walk((element.type as (props: PdfProps) => ReactNode)(element.props), visit)
    return
  }
  if ((element.type as unknown) !== Fragment) visit(element)
  walk(Children.toArray(element.props.children), visit)
}

const collect = (node: ReactNode, type: string) => {
  const found: PdfElement[] = []
  walk(node, (element) => {
    if (element.type === type) found.push(element)
  })
  return found
}

const textOf = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (!isValidElement(node)) return ''
  return textOf((node.props as PdfProps).children)
}

const textsOf = (node: ReactNode) =>
  collect(node, 'TEXT').map((text) => textOf(text.props.children))

const ladder = (
  uid: string,
  altitude: number,
  q: number,
  r: number,
  rotation = 0,
): BoardPiece => ({
  uid,
  inventoryID: Pieces.ladder,
  altitude,
  rotation,
  pieceCoords: { q, r, s: -q - r },
})

const placeAll = (
  board: Board,
  pieces: { id: string; q: number; r: number; altitude: number; uid: string }[],
  rotation = 0,
) => {
  let next = board
  for (const piece of pieces) {
    const result = place({
      board: next,
      pieceID: piece.id,
      at: { q: piece.q, r: piece.r, s: -piece.q - piece.r },
      altitude: piece.altitude,
      uid: piece.uid,
      rotation,
      permissive: true,
    })
    next = result.board
  }
  return next
}

// A single ladder (edge A), a 3-ladder stack (edge B) and an edge with two
// runs separated by land (edge C: ladders at 1 and 3, land, ladders at 7 and 9).
const ladderBoard = (): Board => {
  let board: Board = makeTable(6)
  const floor = [
    [1, 2],
    [3, 2],
    [2, 4],
  ]
  board = placeAll(
    board,
    floor.map(([q, r], i) => ({
      id: 'g1',
      q,
      r,
      altitude: 0,
      uid: `floor-${i}`,
    })),
  )
  board = placeAll(board, [
    { id: Pieces.ladder, q: 1, r: 2, altitude: 1, uid: 'A1' },
  ])
  board = placeAll(
    board,
    [1, 3, 5].map((altitude) => ({
      id: Pieces.ladder,
      q: 3,
      r: 2,
      altitude,
      uid: `B${altitude}`,
    })),
    1,
  )
  board = placeAll(
    board,
    [
      { id: Pieces.ladder, q: 2, r: 4, altitude: 1, uid: 'C1' },
      { id: Pieces.ladder, q: 2, r: 4, altitude: 3, uid: 'C3' },
      { id: 'g1', q: 2, r: 4, altitude: 5, uid: 'C-land' },
      { id: 'g1', q: 2, r: 4, altitude: 6, uid: 'C-land2' },
      { id: Pieces.ladder, q: 2, r: 4, altitude: 7, uid: 'C7' },
      { id: Pieces.ladder, q: 2, r: 4, altitude: 9, uid: 'C9' },
    ],
    2,
  )
  return board
}

const fontFile = (name: string) =>
  fileURLToPath(new URL(`../../public/fonts/${name}`, import.meta.url))

// registerPdfFonts() registers browser URLs; a node render needs file paths
const registerNodeFonts = () => {
  Font.register({ family: 'Inter', src: fontFile('Inter_18pt-Bold.ttf') })
  Font.register({
    family: 'Proxima Nova Condensed Black',
    src: fontFile('ProximaNovaCondensedBlack.otf'),
  })
}

const initialState = useBoundStore.getState()

const setState = (
  board: Board,
  options: { isShowPdfLadderOverlay: boolean; isShowPdfOverlayLayer?: boolean },
) =>
  useBoundStore.setState({
    boardHexes: board.boardHexes,
    boardPieces: board.boardPieces,
    isShowPdfPieceLegend: false,
    isShowPdfLadderOverlay: options.isShowPdfLadderOverlay,
  })

const renderPdfMap = (board: Board, isShowPdfOverlayLayer = true) =>
  PdfMapLevels6PerPage({
    boardHexes: board.boardHexes,
    boardPieces: board.boardPieces,
    isPdfColorBorders: false,
    isShowPdfOverlayLayer,
    isShowPdfOverlayOnPlacedLevel: false,
    isShowPdfGridLinesOverSublevels: true,
    isShowPdfLevelLogo: true,
    isShowPdfTileLetters: false,
    isShowPdfBuriedMarks: false,
    buriedMarksByUID: {} as BuriedMarksByUID,
    useLegacyStartZones: false,
    is2DOverlayLevelEnabled: true,
    objectiveMarkers: [],
  })

const pageLabels = (board: Board, isShowPdfOverlayLayer = true) =>
  collect(renderPdfMap(board, isShowPdfOverlayLayer), 'PAGE').flatMap((page) =>
    textsOf(page),
  )

// In document order, one entry per level cell: the heading text before the
// level's SVG (a plain label only for overlay levels), the count texts drawn in
// it and how many white-with-black-border overlay hexes it holds.
const pageLevels = (board: Board) => {
  const levels: { label: string; counts: string[]; overlayHexes: number }[] = []
  let label = ''
  for (const page of collect(renderPdfMap(board), 'PAGE')) {
    walk(page, (element) => {
      if (element.type === 'TEXT') {
        const text = textOf(element.props.children)
        if (/^(Ladders|Glyphs and Start Zones|Level)/.test(text)) label = text
      }
      if (element.type !== 'SVG') return
      levels.push({
        label,
        counts: textsOf(element),
        overlayHexes: collect(element, 'POLYGON').filter(
          (polygon) =>
            polygon.props.fill === 'white' &&
            polygon.props.stroke === 'black' &&
            polygon.props.strokeWidth === PDF_BORDER_WIDTH,
        ).length,
      })
      label = ''
    })
  }
  return levels
}

const OVERLAY_LABELS = /^(Ladders|Glyphs and Start Zones)/

afterEach(() => {
  useBoundStore.setState({
    boardHexes: initialState.boardHexes,
    boardPieces: initialState.boardPieces,
    isShowPdfPieceLegend: initialState.isShowPdfPieceLegend,
    isShowPdfLadderOverlay: initialState.isShowPdfLadderOverlay,
  })
})

describe('PDF ladder overlay: no "x N" summary', () => {
  const stackHex = (piece: BoardPiece): BoardHex => ({
    id: `${piece.altitude + 1}~${piece.pieceCoords.q}~${piece.pieceCoords.r}`,
    ...piece.pieceCoords,
    altitude: piece.altitude + 1,
    pieceID: `${piece.altitude + 1}~${piece.pieceCoords.q}~${piece.pieceCoords.r}~${piece.rotation}~${Pieces.ladder}`,
    boardPieceUID: piece.uid,
    inventoryID: Pieces.ladder,
    terrain: HexTerrain.ladder,
    pieceRotation: piece.rotation,
    isObstacleOrigin: true,
  })

  it('draws every ladder of a stack with no text, in the PDF and the SVG', () => {
    const pieces = [ladder('l1', 1, 0, 0), ladder('l2', 3, 0, 0)]
    useBoundStore.setState({ boardPieces: pieces })
    for (const piece of pieces) {
      const hex = stackHex(piece)
      const pdf = PdfMapHex({
        hex,
        viewingLevel: 10,
        isOverlayViewing: false,
        isPdfColorBorders: false,
        isShowPdfOverlayOnPlacedLevel: false,
        isShowPdfTileLetters: false,
        isShowPdfBuriedMarks: false,
        buriedMarksByUID: {} as BuriedMarksByUID,
        useLegacyStartZones: false,
      })
      expect(textsOf(pdf)).toEqual([])
      expect(collect(pdf, 'POLYGON')).toHaveLength(1)
      const svg = renderToStaticMarkup(
        createElement(
          'svg',
          { xmlns: 'http://www.w3.org/2000/svg' },
          createElement(SvgMapHex, {
            hex,
            buriedMarksByUID: {} as BuriedMarksByUID,
          }),
        ),
      )
      expect(svg).not.toMatch(/<text/)
      expect(svg).not.toMatch(/x\d/)
    }
  })

  it('prints no "x N" text anywhere in the PDF map, with the overlay on or off', () => {
    const board = ladderBoard()
    for (const isShowPdfLadderOverlay of [false, true]) {
      setState(board, { isShowPdfLadderOverlay })
      const texts = collect(renderPdfMap(board), 'PAGE').flatMap(textsOf)
      expect(texts.filter((text) => /^x\s?\d+$/i.test(text))).toEqual([])
    }
  })
})

describe('PDF ladder overlay levels', () => {
  it('adds no ladder level when the option is off', () => {
    const board = ladderBoard()
    setState(board, { isShowPdfLadderOverlay: false })
    expect(pageLabels(board).filter((l) => /^Ladders/.test(l))).toEqual([])
  })

  it('adds no ladder level when the map has no ladders', () => {
    const board = placeAll(makeTable(4), [
      { id: 'g1', q: 1, r: 1, altitude: 0, uid: 'only-grass' },
    ])
    setState(board, { isShowPdfLadderOverlay: true })
    expect(pageLabels(board).filter((l) => /^Ladders/.test(l))).toEqual([])
  })

  it('adds one "Ladders" level per ladder run depth, after the StartZones/Glyphs level', () => {
    const board = ladderBoard()
    setState(board, { isShowPdfLadderOverlay: true })
    const labels = pageLabels(board).filter((label) =>
      OVERLAY_LABELS.test(label),
    )
    // edge C has two runs: two ladder levels
    expect(labels).toEqual([
      'Glyphs and Start Zones',
      'Ladders 1 of 2',
      'Ladders 2 of 2',
    ])
  })

  it('labels a single ladder level "Ladders" and works without the glyph level', () => {
    const board = placeAll(makeTable(4), [
      { id: 'g1', q: 1, r: 1, altitude: 0, uid: 'grass' },
      { id: Pieces.ladder, q: 1, r: 1, altitude: 1, uid: 'solo' },
    ])
    setState(board, { isShowPdfLadderOverlay: true })
    expect(
      pageLabels(board, false).filter((label) => OVERLAY_LABELS.test(label)),
    ).toEqual(['Ladders'])
  })

  it('draws a white 1-hex with a thin black border, the ladder shape and the count', () => {
    const board = ladderBoard()
    setState(board, { isShowPdfLadderOverlay: true })
    const levels = getLadderOverlayLevels(board.boardPieces)
    expect(levels).toHaveLength(2)

    const stack = levels[0].find((s) => s.bottom.uid === 'B1')
    if (!stack) throw new Error('expected the 3-ladder stack')
    const element = PdfLadderOverlayStack({ stack })
    const polygons = collect(element, 'POLYGON')
    expect(polygons).toHaveLength(2)

    const [hexPolygon, ladderPolygon] = polygons
    const expectedHexPoints = getHexagonPdfPolygonPointsAt00(
      SVG_HEX_RADIUS,
      PDF_BORDER_WIDTH,
    ).points
    expect(hexPolygon.props.points).toBe(expectedHexPoints)
    expect(hexPolygon.props.fill).toBe('white')
    expect(hexPolygon.props.stroke).toBe('black')
    expect(hexPolygon.props.strokeWidth).toBe(PDF_BORDER_WIDTH)
    // same shape as the 1-hex piece
    const multiHex1 = PdfMultiHex1({
      hex: { terrain: 'empty' } as BoardHex,
    })
    expect(hexPolygon.props.points).toBe(multiHex1.props.points)

    const ladderShape = PdfLadder({
      hex: { terrain: HexTerrain.ladder } as BoardHex,
    })
    expect(ladderPolygon.props.points).toBe(ladderShape.props.points)
    expect(ladderPolygon.props.points).not.toBe(expectedHexPoints)

    const texts = collect(element, 'TEXT')
    expect(texts).toHaveLength(1)
    expect(textOf(texts[0].props.children)).toBe('3')
    expect(texts[0].props.fill).toBe('black')
    expect(texts[0].props.textAnchor).toBe('middle')
    expect(texts[0].props.dominantBaseline).toBe('central')
  })

  it('rotates the ladder but not the count with the bottom ladder', () => {
    const board = ladderBoard()
    const levels = getLadderOverlayLevels(board.boardPieces)
    const stack = levels[0].find((s) => s.bottom.uid === 'B1')
    if (!stack) throw new Error('expected the 3-ladder stack')
    const groups = collect(PdfLadderOverlayStack({ stack }), 'G')
    const transforms = groups.map((g) => String(g.props.transform))
    expect(transforms[1]).toBe('rotate(60)') // rotation 1
  })

  it('shows the right counts on each ladder level when an edge has two runs', () => {
    const board = ladderBoard()
    setState(board, { isShowPdfLadderOverlay: true })
    const levels = pageLevels(board)
    const ladderLevels = levels.filter((level) => /^Ladders/.test(level.label))
    expect(ladderLevels.map((level) => level.label)).toEqual([
      'Ladders 1 of 2',
      'Ladders 2 of 2',
    ])
    // level 1: the single ladder, the 3-stack and edge C's first run (2)
    expect([...ladderLevels[0].counts].sort()).toEqual(['1', '2', '3'])
    // level 2: only edge C has a second run (2)
    expect(ladderLevels[1].counts).toEqual(['2'])
    expect(ladderLevels[0].overlayHexes).toBe(3)
    expect(ladderLevels[1].overlayHexes).toBe(1)
    // every other level, ladders included, has no count text
    for (const level of levels.filter((l) => !/^Ladders/.test(l.label))) {
      expect(level.counts).toEqual([])
      expect(level.overlayHexes).toBe(0)
    }
  })

  it('shows the ladder levels, in order, after the normal levels', () => {
    const board = ladderBoard()
    setState(board, { isShowPdfLadderOverlay: true })
    const labels = pageLevels(board).map((level) => level.label)
    expect(labels.slice(-3)).toEqual([
      'Glyphs and Start Zones',
      'Ladders 1 of 2',
      'Ladders 2 of 2',
    ])
  })
})

describe('PDF ladder overlay document', () => {
  it('renders a document with the ladder levels without throwing', async () => {
    registerNodeFonts()
    const board = ladderBoard()
    setState(board, { isShowPdfLadderOverlay: true })
    const pdf = await renderToBuffer(
      createElement(
        Document,
        null,
        createElement(PdfMapLevels6PerPage, {
          boardHexes: board.boardHexes,
          boardPieces: board.boardPieces,
          isPdfColorBorders: false,
          isShowPdfOverlayLayer: true,
          isShowPdfOverlayOnPlacedLevel: false,
          isShowPdfGridLinesOverSublevels: true,
          isShowPdfLevelLogo: true,
          isShowPdfTileLetters: false,
          isShowPdfBuriedMarks: false,
          buriedMarksByUID: {} as BuriedMarksByUID,
          useLegacyStartZones: false,
          is2DOverlayLevelEnabled: true,
          objectiveMarkers: [],
        }),
      ),
    )
    expect(pdf.byteLength).toBeGreaterThan(0)
  })
})
