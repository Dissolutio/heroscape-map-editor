import type {
  BoardHex,
  BoardHexes,
  BoardPiece,
  BoardPieces,
  CubeCoordinate,
} from '../types'
import { Pieces } from '../types'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import { getLaurAddonFootprint } from './laurAddonFootprints'
import { getLaurAddonCanonicalKey } from './laurAddonPlacement'
import { piecesSoFar } from './pieces'

const coordKey = ({ q, r, s }: CubeCoordinate) => `${q},${r},${s}`
const overlapsAltitude = (
  altitude: number,
  height: number,
  otherAltitude: number,
) => otherAltitude >= altitude && otherAltitude < altitude + height

type AltitudeBand = {
  uid: string
  altitude: number
  height: number
}

type LaurAddon = {
  piece: BoardPiece
  canonicalKey: string | null
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

function flagOverlappingBands(bands: AltitudeBand[], conflicts: Set<string>) {
  const ordered = [...bands].sort(
    (a, b) =>
      a.altitude - b.altitude ||
      a.altitude + a.height - (b.altitude + b.height),
  )
  let greatestEnd = Number.NEGATIVE_INFINITY
  let greatestEndUID: string | undefined

  for (const band of ordered) {
    if (band.altitude < greatestEnd && greatestEndUID) {
      conflicts.add(band.uid)
      conflicts.add(greatestEndUID)
    }
    const end = band.altitude + band.height
    if (end > greatestEnd) {
      greatestEnd = end
      greatestEndUID = band.uid
    }
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
    const footprint = getLaurAddonFootprint({
      inventoryID: piece.inventoryID,
      anchor: piece.pieceCoords,
      altitude: piece.altitude,
      rotation: piece.rotation,
    })
    return [
      {
        piece,
        canonicalKey: getLaurAddonCanonicalKey(
          piece.pieceCoords,
          piece.rotation,
        ),
        footprint,
        heightInLevels:
          footprint?.heightInLevels ?? piecesSoFar[piece.inventoryID]?.height,
      },
    ]
  })

  const bandsByCanonicalKey = new Map<string, AltitudeBand[]>()
  const blockedBandsByCoordinate = new Map<string, AltitudeBand[]>()
  for (const addon of addons) {
    if (addon.heightInLevels !== undefined && addon.canonicalKey) {
      addToIndex(bandsByCanonicalKey, addon.canonicalKey, {
        uid: addon.piece.uid,
        altitude: addon.piece.altitude,
        height: addon.heightInLevels,
      })
    }
    for (const hex of addon.footprint?.blockedHexes ?? []) {
      addToIndex(blockedBandsByCoordinate, coordKey(hex), {
        uid: addon.piece.uid,
        altitude: addon.piece.altitude,
        height: addon.footprint?.heightInLevels ?? 0,
      })
    }
  }
  for (const bands of bandsByCanonicalKey.values()) {
    flagOverlappingBands(bands, conflicts)
  }
  for (const bands of blockedBandsByCoordinate.values()) {
    flagOverlappingBands(bands, conflicts)
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
          conflicts.add(addon.piece.uid)
          conflicts.add(uid)
        }
      }
    }
    inspectHexes(footprint.endHexes, true)
    inspectHexes(footprint.blockedHexes, false)
  }

  return [...conflicts]
}
