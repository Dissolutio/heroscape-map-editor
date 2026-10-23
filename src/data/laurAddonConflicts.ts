import type {
  BoardHex,
  BoardHexes,
  BoardPiece,
  BoardPieces,
  CubeCoordinate,
} from '../types'
import { HexTerrain, Pieces } from '../types'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import { getLaurAddonFootprint } from './laurAddonFootprints'
import { getLaurAddonCanonicalKey } from './laurAddonPlacement'
import {
  LAUR_ADDON_STACK_INCREMENT,
  canLaurAddonStackOn,
} from './laurAddonStacking'
import { piecesSoFar } from './pieces'

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

type LaurAddon = {
  piece: BoardPiece
  canonicalKey: string
  footprint: ReturnType<typeof getLaurAddonFootprint>
  heightInLevels: number | undefined
}

const pillarIDs = new Set<string>([
  Pieces.laurWallSquarePillar,
  Pieces.laurWallPillarStackable,
  Pieces.laurWallTrianglePillar,
])

function addToIndex<T>(index: Map<string, T[]>, key: string, value: T) {
  const entries = index.get(key)
  if (entries) entries.push(value)
  else index.set(key, [value])
}

/**
 * Evaluate derived Laur add-on conflicts without changing either board input.
 * Physical checks use registered footprint data; shared attachment identities
 * are checked separately from blocked-hex overlap.
 */
export function evaluateLaurAddonConflicts(
  boardPieces: BoardPieces,
  boardHexes: BoardHexes,
) {
  const conflicts = new Set<string>()
  const pieceByUID = new Map(boardPieces.map((piece) => [piece.uid, piece]))
  const addons: LaurAddon[] = boardPieces.flatMap((piece) => {
    if (!isLaurWallAddonPieceID(piece.inventoryID)) return []
    const canonicalKey = getLaurAddonCanonicalKey(
      piece.pieceCoords,
      piece.rotation,
    )
    if (!canonicalKey) return []
    const footprint = getLaurAddonFootprint({
      inventoryID: piece.inventoryID,
      anchor: piece.pieceCoords,
      altitude: piece.altitude,
      rotation: piece.rotation,
    })
    return [
      {
        piece,
        canonicalKey,
        footprint,
        heightInLevels:
          footprint?.heightInLevels ?? piecesSoFar[piece.inventoryID]?.height,
      },
    ]
  })

  for (let i = 0; i < addons.length; i++) {
    const addon = addons[i]
    for (let j = i + 1; j < addons.length; j++) {
      const other = addons[j]
      const [lower, upper] =
        addon.piece.altitude < other.piece.altitude
          ? [addon, other]
          : [other, addon]
      const isLegalStack =
        addon.canonicalKey === other.canonicalKey &&
        upper.piece.altitude - lower.piece.altitude ===
          LAUR_ADDON_STACK_INCREMENT &&
        canLaurAddonStackOn(upper.piece.inventoryID, lower.piece.inventoryID)
      if (
        !isLegalStack &&
        addon.canonicalKey === other.canonicalKey &&
        addon.heightInLevels !== undefined &&
        other.heightInLevels !== undefined &&
        overlapsAltitudeBands(
          addon.piece.altitude,
          addon.heightInLevels,
          other.piece.altitude,
          other.heightInLevels,
        )
      ) {
        conflicts.add(addon.piece.uid)
        conflicts.add(other.piece.uid)
      }
      if (!addon.footprint || !other.footprint) continue
      if (
        !isLegalStack &&
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
  }

  const occupantsByCoordinate = new Map<string, BoardHex[]>()
  for (const hex of Object.values(boardHexes)) {
    if (hex.boardPieceUID) {
      addToIndex(occupantsByCoordinate, coordKey(hex), hex)
    }
  }
  const pillarsByCoordinate = new Map<string, BoardPiece[]>()
  for (const piece of boardPieces) {
    if (pillarIDs.has(piece.inventoryID)) {
      addToIndex(pillarsByCoordinate, coordKey(piece.pieceCoords), piece)
    }
  }

  for (const addon of addons) {
    const footprint = addon.footprint
    if (!footprint) continue
    const inspectHexes = (
      coordinates: CubeCoordinate[],
      attachmentEnds: boolean,
    ) => {
      for (const coordinate of coordinates) {
        const hasPillarAtEnd =
          attachmentEnds &&
          (pillarsByCoordinate.get(coordKey(coordinate)) ?? []).some(
            (pillar) =>
              pillar.altitude >= footprint.altitude &&
              pillar.altitude < footprint.altitude + footprint.heightInLevels,
          )
        const occupants: BoardHex[] = (
          occupantsByCoordinate.get(coordKey(coordinate)) ?? []
        ).filter((hex) =>
          overlapsAltitude(
            footprint.altitude,
            footprint.heightInLevels,
            hex.altitude,
          ),
        )
        for (const hex of occupants) {
          const uid: string | undefined = hex.boardPieceUID
          if (!uid || uid === addon.piece.uid) continue

          const inventoryID =
            pieceByUID.get(uid)?.inventoryID ?? hex.inventoryID
          if (
            (attachmentEnds &&
              (pillarIDs.has(inventoryID) ||
                (hasPillarAtEnd &&
                  piecesSoFar[inventoryID]?.isHexTerrainPiece))) ||
            (!attachmentEnds && isLaurWallAddonPieceID(inventoryID))
          ) {
            continue
          }
          if (
            hex.terrain !== HexTerrain.empty ||
            hex.inventoryID ||
            hex.pieceID
          ) {
            conflicts.add(addon.piece.uid)
            conflicts.add(uid)
          }
        }
      }
    }
    inspectHexes(footprint.endHexes, true)
    inspectHexes(footprint.blockedHexes, false)
  }

  return [...conflicts]
}
