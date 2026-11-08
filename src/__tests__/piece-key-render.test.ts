import { type ReactNode, createElement, isValidElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import { PieceKeyShape } from '../pdf-map/PdfPieceLegend'
import type { PieceKeyEntry } from '../pdf-svg-shared/pieceKey'
import { getPieceKeyModel } from '../pdf-svg-shared/pieceKey'
import { getPieceKeyShapeLayout } from '../pdf-svg-shared/pieceKeyShapeLayout'
import {
  getHexagonSvgPolygonPointsAt00,
  getLadderSvgPolygonPoints,
  getLaurLongWallSvgPolygonPoints,
  getShipBowSvgPolygonPoints,
  getShipWallSvgPolygonPoints,
} from '../pdf-svg-shared/hexPolygonPoints'
import useBoundStore from '../store/store'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { SvgPieceKeyShape } from '../svg-map/SvgPieceKey'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../types'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import { svgColors } from '../world/maphex/hexColors'
import { type Board, makeTable, place } from './helpers/board'

const initialGenericColors = {
  genericSolidCapColor: useBoundStore.getState().genericSolidCapColor,
  genericSolidSideColor: useBoundStore.getState().genericSolidSideColor,
}

afterEach(() => {
  useBoundStore.setState(initialGenericColors)
})

const collectShapeColors = (node: ReactNode): unknown[] => {
  if (Array.isArray(node)) return node.flatMap(collectShapeColors)
  if (!isValidElement(node)) return []

  const { type, props } = node
  if (typeof type === 'function') {
    const renderComponent = type as (componentProps: typeof props) => ReactNode
    return collectShapeColors(renderComponent(props))
  }
  const shapeColor =
    'fill' in props || 'stroke' in props
      ? {
          fill: props.fill,
          stroke: props.stroke,
          strokeWidth: props.strokeWidth,
        }
      : null
  return [
    ...(shapeColor ? [shapeColor] : []),
    ...collectShapeColors(props.children),
  ]
}

const collectTextContent = (node: ReactNode): string[] => {
  if (typeof node === 'string' || typeof node === 'number') {
    return [String(node)]
  }
  if (Array.isArray(node)) return node.flatMap(collectTextContent)
  if (!isValidElement(node)) return []

  const { type, props } = node
  if (typeof type === 'function') {
    const renderComponent = type as (componentProps: typeof props) => ReactNode
    return collectTextContent(renderComponent(props))
  }
  return collectTextContent(props.children)
}

const pieceKeyEntry = (
  model: ReturnType<typeof getPieceKeyModel>,
  inventoryID: string,
) =>
  [
    ...model.landColumns.flatMap((column) =>
      column.cells.map(({ entry }) => entry),
    ),
    ...model.specialGroups.flatMap((group) => group.entries),
  ].find((entry) => entry.inventoryID === inventoryID)

const getShapePolygonPoints = (entry: PieceKeyEntry) => {
  const hexPoints = getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS).corners
  const points = entry.hexes.flatMap((hex) => {
    const center = hexUtilsHexToPixel(hex)
    return hexPoints.map(({ x, y }) => ({
      x: center.x + x,
      y: center.y + y,
    }))
  })

  if (entry.inventoryID === Pieces.ladder) {
    points.push(...getLadderSvgPolygonPoints(SVG_HEX_RADIUS * 2, 0).corners)
  } else if (entry.inventoryID === Pieces.shipWall) {
    points.push(...getShipWallSvgPolygonPoints(SVG_HEX_RADIUS, 0).corners)
  } else if (entry.inventoryID === Pieces.shipBow) {
    points.push(...getShipBowSvgPolygonPoints(SVG_HEX_RADIUS, 0).corners)
  } else if (entry.inventoryID === Pieces.ropeLadder) {
    const iconRadius = SVG_HEX_RADIUS * 0.4
    const arrowWidth = (iconRadius * 2) / 1.3
    const arrowHalfHeight = (arrowWidth * 7) / 24
    points.push(
      { x: 2 * (SVG_HEX_APOTHEM - iconRadius), y: -2 * iconRadius },
      { x: 2 * (SVG_HEX_APOTHEM + iconRadius), y: 2 * iconRadius },
      {
        x: 2 * (SVG_HEX_APOTHEM - arrowWidth / 2),
        y: 2 * (-17 - arrowHalfHeight),
      },
      {
        x: 2 * (SVG_HEX_APOTHEM + arrowWidth / 2),
        y: 2 * (15 + arrowHalfHeight),
      },
    )
  } else if (entry.inventoryID === Pieces.laurWallLong) {
    points.push(...getLaurLongWallSvgPolygonPoints(SVG_HEX_RADIUS).corners)
  }

  return points
}

