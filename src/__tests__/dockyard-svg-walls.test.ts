/**
 * The dockyard (a map John built) puts each Ship Wall's knub on a Fortified
 * Wall's origin hex: the ship owns that hex, since a wall's hexes never own
 * anything (data/hexGrid/pieceCells.ts). The 2D/SVG view must still draw both
 * walls, from the piece list (pdf-svg-shared/boardPieceOriginHexes.ts).
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import useBoundStore from '../store/store'
import SvgMapDisplay from '../svg-map/SvgMapDisplay'
import { type BoardPiece, type HexMap, Pieces } from '../types'
import { genBoardHexID } from '../utils/map-utils'
import { getFortifiedWallSvgPolygonPoints } from '../pdf-svg-shared/hexPolygonPoints'
import { SVG_BORDER_WIDTH, SVG_HEX_RADIUS } from '../utils/constants'
import twinIronsDockyard from './fixtures/twin-irons-dockyard.json'

const originalState = useBoundStore.getState()
const originalServerState = { ...useBoundStore.getInitialState() }

afterEach(() => {
  useBoundStore.setState(originalState, true)
  Object.assign(useBoundStore.getInitialState(), originalServerState)
})

describe('dockyard SVG export', () => {
  it('draws both Fortified Walls, including one whose origin hex a Ship Wall holds', () => {
    const map = buildupJsonFileMap(
      twinIronsDockyard.boardPieces as BoardPiece[],
      twinIronsDockyard.hexMap as HexMap,
    )
    const walls = map.boardPieces.filter(
      (piece) => piece.inventoryID === Pieces.fortifiedWall,
    )
    expect(walls).toHaveLength(2)
    const originOwners = walls.map(
      (wall) =>
        map.boardHexes[
          genBoardHexID({ ...wall.pieceCoords, altitude: wall.altitude + 1 })
        ]?.inventoryID,
    )
    // the case under test: at least one wall's origin hex is someone else's
    expect(originOwners).toContain(Pieces.shipWall)

    const maxAltitude = Math.max(
      ...Object.values(map.boardHexes).map((hex) => hex.altitude),
    )
    const state = {
      boardHexes: map.boardHexes,
      boardPieces: map.boardPieces,
      hexMap: map.hexMap,
      viewingLevel: maxAltitude,
      is2DOverlayLevelEnabled: false,
      isShow2DExportBuriedMarks: false,
      isShow2DExportTileLetters: false,
      isShowPdfPieceLegend: false,
    }
    // renderToStaticMarkup reads the store's server snapshot
    useBoundStore.setState(state)
    Object.assign(useBoundStore.getInitialState(), state)
    const markup = renderToStaticMarkup(createElement(SvgMapDisplay))
    // SvgFortifiedWall's polygon, whatever its (level-dependent) fill
    const { points } = getFortifiedWallSvgPolygonPoints(
      SVG_HEX_RADIUS,
      SVG_BORDER_WIDTH,
    )
    expect(markup.split(`points="${points}"`).length - 1).toBe(2)
  })
})
