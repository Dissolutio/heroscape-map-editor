import { type ReactNode, createElement, isValidElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import { PieceKeyShape } from '../pdf-map/PdfPieceLegend'
import type { PieceKeyEntry } from '../pdf-svg-shared/pieceKey'
import { getPieceKeyModel } from '../pdf-svg-shared/pieceKey'
import useBoundStore from '../store/store'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { SvgPieceKeyShape } from '../svg-map/SvgPieceKey'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../types'
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

describe('piece key shape rendering', () => {
  it('renders a shape for every populated land-grid cell in both exports', () => {
    let board: Board = makeTable(24)
    for (const [inventoryID, at] of [
      [Pieces.grass2, { q: 2, r: 2, s: -4 }],
      [Pieces.grass3, { q: 8, r: 8, s: -16 }],
      [Pieces.grass7, { q: 14, r: 14, s: -28 }],
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

  it('uses the registered tree height in both keys and map data', () => {
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
    expect(piecesSoFar[Pieces.tree10].height).toBe(9)
    expect(svgKey).toContain('>9</text>')
    const pdfText = collectTextContent(
      PieceKeyShape({
        entry,
        useTerrainBorderColor: true,
        scale: 0.075,
      }),
    )
    expect(pdfText).toContain('9')
    expect(pdfText).not.toContain('10')
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
