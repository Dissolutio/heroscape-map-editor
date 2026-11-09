import { readFileSync } from 'node:fs'
import opentype from 'opentype.js'
import {
  type ReactElement,
  type ReactNode,
  createElement,
  isValidElement,
} from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { PdfMapBoardPiece } from '../pdf-map/PdfMapBoardPiece'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import { PdfLaurWallArchText } from '../pdf-map/PdfMapShapes'
import { PdfPieceLegend, PieceKeyShape } from '../pdf-map/PdfPieceLegend'
import {
  getHexagonSvgPolygonPointsAt00,
  getLadderSvgPolygonPoints,
  getLaurLongWallPdfPolygonPoints,
  getLaurLongWallSvgPolygonPoints,
  getLaurShortWallPolygonPoints,
  getLaurWallRuinPdfPolygonPoints,
  getLaurWallRuinSvgPolygonPoints,
  getShipBowSvgPolygonPoints,
  getShipWallSvgPolygonPoints,
} from '../pdf-svg-shared/hexPolygonPoints'
import type { PieceKeyEntry } from '../pdf-svg-shared/pieceKey'
import { getPieceKeyModel } from '../pdf-svg-shared/pieceKey'
import {
  getPieceKeyShapeLayout,
  getPieceKeySpecialEntriesPerRow,
  getPieceKeySpecialEntryRowLayout,
  getPieceKeySpecialEntryRows,
} from '../pdf-svg-shared/pieceKeyShapeLayout'
import useBoundStore, { type AppState } from '../store/store'
import { SvgMapBoardPiece } from '../svg-map/SvgMapBoardPiece'
import SvgMapDisplay from '../svg-map/SvgMapDisplay'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { SvgMapShapeSettingsContext } from '../svg-map/SvgMapShapes'
import {
  SvgPieceKey,
  SvgPieceKeyShape,
  getSvgPieceKeyWidth,
  wrapSvgPieceKeyText,
} from '../svg-map/SvgPieceKey'
import { getTextPathOriginX } from '../svg-map/exportSvg'
import { getSvgHexFillColor } from '../svg-map/getSvgHexColors'
import { svgHiveBlobD } from '../svg-map/svg-hive'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../types'
import {
  PDF_BORDER_WIDTH,
  SVG_BORDER_WIDTH,
  SVG_HEX_APOTHEM,
  SVG_HEX_RADIUS,
} from '../utils/constants'
import {
  boardPieceToDecodedPieceID,
  hexUtilsHexToPixel,
} from '../utils/map-utils'
import { svgColors } from '../world/maphex/hexColors'
import { type Board, makeTable, place } from './helpers/board'

const initialGenericColors = {
  genericSolidCapColor: useBoundStore.getState().genericSolidCapColor,
  genericSolidSideColor: useBoundStore.getState().genericSolidSideColor,
  genericFluidCapColor: useBoundStore.getState().genericFluidCapColor,
  genericFluidSideColor: useBoundStore.getState().genericFluidSideColor,
}
const initialBorderSettings = {
  isPdfColorBorders: useBoundStore.getState().isPdfColorBorders,
  isSvgColorBorders: useBoundStore.getState().isSvgColorBorders,
  boardHexes: useBoundStore.getState().boardHexes,
  boardPieces: useBoundStore.getState().boardPieces,
  isShowPdfPieceLegend: useBoundStore.getState().isShowPdfPieceLegend,
}
const fontBuffer = readFileSync(
  new URL('../../public/fonts/Inter_18pt-Bold.ttf', import.meta.url),
)
const interFont = opentype.parse(
  fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength,
  ),
)

afterEach(() => {
  useBoundStore.setState({ ...initialGenericColors, ...initialBorderSettings })
  Object.assign(useBoundStore.getInitialState(), {
    ...initialGenericColors,
    ...initialBorderSettings,
  })
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

const findElementByType = (
  node: ReactNode,
  type: ReactElement['type'],
): ReactElement | undefined => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElementByType(child, type)
      if (found) return found
    }
    return undefined
  }
  if (!isValidElement(node)) return undefined
  if (node.type === type) return node
  return findElementByType(node.props.children, type)
}

const findTextElement = (
  node: ReactNode,
  text: string,
): ReactElement | undefined => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findTextElement(child, text)
      if (found) return found
    }
    return undefined
  }
  if (!isValidElement(node)) return undefined
  if (node.props.children === text) return node
  if (typeof node.type === 'function') {
    const componentProps = node.props
    const renderComponent = node.type as (
      props: typeof componentProps,
    ) => ReactNode
    return findTextElement(renderComponent(componentProps), text)
  }
  return findTextElement(node.props.children, text)
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

const laurAddonIDs: string[] = [
  Pieces.laurWallLong,
  Pieces.laurWallLongStackable,
  Pieces.laurWallArch,
  Pieces.laurWallShort,
  Pieces.laurWallShortStackable,
  Pieces.laurWallRuin1,
  Pieces.laurWallRuin2,
  Pieces.laurWallRuin3,
]
const getLaurAddonSymbol = (inventoryID: string) =>
  laurAddonIDs.includes(inventoryID)

