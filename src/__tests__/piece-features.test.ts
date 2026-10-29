import { describe, expect, it } from 'vitest'
import { getPossibleRotationsForPenMode } from '../controls/getPossibleRotationsForPenMode'
import { getEdgeDragTarget } from '../data/dragMove'
import {
  edgeIdFromHex,
  edgeToWorldPoint,
  hexesForEdge,
  hexesForNode,
  nodeIdFromHexCorner,
  nodeIdFromHexRotation,
} from '../data/hexGrid/edgesAndNodes'
import {
  getPieceFeatureIds,
  pieceFeatureDeclarations,
} from '../data/hexGrid/pieceFeatures'
import { getLaurAddonFootprint } from '../data/laurAddonFootprints'
import { getLaurAddonCanonicalKey } from '../data/laurAddonPlacement'
import { getPillarPorts } from '../data/laurPillarPorts'
import { piecesSoFar } from '../data/pieces'
import {
  type BoardPiece,
  type CubeCoordinate,
  HexTerrain,
  Pieces,
} from '../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'

const anchor: CubeCoordinate = { q: -3, r: 4, s: -1 }
const featureTerrains = new Set<string>([
  HexTerrain.laurWall,
  HexTerrain.laurWallAddon,
  HexTerrain.battlement,
  HexTerrain.roadWall,
  HexTerrain.ropeLadder,
])
const featurePieces = Object.values(piecesSoFar).filter((piece) =>
  featureTerrains.has(piece.terrain),
)
const featurePieceIDs = new Set(featurePieces.map((piece) => piece.id))

const coordinateKey = ({ q, r, s }: CubeCoordinate) => `${q},${r},${s}`

function sameHexes(first: CubeCoordinate[], second: CubeCoordinate[]) {
  return (
    first.map(coordinateKey).sort().join('|') ===
    second.map(coordinateKey).sort().join('|')
  )
}

function coordinatesFromKey(value: string) {
  return value.split('|').map((coordinate) => {
    const [q, r, s] = coordinate.split(',').map(Number)
    return { q, r, s }
  })
}

function featureIdFromLaurKey(key: string) {
  const [kind, coordinates] = key.split(':')
  const cells = coordinatesFromKey(coordinates)
  if (kind === 'side') {
    for (const cell of cells) {
      for (let direction = 0; direction < 6; direction += 1) {
        const id = edgeIdFromHex(cell, direction)
        if (sameHexes(hexesForEdge(id), cells)) return id
      }
    }
  }
  if (kind === 'vertex') {
    for (const cell of cells) {
      for (let corner = 0; corner < 6; corner += 1) {
        const id = nodeIdFromHexCorner(cell, corner)
        if (sameHexes(hexesForNode(id), cells)) return id
      }
    }
  }
  throw new Error(`Could not map Laur key to a feature ID: ${key}`)
}

function boardPiece(
  inventoryID: string,
  pieceCoords: CubeCoordinate,
  rotation: number,
): BoardPiece {
  return { uid: inventoryID, inventoryID, pieceCoords, rotation, altitude: 0 }
}

function edgePiecePlacement(
  pieceID: string,
  support: CubeCoordinate,
  edgeIndex: number,
) {
  if (pieceID === Pieces.battlement) {
    return {
      pieceID,
      pieceCoords: hexUtilsAdd(support, HEX_DIRECTIONS[edgeIndex]),
      rotation: (edgeIndex + 3) % 6,
    }
  }
  if (pieceID === Pieces.roadWall) {
    return {
      pieceID,
      pieceCoords: hexUtilsAdd(support, HEX_DIRECTIONS[(edgeIndex + 4) % 6]),
      rotation: edgeIndex,
    }
  }
  return { pieceID, pieceCoords: support, rotation: edgeIndex }
}

function edgePieceAtRotation(
  pieceID: string,
  support: CubeCoordinate,
  rotation: number,
) {
  if (pieceID === Pieces.battlement) {
    return {
      pieceID,
      pieceCoords: hexUtilsAdd(support, HEX_DIRECTIONS[(rotation + 3) % 6]),
      rotation,
    }
  }
  if (pieceID === Pieces.roadWall) {
    return {
      pieceID,
      pieceCoords: hexUtilsAdd(support, HEX_DIRECTIONS[(rotation + 4) % 6]),
      rotation,
    }
  }
  return { pieceID, pieceCoords: support, rotation }
}

