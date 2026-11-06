import { piecesSoFar } from '../data/pieces'
import getPieceTemplateCoords from '../data/rotationTransforms'
import {
  HexTerrain,
  PiecePrefixes,
  type BoardHexes,
  type BoardPiece,
  type PieceInventory,
} from '../types'
import { countPiecesUsedWithLaurStacking } from '../inventory/laurInventoryReconcile'
import { isFluidTerrainHex, isSolidTerrainHex } from './board-utils'
import { makeBuriedStatusChecker } from './buriedStatus'

export type AdaptScope = 'wholeColumn' | 'surfaceOnly'

export type TerrainAdaptChoice = {
  targetTerrain: string
  scope: AdaptScope
}

export type CollectionLandSupply = {
  hasAnyPieces: boolean
  byTerrainAndSize: Map<string, Map<number, string>>
  ownedTerrains: string[]
  hexesByTerrain: Map<string, number>
}

export type TerrainHexCounts = {
  terrain: string
  surfaceHexes: number
  buriedHexes: number
}

// Candidates are ordered from closest to broad fallback; suggestions below
// discard any candidate whose solid/fluid kind differs from the source.
export const TERRAIN_SIMILARITY: Record<string, string[]> = {
  [HexTerrain.snow]: [HexTerrain.ice, HexTerrain.grass, HexTerrain.rock],
  [HexTerrain.ice]: [HexTerrain.water, HexTerrain.swampWater],
  [HexTerrain.lavaField]: [
    HexTerrain.lavaField,
    HexTerrain.toxic,
    HexTerrain.rock,
  ],
  [HexTerrain.lava]: [HexTerrain.lava, HexTerrain.toxicWater, HexTerrain.water],
  [HexTerrain.swamp]: [HexTerrain.swamp, HexTerrain.grass, HexTerrain.rock],
  [HexTerrain.swampWater]: [
    HexTerrain.swampWater,
    HexTerrain.water,
    HexTerrain.toxicWater,
  ],
}

const isLandTerrain = (terrain: string) =>
  isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain)

const isGenericTerrain = (terrain: string) =>
  terrain === HexTerrain.generic || terrain === HexTerrain.genericFluid

const getGenericTerrain = (fluid: boolean) =>
  fluid ? HexTerrain.genericFluid : HexTerrain.generic

const getGenericInventoryID = (size: number, fluid: boolean) => {
  const prefix = fluid ? PiecePrefixes.genericFluid : PiecePrefixes.generic
  const inventoryID = `${prefix}${size}`
  return piecesSoFar[inventoryID] ? inventoryID : undefined
}

export function getCollectionLandSupply(
  inventory: PieceInventory,
): CollectionLandSupply {
  const byTerrainAndSize = new Map<string, Map<number, string>>()
  const hexesByTerrain = new Map<string, number>()

  for (const [inventoryID, count] of Object.entries(inventory)) {
    if (count <= 0) continue
    const piece = piecesSoFar[inventoryID]
    if (
      !piece ||
      piece.isUninventoried ||
      !piece.isHexTerrainPiece ||
      !isLandTerrain(piece.terrain) ||
      isGenericTerrain(piece.terrain)
    ) {
      continue
    }

    if (!byTerrainAndSize.has(piece.terrain)) {
      byTerrainAndSize.set(piece.terrain, new Map())
    }
    byTerrainAndSize.get(piece.terrain)?.set(piece.size, inventoryID)
    hexesByTerrain.set(
      piece.terrain,
      (hexesByTerrain.get(piece.terrain) ?? 0) + piece.size * count,
    )
  }

  return {
    hasAnyPieces: Object.entries(inventory).some(([inventoryID, count]) => {
      const piece = piecesSoFar[inventoryID]
      return count > 0 && Boolean(piece && !piece.isUninventoried)
    }),
    byTerrainAndSize,
    ownedTerrains: [...byTerrainAndSize.keys()].sort(),
    hexesByTerrain,
  }
}

export function analyzeMapTerrain(
  boardHexes: BoardHexes,
  boardPieces: BoardPiece[],
): TerrainHexCounts[] {
  const checkBuried = makeBuriedStatusChecker(boardHexes, boardPieces)
  const counts = new Map<string, TerrainHexCounts>()

  for (const boardPiece of boardPieces) {
    const piece = piecesSoFar[boardPiece.inventoryID]
    if (!piece?.isHexTerrainPiece || !isLandTerrain(piece.terrain)) continue
    const footprint = getPieceTemplateCoords({
      clickedHex: boardPiece.pieceCoords,
      rotation: boardPiece.rotation,
      template: piece.template,
      isVsTile: false,
    })
    if (!footprint.length) continue

    const row = counts.get(piece.terrain) ?? {
      terrain: piece.terrain,
      surfaceHexes: 0,
      buriedHexes: 0,
    }
    const hexCount = footprint.length
    if (checkBuried(boardPiece)?.isBuried) {
      row.buriedHexes += hexCount
    } else {
      row.surfaceHexes += hexCount
    }
    counts.set(piece.terrain, row)
  }

  return [...counts.values()].sort((a, b) => a.terrain.localeCompare(b.terrain))
}

