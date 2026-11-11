import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import SvgMapDisplay from '../svg-map/SvgMapDisplay'
import useBoundStore from '../store/store'
import {
  type BoardHex,
  type BoardHexes,
  type BoardPiece,
  HexTerrain,
  Pieces,
} from '../types'

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

const makeHex = (
  altitude: number,
  q: number,
  inventoryID: string,
  terrain: string,
  uid: string,
): BoardHex => {
  const id = `${altitude}~${q}~0`
  return {
    id,
    q,
    r: 0,
    s: -q,
    altitude,
    pieceID: `${id}~0~${inventoryID}`,
    boardPieceUID: uid,
    inventoryID,
    terrain,
    pieceRotation: 0,
    isObstacleOrigin: true,
  }
}

const boardHexes: BoardHexes = {
  '0~0~0': makeHex(0, 0, Pieces.grass1, HexTerrain.grass, 'grass'),
  '0~1~0': makeHex(0, 1, Pieces.glyphPower, HexTerrain.glyphPower, 'glyph'),
  '1~0~0': makeHex(1, 0, Pieces.outcrop1, HexTerrain.outcrop, 'outcrop'),
}

const boardPieces: BoardPiece[] = [
  {
    uid: 'grass',
    inventoryID: Pieces.grass1,
    altitude: 0,
    rotation: 0,
    pieceCoords: { q: 0, r: 0, s: 0 },
  },
  {
    uid: 'glyph',
    inventoryID: Pieces.glyphPower,
    altitude: 0,
    rotation: 0,
    pieceCoords: { q: 1, r: 0, s: -1 },
  },
  {
    uid: 'outcrop',
    inventoryID: Pieces.outcrop1,
    altitude: 0,
    rotation: 0,
    pieceCoords: { q: 0, r: 0, s: 0 },
  },
]

describe('SVG map render markup', () => {
  it('matches the captured level and overlay SVG markup', () => {
    const renders = [
      ['level-0', 0, false],
      ['level-1', 1, false],
      ['overlay', 2, true],
    ].map(([label, viewingLevel, is2DOverlayLevelEnabled]) => {
      const state = {
        boardHexes,
        boardPieces,
        viewingLevel: Number(viewingLevel),
        is2DOverlayLevelEnabled: Boolean(is2DOverlayLevelEnabled),
        isShow2DExportBuriedMarks: false,
        isShow2DExportTileLetters: false,
        isShowPdfPieceLegend: false,
      }
      useBoundStore.setState(state)
      Object.assign(useBoundStore.getInitialState(), state)
      return [label, renderToStaticMarkup(createElement(SvgMapDisplay))]
    })

    expect(renders).toMatchSnapshot()
  })
})
