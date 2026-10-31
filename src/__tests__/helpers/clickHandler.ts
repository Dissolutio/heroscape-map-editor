import type { ThreeEvent } from '@react-three/fiber'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { RotationPivot } from '../../data/rotationPivot'
import useBoundStore from '../../store/store'
import type { BoardHex, BoardPiece } from '../../types'
import { SELECT_PEN_MODE } from '../../types'
import MapDisplay3D from '../../world/MapDisplay3D'
import type { Board } from './board'
import { takeCapturedHandler } from './handlerCapture'

/**
 * Drives the real click handler (wired by world/MapDisplay3D.tsx) without
 * WebGL. The test file must stub MapDisplay3D's children and the pick-pen hook
 * (see `mapDisplayMocks` in the test), so rendering it to a string only runs
 * its own hooks, and the stubbed EmptyHexes (handlerCapture.ts) hands back the
 * handler.
 */

export type ClickResult = {
  /** Pieces on the board after the click that were not there before. */
  added: BoardPiece[]
  boardPieces: BoardPiece[]
  board: Board
  selectedPieceIDs: string[]
  conflictedPieceUIDs: string[]
}

/** What is selected before each click, to see whether the click changed it. */
export const SELECTED_BEFORE_CLICK = 'selected-before-click'

/**
 * Put `board` in the store with `pieceID` as the pen, then left-click `hex`
 * the way a model or cap mesh hands it to the handler.
 */
export function clickWithPen({
  board,
  pieceID,
  hex,
  rotation = 0,
  shiftKey = false,
}: {
  board: Board
  pieceID: string
  hex: BoardHex
  rotation?: number
  shiftKey?: boolean
}): ClickResult {
  // The store freezes what it holds (Immer), and tests reuse their boards.
  const { boardHexes, boardPieces } = structuredClone(board)
  const state = {
    boardHexes,
    boardPieces,
    conflictedPieceUIDs: [],
    selectedPieceIDs: [SELECTED_BEFORE_CLICK],
    penMode: pieceID,
    pieceSize: 0,
    penModeRotation: rotation,
    viewingLevel: 30,
  }

  useBoundStore.setState(state)
  // A server render reads the store's initial state (zustand passes it as the
  // server snapshot), so the component's hooks see it only if it is set there.
  Object.assign(useBoundStore.getInitialState(), state)
  takeCapturedHandler()
  renderToStaticMarkup(
    createElement(MapDisplay3D, { mapGroupRef: { current: null } }),
  )
  const captured = takeCapturedHandler()
  if (!captured) throw new Error('test helper: handler was not captured')
  const before = new Set(board.boardPieces.map((bp) => bp.uid))
  captured(
    {
      button: 0,
      shiftKey,
      ctrlKey: false,
      metaKey: false,
      stopPropagation: () => undefined,
    } as unknown as ThreeEvent<PointerEvent>,
    hex,
  )
  const after = useBoundStore.getState()
  return {
    added: after.boardPieces.filter((bp) => !before.has(bp.uid)),
    boardPieces: after.boardPieces,
    board: { boardHexes: after.boardHexes, boardPieces: after.boardPieces },
    selectedPieceIDs: after.selectedPieceIDs,
    conflictedPieceUIDs: after.conflictedPieceUIDs,
  }
}

export function clickWithSelection({
  board,
  hex,
  selectedPieceIDs,
  rotationPivot = null,
  shiftKey = false,
}: {
  board: Board
  hex: BoardHex
  selectedPieceIDs: string[]
  rotationPivot?: RotationPivot | null
  shiftKey?: boolean
}): { selectedPieceIDs: string[]; rotationPivot: RotationPivot | null } {
  const { boardHexes, boardPieces } = structuredClone(board)
  const state = {
    boardHexes,
    boardPieces,
    conflictedPieceUIDs: [],
    selectedPieceIDs,
    rotationPivot,
    penMode: SELECT_PEN_MODE,
    viewingLevel: 30,
  }
  useBoundStore.setState(state)
  Object.assign(useBoundStore.getInitialState(), state)
  takeCapturedHandler()
  renderToStaticMarkup(
    createElement(MapDisplay3D, { mapGroupRef: { current: null } }),
  )
  const captured = takeCapturedHandler()
  if (!captured) throw new Error('test helper: handler was not captured')
  captured(
    {
      button: 0,
      shiftKey,
      ctrlKey: false,
      metaKey: false,
      stopPropagation: () => undefined,
    } as unknown as ThreeEvent<PointerEvent>,
    hex,
  )
  const after = useBoundStore.getState()
  return {
    selectedPieceIDs: after.selectedPieceIDs,
    rotationPivot: after.rotationPivot,
  }
}
