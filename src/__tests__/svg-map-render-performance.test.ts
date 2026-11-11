import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SvgMapDisplay from '../svg-map/SvgMapDisplay'
import * as mapUtils from '../utils/map-utils'
import useBoundStore from '../store/store'
import { type BoardHex, type BoardHexes, HexTerrain, Pieces } from '../types'

const originalState = useBoundStore.getState()
const originalServerState = {
  boardHexes: useBoundStore.getInitialState().boardHexes,
  boardPieces: useBoundStore.getInitialState().boardPieces,
  viewingLevel: useBoundStore.getInitialState().viewingLevel,
  is2DOverlayLevelEnabled:
    useBoundStore.getInitialState().is2DOverlayLevelEnabled,
  isShow2DExportBuriedMarks:
    useBoundStore.getInitialState().isShow2DExportBuriedMarks,
  isShow2DExportTileLetters:
    useBoundStore.getInitialState().isShow2DExportTileLetters,
  isShowPdfPieceLegend: useBoundStore.getInitialState().isShowPdfPieceLegend,
}

afterEach(() => {
  const restored = {
    boardHexes: originalState.boardHexes,
    boardPieces: originalState.boardPieces,
    viewingLevel: originalState.viewingLevel,
    is2DOverlayLevelEnabled: originalState.is2DOverlayLevelEnabled,
    isShow2DExportBuriedMarks: originalState.isShow2DExportBuriedMarks,
    isShow2DExportTileLetters: originalState.isShow2DExportTileLetters,
    isShowPdfPieceLegend: originalState.isShowPdfPieceLegend,
  }
  useBoundStore.setState(restored)
  Object.assign(useBoundStore.getInitialState(), originalServerState)
})

const makeLargeBoard = (): BoardHexes => {
  const boardHexes: BoardHexes = {}
  for (let q = 0; q < 30; q += 1) {
    for (let r = 0; r < 30; r += 1) {
      const id = `0~${q}~${r}`
      const inventoryID =
        q === 0 && r === 1
          ? Pieces.glyphPower
          : q === 1 && r === 1
            ? Pieces.outcrop1
            : Pieces.grass1
      const terrain =
        inventoryID === Pieces.glyphPower
          ? HexTerrain.glyphPower
          : inventoryID === Pieces.outcrop1
            ? HexTerrain.outcrop
            : HexTerrain.grass
      const hex: BoardHex = {
        id,
        q,
        r,
        s: -q - r,
        altitude: 0,
        pieceID: `${id}~0~${inventoryID}`,
        boardPieceUID: q === 0 && r === 0 ? 'base' : undefined,
        inventoryID,
        terrain,
        pieceRotation: 0,
      }
      boardHexes[id] = hex
    }
  }
  return boardHexes
}

describe('SVG map render performance', () => {
  it('scans board-wide surface altitudes once per map render', () => {
    const boardHexes = makeLargeBoard()
    const state = {
      boardHexes,
      boardPieces: [
        {
          uid: 'base',
          inventoryID: Pieces.grass1,
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 0, r: 0, s: 0 },
        },
      ],
      viewingLevel: 0,
      is2DOverlayLevelEnabled: false,
      isShow2DExportBuriedMarks: false,
      isShow2DExportTileLetters: false,
      isShowPdfPieceLegend: false,
    }
    useBoundStore.setState(state)
    Object.assign(useBoundStore.getInitialState(), state)

    const surfaceAltitudeLookup = vi.spyOn(
      mapUtils,
      'getSurfaceAltitudeByPieceUID',
    )
    const markup = renderToStaticMarkup(createElement(SvgMapDisplay))

    expect(markup.match(/<polygon/g)).toHaveLength(1800)
    expect(surfaceAltitudeLookup).toHaveBeenCalledTimes(1)
  })
})
