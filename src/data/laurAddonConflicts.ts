import type { BoardHexes, BoardPieces, CubeCoordinate } from '../types'
import { HexTerrain } from '../types'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import { getLaurAddonFootprint } from './laurAddonFootprints'
import { getLaurAddonCanonicalKey } from './laurAddonPlacement'

const coordKey = ({ q, r, s }: CubeCoordinate) => `${q},${r},${s}`
const overlapsAltitude = (
  altitude: number,
  height: number,
  otherAltitude: number,
) => otherAltitude >= altitude && otherAltitude < altitude + height
const overlapsAltitudeBands = (
  altitude: number,
  height: number,
  otherAltitude: number,
  otherHeight: number,
) => altitude < otherAltitude + otherHeight && otherAltitude < altitude + height

/**
 * Evaluate derived Laur add-on conflicts without changing either board input.
 * Physical footprint checks deliberately use only measured footprint data.
 */
export function evaluateLaurAddonConflicts(
  boardPieces: BoardPieces,
  boardHexes: BoardHexes,
) {
  const conflicts = new Set<string>()
  const addons = boardPieces.flatMap((piece) => {
    if (!isLaurWallAddonPieceID(piece.inventoryID)) return []
    const canonicalKey = getLaurAddonCanonicalKey(
      piece.pieceCoords,
      piece.rotation,
    )
    if (!canonicalKey) return []
    return [
      {
        piece,
        canonicalKey,
        footprint: getLaurAddonFootprint({
          inventoryID: piece.inventoryID,
          anchor: piece.pieceCoords,
          altitude: piece.altitude,
          rotation: piece.rotation,
        }),
      },
    ]
  })

  for (let i = 0; i < addons.length; i++) {
    const addon = addons[i]
    for (let j = i + 1; j < addons.length; j++) {
      const other = addons[j]
      if (addon.canonicalKey === other.canonicalKey) {
        conflicts.add(addon.piece.uid)
        conflicts.add(other.piece.uid)
      }
      if (!addon.footprint || !other.footprint) continue
      if (
        addon.footprint.blockedHexes.some((hex) =>
          other.footprint?.blockedHexes.some(
            (otherHex) => coordKey(hex) === coordKey(otherHex),
          ),
        ) &&
        overlapsAltitudeBands(
          addon.piece.altitude,
          addon.footprint.heightInLevels,
          other.piece.altitude,
          other.footprint.heightInLevels,
        )
      ) {
        conflicts.add(addon.piece.uid)
        conflicts.add(other.piece.uid)
      }
    }

    if (!addon.footprint) continue
    const blockedCells = new Set(addon.footprint.blockedHexes.map(coordKey))
    for (const hex of Object.values(boardHexes)) {
      if (
        !hex.boardPieceUID ||
        hex.boardPieceUID === addon.piece.uid ||
        !blockedCells.has(coordKey(hex)) ||
        !overlapsAltitude(
          addon.piece.altitude,
          addon.footprint.heightInLevels,
          hex.altitude,
        )
      ) {
        continue
      }
      if (hex.terrain !== HexTerrain.empty || hex.inventoryID || hex.pieceID) {
        conflicts.add(addon.piece.uid)
        conflicts.add(hex.boardPieceUID)
      }
    }
  }
  return [...conflicts]
}
