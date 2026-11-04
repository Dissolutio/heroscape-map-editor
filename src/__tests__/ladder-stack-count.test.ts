import { createElement, isValidElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { getLadderStackInfo } from '../pdf-svg-shared/ladderStack'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import useBoundStore from '../store/store'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../types'
import type { BuriedMarksByUID } from '../utils/tileMarks'

const at = { q: 0, r: 0, s: 0 }

const ladder = (
  uid: string,
  altitude: number,
  rotation = 0,
  coords = at,
): BoardPiece => ({
  uid,
  inventoryID: Pieces.ladder,
  altitude,
  rotation,
  pieceCoords: coords,
})

const baseLadderHex = (piece: BoardPiece): BoardHex => ({
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

const initialState = useBoundStore.getState()
const initialServerState = useBoundStore.getInitialState()
const originalServerState = { ...initialServerState }

const renderSvgLadder = (hex: BoardHex) =>
  renderToStaticMarkup(
    createElement(
      'svg',
      { xmlns: 'http://www.w3.org/2000/svg' },
      createElement(SvgMapHex, {
        hex,
        buriedMarksByUID: {} as BuriedMarksByUID,
      }),
    ),
  )

const renderPdfLadder = (hex: BoardHex) =>
  PdfMapHex({
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

const textContent = (node: ReactNode): string => {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textContent).join('')
  if (!isValidElement(node)) return ''
  return textContent((node.props as { children?: ReactNode }).children ?? null)
}

const setExportState = (boardPieces: BoardPiece[]) => {
  const state = {
    boardHexes: {},
    boardPieces,
    viewingLevel: 10,
    is2DOverlayLevelEnabled: false,
    isShow2DExportTileLetters: false,
    isShow2DExportBuriedMarks: false,
  }
  useBoundStore.setState(state)
  Object.assign(initialServerState, state)
}

afterEach(() => {
  Object.assign(initialServerState, originalServerState)
  useBoundStore.setState({
    boardHexes: initialState.boardHexes,
    boardPieces: initialState.boardPieces,
    viewingLevel: initialState.viewingLevel,
    is2DOverlayLevelEnabled: initialState.is2DOverlayLevelEnabled,
    isShow2DExportTileLetters: initialState.isShow2DExportTileLetters,
    isShow2DExportBuriedMarks: initialState.isShow2DExportBuriedMarks,
  })
})

describe('ladder stack export count', () => {
  it('counts only contiguous ladders on the same edge', () => {
    const single = ladder('single', 1)
    const twoBottom = ladder('two-bottom', 1)
    const twoTop = ladder('two-top', 3)
    const threeBottom = ladder('three-bottom', 1)
    const threeMiddle = ladder('three-middle', 3)
    const threeTop = ladder('three-top', 5)
    const separateFirstBottom = ladder('separate-first-bottom', 1)
    const separateFirstTop = ladder('separate-first-top', 3)
    const separateSecondBottom = ladder('separate-second-bottom', 9)
    const separateSecondTop = ladder('separate-second-top', 11)
    const otherEdge = ladder('other-edge', 1, 1)

    expect(getLadderStackInfo([single], single)).toEqual({
      count: 1,
      isBottom: true,
    })
    expect(getLadderStackInfo([twoBottom, twoTop], twoBottom)).toEqual({
      count: 2,
      isBottom: true,
    })
    expect(getLadderStackInfo([twoBottom, twoTop], twoTop)).toEqual({
      count: 2,
      isBottom: false,
    })
    expect(
      getLadderStackInfo([threeBottom, threeMiddle, threeTop], threeBottom),
    ).toEqual({
      count: 3,
      isBottom: true,
    })
    const separateStacks = [
      separateFirstBottom,
      separateFirstTop,
      separateSecondBottom,
      separateSecondTop,
    ]
    expect(getLadderStackInfo(separateStacks, separateFirstBottom)).toEqual({
      count: 2,
      isBottom: true,
    })
    expect(getLadderStackInfo(separateStacks, separateSecondBottom)).toEqual({
      count: 2,
      isBottom: true,
    })
    expect(getLadderStackInfo([single, otherEdge], otherEdge)).toEqual({
      count: 1,
      isBottom: true,
    })
  })

  it('shows the count only on the bottom ladder in SVG and PDF output', () => {
    const bottom = ladder('bottom', 1)
    const top = ladder('top', 3)
    setExportState([bottom, top])

    const bottomHex = baseLadderHex(bottom)
    const topHex = baseLadderHex(top)
    const bottomSvg = renderSvgLadder(bottomHex)
    const topSvg = renderSvgLadder(topHex)

    expect(bottomSvg).toContain('x2')
    expect(topSvg).not.toContain('x2')
    expect(textContent(renderPdfLadder(bottomHex))).toContain('x2')
    expect(textContent(renderPdfLadder(topHex))).not.toContain('x2')
  })

  it('adds no count to a single ladder in SVG or PDF output', () => {
    const onlyLadder = ladder('only', 1)
    setExportState([onlyLadder])
    const hex = baseLadderHex(onlyLadder)

    expect(renderSvgLadder(hex)).not.toContain('x1')
    expect(textContent(renderPdfLadder(hex))).not.toContain('x1')
  })
})
