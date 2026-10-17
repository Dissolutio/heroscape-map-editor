import { piecesSoFar } from '../data/pieces'
import getPieceTemplateCoords from '../data/rotationTransforms'
import type { BoardHexes, BoardPiece, CubeCoordinate } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from './board-utils'
import { HEX_DIRECTIONS, hexUtilsAdd } from './hex-utils'
import { genBoardHexID, getSurfaceAltitudeByPieceUID } from './map-utils'

export type BuriedStatus = {
  /** Every surface hex has land directly on top of it. */
  isBuried: boolean
  /** At least one surface hex has land directly on top of it. */
  isPartiallyBuried: boolean
  /** Every side is covered by neighbouring land over the piece's full height. */
  isSubterrainBuried: boolean
}

// Altitudes are always multiples of a half level (see getLandAltitudeIncrement).
const HALF = 0.5

const isLandTerrain = (terrain: string) =>
  isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain)

/**
 * Builds a checker for the buried status of land pieces on one board. Returns
 * null for pieces that are not land (or are unknown).
 *
 * A land piece placed at altitude B with its surface at S occupies the band
 * (B, S]: a whole level, or a half level for fluid on fluid and for solid on a
 * half-level fluid. Every board hex is the top of such a band for the piece
 * that owns it, which is how neighbour coverage is measured.
 */
export function makeBuriedStatusChecker(
  boardHexes: BoardHexes,
  boardPieces: BoardPiece[],
) {
  const surfaceByUID = getSurfaceAltitudeByPieceUID(boardHexes)
  const placementByUID = new Map(boardPieces.map((bp) => [bp.uid, bp.altitude]))

  const landHexAt = (coord: CubeCoordinate, altitude: number) => {
    const hex = boardHexes[genBoardHexID({ ...coord, altitude })]
    return hex && isLandTerrain(hex.terrain) ? hex : undefined
  }

  // Land directly on top of a surface at `surface`: a cover piece placed there
  // tops out half a level or a whole level higher.
  const isCovered = (coord: CubeCoordinate, surface: number) =>
    Boolean(landHexAt(coord, surface + HALF) || landHexAt(coord, surface + 1))

  // Does the land in this column cover the whole band (bottom, top]? Each land
  // hex at altitude h covers its own piece's band (placement, h]. A hex that
  // covers part of the band tops out at most one level above it.
  const isColumnCovering = (
    coord: CubeCoordinate,
    bottom: number,
    top: number,
    counts: (terrain: string) => boolean,
  ) => {
    const bands: [number, number][] = []
    for (let h = bottom + HALF; h <= top + 1; h += HALF) {
      const hex = landHexAt(coord, h)
      if (!hex || !counts(hex.terrain)) continue
      const base = placementByUID.get(hex.boardPieceUID ?? '') ?? h - 1
      bands.push([base, h])
    }
    for (let seg = bottom; seg < top; seg += HALF) {
      const isSegmentCovered = bands.some(
        ([base, h]) => base <= seg && h >= seg + HALF,
      )
      if (!isSegmentCovered) return false
    }
    return true
  }

  return (bp: BoardPiece): BuriedStatus | null => {
    const piece = piecesSoFar[bp.inventoryID]
    if (!piece || !isLandTerrain(piece.terrain)) return null
    const footprint = getPieceTemplateCoords({
      clickedHex: bp.pieceCoords,
      rotation: bp.rotation,
      template: piece.template,
      isVsTile: false,
    })
    if (!footprint.length) return null
    const surface = surfaceByUID.get(bp.uid) ?? bp.altitude + 1

    const covered = footprint.map((c) => isCovered(c, surface))

    const footprintKeys = new Set(footprint.map((c) => `${c.q},${c.r}`))
    const counts = isFluidTerrainHex(piece.terrain)
      ? isLandTerrain
      : isSolidTerrainHex
    const isSubterrainBuried = footprint.every((c) =>
      Object.values(HEX_DIRECTIONS).every((dir) => {
        const n = hexUtilsAdd(c, dir)
        if (footprintKeys.has(`${n.q},${n.r}`)) return true
        return isColumnCovering(n, bp.altitude, surface, counts)
      }),
    )

    return {
      isBuried: covered.every(Boolean),
      isPartiallyBuried: covered.some(Boolean),
      isSubterrainBuried,
    }
  }
}
