import type {
  BoardHexes,
  BoardPiece,
  BoardPieces,
  CubeCoordinate,
} from '../types'
import { HexTerrain, Pieces } from '../types'
import { piecesSoFar } from './pieces'
import getPieceTemplateCoords from './rotationTransforms'

export const isVoidMatPieceID = (inventoryID: string) =>
  piecesSoFar[inventoryID]?.terrain === HexTerrain.voidMat

export type VoidMatLayout = {
  pieceCoords: CubeCoordinate
  rotation: number
}

/** The full hexes a Void Mat or Marker occupies visually on the table. */
export function getVoidMatHexes(
  mat: Pick<BoardPiece, 'inventoryID' | 'pieceCoords' | 'rotation'>,
): CubeCoordinate[] {
  const piece = piecesSoFar[mat.inventoryID]
  if (!piece) return []
  return getPieceTemplateCoords({
    clickedHex: mat.pieceCoords,
    rotation: mat.rotation,
    template: piece.template,
    isVsTile: false,
  })
}

/** Finds the Void Mat placement covered by exactly these level-0 markers. */
export function findVoidMatLayoutForMarkers(
  markers: readonly BoardPiece[],
): VoidMatLayout | undefined {
  if (
    markers.length !== 14 ||
    markers.some(
      (marker) =>
        marker.inventoryID !== Pieces.voidMarker || marker.altitude !== 0,
    )
  ) {
    return undefined
  }

  const markerHexIDs = new Set(
    markers.map(({ pieceCoords: { q, r, s } }) => `${q},${r},${s}`),
  )
  if (markerHexIDs.size !== 14) return undefined

  for (const marker of markers) {
    for (let rotation = 0; rotation < 6; rotation += 1) {
      const layout = {
        pieceCoords: marker.pieceCoords,
        rotation,
      }
      const matHexIDs = new Set(
        getVoidMatHexes({
          inventoryID: Pieces.voidMat,
          ...layout,
        }).map(({ q, r, s }) => `${q},${r},${s}`),
      )
      if (
        matHexIDs.size === markerHexIDs.size &&
        [...matHexIDs].every((hexID) => markerHexIDs.has(hexID))
      ) {
        return layout
      }
    }
  }

  return undefined
}

/**
 * The topmost Void Mat or Marker at a table hex, only when nothing else is
 * there, so a void piece never takes a click from a piece standing on it.
 */
export function findVoidMatAtTableHex(
  boardPieces: BoardPieces,
  boardHexes: BoardHexes,
  { q, r, s }: CubeCoordinate,
): BoardPiece | undefined {
  const isOccupied = Object.values(boardHexes).some(
    (hex) => hex.q === q && hex.r === r && Boolean(hex.boardPieceUID),
  )
  if (isOccupied) return undefined
  for (let index = boardPieces.length - 1; index >= 0; index -= 1) {
    const candidate = boardPieces[index]
    if (!isVoidMatPieceID(candidate.inventoryID)) continue
    if (
      getVoidMatHexes(candidate).some(
        (hex) => hex.q === q && hex.r === r && hex.s === s,
      )
    ) {
      return candidate
    }
  }
  return undefined
}