const getShapePolygonPoints = (entry: PieceKeyEntry) => {
  const hexPoints = getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS).corners
  const isStandaloneSymbol =
    entry.inventoryID === Pieces.ropeLadder ||
    Boolean(getLaurAddonSymbol(entry.inventoryID))
  const points = (isStandaloneSymbol ? [] : entry.hexes).flatMap((hex) => {
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
  } else if (
    entry.inventoryID === Pieces.laurWallLongStackable ||
    entry.inventoryID === Pieces.laurWallArch
  ) {
    points.push(...getLaurLongWallSvgPolygonPoints(SVG_HEX_RADIUS).corners)
  } else if (
    entry.inventoryID === Pieces.laurWallShort ||
    entry.inventoryID === Pieces.laurWallShortStackable
  ) {
    points.push(...getLaurShortWallPolygonPoints(SVG_HEX_RADIUS, 0.5).corners)
  } else if (
    [Pieces.laurWallRuin1, Pieces.laurWallRuin2, Pieces.laurWallRuin3].some(
      (inventoryID) => inventoryID === entry.inventoryID,
    )
  ) {
    points.push(...getLaurWallRuinSvgPolygonPoints(SVG_HEX_RADIUS).corners)
  }

  return points
}

const boundsCenter = (points: { x: number; y: number }[]) => {
  const xs = points.map(({ x }) => x)
  const ys = points.map(({ y }) => y)
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  }
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

  it('keeps special-group color descriptions aligned with both key renderers', () => {
    const inventoryIDs = [
      Pieces.road5,
      Pieces.wallWalk7,
      Pieces.water3,
      Pieces.wellspringWater1,
      Pieces.tree10,
      Pieces.palm14,
      Pieces.wood2,
      Pieces.laurWallSquarePillar,
      Pieces.laurWallLong,
      Pieces.ladder,
    ]
    const boardPieces: BoardPiece[] = inventoryIDs.map(
      (inventoryID, index) => ({
        uid: `key-${inventoryID}`,
        inventoryID,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: index, r: 0, s: -index },
      }),
    )
    for (const useTerrainBorderColor of [true, false]) {
      const expectedDescriptions = new Map([
        ['roads-and-wall-walks', 'gray centers'],
        [
          'evergreen',
          useTerrainBorderColor
            ? 'green borders and centers; number indicates tree height'
            : 'dark borders and green centers; number indicates tree height',
        ],
        [
          'jungle',
          useTerrainBorderColor
            ? 'brown borders, yellow centers'
            : 'dark borders, yellow centers',
        ],
        [
          'laur',
          useTerrainBorderColor
            ? 'pillars have pink borders and purple centers; wall add-ons are pink'
            : 'pillars have dark borders and purple centers; wall add-ons are pink',
        ],
        ['ladder', 'black borders'],
      ])
      const model = getPieceKeyModel(boardPieces, {}, useTerrainBorderColor)
      for (const [groupID, description] of expectedDescriptions) {
        const group = model.specialGroups.find(({ id }) => id === groupID)
        expect(group?.description).toBe(description)
        expect(group?.entries.length).toBeGreaterThan(0)
        for (const entry of group?.entries ?? []) {
          const svg = renderToStaticMarkup(
            SvgPieceKeyShape(
              entry,
              0,
              0,
              0.1,
              `${groupID}-${entry.inventoryID}`,
              useTerrainBorderColor,
            ),
          )
          const decoded = boardPieceToDecodedPieceID(entry.piece)
          expect(decoded).toBeDefined()
          if (!decoded) continue

          if (groupID === 'roads-and-wall-walks') {
            expect(svg).toContain(`fill="${svgColors[HexTerrain.road]}"`)
          } else if (groupID === 'evergreen') {
            expect(svg).toContain(`fill="${svgColors[HexTerrain.tree]}"`)
            expect(svg).toContain(
              `fill="${useTerrainBorderColor ? svgColors.outlineTree : '#000000'}"`,
            )
          } else if (groupID === 'jungle') {
            expect(svg).toContain(`fill="${svgColors.fillJungle}"`)
            expect(svg).toContain(
              `fill="${useTerrainBorderColor ? svgColors.outlineJungle : '#000000'}"`,
            )
          } else if (groupID === 'laur') {
            if (entry.inventoryID === Pieces.laurWallSquarePillar) {
              expect(svg).toContain(`fill="${svgColors[HexTerrain.laurWall]}"`)
              expect(svg).toContain(
                `fill="${useTerrainBorderColor ? svgColors.outlineLaurWall : '#000000'}"`,
              )
            } else {
              expect(svg).toContain(
                `fill="${svgColors[HexTerrain.laurWallAddon]}"`,
              )
            }
          } else if (groupID === 'ladder') {
            expect(svg).toContain('stroke="black"')
          }
        }
      }

      for (const [terrain, description] of [
        [HexTerrain.water, 'blue centers'],
        [HexTerrain.wellspringWater, 'white centers'],
      ] as const) {
        const column = model.fluidColumns.find(
          (candidate) => candidate.terrain === terrain,
        )
        expect(column?.description).toBe(description)
        const entry = column?.cells[0]?.entry
        expect(entry).toBeDefined()
        if (!entry) continue

        expect(model.fluidRows[0]?.description).toBe(
          useTerrainBorderColor ? 'blue borders' : 'dark borders',
        )
        const svg = renderToStaticMarkup(
          SvgPieceKeyShape(
            entry,
            0,
            0,
            0.1,
            `${terrain}-fluid-key`,
            useTerrainBorderColor,
          ),
        )
        expect(svg).toContain(`fill="${svgColors[terrain]}"`)
        expect(svg).toContain(
          `fill="${useTerrainBorderColor ? svgColors.outlineWater : '#000000'}"`,
        )
        const pdfColors = collectShapeColors(
          PieceKeyShape({
            entry,
            useTerrainBorderColor,
            scale: 0.075,
          }),
        )
        expect(pdfColors).toContainEqual(
          expect.objectContaining({ fill: expect.any(String) }),
        )
      }

      const wood = model.specialGroups.find(({ id }) => id === 'wood')
      expect(wood?.description).toBe(
        useTerrainBorderColor
          ? 'orange borders, brown wood-grain centers'
          : 'dark borders, brown wood-grain centers',
      )
      const woodEntry = wood?.entries[0]
      expect(woodEntry).toBeDefined()
      if (woodEntry) {
        const svg = renderToStaticMarkup(
          SvgPieceKeyShape(
            woodEntry,
            0,
            0,
            0.1,
            'wood-description-check',
            useTerrainBorderColor,
          ),
        )
        expect(svg).toContain(`fill="${svgColors[HexTerrain.wood]}"`)
        expect(svg).toContain(
          `fill="${useTerrainBorderColor ? svgColors.outline2 : '#000000'}"`,
        )
      }
      const ladder = model.specialGroups.find(({ id }) => id === 'ladder')
      const ladderEntry = ladder?.entries[0]
      expect(ladderEntry).toBeDefined()
      if (ladderEntry) {
        const pdfColors = collectShapeColors(
          PieceKeyShape({
            entry: ladderEntry,
            useTerrainBorderColor,
            scale: 0.075,
          }),
        )
        expect(pdfColors).toContainEqual(
          expect.objectContaining({ stroke: svgColors.battlementBorder }),
        )
      }
    }
  })

  it('keeps SVG and PDF legend border settings independent of map output', () => {
    const boardPieces: BoardPiece[] = [Pieces.grass1, Pieces.grass7].map(
      (inventoryID, index) => ({
        uid: `border-${inventoryID}`,
        inventoryID,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: index, r: 0, s: -index },
      }),
    )
    const setRenderState = (state: Partial<AppState>) => {
      useBoundStore.setState(state)
      Object.assign(useBoundStore.getInitialState(), state)
    }
    setRenderState({
      boardHexes: {},
      boardPieces,
      isShowPdfPieceLegend: true,
      isPdfColorBorders: false,
      isSvgColorBorders: true,
    })

    const renderSvgLegend = () =>
      renderToStaticMarkup(createElement(SvgMapDisplay, { legendOnly: true }))
    const renderSvgMap = () =>
      renderToStaticMarkup(
        createElement(SvgMapDisplay, { viewingLevelOverride: 0 }),
      )
    const svgColorMarkup = renderSvgLegend()
    const mapMarkup = renderSvgMap()

    setRenderState({ isPdfColorBorders: true })
    expect(renderSvgLegend()).toBe(svgColorMarkup)

    setRenderState({ isSvgColorBorders: false })
    const svgDarkMarkup = renderSvgLegend()
    expect(svgDarkMarkup).not.toBe(svgColorMarkup)
    for (const borderColor of [svgColors.outline1, svgColors.outline7]) {
      expect(svgColorMarkup).toContain(`fill="${borderColor}"`)
      expect(svgDarkMarkup).not.toContain(`fill="${borderColor}"`)
    }

    setRenderState({ isSvgColorBorders: true })
    expect(renderSvgMap()).toBe(mapMarkup)

    setRenderState({ isPdfColorBorders: true })
    const pdfColorShapes = collectShapeColors(PdfPieceLegend({ boardPieces }))
    expect(
      pdfColorShapes.some(
        (shape) =>
          typeof shape === 'object' &&
          shape !== null &&
          'stroke' in shape &&
          [svgColors.outline1, svgColors.outline7].includes(
            shape.stroke as string,
          ),
      ),
    ).toBe(true)

    setRenderState({ isSvgColorBorders: false })
    expect(collectShapeColors(PdfPieceLegend({ boardPieces }))).toEqual(
      pdfColorShapes,
    )

    setRenderState({ isPdfColorBorders: false })
    const pdfDarkShapes = collectShapeColors(PdfPieceLegend({ boardPieces }))
    expect(
      pdfDarkShapes.some(
        (shape) =>
          typeof shape === 'object' &&
          shape !== null &&
          'stroke' in shape &&
          [svgColors.outline1, svgColors.outline7].includes(
            shape.stroke as string,
          ),
      ),
    ).toBe(false)
  })

  it('matches map-level fill and stroke colors for every Laur wall add-on', () => {
    const boardPieces: BoardPiece[] = laurAddonIDs.map(
      (inventoryID, index) => ({
        uid: `key-${inventoryID}`,
        inventoryID,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: index, r: 0, s: -index },
      }),
    )
    const entries = getPieceKeyModel(boardPieces, {}, true).specialGroups.find(
      ({ id }) => id === 'laur',
    )?.entries

    expect(entries).toHaveLength(laurAddonIDs.length)
    for (const entry of entries ?? []) {
      const decoded = boardPieceToDecodedPieceID(entry.piece)
      expect(decoded).toBeDefined()
      if (!decoded) continue

      const svgMap = renderToStaticMarkup(
        createElement(SvgMapBoardPiece, {
          piece: decoded,
          viewingLevel: 1,
          overlayLevel: 1,
        }),
      )
      const svgKey = renderToStaticMarkup(
        SvgPieceKeyShape(entry, 0, 0, 0.1, `laur-${entry.inventoryID}`),
      )
      const svgColors = (markup: string) =>
        markup.match(/(?:fill|stroke)="[^"]+"/g) ?? []

      expect(svgColors(svgKey)).toEqual(svgColors(svgMap))

      for (const useTerrainBorderColor of [true, false]) {
        const pdfMapColors = collectShapeColors(
          PdfMapBoardPiece({
            piece: decoded,
            viewingLevel: 1,
            overlayLevel: 1,
            useLegacyStartZones: false,
            useTerrainBorderColor,
          }),
        )
        const pdfKeyColors = collectShapeColors(
          PieceKeyShape({
            entry,
            useTerrainBorderColor,
            scale: 0.075,
          }),
        )

        expect(pdfKeyColors).toEqual(pdfMapColors)
      }
    }
  })

  it('centers the rope ladder and every Laur add-on over their captions', () => {
    const inventoryIDs = [Pieces.ropeLadder, ...laurAddonIDs]
    const boardPieces: BoardPiece[] = inventoryIDs.map(
      (inventoryID, index) => ({
        uid: `key-${inventoryID}`,
        inventoryID,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: index, r: 0, s: -index },
      }),
    )
    const model = getPieceKeyModel(boardPieces, {}, true)
    const entries = model.specialGroups.flatMap(({ entries: groupEntries }) =>
      groupEntries.filter(({ inventoryID }) =>
        inventoryIDs.includes(inventoryID),
      ),
    )

    expect(entries).toHaveLength(inventoryIDs.length)
    for (const entry of entries) {
      const svgBounds = getShapePolygonPoints(entry)
      const svgLayout = getPieceKeyShapeLayout(entry)
      expect(svgLayout.center).toEqual(boundsCenter(svgBounds))

      const pdfBounds =
        entry.inventoryID === Pieces.ropeLadder
          ? svgBounds
          : entry.inventoryID === Pieces.laurWallLong ||
              entry.inventoryID === Pieces.laurWallLongStackable ||
              entry.inventoryID === Pieces.laurWallArch
            ? getLaurLongWallPdfPolygonPoints(SVG_HEX_RADIUS, 1).corners
            : entry.inventoryID === Pieces.laurWallShort ||
                entry.inventoryID === Pieces.laurWallShortStackable
              ? getLaurShortWallPolygonPoints(SVG_HEX_RADIUS, 0.2).corners
              : getLaurWallRuinPdfPolygonPoints(SVG_HEX_RADIUS).corners
      const pdfLayout = getPieceKeyShapeLayout(entry, 'pdf')
      expect(pdfLayout.center).toEqual(boundsCenter(pdfBounds))

      const pdfViewBox = (
        PieceKeyShape({
          entry,
          useTerrainBorderColor: true,
          scale: 0.075,
        }) as { props: { viewBox: string } }
      ).props.viewBox
        .split(' ')
        .map(Number)
      expect(pdfViewBox[0] + pdfViewBox[2] / 2).toBeCloseTo(
        pdfLayout.origin.x + pdfLayout.center.x,
      )
      expect(pdfViewBox[1] + pdfViewBox[3] / 2).toBeCloseTo(
        pdfLayout.origin.y + pdfLayout.center.y,
      )

      const svg = renderToStaticMarkup(
        SvgPieceKeyShape(entry, 500, 600, 1, `centered-${entry.inventoryID}`),
      )
      expect(svg).toContain(
        `translate(${-svgLayout.center.x} ${-svgLayout.center.y})`,
      )
    }
  })

  it('centers ARCH text in the key without changing map arch text', () => {
    const boardPiece: BoardPiece = {
      uid: 'key-arch',
      inventoryID: Pieces.laurWallArch,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 0, r: 0, s: 0 },
    }
    const model = getPieceKeyModel([boardPiece], {}, true)
    const entry = pieceKeyEntry(model, Pieces.laurWallArch)
    expect(entry).toBeDefined()
    if (!entry) return

    const pdfLayout = getPieceKeyShapeLayout(entry, 'pdf')
    const svgLayout = getPieceKeyShapeLayout(entry, 'svg')
    const pdfKeyPiece = findElementByType(
      PieceKeyShape({
        entry,
        useTerrainBorderColor: true,
        scale: 0.075,
      }),
      PdfMapBoardPiece,
    )
    const svgKeyPiece = findElementByType(
      SvgPieceKeyShape(entry, 500, 600, 1, 'centered-arch'),
      SvgMapBoardPiece,
    )
    expect(pdfKeyPiece?.props.archTextOffsetX).toBeCloseTo(pdfLayout.center.x)
    expect(svgKeyPiece?.props.archTextOffsetX).toBeCloseTo(svgLayout.center.x)

    const pdfKeyText = findTextElement(
      PdfMapBoardPiece(pdfKeyPiece?.props as never),
      'ARCH',
    )
    expect(pdfKeyText?.props.x).toBeCloseTo(pdfLayout.center.x)
    expect(pdfKeyText?.props.textAnchor).toBe('middle')

    const svgKeyMarkup = renderToStaticMarkup(
      SvgMapBoardPiece(svgKeyPiece?.props as never),
    )
    const svgKeyText = svgKeyMarkup.match(/<text\b([^>]*)>ARCH<\/text>/)
    expect(svgKeyText).not.toBeNull()
    expect(svgKeyText?.[1]).toContain(`x="${svgLayout.center.x}"`)
    expect(svgKeyText?.[1]).toContain('text-anchor="middle"')

    for (const rotation of [150, 210]) {
      const mapPiece: BoardPiece = {
        ...boardPiece,
        uid: `map-arch-${rotation}`,
        rotation: rotation / 60,
      }
      const decoded = boardPieceToDecodedPieceID(mapPiece)
      expect(decoded).toBeDefined()
      if (!decoded) continue

      const pdfMapPiece = PdfMapBoardPiece({
        piece: decoded,
        viewingLevel: 1,
        overlayLevel: 1,
      })
      const pdfMapArchText = findElementByType(pdfMapPiece, PdfLaurWallArchText)
      expect(pdfMapArchText).toBeDefined()
      const pdfMapText = PdfLaurWallArchText(
        pdfMapArchText?.props as never,
      ) as ReactElement
      expect(pdfMapText?.props.x).toBe(-2.75 * SVG_HEX_APOTHEM)
      expect(pdfMapText?.props.y).toBe(0.2 * SVG_HEX_RADIUS)
      expect('textAnchor' in (pdfMapText?.props ?? {})).toBe(false)

      const svgMapMarkup = renderToStaticMarkup(
        SvgMapBoardPiece({
          piece: decoded,
          viewingLevel: 1,
          overlayLevel: 1,
        }),
      )
      const svgMapText = svgMapMarkup.match(/<text\b([^>]*)>ARCH<\/text>/)
      expect(svgMapText).not.toBeNull()
      expect(svgMapText?.[1]).toContain(`x="${-2.75 * SVG_HEX_APOTHEM}"`)
      expect(svgMapText?.[1]).toContain(`y="${0.2 * SVG_HEX_RADIUS}"`)
      expect(svgMapText?.[1]).not.toContain('text-anchor=')
    }
  })

  it('wraps SVG special captions within their cells using Inter metrics', () => {
    const inventoryIDs = [
      Pieces.laurPalm13,
      Pieces.laurPalm14,
      Pieces.laurPalm15,
      Pieces.palm14,
      Pieces.palm15,
      Pieces.palm16,
      Pieces.brush9,
      Pieces.tree10,
      Pieces.tree415,
    ]
    const boardPieces: BoardPiece[] = inventoryIDs.map(
      (inventoryID, index) => ({
        uid: `key-${inventoryID}`,
        inventoryID,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: index, r: 0, s: -index },
      }),
    )
    const model = getPieceKeyModel(boardPieces, {}, true)
    const keyWidth = getSvgPieceKeyWidth(model, SVG_HEX_RADIUS * 4)
    const cardWidth = keyWidth / 3
    const fontSize = SVG_HEX_RADIUS * 0.24
    for (const group of model.specialGroups) {
      const entriesPerRow = getPieceKeySpecialEntriesPerRow(
        group,
        cardWidth - 2 * SVG_HEX_RADIUS * 0.12,
        1,
      )
      const slotWidth = (cardWidth - 2 * SVG_HEX_RADIUS * 0.12) / entriesPerRow
      const availableWidth = slotWidth - SVG_HEX_RADIUS * 0.06
      for (
        let offset = 0;
        offset < group.entries.length;
        offset += entriesPerRow
      ) {
        const row = group.entries.slice(offset, offset + entriesPerRow)
        const textBounds = row.map((entry, index) => {
          const lines = wrapSvgPieceKeyText(
            entry.title,
            availableWidth,
            fontSize,
          )
          const centerX = index * slotWidth + slotWidth / 2
          const widths = lines.map((line) =>
            interFont.getAdvanceWidth(line, fontSize, { kerning: true }),
          )
          expect(Math.max(...widths)).toBeLessThanOrEqual(availableWidth + 0.1)
          return {
            left: centerX - Math.max(...widths) / 2,
            right: centerX + Math.max(...widths) / 2,
          }
        })
        for (let index = 1; index < textBounds.length; index += 1) {
          expect(textBounds[index - 1].right).toBeLessThanOrEqual(
            textBounds[index].left + 0.1,
          )
        }
      }
    }

    for (const caption of [
      'Laur Jungle Tree (13)',
      'Ticalla Jungle Palm (15)',
    ]) {
      const lines = wrapSvgPieceKeyText(caption, 140, fontSize)
      expect(lines.length).toBeGreaterThan(1)
      expect(
        Math.max(
          ...lines.map((line) =>
            interFont.getAdvanceWidth(line, fontSize, { kerning: true }),
          ),
        ),
      ).toBeLessThanOrEqual(140)
    }
  })

  it('constrains long PDF special-tile labels to their own cells', () => {
    const boardPieces = [Pieces.palm14, Pieces.palm15].map(
      (inventoryID, index) => ({
        uid: `pdf-key-${inventoryID}`,
        inventoryID,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: index, r: 0, s: -index },
      }),
    )
    const label = findTextElement(
      PdfPieceLegend({ boardPieces }),
      'Ticalla Jungle Palm (14)',
    )

    expect(label).toBeDefined()
    expect(label?.props.style).toMatchObject({ maxWidth: '100%' })
  })

  it('aligns Special Tiles shapes per renderer and group', () => {
    const boardPieces = Object.keys(piecesSoFar).map((inventoryID, index) => ({
      uid: `layout-${index}`,
      inventoryID,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: index, r: 0, s: -index },
    }))
    const model = getPieceKeyModel(boardPieces, {}, true)
    const keyWidth = getSvgPieceKeyWidth(model, SVG_HEX_RADIUS * 4)

    for (const renderer of ['pdf', 'svg'] as const) {
      const scale = renderer === 'pdf' ? 0.075 : 1
      const rowWidth =
        renderer === 'pdf'
          ? 564 / 3 - 12
          : keyWidth / 3 - 2 * SVG_HEX_RADIUS * 0.12

      for (const group of model.specialGroups) {
        const { rows } = getPieceKeySpecialEntryRows(
          group,
          rowWidth,
          scale,
          renderer,
        )
        for (const row of rows) {
          const layout = getPieceKeySpecialEntryRowLayout(
            row,
            scale,
            renderer,
            group.id,
          )
          for (const { shapeHeight, shapeTopOffset } of layout.entries) {
            const expectedOffset =
              group.id === 'ship'
                ? layout.shapeHeight - shapeHeight
                : renderer === 'pdf'
                  ? 0
                  : (layout.shapeHeight - shapeHeight) / 2
            expect(shapeTopOffset).toBeCloseTo(expectedOffset)
          }
          expect(layout.shapeHeight).toBe(
            Math.max(...layout.entries.map(({ shapeHeight }) => shapeHeight)),
          )
        }
      }
    }
  })

  it('bottom-aligns a Ship Wall beside the Ship Bow', () => {
    const model = getPieceKeyModel(
      [Pieces.shipBow, Pieces.shipWall].map((inventoryID, index) => ({
        uid: `ship-key-${inventoryID}`,
        inventoryID,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: index, r: 0, s: -index },
      })),
      {},
      true,
    )
    const shipGroup = model.specialGroups.find(({ id }) => id === 'ship')
    const shipBow = shipGroup?.entries.find(
      ({ inventoryID }) => inventoryID === Pieces.shipBow,
    )
    const shipWall = shipGroup?.entries.find(
      ({ inventoryID }) => inventoryID === Pieces.shipWall,
    )

    expect(shipBow).toBeDefined()
    expect(shipWall).toBeDefined()
    if (!shipBow || !shipWall) return

    const layout = getPieceKeySpecialEntryRowLayout(
      [shipBow, shipWall],
      1,
      'svg',
      'ship',
    )
    const wallLayout = layout.entries.find(
      ({ entry }) => entry.inventoryID === Pieces.shipWall,
    )

    expect(wallLayout?.shapeTopOffset).toBeGreaterThan(0)
    expect(wallLayout?.shapeTopOffset).toBeCloseTo(
      layout.shapeHeight - (wallLayout?.shapeHeight ?? 0),
    )
  })

  it('centers SVG land header text blocks in their cells', () => {
    const model = getPieceKeyModel(
      [
        {
          uid: 'land-header-grass',
          inventoryID: Pieces.grass24,
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 0, r: 0, s: 0 },
        },
      ],
      {},
      true,
    )
    const keyWidth = getSvgPieceKeyWidth(model, SVG_HEX_RADIUS * 4)
    const markup = renderToStaticMarkup(
      SvgPieceKey({
        model,
        renderOptions: {
          viewingLevel: 1,
          overlayLevel: 1,
          isOverlayViewing: false,
          is2DOverlayLevelEnabled: false,
          isShow2DExportTileLetters: false,
          isShow2DExportBuriedMarks: false,
          glyphCoordinates: new Set(),
          glyphExportSettings: { isHideHeightsOnGlyphs: false },
        },
        useTerrainBorderColor: true,
        x: 0,
        y: 0,
        width: keyWidth,
      }),
    )
    const textAttributes = (text: string) =>
      [...markup.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].find(
        ([, , content]) => content.replace(/<[^>]+>/g, '').trim() === text,
      )?.[1]
    const attributeNumber = (attributes: string, name: string) =>
      Number(attributes.match(new RegExp(`${name}="([^"]+)"`))?.[1])
    const tableMarkupStart = markup.indexOf(
      '<g data-testid="svg-piece-key-land-table">',
    )
    expect(tableMarkupStart).toBeGreaterThanOrEqual(0)
    const headerRects = [
      ...markup.slice(tableMarkupStart).matchAll(/<rect\b([^>]*)>/g),
    ].slice(0, 4)
    expect(headerRects).toHaveLength(4)

    const expectCenteredBlock = (texts: string[], cellAttributes: string) => {
      const elements = texts.map((text) => textAttributes(text))
      expect(elements.every(Boolean)).toBe(true)
      if (elements.some((attributes) => !attributes)) return

      const lineAttributes = elements as string[]
      const fontSizes = lineAttributes.map((attributes) =>
        attributeNumber(attributes, 'font-size'),
      )
      const cellTop = attributeNumber(cellAttributes, 'y')
      const cellHeight = attributeNumber(cellAttributes, 'height')
      const cellCenterX =
        attributeNumber(cellAttributes, 'x') +
        attributeNumber(cellAttributes, 'width') / 2
      const lineGap = SVG_HEX_RADIUS * 0.24 * 0.25
      const blockHeight =
        fontSizes.reduce((sum, size) => sum + size, 0) +
        lineGap * (fontSizes.length - 1)
      let expectedBaseline =
        cellTop + (cellHeight - blockHeight) / 2 + fontSizes[0]

      lineAttributes.forEach((attributes, index) => {
        if (index > 0) expectedBaseline += lineGap + fontSizes[index]
        expect(
          Math.abs(attributeNumber(attributes, 'y') - expectedBaseline),
        ).toBeLessThanOrEqual(1)
        expect(attributes).toContain('text-anchor="middle"')
        expect(
          Math.abs(attributeNumber(attributes, 'x') - cellCenterX),
        ).toBeLessThanOrEqual(1)
      })
    }

    expectCenteredBlock(
      ['Notice centers', 'and border colors'],
      headerRects[0][1],
    )
    expectCenteredBlock(['Grass', 'green centers'], headerRects[2][1])
  })

  it('uses the map hive artwork in the key', () => {
    const model = getPieceKeyModel(
      [
        {
          uid: 'key-hive',
          inventoryID: Pieces.hive,
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 0, r: 0, s: 0 },
        },
      ],
      {},
      true,
    )
    const entry = model.specialGroups[0]?.entries[0]
    expect(entry?.inventoryID).toBe(Pieces.hive)
    if (!entry) return
    const originHex = entry.hexes.find((hex) => hex.isObstacleOrigin)
    expect(originHex).toBeDefined()
    if (!originHex) return

    const keySvg = renderToStaticMarkup(
      SvgPieceKeyShape(entry, 0, 0, 1, 'key-hive'),
    )
    const mapSvg = renderToStaticMarkup(
      createElement(SvgMapHex, {
        hex: originHex,
        buriedMarksByUID: new Map(),
      }),
    )
    expect(keySvg.split(svgHiveBlobD).length - 1).toBe(1)
    expect(mapSvg.split(svgHiveBlobD).length - 1).toBe(1)
    const blobPath = `<path d="${svgHiveBlobD}"`
    const expectedBlobPath = `${blobPath} fill="${getSvgHexFillColor(originHex)}" stroke="black" stroke-width="${SVG_BORDER_WIDTH / 2.4}"`
    expect(keySvg).toContain(expectedBlobPath)
    expect(mapSvg).toContain(expectedBlobPath)
  })

  it('converts every multiline key line with its own SVG text anchor', () => {
    const model = getPieceKeyModel(
      [
        {
          uid: 'lava-resistance',
          inventoryID: 'y56',
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 0, r: 0, s: 0 },
        },
        {
          uid: 'giant-hunter',
          inventoryID: 'y36',
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 1, r: 0, s: -1 },
        },
      ],
      {},
      true,
    )
    const keyWidth = getSvgPieceKeyWidth(model, SVG_HEX_RADIUS * 4)
    const markup = renderToStaticMarkup(
      SvgPieceKey({
        model,
        renderOptions: {
          viewingLevel: 1,
          overlayLevel: 1,
          isOverlayViewing: false,
          is2DOverlayLevelEnabled: false,
          isShow2DExportTileLetters: false,
          isShow2DExportBuriedMarks: false,
          glyphCoordinates: new Set(),
          glyphExportSettings: { isHideHeightsOnGlyphs: false },
        },
        useTerrainBorderColor: true,
        x: 0,
        y: 0,
        width: keyWidth,
      }),
    )
    const attr = (source: string, name: string) =>
      Number(source.match(new RegExp(`${name}="([^"]+)"`))?.[1])
    let multilineLines = 0

    for (const [, attributes, textContent] of markup.matchAll(
      /<text\b([^>]*)>([\s\S]*?)<\/text>/g,
    )) {
      const spans = [
        ...textContent.matchAll(/<tspan\b([^>]*)>([\s\S]*?)<\/tspan>/g),
      ]
      if (spans.length < 2) continue

      const fontSize = attr(attributes, 'font-size')
      const inheritedAnchor =
        attributes.match(/text-anchor="([^"]+)"/)?.[1] ?? 'start'
      for (const [, spanAttributes, spanText] of spans) {
        const line = spanText.replace(/<[^>]+>/g, '').trim()
        if (!line) continue
        const anchorX = attr(spanAttributes, 'x')
        const textAnchor =
          spanAttributes.match(/text-anchor="([^"]+)"/)?.[1] ?? inheritedAnchor
        const pathX = getTextPathOriginX(
          interFont,
          line,
          fontSize,
          textAnchor,
          anchorX,
        )
        const bounds = interFont
          .getPath(line, pathX, 0, fontSize, { kerning: true })
          .getBoundingBox()
        if (textAnchor === 'middle') {
          expect(Math.abs((bounds.x1 + bounds.x2) / 2 - anchorX)).toBeLessThan(
            0.5,
          )
        } else {
          expect(Math.abs(bounds.x1 - anchorX)).toBeLessThan(0.5)
        }
        multilineLines += 1
      }
    }

    expect(multilineLines).toBeGreaterThanOrEqual(4)
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

  it('uses the selected user colors for Generic Fluid key shapes', () => {
    const model = getPieceKeyModel(
      [
        {
          uid: 'key-generic-fluid',
          inventoryID: Pieces.genericFluid1,
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 0, r: 0, s: 0 },
        },
      ],
      {},
      true,
    )
    const entry = model.fluidColumns[0]?.cells[0]?.entry
    expect(entry).toBeDefined()
    if (!entry) return

    const capColor = '#346789'
    const sideColor = '#563421'
    useBoundStore.setState({
      genericFluidCapColor: capColor,
      genericFluidSideColor: sideColor,
    })
    const hex = entry.hexes[0]
    expect(hex.terrain).toBe(HexTerrain.genericFluid)
    expect(useBoundStore.getState().genericFluidCapColor).toBe(capColor)
    expect(getSvgHexFillColor(hex)).toBe(capColor)
    const mapProps = {
      hex,
      viewingLevel: 1,
      isOverlayViewing: true,
      isPdfColorBorders: true,
      isShowPdfOverlayOnPlacedLevel: true,
      isShowPdfTileLetters: false,
      isShowPdfBuriedMarks: false,
      buriedMarksByUID: new Map(),
      useLegacyStartZones: false,
      isPieceKeyPreview: true,
      useTerrainBorderColor: true,
    }

    expect(
      collectShapeColors(
        PieceKeyShape({
          entry,
          useTerrainBorderColor: true,
          scale: 0.075,
        }),
      ),
    ).toEqual(collectShapeColors(PdfMapHex(mapProps)))
    expect(
      collectShapeColors(
        PieceKeyShape({
          entry,
          useTerrainBorderColor: true,
          scale: 0.075,
        }),
      ),
    ).toContainEqual(expect.objectContaining({ fill: capColor }))

    const shapeSettings = {
      genericSolidCapColor: useBoundStore.getState().genericSolidCapColor,
      genericFluidCapColor: capColor,
      useLegacyStartZones: false,
    }
    const renderSvgWithSettings = (element: ReactElement) =>
      renderToStaticMarkup(
        createElement(
          SvgMapShapeSettingsContext.Provider,
          { value: shapeSettings },
          element,
        ),
      )
    const mapSvg = renderSvgWithSettings(
      createElement(SvgMapHex, {
        hex,
        buriedMarksByUID: new Map(),
        isPieceKeyPreview: true,
      }),
    )
    const keySvg = renderSvgWithSettings(
      SvgPieceKeyShape(entry, 0, 0, 0.075, 'generic-fluid', true),
    )
    const svgColors = (markup: string) =>
      markup.match(/(?:fill|stroke)="[^"]+"/g) ?? []

    expect(svgColors(keySvg)).toEqual(svgColors(mapSvg))
    expect(keySvg).toContain(`fill="${capColor}"`)
  })
})