describe('piece key shape rendering', () => {
  it('renders populated land and ladder shapes inside their PDF cells', () => {
    let board: Board = makeTable(24)
    for (const [inventoryID, at] of [
      [Pieces.grass2, { q: 2, r: 2, s: -4 }],
      [Pieces.grass3, { q: 8, r: 8, s: -16 }],
      [Pieces.grass7, { q: 14, r: 14, s: -28 }],
      [Pieces.ladder, { q: 4, r: 17, s: -21 }],
      [Pieces.ropeLadder, { q: 17, r: 4, s: -21 }],
    ] as const) {
      board = place({
        board,
        pieceID: inventoryID,
        at,
        altitude: 0,
        permissive: true,
      }).board
    }

    const model = getPieceKeyModel(board.boardPieces, board.boardHexes, true)
    const populatedCells = model.landColumns.flatMap((column) =>
      column.cells.map(({ entry }) => entry),
    )

    expect(populatedCells).toHaveLength(3)
    for (const [index, entry] of populatedCells.entries()) {
      expect(entry.hexes.length).toBeGreaterThan(0)
      const svg = renderToStaticMarkup(
        SvgPieceKeyShape(entry, 0, 0, 0.1, `land-cell-${index}`),
      )
      expect(svg).toMatch(/<(polygon|path|circle)\b/)
      expect(
        collectShapeColors(
          PieceKeyShape({
            entry,
            useTerrainBorderColor: true,
            scale: 0.075,
          }),
        ).length,
      ).toBeGreaterThan(0)
    }

    const ladderEntries = model.specialGroups.flatMap((group) =>
      group.entries.filter(
        ({ inventoryID }) =>
          inventoryID === Pieces.ladder || inventoryID === Pieces.ropeLadder,
      ),
    )
    expect(ladderEntries).toHaveLength(2)
    for (const [index, entry] of ladderEntries.entries()) {
      const svg = renderToStaticMarkup(
        SvgPieceKeyShape(entry, 0, 0, 0.1, `special-${index}`),
      )
      expect(svg).toMatch(/<(polygon|path|rect)\b/)

      const shape = PieceKeyShape({
        entry,
        useTerrainBorderColor: true,
        scale: 0.075,
      })
      expect(collectShapeColors(shape).length).toBeGreaterThan(0)

      const viewBox = (shape as { props: { viewBox: string } }).props.viewBox
        .split(' ')
        .map(Number)
      const [viewX, viewY, viewWidth, viewHeight] = viewBox
      const layout = getPieceKeyShapeLayout(entry)
      expect(viewX).toBeCloseTo(layout.origin.x + layout.minX - 24)
      expect(viewY).toBeCloseTo(layout.origin.y + layout.minY - 24)
      expect(viewWidth).toBeCloseTo(layout.width + 48)
      expect(viewHeight).toBeCloseTo(layout.height + 48)
    }
  })

  it('uses identical canonical key shapes for every map rotation', () => {
    const inventoryIDs = [
      Pieces.grass24,
      Pieces.grass7,
      Pieces.grass3,
      Pieces.grass2,
      Pieces.grass1,
      Pieces.ropeLadder,
      Pieces.ladder,
      Pieces.shipWall,
      Pieces.shipBow,
      Pieces.cannon,
      Pieces.laurWallLong,
    ]
    const models = Array.from({ length: 6 }, (_, rotation) => {
      let board: Board = { boardHexes: {}, boardPieces: [] }
      for (const [index, inventoryID] of inventoryIDs.entries()) {
        board = place({
          board,
          pieceID: inventoryID,
          at: { q: index * 20, r: 0, s: -index * 20 },
          altitude: 0,
          rotation,
          permissive: true,
        }).board
      }
      expect(
        board.boardPieces.every((piece) => piece.rotation === rotation),
      ).toBe(true)
      return getPieceKeyModel(board.boardPieces, {}, true)
    })

    for (const inventoryID of inventoryIDs) {
      const entries = models.map((model) => {
        const entry = pieceKeyEntry(model, inventoryID)
        expect(entry).toBeDefined()
        return entry as PieceKeyEntry
      })
      const first = entries[0]
      const firstSvg = renderToStaticMarkup(
        SvgPieceKeyShape(first, 0, 0, 0.1, 'canonical-key'),
      )
      const firstPdf = PieceKeyShape({
        entry: first,
        useTerrainBorderColor: true,
        scale: 0.075,
      }) as { props: { viewBox: string } }

      expect(first.piece.rotation).toBe(0)
      expect(first.piece.pieceCoords).toEqual({ q: 0, r: 0, s: 0 })
      if (inventoryID === Pieces.shipWall || inventoryID === Pieces.shipBow) {
        expect(first.hexes.some((hex) => hex.isObstacleOrigin)).toBe(true)
      }

      for (const entry of entries.slice(1)) {
        expect(entry.hexes).toEqual(first.hexes)
        expect(getPieceKeyShapeLayout(entry)).toEqual(
          getPieceKeyShapeLayout(first),
        )
        expect(
          renderToStaticMarkup(
            SvgPieceKeyShape(entry, 0, 0, 0.1, 'canonical-key'),
          ),
        ).toBe(firstSvg)
        const pdf = PieceKeyShape({
          entry,
          useTerrainBorderColor: true,
          scale: 0.075,
        }) as { props: { viewBox: string } }
        expect(pdf.props.viewBox).toBe(firstPdf.props.viewBox)
      }
    }
  })

  it('keeps canonical key polygons inside their PDF viewBoxes', () => {
    const inventoryIDs = [
      Pieces.grass24,
      Pieces.grass7,
      Pieces.grass3,
      Pieces.grass2,
      Pieces.grass1,
      Pieces.ropeLadder,
      Pieces.ladder,
      Pieces.shipWall,
      Pieces.shipBow,
      Pieces.cannon,
      Pieces.laurWallLong,
    ]
    let board: Board = { boardHexes: {}, boardPieces: [] }
    for (const [index, inventoryID] of inventoryIDs.entries()) {
      board = place({
        board,
        pieceID: inventoryID,
        at: { q: index * 20, r: 0, s: -index * 20 },
        altitude: 0,
        permissive: true,
      }).board
    }
    const model = getPieceKeyModel(board.boardPieces, board.boardHexes, true)

    for (const inventoryID of inventoryIDs) {
      const entry = pieceKeyEntry(model, inventoryID)
      expect(entry).toBeDefined()
      if (!entry) continue

      const shape = PieceKeyShape({
        entry,
        useTerrainBorderColor: true,
        scale: 0.075,
      }) as { props: { viewBox: string } }
      const [viewX, viewY, viewWidth, viewHeight] = shape.props.viewBox
        .split(' ')
        .map(Number)
      const viewRight = viewX + viewWidth
      const viewBottom = viewY + viewHeight

      for (const point of getShapePolygonPoints(entry)) {
        expect(point.x).toBeGreaterThanOrEqual(viewX)
        expect(point.x).toBeLessThanOrEqual(viewRight)
        expect(point.y).toBeGreaterThanOrEqual(viewY)
        expect(point.y).toBeLessThanOrEqual(viewBottom)
      }
    }
  })

  it('renders a one-space SVG key shape at the map scale', () => {
    const piece: BoardPiece = {
      uid: 'key-grass-1',
      inventoryID: Pieces.grass1,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 0, r: 0, s: 0 },
    }
    const entry = getPieceKeyModel([piece], {}, true).landColumns[0].cells[0]
      .entry
    const keySvg = renderToStaticMarkup(
      SvgPieceKeyShape(entry, 0, 0, 1, 'map-scale'),
    )
    const mapSvg = renderToStaticMarkup(
      createElement(SvgMapHex, {
        hex: entry.hexes[0],
        buriedMarksByUID: new Map(),
        isPieceKeyPreview: true,
      }),
    )
    const mapPolygon = mapSvg.match(/<polygon[^>]*points="([^"]+)"/)
    const keyPolygon = keySvg.match(/<polygon[^>]*points="([^"]+)"/)
    const bounds = (points: string | undefined) => {
      const coordinates =
        points
          ?.trim()
          .split(/[\s,]+/)
          .map(Number) ?? []
      const xs = coordinates.filter((_, index) => index % 2 === 0)
      const ys = coordinates.filter((_, index) => index % 2 === 1)
      return [
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys),
      ]
    }

    expect(keySvg).toContain('scale(1)')
    expect(mapPolygon?.[1]).toBeDefined()
    expect(keyPolygon?.[1]).toBeDefined()
    expect(bounds(keyPolygon?.[1])).toEqual(bounds(mapPolygon?.[1]))
    expect(getPieceKeyShapeLayout(entry).width).toBeCloseTo(SVG_HEX_RADIUS * 2)
  })

  it('reconstructs the full land tile when its origin hex is missing', () => {
    const piece: BoardPiece = {
      uid: 'key-grass-2',
      inventoryID: Pieces.grass2,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 0, r: 0, s: 0 },
    }
    const remainingHex: BoardHex = {
      id: '0~1~0',
      q: 1,
      r: 0,
      s: -1,
      altitude: 0,
      pieceID: '0~0~0~0~g2',
      boardPieceUID: piece.uid,
      inventoryID: Pieces.grass2,
      terrain: HexTerrain.grass,
      pieceRotation: 0,
      isObstacleOrigin: false,
    }
    const entry = getPieceKeyModel(
      [piece],
      { [remainingHex.id]: remainingHex },
      true,
    ).landColumns[0].cells[0].entry

    expect(entry.hexes).toHaveLength(2)
    expect(entry.hexes[0].isObstacleOrigin).toBe(true)
    expect(
      renderToStaticMarkup(SvgPieceKeyShape(entry, 0, 0, 0.1, 'reconstructed')),
    ).toMatch(/<polygon\b/)
    expect(
      collectShapeColors(
        PieceKeyShape({
          entry,
          useTerrainBorderColor: true,
          scale: 0.075,
        }),
      ).length,
    ).toBeGreaterThan(0)
  })

  it('prints the game height (not the physical height) in both keys', () => {
    const board = place({
      board: makeTable(12),
      pieceID: Pieces.tree10,
      at: { q: 2, r: 2, s: -4 },
      altitude: 0,
      permissive: true,
    }).board
    const entry = getPieceKeyModel(board.boardPieces, board.boardHexes, true)
      .specialGroups.find(({ id }) => id === 'evergreen')
      ?.entries.find(({ inventoryID }) => inventoryID === Pieces.tree10)

    expect(entry).toBeDefined()
    if (!entry) return

    const svgKey = renderToStaticMarkup(
      SvgPieceKeyShape(entry, 0, 0, 0.1, 'tree-key'),
    )
    // Physical height stays 9; the printed label is the rules height, 10.
    expect(piecesSoFar[Pieces.tree10].height).toBe(9)
    expect(svgKey).toContain('>10</text>')
    const pdfText = collectTextContent(
      PieceKeyShape({
        entry,
        useTerrainBorderColor: true,
        scale: 0.075,
      }),
    )
    expect(pdfText).toContain('10')
  })

  it('renders Laur wall key shapes with purple centers and pink borders', () => {
    const boardPieces: BoardPiece[] = [
      Pieces.laurWallLong,
      Pieces.laurWallShort,
    ].map((inventoryID, index) => ({
      uid: `key-${inventoryID}`,
      inventoryID,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: index, r: 0, s: -index },
    }))
    const entries = getPieceKeyModel(boardPieces, {}, true).specialGroups.find(
      ({ id }) => id === 'laur',
    )?.entries

    expect(entries).toHaveLength(2)
    for (const [index, entry] of (entries ?? []).entries()) {
      const svg = renderToStaticMarkup(
        SvgPieceKeyShape(entry, 0, 0, 0.1, `laur-${index}`),
      )
      const pdfColors = collectShapeColors(
        PieceKeyShape({
          entry,
          useTerrainBorderColor: true,
          scale: 0.075,
        }),
      )

      expect(svg).toContain(`fill="${svgColors[HexTerrain.laurWall]}"`)
      expect(svg).toContain(`stroke="${svgColors.outlineLaurWall}"`)
      expect(pdfColors).toContainEqual(
        expect.objectContaining({ fill: svgColors[HexTerrain.laurWall] }),
      )
      expect(pdfColors).toContainEqual(
        expect.objectContaining({ stroke: svgColors.outlineLaurWall }),
      )
    }
  })

  it('matches map fill and stroke in both border modes with Generic colors', () => {
    const piece: BoardPiece = {
      uid: 'key-generic',
      inventoryID: Pieces.generic1,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 0, r: 0, s: 0 },
    }
    const hex: BoardHex = {
      id: '0~0~0',
      q: 0,
      r: 0,
      s: 0,
      altitude: 0,
      pieceID: '0~0~0~0~gn1',
      boardPieceUID: piece.uid,
      inventoryID: Pieces.generic1,
      terrain: HexTerrain.generic,
      pieceRotation: 0,
      isCap: true,
    }
    const entry: PieceKeyEntry = {
      inventoryID: piece.inventoryID,
      title: 'Generic (1)',
      terrain: HexTerrain.generic,
      count: 1,
      piece,
      hexes: [hex],
    }
    const genericCapColor = '#123456'
    const genericSideColor = '#234567'
    useBoundStore.setState({
      genericSolidCapColor: genericCapColor,
      genericSolidSideColor: genericSideColor,
    })

    for (const useTerrainBorderColor of [true, false]) {
      const mapProps = {
        hex,
        viewingLevel: 1,
        isOverlayViewing: true,
        isPdfColorBorders: useTerrainBorderColor,
        isShowPdfOverlayOnPlacedLevel: true,
        isShowPdfTileLetters: false,
        isShowPdfBuriedMarks: false,
        buriedMarksByUID: new Map(),
        useLegacyStartZones: false,
        isPieceKeyPreview: true,
        useTerrainBorderColor,
      }
      const keyShape = PieceKeyShape({
        entry,
        useTerrainBorderColor,
        scale: 0.075,
      })
      const keyColors = collectShapeColors(keyShape)
      const mapColors = collectShapeColors(PdfMapHex(mapProps))

      expect(keyColors).toEqual(mapColors)
      expect(keyColors).toContainEqual(
        expect.objectContaining({ fill: genericCapColor }),
      )
    }

    const mapSvg = renderToStaticMarkup(
      createElement(SvgMapHex, {
        hex,
        buriedMarksByUID: new Map(),
        isPieceKeyPreview: true,
      }),
    )
    const keySvg = renderToStaticMarkup(
      SvgPieceKeyShape(entry, 0, 0, 0.075, 'generic', true),
    )
    const darkMapSvg = renderToStaticMarkup(
      createElement(SvgMapHex, {
        hex,
        buriedMarksByUID: new Map(),
        isPieceKeyPreview: true,
        useTerrainBorderColor: false,
      }),
    )
    const darkKeySvg = renderToStaticMarkup(
      SvgPieceKeyShape(entry, 0, 0, 0.075, 'generic-dark', false),
    )
    const svgColors = (markup: string) =>
      markup.match(/(?:fill|stroke)="[^"]+"/g) ?? []

    expect(svgColors(keySvg)).toEqual(svgColors(mapSvg))
    expect(svgColors(darkKeySvg)).toEqual(svgColors(darkMapSvg))
  })
})
