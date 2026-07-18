import type { BoardPiece } from '../types'
import { piecesSoFar } from '../data/pieces'
import { HEX_DIRECTIONS, hexUtilsAdd } from './hex-utils'
import { genBoardHexID } from './map-utils'

/**
 * Selection expansion utilities for piece context menu.
 * These functions help users select groups of related pieces.
 */

/**
 * Get all piece UIDs on the same altitude level as the clicked piece.
 * Includes the clicked piece itself.
 */
export function selectAllPiecesOnLevel(
  pieceID: string,
  boardPieces: BoardPiece[],
): string[] {
  const clickedPiece = boardPieces.find((bp) => bp.uid === pieceID)
  if (!clickedPiece) return []

  return boardPieces
    .filter((bp) => bp.altitude === clickedPiece.altitude)
    .map((bp) => bp.uid)
}

/**
 * Get all piece UIDs of the same type on the same altitude level.
 * Includes the clicked piece itself.
 */
export function selectAllPiecesOfType(
  pieceID: string,
  boardPieces: BoardPiece[],
): string[] {
  const clickedPiece = boardPieces.find((bp) => bp.uid === pieceID)
  if (!clickedPiece) return []

  return boardPieces
    .filter(
      (bp) =>
        bp.inventoryID === clickedPiece.inventoryID &&
        bp.altitude === clickedPiece.altitude,
    )
    .map((bp) => bp.uid)
}

/**
 * Get all piece UIDs that neighbor the clicked piece.
 * A neighboring piece is one that:
 * - Is on the same altitude level
 * - Has a hex coordinate adjacent to the clicked piece
 * Does NOT include the clicked piece itself.
 */
export function selectNeighboringPieces(
  pieceID: string,
  boardPieces: BoardPiece[],
): string[] {
  const clickedPiece = boardPieces.find((bp) => bp.uid === pieceID)
  if (!clickedPiece) return []

  const clickedCoords = clickedPiece.pieceCoords
  const clickedAltitude = clickedPiece.altitude

  // Get the piece's footprint to determine all its hex coordinates
  const piece = piecesSoFar[clickedPiece.inventoryID]
  if (!piece || !piece.template) return []

  // For simplicity, we check neighbors of the clicked piece's origin coordinate
  // In reality, for multi-hex pieces, we might want to check neighbors of all hexes
  const neighborCoords = Object.values(HEX_DIRECTIONS).map((direction) =>
    hexUtilsAdd(clickedCoords, direction),
  )

  const neighboringPieces = boardPieces.filter(
    (bp) =>
      bp.uid !== pieceID &&
      bp.altitude === clickedAltitude &&
      neighborCoords.some(
        (coord) =>
          coord.q === bp.pieceCoords.q &&
          coord.r === bp.pieceCoords.r &&
          coord.s === bp.pieceCoords.s,
      ),
  )

  return neighboringPieces.map((bp) => bp.uid)
}
