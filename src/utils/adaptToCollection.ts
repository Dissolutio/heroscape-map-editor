import { piecesSoFar } from '../data/pieces'
import getPieceTemplateCoords from '../data/rotationTransforms'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import {
  HexTerrain,
  Pieces,
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

export type ObstacleAdaptChoice = {
  targetInventoryIDs: string[]
}

export type CollectionLandSupply = {
  hasAnyPieces: boolean
  byTerrainAndSize: Map<string, Map<number, string>>
  ownedTerrains: string[]
  hexesByTerrain: Map<string, number>
  quantityByInventoryID: Map<string, number>
  obstacleQuantityByInventoryID: Map<string, number>
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

export type UnconvertedObstaclePieceCount = {
  inventoryID: string
  count: number
}

export type CollectionAdaptationPlan = {
  mapping: Record<string, string>
  surfaceCoverageByTerrain: Record<string, number[]>
  unconvertedPieces: UnconvertedLandPieceCount[]
  obstacleCoverageByInventoryID: Record<string, number[]>
  unconvertedObstacles: UnconvertedObstaclePieceCount[]
}

export const ADAPTED_MAP_SUFFIX = ' (Adapted to collection)'

// Families share substitutes only when listed together; matching candidates
// must still have the exact same footprint. Keep this table editable as the
// physical-piece equivalences are verified.
export const OBSTACLE_SUBSTITUTION_FAMILIES: Record<string, string[]> = {
  forestTree: ['forestTree', 'snowTree'],
  snowTree: ['forestTree', 'snowTree'],
  rockOutcrop: ['rockOutcrop', 'lavaRockOutcrop', 'toxicOutcrop'],
  lavaRockOutcrop: ['rockOutcrop', 'lavaRockOutcrop', 'toxicOutcrop'],
  toxicOutcrop: ['rockOutcrop', 'lavaRockOutcrop', 'toxicOutcrop'],
  laurJungleTree: ['laurJungleTree', 'ticallaPalm'],
  ticallaPalm: ['laurJungleTree', 'ticallaPalm'],
  glacier: ['glacier'],
  marvelRuin: ['marvelRuin'],
  ruins: ['ruins'],
  shroudshroom: ['shroudshroom'],
  laurWall: ['laurWall'],
  ship: ['ship'],
}

const gameplayAffectingObstacleFamilies = new Set([
  'laurJungleTree',
  'ticallaPalm',
  'shroudshroom',
])

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
  const obstacleQuantityByInventoryID = new Map<string, number>()

  for (const [inventoryID, count] of Object.entries(inventory)) {
    if (count <= 0) continue
    const piece = piecesSoFar[inventoryID]
    if (!piece || piece.isUninventoried) {
      continue
    }

    if (
      piece.isObstaclePiece &&
      !piece.isOverlayPiece &&
      piece.terrain !== HexTerrain.startZone
    ) {
      obstacleQuantityByInventoryID.set(inventoryID, count)
    }

    if (
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
    obstacleQuantityByInventoryID,
  }
}

export function isGameplayAffectingObstacle(inventoryID: string): boolean {
  const piece = piecesSoFar[inventoryID]
  return Boolean(
    piece &&
      (inventoryID === Pieces.cannon ||
        (piece.pieceSizeFamily &&
          gameplayAffectingObstacleFamilies.has(piece.pieceSizeFamily))),
  )
}

const obstacleFootprintSignature = (inventoryID: string): string => {
  const piece = piecesSoFar[inventoryID]
  if (!piece?.isObstaclePiece || !piece.template) return ''

  const signatures = Array.from({ length: 6 }, (_, rotation) => {
    const coordinates = getPieceTemplateCoords({
      clickedHex: { q: 0, r: 0, s: 0 },
      rotation,
      template: piece.template,
      isVsTile: false,
    })
    const unique = [
      ...new Map(
        coordinates.map((coordinate) => [
          `${coordinate.q},${coordinate.r},${coordinate.s}`,
          coordinate,
        ]),
      ).values(),
    ].sort((a, b) => a.q - b.q || a.r - b.r || a.s - b.s)
    const origin = unique[0]
    if (!origin) return ''
    return JSON.stringify(
      unique.map(({ q, r, s }) => [q - origin.q, r - origin.r, s - origin.s]),
    )
  })
  return signatures.filter(Boolean).sort()[0] ?? ''
}

export function getObstacleSubstituteCandidates(
  inventoryID: string,
  inventory: PieceInventory,
  boardPieces?: BoardPiece[],
): string[] {
  const source = piecesSoFar[inventoryID]
  const sourceFamily = source?.pieceSizeFamily
  const compatibleFamilies = sourceFamily
    ? OBSTACLE_SUBSTITUTION_FAMILIES[sourceFamily]
    : undefined
  if (!source?.isObstaclePiece || !compatibleFamilies) return []

  const sourceFootprint = obstacleFootprintSignature(inventoryID)
  if (!sourceFootprint) return []
  const sourceBoardPieces =
    boardPieces?.filter(
      (boardPiece) => boardPiece.inventoryID === inventoryID,
    ) ?? []
  const conflictsBefore = boardPieces
    ? new Set(computeConflictedPieceUIDs(boardPieces))
    : undefined

  return Object.entries(inventory)
    .filter(([candidateID, count]) => {
      const candidate = piecesSoFar[candidateID]
      return (
        candidateID !== inventoryID &&
        count > 0 &&
        candidate?.isObstaclePiece &&
        !candidate.isUninventoried &&
        candidate.pieceSizeFamily &&
        compatibleFamilies.includes(candidate.pieceSizeFamily) &&
        candidate.size === source.size &&
        obstacleFootprintSignature(candidateID) === sourceFootprint &&
        sourceBoardPieces.every((boardPiece) => {
          if (!boardPieces || !conflictsBefore) return true
          const replacedPieces = boardPieces.map((current) =>
            current.uid === boardPiece.uid
              ? { ...current, inventoryID: candidateID }
              : current,
          )
          return computeConflictedPieceUIDs(replacedPieces).every((uid) =>
            conflictsBefore.has(uid),
          )
        })
      )
    })
    .map(([candidateID]) => candidateID)
    .sort((a, b) => {
      const gameplayOrder =
        Number(isGameplayAffectingObstacle(a)) -
        Number(isGameplayAffectingObstacle(b))
      if (gameplayOrder) return gameplayOrder
      const heightDifference =
        Math.abs(piecesSoFar[a].height - source.height) -
        Math.abs(piecesSoFar[b].height - source.height)
      return (
        heightDifference ||
        piecesSoFar[a].title.localeCompare(piecesSoFar[b].title) ||
        a.localeCompare(b)
      )
    })
}

export function getMissingObstacles(
  boardPieces: BoardPiece[],
  inventory: PieceInventory,
): { inventoryID: string; count: number }[] {
  const usedByID = countPiecesUsedWithLaurStacking(boardPieces)
  return Object.entries(usedByID)
    .flatMap(([inventoryID, used]) => {
      const piece = piecesSoFar[inventoryID]
      if (
        !piece?.isObstaclePiece ||
        piece.isOverlayPiece ||
        piece.terrain === HexTerrain.startZone
      ) {
        return []
      }
      const missing = used - Math.max(0, inventory[inventoryID] ?? 0)
      return missing > 0 ? [{ inventoryID, count: missing }] : []
    })
    .sort(
      (a, b) =>
        Number(isGameplayAffectingObstacle(a.inventoryID)) -
          Number(isGameplayAffectingObstacle(b.inventoryID)) ||
        piecesSoFar[a.inventoryID].title.localeCompare(
          piecesSoFar[b.inventoryID].title,
        ) ||
        a.inventoryID.localeCompare(b.inventoryID),
    )
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
  obstacleChoices = {},
}: {
  boardHexes: BoardHexes
  boardPieces: BoardPiece[]
  supply: CollectionLandSupply
  choices: Record<string, TerrainAdaptChoice>
  buriedFillByKind: { solid: string; fluid: string }
  obstacleChoices?: Record<string, ObstacleAdaptChoice>
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
  const obstacleInventory = Object.fromEntries(
    supply.obstacleQuantityByInventoryID,
  )
  const missingObstacles = getMissingObstacles(boardPieces, obstacleInventory)
  const obstacleCandidatesByID = new Map(
    missingObstacles.map(({ inventoryID }) => [
      inventoryID,
      getObstacleSubstituteCandidates(
        inventoryID,
        obstacleInventory,
        boardPieces,
      ),
    ]),
  )
  const piecesByObstacle = new Map(
    missingObstacles.map(({ inventoryID }) => [
      inventoryID,
      boardPieces
        .filter((boardPiece) => boardPiece.inventoryID === inventoryID)
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
  const obstacleCoverageByInventoryID: Record<string, number[]> = {}
  const unconvertedObstacles = new Map<string, UnconvertedObstaclePieceCount>()

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

  const remainingObstacles = new Map(supply.obstacleQuantityByInventoryID)
  for (const [inventoryID, used] of Object.entries(
    countPiecesUsedWithLaurStacking(boardPieces),
  )) {
    remainingObstacles.set(
      inventoryID,
      Math.max(0, (remainingObstacles.get(inventoryID) ?? 0) - used),
    )
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

  for (const { inventoryID, count } of missingObstacles) {
    const source = piecesSoFar[inventoryID]
    if (!source) continue
    const choice = obstacleChoices[inventoryID]
    const targets = choice?.targetInventoryIDs ?? []
    const coverage = [0, 0, 0]
    obstacleCoverageByInventoryID[inventoryID] = coverage
    const sourcePieces = piecesByObstacle.get(inventoryID) ?? []
    const ownedCount = Math.max(
      0,
      Math.floor(obstacleInventory[inventoryID] ?? 0),
    )
    const piecesToReplace = sourcePieces.slice(ownedCount)
    for (const boardPiece of piecesToReplace.slice(0, count)) {
      const seen = new Set<string>()
      let allocated = false
      for (let rank = 0; rank < Math.min(targets.length, 3); rank += 1) {
        const targetID = targets[rank]
        if (!targetID || seen.has(targetID)) continue
        seen.add(targetID)
        if (
          !obstacleCandidatesByID.get(inventoryID)?.includes(targetID) ||
          (remainingObstacles.get(targetID) ?? 0) <= 0
        ) {
          continue
        }
        remainingObstacles.set(
          targetID,
          (remainingObstacles.get(targetID) ?? 0) - 1,
        )
        mapping[boardPiece.uid] = targetID
        coverage[rank] = (coverage[rank] ?? 0) + 1
        allocated = true
        break
      }
      if (!allocated) {
        const current = unconvertedObstacles.get(inventoryID)
        if (current) current.count += 1
        else unconvertedObstacles.set(inventoryID, { inventoryID, count: 1 })
      }
    }
  }

  return {
    mapping,
    surfaceCoverageByTerrain,
    unconvertedPieces: [...unconvertedByTerrainAndSize.values()].sort(
      (a, b) => a.terrain.localeCompare(b.terrain) || a.size - b.size,
    ),
    obstacleCoverageByInventoryID,
    unconvertedObstacles: [...unconvertedObstacles.values()].sort((a, b) =>
      piecesSoFar[a.inventoryID].title.localeCompare(
        piecesSoFar[b.inventoryID].title,
      ),
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
