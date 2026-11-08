import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import { ReactPdfSvgMapDisplay } from '../pdf-map/ReactPdfSvgMapDisplay'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import SvgMapDisplay from '../svg-map/SvgMapDisplay'
import useBoundStore from '../store/store'
import {
  type BoardHex,
  type BoardPiece,
  Pieces,
} from '../types'
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
  altitude,
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
    isHideHeightsOnGlyphs: false,
  })
  Object.assign(useBoundStore.getInitialState(), useBoundStore.getState())
  return { ship, waterHex }
}

const renderExpectedSvgOrigin = (hex: BoardHex) =>
  renderToStaticMarkup(
    createElement(SvgMapHex, {
      hex,
      buriedMarksByUID: emptyBuriedMarks,
      viewingLevel: altitude,
      isVisible: true,
      isSubLevel: false,
    }),
  )

const renderExpectedPdfOrigin = (hex: BoardHex) =>
  renderToStaticMarkup(
    PdfMapHex({
      hex,
      viewingLevel: altitude,
      isOverlayViewing: false,
      isPdfColorBorders: false,
      isShowPdfOverlayOnPlacedLevel: false,
      isShowPdfTileLetters: false,
      isShowPdfBuriedMarks: false,
      buriedMarksByUID: emptyBuriedMarks,
      useLegacyStartZones: false,
    }),
  )

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
          glyphCoordinates: new Set(),
          glyphExportSettings: { isHideHeightsOnGlyphs: false },
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
})
