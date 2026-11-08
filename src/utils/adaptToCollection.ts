import { piecesSoFar } from '../data/pieces'
import getPieceTemplateCoords from '../data/rotationTransforms'
import {
  HexTerrain,
  type BoardHexes,
  type BoardPiece,
  type PieceInventory,
} from '../types'
import { countPiecesUsedWithLaurStacking } from '../inventory/laurInventoryReconcile'
import { isFluidTerrainHex, isSolidTerrainHex } from './board-utils'
import { makeBuriedStatusChecker } from './buriedStatus'

export type AdaptScope = 'wholeColumn' | 'surfaceOnly'

export type TerrainAdaptChoice = {
  targetTerrains: string[]
  scope: AdaptScope
}

export type CollectionLandSupply = {
  hasAnyPieces: boolean
  byTerrainAndSize: Map<string, Map<number, string>>
  ownedTerrains: string[]
  hexesByTerrain: Map<string, number>
  quantityByInventoryID: Map<string, number>
}

export type TerrainHexCounts = {
  terrain: string
  surfaceHexes: number
  buriedHexes: number
}

export type UnconvertedLandPieceCount = {
  terrain: string
  size: number
  count: number
}

export type CollectionAdaptationPlan = {
  mapping: Record<string, string>
  surfaceCoverageByTerrain: Record<string, number[]>
  unconvertedPieces: UnconvertedLandPieceCount[]
}

export const ADAPTED_MAP_SUFFIX = ' (Adapted to collection)'

export function getAdaptedMapName(mapName: string): string {
  const name = mapName.trim()
  if (!name) return 'Adapted to collection'
  return name.endsWith(ADAPTED_MAP_SUFFIX)
    ? name
    : `${name}${ADAPTED_MAP_SUFFIX}`
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

export function getCollectionLandSupply(
  inventory: PieceInventory,
): CollectionLandSupply {
  const byTerrainAndSize = new Map<string, Map<number, string>>()
  const hexesByTerrain = new Map<string, number>()
  const quantityByInventoryID = new Map<string, number>()

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
    quantityByInventoryID.set(inventoryID, count)
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
    quantityByInventoryID,
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
          (supply.hexesByTerrain.get(a) ?? 0) || a.localeCompare(b),
    )[0] ?? ''
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
          (supply.hexesByTerrain.get(a) ?? 0) || a.localeCompare(b),
    )
  return owned[0] ?? ''
}

export function buildCollectionAdaptationPlan({
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
}): CollectionAdaptationPlan {
  const checkBuried = makeBuriedStatusChecker(boardHexes, boardPieces)
  const analysis = analyzeMapTerrain(boardHexes, boardPieces)
  const missingTerrains = getMissingLandTerrains(analysis, supply)
  const piecesByTerrain = new Map(
    missingTerrains.map((terrain) => [
      terrain,
      boardPieces
        .filter(
          (boardPiece) =>
            piecesSoFar[boardPiece.inventoryID]?.terrain === terrain,
        )
        .sort(
          (a, b) =>
            a.pieceCoords.q - b.pieceCoords.q ||
            a.pieceCoords.r - b.pieceCoords.r ||
            a.altitude - b.altitude ||
            a.rotation - b.rotation ||
            a.uid.localeCompare(b.uid),
        ),
    ]),
  )
  const remaining = new Map(supply.quantityByInventoryID)
  for (const [inventoryID, used] of Object.entries(
    countPiecesUsedWithLaurStacking(boardPieces),
  )) {
    remaining.set(
      inventoryID,
      Math.max(0, (remaining.get(inventoryID) ?? 0) - used),
    )
  }
  const mapping: Record<string, string> = {}
  const surfaceCoverageByTerrain: Record<string, number[]> = {}
  const unconvertedByTerrainAndSize = new Map<
    string,
    UnconvertedLandPieceCount
  >()

  const recordUnconverted = (terrain: string, size: number) => {
    const key = `${terrain}:${size}`
    const current = unconvertedByTerrainAndSize.get(key)
    if (current) current.count += 1
    else
      unconvertedByTerrainAndSize.set(key, {
        terrain,
        size,
        count: 1,
      })
  }

  const allocate = (
    boardPiece: BoardPiece,
    sourceTerrain: string,
    targets: string[],
  ): number | undefined => {
    const fluid = isFluidTerrainHex(sourceTerrain)
    const seen = new Set<string>()
    for (let rank = 0; rank < Math.min(targets.length, 3); rank += 1) {
      const targetTerrain = targets[rank]
      if (
        !targetTerrain ||
        seen.has(targetTerrain) ||
        isGenericTerrain(targetTerrain) ||
        !terrainMatchesKind(targetTerrain, fluid)
      ) {
        continue
      }
      seen.add(targetTerrain)
      const sourceSize = piecesSoFar[boardPiece.inventoryID]?.size
      if (sourceSize === undefined) continue
      const targetID = supply.byTerrainAndSize
        .get(targetTerrain)
        ?.get(sourceSize)
      if (!targetID || (remaining.get(targetID) ?? 0) <= 0) continue
      remaining.set(targetID, (remaining.get(targetID) ?? 0) - 1)
      mapping[boardPiece.uid] = targetID
      return rank
    }
    return undefined
  }

  for (const terrain of missingTerrains) {
    surfaceCoverageByTerrain[terrain] = [0, 0, 0]
    const choice = choices[terrain]
    for (const boardPiece of piecesByTerrain.get(terrain) ?? []) {
      if (checkBuried(boardPiece)?.isBuried) continue
      const sourcePiece = piecesSoFar[boardPiece.inventoryID]
      if (!sourcePiece) continue
      const rank = allocate(boardPiece, terrain, choice?.targetTerrains ?? [])
      if (rank === undefined) {
        recordUnconverted(terrain, sourcePiece.size)
      } else {
        const coverage = surfaceCoverageByTerrain[terrain]
        if (coverage) {
          coverage[rank] = (coverage[rank] ?? 0) + sourcePiece.size
        }
      }
    }
  }

  for (const terrain of missingTerrains) {
    const choice = choices[terrain]
    const fluid = isFluidTerrainHex(terrain)
    const fillTerrain = fluid ? buriedFillByKind.fluid : buriedFillByKind.solid
    for (const boardPiece of piecesByTerrain.get(terrain) ?? []) {
      if (!checkBuried(boardPiece)?.isBuried) continue
      const sourcePiece = piecesSoFar[boardPiece.inventoryID]
      if (!sourcePiece) continue
      const targets =
        choice?.scope === 'surfaceOnly'
          ? [fillTerrain]
          : (choice?.targetTerrains ?? [])
      if (allocate(boardPiece, terrain, targets) === undefined) {
        recordUnconverted(terrain, sourcePiece.size)
      }
    }
  }

  return {
    mapping,
    surfaceCoverageByTerrain,
    unconvertedPieces: [...unconvertedByTerrainAndSize.values()].sort(
      (a, b) => a.terrain.localeCompare(b.terrain) || a.size - b.size,
    ),
  }
}

export function buildCollectionAdaptationMapping(
  args: Parameters<typeof buildCollectionAdaptationPlan>[0],
): Record<string, string> {
  return buildCollectionAdaptationPlan(args).mapping
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
