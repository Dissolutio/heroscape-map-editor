import type { BoardPiece, BoardPieces } from '../types'
import { Pieces } from '../types'

export const LAUR_PILLAR_STACK_INCREMENT = 8

const squarePillarIDs = new Set<string>([
  Pieces.laurWallSquarePillar,
  Pieces.laurWallPillarStackable,
])

export const isLaurPillarID = (id: string) =>
  squarePillarIDs.has(id) || id === Pieces.laurWallTrianglePillar

const samePillarShape = (a: string, b: string) =>
  (squarePillarIDs.has(a) && squarePillarIDs.has(b)) ||
  (a === Pieces.laurWallTrianglePillar && b === Pieces.laurWallTrianglePillar)

export const areMatchingLaurPillarShapes = samePillarShape

export const getLaurPillarStackAltitude = (supportingAltitude: number) =>
  supportingAltitude + LAUR_PILLAR_STACK_INCREMENT

export function getSupportingLaurPillar(
  boardPieces: BoardPieces,
  upperPillar: BoardPiece,
) {
  const expectedAltitude = upperPillar.altitude - LAUR_PILLAR_STACK_INCREMENT
  return boardPieces.find(
    (piece) =>
      samePillarShape(piece.inventoryID, upperPillar.inventoryID) &&
      piece.pieceCoords.q === upperPillar.pieceCoords.q &&
      piece.pieceCoords.r === upperPillar.pieceCoords.r &&
      piece.pieceCoords.s === upperPillar.pieceCoords.s &&
      piece.altitude === expectedAltitude,
  )
}

export const hasSupportingLaurPillar = (
  boardPieces: BoardPieces,
  upperPillar: BoardPiece,
) => Boolean(getSupportingLaurPillar(boardPieces, upperPillar))
