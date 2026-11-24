import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import { ReactPdfSvgMapDisplay } from '../pdf-map/ReactPdfSvgMapDisplay'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import SvgMapDisplay from '../svg-map/SvgMapDisplay'
import useBoundStore from '../store/store'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../types'
import { genPieceID, hexUtilsHexToPixel } from '../utils/map-utils'
import type { BuriedMarksByUID } from '../utils/tileMarks'
import { SVG_HEX_RADIUS } from '../utils/constants'

const originalState = useBoundStore.getState()
const coords = { q: 1, r: 2, s: -3 }
const altitude = 2
const rotation = 3
const boardHexID = `${altitude}~${coords.q}~${coords.r}`
const emptyBuriedMarks = {} as BuriedMarksByUID

const makePiece = (inventoryID: string, uid: string): BoardPiece => ({
  uid,
  inventoryID,
  altitude: altitude - 1,
  rotation,
  pieceCoords: coords,
})

const makeHex = (inventoryID: string, uid: string): BoardHex => {
  const piece = piecesSoFar[inventoryID]
  return {
    id: boardHexID,
    ...coords,
    altitude,
    pieceID: genPieceID(boardHexID, inventoryID, rotation),
    boardPieceUID: uid,
    inventoryID,
    terrain: piece.terrain,
    pieceRotation: rotation,
    isObstacleOrigin: true,
  }
}

const setOverwrittenOrigin = (inventoryID: string) => {
  const ship = makePiece(inventoryID, 'origin-piece')
  const water = makePiece(Pieces.water1, 'overwriting-water')
  const waterHex = makeHex(Pieces.water1, water.uid)
  useBoundStore.setState({
    boardHexes: { [waterHex.id]: waterHex },
    boardPieces: [ship, water],
    viewingLevel: altitude,
    is2DOverlayLevelEnabled: false,
    isShow2DExportBuriedMarks: false,
    isShow2DExportTileLetters: false,
    isShowPdfPieceLegend: false,
  })
  Object.assign(useBoundStore.getInitialState(), useBoundStore.getState())
  return { ship, waterHex }
}

const renderExpectedSvgOrigin = (hex: BoardHex, viewingLevel = altitude) =>
  renderToStaticMarkup(
    createElement(SvgMapHex, {
      hex,
      buriedMarksByUID: emptyBuriedMarks,
      viewingLevel,
      isVisible: true,
      isSubLevel: hex.altitude < viewingLevel,
    }),
  )

const renderExpectedPdfOrigin = (hex: BoardHex, viewingLevel = altitude) =>
  renderToStaticMarkup(
    PdfMapHex({
      hex,
      viewingLevel,
      isOverlayViewing: false,
      isPdfColorBorders: false,
      isShowPdfOverlayOnPlacedLevel: false,
      isShowPdfTileLetters: false,
      isShowPdfBuriedMarks: false,
      buriedMarksByUID: emptyBuriedMarks,
      useLegacyStartZones: false,
    }),
  )

const countMarkup = (markup: string, value: string) =>
  markup.split(value).length - 1

afterEach(() => {
  useBoundStore.setState(originalState)
  Object.assign(useBoundStore.getInitialState(), originalState)
})

