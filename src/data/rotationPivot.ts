import type { BoardHex, BoardHexes, BoardPiece, CubeCoordinate } from '../types'
import { genBoardHexID, getBoardHex3DCoords } from '../utils/map-utils'

export type RotationPivot = {
  uid: string
  coords: CubeCoordinate
  pieceCoords: CubeCoordinate
  pieceAltitude: number
  surfaceAltitude: number
}

export type ResolvedRotationPivot = {
  coords: CubeCoordinate
  surfaceAltitude: number
}

export function getClosestOwnedPieceHex(
  boardHexes: BoardHexes,
  uid: string,
  point: { x: number; z: number },
): BoardHex | undefined {
  const ownedHexes = Object.values(boardHexes).filter(
    (hex) => hex.boardPieceUID === uid && !hex.isVerticalClearanceHex,
  )
  if (!ownedHexes.length) return undefined

  return ownedHexes
    .map((hex) => {
      const position = getBoardHex3DCoords(hex)
      return {
        hex,
        distance: Math.hypot(position.x - point.x, position.z - point.z),
      }
    })
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        a.hex.q - b.hex.q ||
        a.hex.r - b.hex.r ||
        b.hex.altitude - a.hex.altitude,
    )[0]?.hex
}

const getOriginSurfaceAltitude = (
  piece: BoardPiece,
  boardHexes: BoardHexes,
) => {
  for (const altitude of [piece.altitude + 1, piece.altitude + 0.5]) {
    const hex = boardHexes[genBoardHexID({ ...piece.pieceCoords, altitude })]
    if (hex?.boardPieceUID === piece.uid && !hex.isVerticalClearanceHex) {
      return altitude
    }
  }
  return piece.altitude + 1
}

const sameCoords = (a: CubeCoordinate, b: CubeCoordinate) =>
  a.q === b.q && a.r === b.r && a.s === b.s

export function createRotationPivot(
  piece: BoardPiece,
  hex: BoardHex,
): RotationPivot | null {
  if (hex.boardPieceUID !== piece.uid) return null

  return {
    uid: piece.uid,
    coords: { q: hex.q, r: hex.r, s: hex.s },
    pieceCoords: piece.pieceCoords,
    pieceAltitude: piece.altitude,
    surfaceAltitude: hex.altitude,
  }
}

export function resolveRotationPivot(
  selectedPieceIDs: readonly string[],
  boardPieces: readonly BoardPiece[],
  boardHexes: BoardHexes,
  rotationPivot: RotationPivot | null,
): ResolvedRotationPivot | undefined {
  const uid = selectedPieceIDs[selectedPieceIDs.length - 1]
  const piece = boardPieces.find((candidate) => candidate.uid === uid)
  if (!uid || !piece) return undefined

  const hasMatchingAnchor =
    rotationPivot !== null &&
    rotationPivot.uid === uid &&
    rotationPivot.pieceAltitude === piece.altitude &&
    sameCoords(rotationPivot.pieceCoords, piece.pieceCoords)
  const storedHex = hasMatchingAnchor
    ? boardHexes[
        genBoardHexID({
          ...rotationPivot.coords,
          altitude: rotationPivot.surfaceAltitude,
        })
      ]
    : undefined

  if (rotationPivot && storedHex?.boardPieceUID === uid) {
    return {
      coords: rotationPivot.coords,
      surfaceAltitude: rotationPivot.surfaceAltitude,
    }
  }

  return {
    coords: piece.pieceCoords,
    surfaceAltitude: getOriginSurfaceAltitude(piece, boardHexes),
  }
}

export function reanchorRotationPivotAfterGroupRotation(
  selectedPieceIDs: readonly string[],
  previousBoardPieces: readonly BoardPiece[],
  previousBoardHexes: BoardHexes,
  nextBoardPieces: readonly BoardPiece[],
  nextBoardHexes: BoardHexes,
  rotationPivot: RotationPivot | null,
): RotationPivot | null {
  const uid = selectedPieceIDs[selectedPieceIDs.length - 1]
  if (!uid || rotationPivot?.uid !== uid) return null

  const previousPiece = previousBoardPieces.find((piece) => piece.uid === uid)
  if (
    !previousPiece ||
    rotationPivot.pieceAltitude !== previousPiece.altitude ||
    !sameCoords(rotationPivot.pieceCoords, previousPiece.pieceCoords)
  ) {
    return null
  }

  const pivotHexID = genBoardHexID({
    ...rotationPivot.coords,
    altitude: rotationPivot.surfaceAltitude,
  })
  const previousPivotHex = previousBoardHexes[pivotHexID]
  if (
    previousPivotHex?.boardPieceUID !== uid ||
    previousPivotHex.isVerticalClearanceHex
  ) {
    return null
  }

  const nextPiece = nextBoardPieces.find((piece) => piece.uid === uid)
  const nextPivotHex = nextBoardHexes[pivotHexID]
  if (
    !nextPiece ||
    nextPivotHex?.boardPieceUID !== uid ||
    nextPivotHex.isVerticalClearanceHex
  ) {
    return null
  }

  return {
    ...rotationPivot,
    pieceCoords: { ...nextPiece.pieceCoords },
    pieceAltitude: nextPiece.altitude,
  }
}

export function shouldSetRotationPivotOnClick(
  selectedPieceIDs: readonly string[],
  boardPieces: readonly BoardPiece[],
  boardHexes: BoardHexes,
  rotationPivot: RotationPivot | null,
  clickedHex: BoardHex,
  isMultiSelect: boolean,
): boolean {
  if (isMultiSelect || selectedPieceIDs.length < 2) return false

  const lastSelectedUID = selectedPieceIDs[selectedPieceIDs.length - 1]
  const resolved = resolveRotationPivot(
    selectedPieceIDs,
    boardPieces,
    boardHexes,
    rotationPivot,
  )
  if (
    !resolved ||
    lastSelectedUID !== clickedHex.boardPieceUID ||
    sameCoords(resolved.coords, clickedHex)
  ) {
    return false
  }

  return (
    clickedHex.boardPieceUID === lastSelectedUID &&
    boardHexes[
      genBoardHexID({
        ...clickedHex,
        altitude: clickedHex.altitude,
      })
    ]?.boardPieceUID === clickedHex.boardPieceUID
  )
}
