import { createElement, Fragment, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { getPillarPorts } from '../data/portPieces'
import { isVoidMatPieceID } from '../data/voidMat'
import { PdfMapBoardPiece } from '../pdf-map/PdfMapBoardPiece'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import { PdfVoidMatSymbol } from '../pdf-map/PdfVoidAndPylons'
import { ReactPdfSvgMapDisplay } from '../pdf-map/ReactPdfSvgMapDisplay'
import { getPieceKeyModel } from '../pdf-svg-shared/pieceKey'
import { SvgMapBoardPiece } from '../svg-map/SvgMapBoardPiece'
import SvgMapDisplay from '../svg-map/SvgMapDisplay'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { SvgVoidMatSymbol } from '../svg-map/SvgVoidAndPylons'
import useBoundStore from '../store/store'
import {
  type BoardHex,
  type BoardPiece,
  type DecodedPieceID,
  HexTerrain,
  Pieces,
} from '../types'
import {
  boardPieceToDecodedPieceID,
  genPieceID,
  hexUtilsHexToPixel,
} from '../utils/map-utils'
import { SVG_HEX_RADIUS } from '../utils/constants'
import { makeTable, place } from './helpers/board'

const initialState = useBoundStore.getState()
const origin = { q: 0, r: 0, s: 0 }

const makeDecodedPiece = (
  inventoryID: string,
  rotation = 0,
): DecodedPieceID => ({
  boardPieceID: `${inventoryID}-uid`,
  inventoryID,
  altitude: 0,
  rotation,
  boardHexID: '1~0~0',
  pieceCoords: origin,
  terrain: piecesSoFar[inventoryID].terrain,
})

const makePylonHex = (
  inventoryID: string,
  rotation: number,
  altitude = 1,
): BoardHex => {
  const piece = makeDecodedPiece(inventoryID, rotation)
  return {
    id: `${altitude}~0~0`,
    ...origin,
    altitude,
    pieceID: genPieceID(`${altitude}~0~0`, inventoryID, rotation),
    boardPieceUID: piece.boardPieceID,
    inventoryID,
    terrain: HexTerrain.voidPylon,
    pieceRotation: rotation,
    isObstacleOrigin: true,
  }
}

const buriedMarksByUID = new Map()

const svgPiece = (
  inventoryID: string,
  rotation: number,
  viewingLevel: number,
): ReactNode => {
  if (inventoryID === Pieces.voidMat || inventoryID === Pieces.voidMarker) {
    return createElement(SvgVoidMatSymbol, {
      piece: makeDecodedPiece(inventoryID, rotation),
      isSubLevel: viewingLevel > 0,
    })
  }
  if (
    inventoryID === Pieces.twoWayPylon ||
    inventoryID === Pieces.threeWayPylon
  ) {
    return createElement(SvgMapHex, {
      hex: makePylonHex(inventoryID, rotation),
      buriedMarksByUID,
      viewingLevel,
    })
  }
  return createElement(SvgMapBoardPiece, {
    piece: makeDecodedPiece(inventoryID, rotation),
    viewingLevel,
    overlayLevel: 3,
  })
}

const pdfPiece = (
  inventoryID: string,
  rotation: number,
  viewingLevel: number,
): ReactNode => {
  if (inventoryID === Pieces.voidMat || inventoryID === Pieces.voidMarker) {
    return createElement(PdfVoidMatSymbol, {
      piece: makeDecodedPiece(inventoryID, rotation),
      isSubLevel: viewingLevel > 0,
    })
  }
  if (
    inventoryID === Pieces.twoWayPylon ||
    inventoryID === Pieces.threeWayPylon
  ) {
    return createElement(PdfMapHex, {
      hex: makePylonHex(inventoryID, rotation),
      viewingLevel,
      isOverlayViewing: false,
      isPdfColorBorders: false,
      isShowPdfOverlayOnPlacedLevel: false,
      isShowPdfTileLetters: false,
      isShowPdfBuriedMarks: false,
      buriedMarksByUID,
      useLegacyStartZones: false,
    })
  }
  return createElement(PdfMapBoardPiece, {
    piece: makeDecodedPiece(inventoryID, rotation),
    viewingLevel,
    overlayLevel: 3,
    useLegacyStartZones: false,
    is2DOverlayLevelEnabled: false,
  })
}

const renderSvg = (node: ReactNode) =>
  renderToStaticMarkup(createElement('svg', null, node))

const renderPdf = (node: ReactNode) =>
  renderToStaticMarkup(createElement(Fragment, null, node))

afterEach(() => {
  useBoundStore.setState(initialState)
  Object.assign(useBoundStore.getInitialState(), initialState)
})

describe('Void and Pylons exports', () => {
  it.each([
    [Pieces.voidMat, [0, 3], 0, '#19161b', '#8c8b8d'],
    [Pieces.voidMarker, [0, 3], 0, '#19161b', '#8c8b8d'],
    [Pieces.twoWayPylon, [0, 3], 1, '#000000', '#808080'],
    [Pieces.threeWayPylon, [0, 2], 1, '#000000', '#808080'],
    [Pieces.deflectorShield, [0.5, 1.5], 1, '#6fd3ff', '#b7e9ff'],
  ] as const)(
    'draws %s in SVG and PDF at both levels and rotations',
    (inventoryID, rotations, mainViewLevel, mainColor, subLevelColor) => {
      for (const rotation of rotations) {
        const mainSvg = renderSvg(
          svgPiece(inventoryID, rotation, mainViewLevel),
        )
        const subLevelSvg = renderSvg(
          svgPiece(inventoryID, rotation, mainViewLevel + 1),
        )
        const mainPdf = renderPdf(
          pdfPiece(inventoryID, rotation, mainViewLevel),
        )
        const subLevelPdf = renderPdf(
          pdfPiece(inventoryID, rotation, mainViewLevel + 1),
        )

        expect(mainSvg.toLowerCase()).toContain(mainColor)
        expect(subLevelSvg.toLowerCase()).toContain(subLevelColor)
        expect(mainPdf.toLowerCase()).toContain(mainColor)
        expect(subLevelPdf.toLowerCase()).toContain(subLevelColor)
        expect(mainSvg).toContain(`rotate(${rotation * 60})`)
        expect(mainPdf).toContain(`rotate(${rotation * 60})`)
      }
    },
  )

  it('draws one ungridded hex for a Void Marker in SVG and PDF', () => {
    const piece = makeDecodedPiece(Pieces.voidMarker)
    const svg = renderSvg(
      createElement(SvgVoidMatSymbol, { piece, isSubLevel: false }),
    )
    const pdf = renderPdf(
      createElement(PdfVoidMatSymbol, { piece, isSubLevel: false }),
    )

    expect(svg.match(/<polygon\b/g)).toHaveLength(1)
    expect(pdf.toLowerCase().match(/<polygon\b/g)).toHaveLength(1)
    expect(svg).toContain('#19161b')
    expect(pdf).toContain('#19161b')
  })

  it.each([
    [Pieces.twoWayPylon, [1.5, 4.5]],
    [Pieces.threeWayPylon, [0.5, 2.5, 4.5]],
  ] as const)(
    'rotates the %s export tabs with all six port directions',
    (inventoryID, ports) => {
      for (let rotation = 0; rotation < 6; rotation += 1) {
        const expectedPorts = ports
          .map((port) => (((port + rotation) % 6) + 6) % 6)
          .sort((a, b) => a - b)
        const markup = renderSvg(svgPiece(inventoryID, rotation, 1))

        expect(
          getPillarPorts(inventoryID, rotation).sort((a, b) => a - b),
        ).toEqual(expectedPorts)
        expect(markup).toContain(`rotate(${rotation * 60})`)
      }
    },
  )

  it('snapshots the new SVG symbols without changing existing map snapshots', () => {
    const cases = [
      [Pieces.voidMat, 0, 0],
      [Pieces.voidMat, 3, 0],
      [Pieces.voidMarker, 0, 0],
      [Pieces.voidMarker, 3, 0],
      [Pieces.twoWayPylon, 0, 1],
      [Pieces.twoWayPylon, 3, 1],
      [Pieces.threeWayPylon, 0, 1],
      [Pieces.threeWayPylon, 2, 1],
      [Pieces.deflectorShield, 0.5, 1],
      [Pieces.deflectorShield, 1.5, 1],
    ] as const
    const symbols = cases.flatMap(([inventoryID, rotation, mainViewLevel]) =>
      [mainViewLevel, mainViewLevel + 1].map((viewingLevel) =>
        createElement(
          'g',
          {
            key: `${inventoryID}-${rotation}-${viewingLevel}`,
            'data-piece': inventoryID,
            'data-level': viewingLevel,
          },
          svgPiece(inventoryID, rotation, viewingLevel),
        ),
      ),
    )

    expect(renderSvg(symbols)).toMatchSnapshot()
  })

  it('draws a Void Mat beneath land in the 2D and PDF map renderers', () => {
    const table = makeTable(9)
    const withMat = place({
      board: table,
      pieceID: Pieces.voidMat,
      at: table.center,
      altitude: 0,
      uid: 'void-mat',
      permissive: true,
    }).board
    const board = place({
      board: withMat,
      pieceID: Pieces.grass1,
      at: table.center,
      altitude: 0,
      uid: 'grass',
      permissive: true,
    }).board
    const state = {
      ...useBoundStore.getState(),
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
      viewingLevel: 1,
      isShowPdfPieceLegend: false,
      is2DOverlayLevelEnabled: false,
      isShow2DExportBuriedMarks: false,
      isShow2DExportTileLetters: false,
    }
    useBoundStore.setState(state)
    Object.assign(useBoundStore.getInitialState(), state)

    const svg = renderToStaticMarkup(createElement(SvgMapDisplay))
    const pdf = renderToStaticMarkup(
      createElement(ReactPdfSvgMapDisplay, {
        width: SVG_HEX_RADIUS * 4,
        length: SVG_HEX_RADIUS * 4,
        boardHexesArr: Object.values(board.boardHexes),
        boardPiecesArr: board.boardPieces
          .map(boardPieceToDecodedPieceID)
          .filter(Boolean) as DecodedPieceID[],
        viewingLevel: 1,
        overlayLevel: 2,
        isPdfColorBorders: false,
        isShowPdfOverlayOnPlacedLevel: false,
        isShowGridLinesOverSublevels: false,
        isShowPdfTileLetters: false,
        isShowPdfBuriedMarks: false,
        buriedMarksByUID: buriedMarksByUID,
        useLegacyStartZones: false,
        is2DOverlayLevelEnabled: false,
        objectiveMarkers: [],
      }),
    )
    const grassHex = Object.values(board.boardHexes).find(
      (hex) => hex.inventoryID === Pieces.grass1,
    )
    const emptyHex = Object.values(board.boardHexes).find(
      (hex) => hex.terrain === HexTerrain.empty,
    )
    if (!grassHex) throw new Error('Expected placed grass hex')
    if (!emptyHex) throw new Error('Expected an empty table hex')
    const grassPixel = hexUtilsHexToPixel(grassHex)
    const emptyPixel = hexUtilsHexToPixel(emptyHex)
    const grassTransform = `translate(${grassPixel.x}, ${grassPixel.y})`
    const emptyTransform = `translate(${emptyPixel.x}, ${emptyPixel.y})`
    const matColorIndex = (markup: string) => {
      const lower = markup.toLowerCase()
      const mainColor = lower.indexOf('fill="#19161b"')
      return mainColor >= 0 ? mainColor : lower.indexOf('fill="#8c8b8d"')
    }

    expect(
      board.boardPieces.some((piece) => isVoidMatPieceID(piece.inventoryID)),
    ).toBe(true)
    expect(svg.indexOf(emptyTransform)).toBeLessThan(matColorIndex(svg))
    expect(matColorIndex(svg)).toBeGreaterThanOrEqual(0)
    expect(svg.indexOf(grassTransform, matColorIndex(svg))).toBeGreaterThan(
      matColorIndex(svg),
    )
    expect(pdf.indexOf(emptyTransform)).toBeLessThan(matColorIndex(pdf))
    expect(matColorIndex(pdf)).toBeGreaterThanOrEqual(0)
    expect(pdf.indexOf(grassTransform, matColorIndex(pdf))).toBeGreaterThan(
      matColorIndex(pdf),
    )
  })

  it('draws Void Mats over empty table hexes at level zero', () => {
    const table = makeTable(9)
    const board = place({
      board: table,
      pieceID: Pieces.voidMat,
      at: table.center,
      altitude: 0,
      uid: 'void-mat',
      permissive: true,
    }).board
    const state = {
      ...useBoundStore.getState(),
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
      viewingLevel: 0,
      isShowPdfPieceLegend: false,
      is2DOverlayLevelEnabled: false,
      isShow2DExportBuriedMarks: false,
      isShow2DExportTileLetters: false,
    }
    useBoundStore.setState(state)
    Object.assign(useBoundStore.getInitialState(), state)

    const svg = renderToStaticMarkup(createElement(SvgMapDisplay))
    const pdf = renderToStaticMarkup(
      createElement(ReactPdfSvgMapDisplay, {
        width: SVG_HEX_RADIUS * 4,
        length: SVG_HEX_RADIUS * 4,
        boardHexesArr: Object.values(board.boardHexes),
        boardPiecesArr: board.boardPieces
          .map(boardPieceToDecodedPieceID)
          .filter(Boolean) as DecodedPieceID[],
        viewingLevel: 0,
        overlayLevel: 2,
        isPdfColorBorders: false,
        isShowPdfOverlayOnPlacedLevel: false,
        isShowGridLinesOverSublevels: false,
        isShowPdfTileLetters: false,
        isShowPdfBuriedMarks: false,
        buriedMarksByUID,
        useLegacyStartZones: false,
        is2DOverlayLevelEnabled: false,
        objectiveMarkers: [],
      }),
    )
    const emptyHex = Object.values(board.boardHexes).find(
      (hex) =>
        hex.terrain === HexTerrain.empty &&
        hex.q === table.center.q &&
        hex.r === table.center.r,
    )
    if (!emptyHex) throw new Error('Expected an empty table hex')
    const pixel = hexUtilsHexToPixel(emptyHex)
    const emptyTransform = `translate(${pixel.x}, ${pixel.y})`
    const matColorIndex = (markup: string) =>
      markup.toLowerCase().indexOf('fill="#19161b"')

    expect(svg.indexOf(emptyTransform)).toBeLessThan(matColorIndex(svg))
    expect(matColorIndex(svg)).toBeGreaterThanOrEqual(0)
    expect(pdf.indexOf(emptyTransform)).toBeLessThan(matColorIndex(pdf))
    expect(matColorIndex(pdf)).toBeGreaterThanOrEqual(0)
  })

  it('keeps Void and Pylons key entries in one dedicated group', () => {
    const boardPieces: BoardPiece[] = [
      Pieces.voidMat,
      Pieces.voidMarker,
      Pieces.twoWayPylon,
      Pieces.threeWayPylon,
      Pieces.deflectorShield,
    ].map((inventoryID, index) => ({
      uid: `key-${index}`,
      inventoryID,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: index, r: 0, s: -index },
    }))
    const model = getPieceKeyModel(boardPieces, {}, true)
    const group = model.specialGroups.find(({ id }) => id === 'void-and-pylons')

    expect(group?.entries.map(({ inventoryID }) => inventoryID).sort()).toEqual(
      [
        Pieces.voidMat,
        Pieces.voidMarker,
        Pieces.twoWayPylon,
        Pieces.threeWayPylon,
        Pieces.deflectorShield,
      ].sort(),
    )
    const voidAndPylonsIDs = new Set([
      Pieces.voidMat,
      Pieces.voidMarker,
      Pieces.twoWayPylon,
      Pieces.threeWayPylon,
      Pieces.deflectorShield,
    ])
    expect(
      model.specialGroups
        .flatMap(({ entries }) => entries)
        .filter((entry) => voidAndPylonsIDs.has(entry.inventoryID)),
    ).toHaveLength(5)
    expect(
      group?.entries.filter(
        ({ inventoryID }) => inventoryID === Pieces.voidMarker,
      ),
    ).toHaveLength(1)
  })
})