describe('origin-anchored SVG and PDF symbols', () => {
  it.each([
    Pieces.shipWall,
    Pieces.shipBow,
    Pieces.ladder,
    Pieces.fortifiedWall,
    Pieces.tree415,
  ])(
    'keeps the %s symbol at its origin when water overwrites that hex',
    (inventoryID) => {
      const { ship } = setOverwrittenOrigin(inventoryID)
      const originHex = makeHex(inventoryID, ship.uid)
      const pixel = hexUtilsHexToPixel(coords)
      const expectedPosition = `translate(${pixel.x}, ${pixel.y})`
      const expectedRotation = `rotate(${rotation * 60})`

      const svg = renderToStaticMarkup(createElement(SvgMapDisplay))
      const pdf = renderToStaticMarkup(
        createElement(ReactPdfSvgMapDisplay, {
          width: SVG_HEX_RADIUS * 4,
          length: SVG_HEX_RADIUS * 4,
          boardHexesArr: [makeHex(Pieces.water1, 'overwriting-water')],
          boardPiecesArr: [
            {
              boardPieceID: ship.uid,
              inventoryID: ship.inventoryID,
              altitude: ship.altitude,
              rotation: ship.rotation,
              boardHexID,
              pieceCoords: coords,
              terrain: piecesSoFar[ship.inventoryID].terrain,
            },
          ],
          viewingLevel: altitude,
          overlayLevel: altitude + 1,
          isPdfColorBorders: false,
          isShowPdfOverlayOnPlacedLevel: false,
          isShowGridLinesOverSublevels: false,
          isShowPdfTileLetters: false,
          isShowPdfBuriedMarks: false,
          buriedMarksByUID: emptyBuriedMarks,
          useLegacyStartZones: false,
          is2DOverlayLevelEnabled: false,
          objectiveMarkers: [],
        }),
      )

      expect(svg).toContain(renderExpectedSvgOrigin(originHex))
      expect(pdf).toContain(renderExpectedPdfOrigin(originHex))
      expect(svg).toContain(expectedPosition)
      expect(svg).toContain(expectedRotation)
      expect(pdf).toContain(expectedPosition)
      expect(pdf).toContain(expectedRotation)
    },
  )

  it('keeps a castle wall on its base at the stored level when its origin is overwritten', () => {
    const wall: BoardPiece = {
      uid: 'castle-wall-on-base',
      inventoryID: Pieces.castleWallStraight,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 0, r: 0, s: 0 },
    }
    const water: BoardPiece = {
      uid: 'water-on-castle-base',
      inventoryID: Pieces.water1,
      altitude: 0,
      rotation: 0,
      pieceCoords: wall.pieceCoords,
    }
    const waterHex: BoardHex = {
      id: '0~0~0',
      ...wall.pieceCoords,
      altitude: 0,
      pieceID: genPieceID('0~0~0', water.inventoryID, 0),
      boardPieceUID: water.uid,
      inventoryID: water.inventoryID,
      terrain: HexTerrain.water,
      pieceRotation: 0,
      isObstacleOrigin: true,
    }
    const wallSecondaryHex: BoardHex = {
      id: '0~1~0',
      q: 1,
      r: 0,
      s: -1,
      altitude: 0,
      pieceID: genPieceID('0~1~0', wall.inventoryID, 0),
      boardPieceUID: wall.uid,
      inventoryID: wall.inventoryID,
      terrain: piecesSoFar[wall.inventoryID].terrain,
      pieceRotation: 0,
      isObstacleAuxiliary: true,
    }
    const originHex: BoardHex = {
      ...waterHex,
      pieceID: genPieceID('0~0~0', wall.inventoryID, 0),
      boardPieceUID: wall.uid,
      inventoryID: wall.inventoryID,
      terrain: piecesSoFar[wall.inventoryID].terrain,
      isObstacleOrigin: true,
    }

    const state = {
      ...useBoundStore.getState(),
      boardHexes: {
        [waterHex.id]: waterHex,
        [wallSecondaryHex.id]: wallSecondaryHex,
      },
      boardPieces: [wall, water],
      viewingLevel: 0,
      is2DOverlayLevelEnabled: false,
      isShow2DExportBuriedMarks: false,
      isShow2DExportTileLetters: false,
      isShowPdfPieceLegend: false,
    }
    useBoundStore.setState(state)
    Object.assign(useBoundStore.getInitialState(), state)

    const svg = renderToStaticMarkup(createElement(SvgMapDisplay))
    const pdf = renderToStaticMarkup(
      createElement(ReactPdfSvgMapDisplay, {
        width: SVG_HEX_RADIUS * 4,
        length: SVG_HEX_RADIUS * 4,
        boardHexesArr: [waterHex, wallSecondaryHex],
        boardPiecesArr: [
          {
            boardPieceID: wall.uid,
            inventoryID: wall.inventoryID,
            altitude: wall.altitude,
            rotation: wall.rotation,
            boardHexID: '0~0~0',
            pieceCoords: wall.pieceCoords,
            terrain: piecesSoFar[wall.inventoryID].terrain,
          },
        ],
        viewingLevel: 0,
        overlayLevel: 1,
        isPdfColorBorders: false,
        isShowPdfOverlayOnPlacedLevel: false,
        isShowGridLinesOverSublevels: false,
        isShowPdfTileLetters: false,
        isShowPdfBuriedMarks: false,
        buriedMarksByUID: emptyBuriedMarks,
        useLegacyStartZones: false,
        is2DOverlayLevelEnabled: false,
        objectiveMarkers: [],
      }),
    )

    expect(svg).toContain(renderExpectedSvgOrigin(originHex, 0))
    expect(pdf).toContain(renderExpectedPdfOrigin(originHex, 0))
  })

  it('renders each registry-backed origin symbol once at its own level', () => {
    const boardPieceOnlyTerrains = new Set([
      HexTerrain.startZone,
      HexTerrain.ropeLadder,
      HexTerrain.laurWallAddon,
      HexTerrain.battlement,
      HexTerrain.roadWall,
    ])
    const originSymbolPieces = Object.values(piecesSoFar).filter(
      (piece) =>
        !boardPieceOnlyTerrains.has(piece.terrain as HexTerrain) &&
        (piece.isObstaclePiece ||
          piece.terrain === HexTerrain.castleBase ||
          piece.terrain === HexTerrain.castleWall ||
          (piece.landPrefix && piece.template !== '1')),
    )
    const boardHexes: Record<string, BoardHex> = {}
    const boardPieces: BoardPiece[] = []
    const expectedSymbols: string[] = []

    originSymbolPieces.forEach((piece, index) => {
      const pieceCoords = { q: index, r: 0, s: -index }
      const pieceAltitude = 0
      const symbolAltitude = pieceAltitude + 1
      const uid = `origin-${index}`
      const waterUID = `water-${index}`
      const waterHexID = `${symbolAltitude}~${index}~0`
      const originHex: BoardHex = {
        id: waterHexID,
        ...pieceCoords,
        altitude: symbolAltitude,
        pieceID: genPieceID(waterHexID, Pieces.water1, 0),
        boardPieceUID: waterUID,
        inventoryID: Pieces.water1,
        terrain: HexTerrain.water,
        pieceRotation: 0,
        isObstacleOrigin: true,
      }

      boardHexes[waterHexID] = originHex
      boardPieces.push(
        {
          uid,
          inventoryID: piece.id,
          altitude: pieceAltitude,
          rotation: index % 6,
          pieceCoords,
        },
        {
          uid: waterUID,
          inventoryID: Pieces.water1,
          altitude: pieceAltitude,
          rotation: 0,
          pieceCoords,
        },
      )
      expectedSymbols.push(
        renderExpectedSvgOrigin(
          {
            ...originHex,
            pieceID: genPieceID(waterHexID, piece.id, index % 6),
            boardPieceUID: uid,
            inventoryID: piece.id,
            terrain: piece.terrain,
            pieceRotation: index % 6,
            isObstacleOrigin: true,
          },
          symbolAltitude,
        ),
      )
    })

    const state = {
      ...useBoundStore.getState(),
      boardHexes,
      boardPieces,
      viewingLevel: 1,
      is2DOverlayLevelEnabled: false,
      isShow2DExportBuriedMarks: false,
      isShow2DExportTileLetters: false,
      isShowPdfPieceLegend: false,
    }
    useBoundStore.setState(state)
    Object.assign(useBoundStore.getInitialState(), state)

    const svg = renderToStaticMarkup(createElement(SvgMapDisplay))
    for (const symbol of expectedSymbols) {
      expect(symbol).not.toBe('')
      expect(countMarkup(svg, symbol)).toBe(1)
    }
  })
})
