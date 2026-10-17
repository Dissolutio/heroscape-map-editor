import type { BoardHexes, CubeCoordinate, Piece } from '../types'
import { HexTerrain } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { HEXGRID_MAX_ALTITUDE } from '../utils/constants'
import { genBoardHexID } from '../utils/map-utils'
import { addPiece } from './addPiece'
import getPieceTemplateCoords from './rotationTransforms'
import { verticalObstructionTemplates } from './vertical-obstruction-templates'

export function getSmartPlacementAltitude({
  boardHexes,
  piece,
  pieceCoords,
  altitude,
  rotation,
}: {
  boardHexes: BoardHexes
  piece: Piece
  pieceCoords: CubeCoordinate
  altitude: number
  rotation: number
}): number {
  if (
    piece.isOverlayPiece ||
    piece.terrain === HexTerrain.laurWallAddon ||
    (!piece.isObstaclePiece &&
      !isSolidTerrainHex(piece.terrain) &&
      !isFluidTerrainHex(piece.terrain)) ||
    altitude >= HEXGRID_MAX_ALTITUDE
  ) {
    return altitude
  }
  const footprint = getPieceTemplateCoords({
    clickedHex: pieceCoords,
    rotation,
    template: piece.template,
    isVsTile: false,
  })
  if (footprint.length < 2) return altitude

  // Probe only these columns, including the full obstacle clearance. Never
  // clone or replay the whole map during pointer movement.
  const localHexes: BoardHexes = {}
  const candidates = new Set([altitude])
  const clearance = Math.max(
    piece.height,
    ...(verticalObstructionTemplates[piece.id] ?? []),
  )
  for (const coords of footprint) {
    for (
      let level = altitude;
      level <= HEXGRID_MAX_ALTITUDE + clearance + 1;
      level += 0.5
    ) {
      const id = genBoardHexID({ ...coords, altitude: level })
      const hex = boardHexes[id]
      if (!hex) continue
      localHexes[id] = hex
      if (
        level < HEXGRID_MAX_ALTITUDE &&
        hex.terrain !== HexTerrain.empty &&
        !hex.isVerticalClearanceHex
      ) {
        candidates.add(level)
      }
    }
  }

  for (const candidate of [...candidates].sort((a, b) => a - b)) {
    const args = {
      piece,
      pieceCoords,
      placementAltitude: candidate,
      rotation,
      isVsTile: false,
      boardPieces: [],
    }
    // addPiece shallow-copies its input but edits the hex objects themselves.
    const strict = addPiece({
      ...args,
      boardHexes: structuredClone(localHexes),
    })
    if (strict.error) continue
    // Strict clearance rules allow some overlaps that permissive painting
    // would overwrite. Check the actual paint path as well.
    const painted = addPiece({
      ...args,
      boardHexes: structuredClone(localHexes),
      permissive: true,
    })
    if (!painted.error && !painted.displacedUIDs?.length) return candidate
  }
  // Keep intentional, permissive placement possible when no level fits.
  return altitude
}
