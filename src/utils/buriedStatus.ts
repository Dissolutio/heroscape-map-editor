import { piecesSoFar } from '../data/pieces'
import getPieceTemplateCoords from '../data/rotationTransforms'
import type { BoardHexes, BoardPiece, CubeCoordinate } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from './board-utils'
import { HEX_DIRECTIONS, hexUtilsAdd } from './hex-utils'
import { genBoardHexID, getSurfaceAltitudeByPieceUID } from './map-utils'

export type BuriedStatus = {
  /** Every surface hex has land resting directly on its cap (see isCovered). */
  isBuried: boolean
  /** At least one surface hex has land resting directly on its cap. */
  isPartiallyBuried: boolean
  /** Every side is covered by neighbouring land over the piece's full height. */
  isSubterrainBuried: boolean
}

// Altitudes are always multiples of a half level (see getLandAltitudeIncrement).
const HALF = 0.5

type Band = [bottom: number, top: number]

/**
 * The height a land hex physically fills, from its in-app surface altitude.
 * A solid tile is a full level thick: (h - 1, h]. A fluid tile is half a level
 * thick and its real top sits half a level below its in-app surface:
 * (h - 1, h - 0.5]. So water on the table fills 0 to 0.5, water stacked on it
 * (surface 1.5) fills 0.5 to 1, and grass on that stack (surface 2) fills 1 to 2.
 */
const physicalBand = (terrain: string, h: number): Band =>
  isFluidTerrainHex(terrain) ? [h - 1, h - HALF] : [h - 1, h]

const isLandTerrain = (terrain: string) =>
  isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain)

/**
 * Builds a checker for the buried status of land pieces on one board. Returns
 * null for pieces that are not land (or are unknown).
 *
 * Both checks use physical heights, not in-app altitudes (see physicalBand):
 * a cap is buried only by land resting on it, and a side is buried only when
 * neighbouring land physically fills the piece's whole height beside it.
 */
export function makeBuriedStatusChecker(
  boardHexes: BoardHexes,
  boardPieces: BoardPiece[],
) {
  const surfaceByUID = getSurfaceAltitudeByPieceUID(boardHexes)
  const pieceByUID = new Map(boardPieces.map((bp) => [bp.uid, bp]))

  const landHexAt = (coord: CubeCoordinate, altitude: number) => {
    const hex = boardHexes[genBoardHexID({ ...coord, altitude })]
    return hex && isLandTerrain(hex.terrain) ? hex : undefined
  }

  const getFootprint = (bp: BoardPiece) => {
    const piece = piecesSoFar[bp.inventoryID]
    if (!piece) return []
    return getPieceTemplateCoords({
      clickedHex: bp.pieceCoords,
      rotation: bp.rotation,
      template: piece.template,
      isVsTile: false,
    })
  }

  // Does every hex under this piece's footprint hold fluid? Only then does it
  // physically rest on the fluid caps; anything solid under it holds it up
  // higher, leaving a gap over the (thinner) fluid tiles.
  const restsOnFluid = (cover: BoardPiece) =>
    getFootprint(cover).every((c) => {
      const under =
        boardHexes[genBoardHexID({ ...c, altitude: cover.altitude })]
      return Boolean(under && isFluidTerrainHex(under.terrain))
    })

  // Land directly on top of a surface at `surface`: a cover piece placed at
  // exactly that altitude (it tops out half a level or a whole level higher).
  // A fluid tile is physically half a level thick, so its cap is only touched
  // by a cover that rests on fluid; a solid cap is touched by any cover.
  const isCovered = (
    coord: CubeCoordinate,
    surface: number,
    isFluidPiece: boolean,
  ) =>
    [surface + HALF, surface + 1].some((h) => {
      const cover = pieceByUID.get(landHexAt(coord, h)?.boardPieceUID ?? '')
      if (!cover || cover.altitude !== surface) return false
      return !isFluidPiece || restsOnFluid(cover)
    })

  // Does the land in this column cover the whole physical band (bottom, top]?
  // Bands that touch it top out between bottom + 0.5 and top + 1.
  const isColumnCovering = (
    coord: CubeCoordinate,
    [bottom, top]: Band,
    counts: (terrain: string) => boolean,
  ) => {
    const bands: Band[] = []
    for (let h = bottom + HALF; h <= top + 1; h += HALF) {
      const hex = landHexAt(coord, h)
      if (hex && counts(hex.terrain)) bands.push(physicalBand(hex.terrain, h))
    }
    for (let seg = bottom; seg < top; seg += HALF) {
      const isSegmentCovered = bands.some(
        ([lo, hi]) => lo <= seg && hi >= seg + HALF,
      )
      if (!isSegmentCovered) return false
    }
    return true
  }

  return (bp: BoardPiece): BuriedStatus | null => {
    const piece = piecesSoFar[bp.inventoryID]
    if (!piece || !isLandTerrain(piece.terrain)) return null
    const footprint = getFootprint(bp)
    if (!footprint.length) return null
    const surface = surfaceByUID.get(bp.uid) ?? bp.altitude + 1
    const isFluidPiece = isFluidTerrainHex(piece.terrain)

    const covered = footprint.map((c) => isCovered(c, surface, isFluidPiece))

    const footprintKeys = new Set(footprint.map((c) => `${c.q},${c.r}`))
    const counts = isFluidPiece ? isLandTerrain : isSolidTerrainHex
    const ownBand = physicalBand(piece.terrain, surface)
    const isSubterrainBuried = footprint.every((c) =>
      Object.values(HEX_DIRECTIONS).every((dir) => {
        const n = hexUtilsAdd(c, dir)
        if (footprintKeys.has(`${n.q},${n.r}`)) return true
        return isColumnCovering(n, ownBand, counts)
      }),
    )

    return {
      isBuried: covered.every(Boolean),
      isPartiallyBuried: covered.some(Boolean),
      isSubterrainBuried,
    }
  }
}
