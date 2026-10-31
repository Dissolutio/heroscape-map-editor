import type {
  BoardHex,
  BoardHexes,
  BoardPiece,
  BoardPieces,
  CubeCoordinate,
} from '../types'
import { HexTerrain, Pieces } from '../types'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import type { HexFeatureId } from './hexGrid/edgesAndNodes'
import { getLaurAddonFootprint } from './laurAddonFootprints'
import { getLaurAddonFeatureId } from './laurAddonPlacement'
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

type LaurAddon = {
  piece: BoardPiece
  featureId: HexFeatureId
  footprint: ReturnType<typeof getLaurAddonFootprint>
  heightInLevels: number | undefined
}

type LaurAddonInterval = {
  addon: LaurAddon
  altitude: number
  height: number
}

const pillarIDs = new Set<string>([
  Pieces.laurWallSquarePillar,
  Pieces.laurWallPillarStackable,
  Pieces.laurWallTrianglePillar,
])

function addToIndex<Key extends string, Value>(
  index: Map<Key, Value[]>,
  key: Key,
  value: Value,
) {
  const entries = index.get(key)
  if (entries) entries.push(value)
  else index.set(key, [value])
}

function addOverlappingIntervalConflicts(
  intervals: LaurAddonInterval[],
  conflicts: Set<string>,
  isExempt: (first: LaurAddon, second: LaurAddon) => boolean,
) {
  intervals.sort((first, second) => first.altitude - second.altitude)
  let active: LaurAddonInterval[] = []
  for (const interval of intervals) {
    active = active.filter(
      (candidate) => candidate.altitude + candidate.height > interval.altitude,
    )
    for (const candidate of active) {
      if (!(candidate.altitude < interval.altitude + interval.height)) continue
      if (isExempt(candidate.addon, interval.addon)) continue
      conflicts.add(candidate.addon.piece.uid)
      conflicts.add(interval.addon.piece.uid)
    }
    active.push(interval)
  }
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
    const featureId = getLaurAddonFeatureId(piece.pieceCoords, piece.rotation)
    if (!featureId) return []
    const footprint = getLaurAddonFootprint({
      inventoryID: piece.inventoryID,
      anchor: piece.pieceCoords,
      altitude: piece.altitude,
      rotation: piece.rotation,
    })
    return [
      {
        piece,
        featureId: footprint?.featureId ?? featureId,
        footprint,
        heightInLevels:
          footprint?.heightInLevels ?? piecesSoFar[piece.inventoryID]?.height,
      },
    ]
  })

  const isLegalStack = (first: LaurAddon, second: LaurAddon) => {
    const [lower, upper] =
      first.piece.altitude < second.piece.altitude
        ? [first, second]
        : [second, first]
    return (
      first.featureId === second.featureId &&
      upper.piece.altitude - lower.piece.altitude ===
        LAUR_ADDON_STACK_INCREMENT &&
      canLaurAddonStackOn(upper.piece.inventoryID, lower.piece.inventoryID)
    )
  }

  const addonsByFeatureId = new Map<HexFeatureId, LaurAddonInterval[]>()
  for (const addon of addons) {
    if (addon.heightInLevels === undefined) continue
    addToIndex(addonsByFeatureId, addon.featureId, {
      addon,
      altitude: addon.piece.altitude,
      height: addon.heightInLevels,
    })
  }
  for (const intervals of addonsByFeatureId.values()) {
    addOverlappingIntervalConflicts(intervals, conflicts, isLegalStack)
  }

  const addonsByBlockedCoordinate = new Map<string, LaurAddonInterval[]>()
  for (const addon of addons) {
    const footprint = addon.footprint
    if (!footprint) continue
    for (const coordinate of footprint.blockedHexes) {
      addToIndex(addonsByBlockedCoordinate, coordKey(coordinate), {
        addon,
        altitude: footprint.altitude,
        height: footprint.heightInLevels,
      })
    }
  }
  for (const intervals of addonsByBlockedCoordinate.values()) {
    addOverlappingIntervalConflicts(intervals, conflicts, isLegalStack)
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
    const footprintBaseHexAltitude = footprint.altitude + 1
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
            footprintBaseHexAltitude,
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