describe('piece feature declarations and adapters', () => {
  it('declares every registered Laur, battlement, road-wall, and rope-ladder feature piece', () => {
    expect([...Object.keys(pieceFeatureDeclarations)].sort()).toEqual(
      [...featurePieceIDs].sort(),
    )
    expect(featurePieces).toHaveLength(14)

    for (const piece of featurePieces) {
      const declaration =
        pieceFeatureDeclarations[
          piece.id as keyof typeof pieceFeatureDeclarations
        ]
      const rotations = getPossibleRotationsForPenMode(piece.id)
      const hasWholeSteps = rotations.some(Number.isInteger)
      const hasHalfSteps = rotations.some(
        (rotation) => !Number.isInteger(rotation),
      )
      const expectedGranularity = hasWholeSteps
        ? hasHalfSteps
          ? 'whole-and-half-step'
          : 'whole-step'
        : 'half-step'
      expect(declaration.rotation).toBe(expectedGranularity)

      const featureKinds = new Set<string>()
      for (const rotation of rotations) {
        const result = getPieceFeatureIds({
          pieceID: piece.id,
          pieceCoords: anchor,
          rotation,
        })
        for (const featureId of result?.featureIds ?? []) {
          featureKinds.add(featureId.startsWith('edge:') ? 'edge' : 'node')
        }
      }
      expect([...declaration.featureKinds].sort()).toEqual(
        [...featureKinds].sort(),
      )
    }
  })

  it.each(featurePieces.map(({ id }) => id))(
    'matches legacy feature calculations for every legal %s rotation',
    (pieceID) => {
      const piece = piecesSoFar[pieceID]
      const rotations = getPossibleRotationsForPenMode(pieceID)
      expect(rotations.length).toBeGreaterThan(0)

      for (const rotation of rotations) {
        const result = getPieceFeatureIds({
          pieceID,
          pieceCoords: anchor,
          rotation,
          altitude: 7,
        })
        expect(result).not.toBeNull()
        if (!result) throw new Error(`Missing feature IDs for ${pieceID}`)

        if (piece.terrain === HexTerrain.laurWallAddon) {
          const legacyKey = getLaurAddonCanonicalKey(anchor, rotation)
          expect(legacyKey).not.toBeNull()
          expect(result.featureIds).toEqual([
            featureIdFromLaurKey(legacyKey as string),
          ])

          const legacyFootprint = getLaurAddonFootprint({
            inventoryID: pieceID,
            anchor,
            altitude: 7,
            rotation,
          })
          expect(legacyFootprint).not.toBeNull()
          expect(result.footprint).toEqual({
            endHexIds: legacyFootprint?.endHexes.map(
              (hex) => `hex:${hex.q},${hex.r},${hex.s}`,
            ),
            blockedHexIds: legacyFootprint?.blockedHexes.map(
              (hex) => `hex:${hex.q},${hex.r},${hex.s}`,
            ),
            altitude: legacyFootprint?.altitude,
            heightInLevels: legacyFootprint?.heightInLevels,
          })
        } else if (piece.terrain === HexTerrain.laurWall) {
          const legacyPorts = getPillarPorts(pieceID, rotation)
          expect(result.featureIds).toEqual(
            legacyPorts.map((port) =>
              Number.isInteger(port)
                ? edgeIdFromHex(anchor, port)
                : nodeIdFromHexRotation(anchor, port),
            ),
          )
          expect(result.footprint).toBeNull()
        } else {
          const placed = edgePieceAtRotation(pieceID, anchor, rotation)
          const legacyTarget = getEdgeDragTarget(
            piece,
            boardPiece(pieceID, placed.pieceCoords, placed.rotation),
            anchor,
          )
          expect(legacyTarget).not.toBeNull()
          if (!legacyTarget)
            throw new Error(`Missing drag target for ${pieceID}`)
          expect(getPieceFeatureIds(placed)?.featureIds).toEqual([
            edgeIdFromHex(anchor, legacyTarget.edgeIndex),
          ])
          expect(result.footprint).toBeNull()
        }
      }
    },
  )

  it('matches edge drag targets at every edge for battlements, road walls, and rope ladders', () => {
    for (const pieceID of [
      Pieces.battlement,
      Pieces.roadWall,
      Pieces.ropeLadder,
    ]) {
      const piece = piecesSoFar[pieceID]
      for (let edgeIndex = 0; edgeIndex < 6; edgeIndex += 1) {
        const target = getEdgeDragTarget(
          piece,
          boardPiece(pieceID, anchor, 0),
          anchor,
          edgeToWorldPoint(edgeIdFromHex(anchor, edgeIndex)),
        )
        expect(target?.edgeIndex).toBe(edgeIndex)
        const placed = edgePiecePlacement(pieceID, anchor, edgeIndex)
        expect(getPieceFeatureIds(placed)?.featureIds).toEqual([
          edgeIdFromHex(anchor, target?.edgeIndex ?? -1),
        ])
      }
    }
  })

  it('keeps feature identity independent of altitude and preserves altitude-keyed occupancy', () => {
    for (const pieceID of featurePieceIDs) {
      const rotation = getPossibleRotationsForPenMode(pieceID)[0]
      const low = getPieceFeatureIds({
        pieceID,
        pieceCoords: anchor,
        rotation,
        altitude: 2,
      })
      const high = getPieceFeatureIds({
        pieceID,
        pieceCoords: anchor,
        rotation,
        altitude: 18,
      })
      expect(low?.featureIds).toEqual(high?.featureIds)
      expect(low?.featureIds.map((featureId) => [featureId, 2])).not.toEqual(
        high?.featureIds.map((featureId) => [featureId, 18]),
      )
    }
  })
})