const terrainMatchesKind = (terrain: string, fluid: boolean) =>
  fluid ? isFluidTerrainHex(terrain) : isSolidTerrainHex(terrain)

export function suggestTerrainTarget(
  sourceTerrain: string,
  supply: CollectionLandSupply,
): string {
  if (supply.byTerrainAndSize.has(sourceTerrain)) return sourceTerrain
  const fluid = isFluidTerrainHex(sourceTerrain)
  const owned = supply.ownedTerrains.filter((terrain) =>
    terrainMatchesKind(terrain, fluid),
  )
  const preferred = (TERRAIN_SIMILARITY[sourceTerrain] ?? []).find((terrain) =>
    owned.includes(terrain),
  )
  if (preferred) return preferred

  return (
    owned.sort(
      (a, b) =>
        (supply.hexesByTerrain.get(b) ?? 0) -
        (supply.hexesByTerrain.get(a) ?? 0),
    )[0] ?? getGenericTerrain(fluid)
  )
}

export function suggestBuriedFillTerrain(
  supply: CollectionLandSupply,
  fluid: boolean,
): string {
  const grass = supply.byTerrainAndSize.has(HexTerrain.grass)
  if (!fluid && grass) return HexTerrain.grass

  const owned = supply.ownedTerrains
    .filter((terrain) => terrainMatchesKind(terrain, fluid))
    .sort(
      (a, b) =>
        (supply.hexesByTerrain.get(b) ?? 0) -
        (supply.hexesByTerrain.get(a) ?? 0),
    )
  return owned[0] ?? getGenericTerrain(fluid)
}

export function buildCollectionAdaptationMapping({
  boardHexes,
  boardPieces,
  supply,
  choices,
  buriedFillByKind,
}: {
  boardHexes: BoardHexes
  boardPieces: BoardPiece[]
  supply: CollectionLandSupply
  choices: Record<string, TerrainAdaptChoice>
  buriedFillByKind: { solid: string; fluid: string }
}): Record<string, string> {
  const checkBuried = makeBuriedStatusChecker(boardHexes, boardPieces)
  const byUID: Record<string, string> = {}

  for (const boardPiece of boardPieces) {
    const piece = piecesSoFar[boardPiece.inventoryID]
    if (
      !piece?.isHexTerrainPiece ||
      !isLandTerrain(piece.terrain) ||
      isGenericTerrain(piece.terrain)
    ) {
      continue
    }

    const choice = choices[piece.terrain]
    if (!choice) continue
    const fluid = isFluidTerrainHex(piece.terrain)
    const targetTerrain =
      choice.scope === 'surfaceOnly' && checkBuried(boardPiece)?.isBuried
        ? fluid
          ? buriedFillByKind.fluid
          : buriedFillByKind.solid
        : choice.targetTerrain

    if (targetTerrain === piece.terrain) continue
    if (!terrainMatchesKind(targetTerrain, fluid)) continue
    const targetID = isGenericTerrain(targetTerrain)
      ? getGenericInventoryID(piece.size, fluid)
      : (supply.byTerrainAndSize.get(targetTerrain)?.get(piece.size) ??
        getGenericInventoryID(piece.size, fluid))

    if (targetID && targetID !== boardPiece.inventoryID) {
      byUID[boardPiece.uid] = targetID
    }
  }

  return byUID
}

export function getRemainingLandShortfalls(
  boardPieces: BoardPiece[],
  inventory: PieceInventory,
) {
  const usedByID = countPiecesUsedWithLaurStacking(boardPieces)
  return Object.entries(usedByID)
    .flatMap(([inventoryID, used]) => {
      const piece = piecesSoFar[inventoryID]
      if (!piece?.isHexTerrainPiece || !isLandTerrain(piece.terrain)) return []
      const shortfall = used - (inventory[inventoryID] ?? 0)
      if (shortfall <= 0) return []
      return [{ inventoryID, shortfall }]
    })
    .sort((a, b) => a.inventoryID.localeCompare(b.inventoryID))
}

export function getMissingLandTerrains(
  analysis: TerrainHexCounts[],
  supply: CollectionLandSupply,
): string[] {
  return analysis
    .filter(
      ({ terrain }) =>
        !isGenericTerrain(terrain) && !supply.byTerrainAndSize.has(terrain),
    )
    .map(({ terrain }) => terrain)
}
