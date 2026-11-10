import { piecesSoFar } from '../data/pieces'
import {
  type TerrainSetKind,
  terrainSetsByShortID,
} from '../data/terrainSets'
import {
  countPiecesUsedWithLaurStacking,
  reconcileLaurLegacyToStackableUsage,
} from '../inventory/laurInventoryReconcile'
import {
  type BoardPiece,
  type PieceInventory,
  Pieces,
  isGenericPieceID,
} from '../types'

// A is a discontinued community concept; B and DD are large tournament kits.
export const EXCLUDED_SET_IDS = ['A', 'B', 'DD'] as const

export const JUNGLE_PIECE_EQUIVALENTS = [
  { laur: Pieces.laurPalm13, ticalla: Pieces.palm14 },
  { laur: Pieces.laurPalm14, ticalla: Pieces.palm15 },
  { laur: Pieces.laurPalm15, ticalla: Pieces.palm16 },
  { laur: Pieces.laurBrush10, ticalla: Pieces.brush9 },
] as const

const MAX_EXACT_SET_COPIES = 128
const MAX_OPTIONS = 20
const BOX_CEILING = 2
const DEFAULT_TIME_BUDGET_MS = 150
export const DEFAULT_VISIBLE_OPTION_COUNT = 6

export type PieceCount = {
  inventoryID: string
  title: string
  count: number
}

export type SetCount = {
  setID: string
  name: string
  abbreviation: string
  kind: TerrainSetKind
  count: number
}

const setKindLabels: {
  kind: TerrainSetKind
  singular: string
  plural: string
}[] = [
  { kind: 'masterSet', singular: 'Master Set', plural: 'Master Sets' },
  { kind: 'expansion', singular: 'Expansion', plural: 'Expansions' },
  { kind: 'promo', singular: 'Promo', plural: 'Promos' },
]

export const formatSetKindTotals = (
  sets: Pick<SetCount, 'kind' | 'count'>[],
) =>
  setKindLabels
    .flatMap(({ kind, singular, plural }) => {
      const count = sets.reduce(
        (total, set) => total + (set.kind === kind ? set.count : 0),
        0,
      )
      return count
        ? [`${count} ${count === 1 ? singular : plural}`]
        : []
    })
    .join(', ')

export type SetsToBuildMapOption = {
  sets: SetCount[]
  boxCount: number
}

export type SetsToBuildMapCategory = {
  id: 'contemporary' | 'classic' | 'mixed'
  title: 'Contemporary' | 'Classic' | 'Mixed'
  options: SetsToBuildMapOption[]
  reason?: string
  approximate: boolean
}

export type SetsToBuildMapCatalog = {
  categories: SetsToBuildMapCategory[]
  notInAnySet: PieceCount[]
  ignored: PieceCount[]
}

type Era = 'contemporary' | 'classic'
type SetCandidate = {
  id: string
  name: string
  abbreviation: string
  kind: TerrainSetKind
  era: Era
  inventory: PieceInventory
}

const pieceTitle = (inventoryID: string) =>
  piecesSoFar[inventoryID]?.title ?? inventoryID

const isIgnoredPiece = (inventoryID: string) => {
  if (isGenericPieceID(inventoryID)) return true
  const title = piecesSoFar[inventoryID]?.title.toLowerCase() ?? ''
  return title.includes('start zone') || title.includes('glyph')
}

const getPieceCounts = (counts: Record<string, number>): PieceCount[] =>
  Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([inventoryID, count]) => ({
      inventoryID,
      title: pieceTitle(inventoryID),
      count,
    }))
    .sort((a, b) => a.inventoryID.localeCompare(b.inventoryID))

const normalizeJungleCounts = (
  counts: Record<string, number>,
  family: 'laur' | 'ticalla',
) => {
  const normalized: Record<string, number> = {}
  for (const [inventoryID, count] of Object.entries(counts)) {
    const equivalent = JUNGLE_PIECE_EQUIVALENTS.find(({ laur, ticalla }) =>
      family === 'laur' ? inventoryID === ticalla : inventoryID === laur,
    )
    const normalizedID =
      family === 'laur'
        ? (equivalent?.laur ?? inventoryID)
        : (equivalent?.ticalla ?? inventoryID)
    normalized[normalizedID] = (normalized[normalizedID] ?? 0) + count
  }
  return normalized
}

const isJunglePiece = (inventoryID: string) =>
  JUNGLE_PIECE_EQUIVALENTS.some(
    ({ laur, ticalla }) => laur === inventoryID || ticalla === inventoryID,
  )

const allSets: SetCandidate[] = Object.values(terrainSetsByShortID).map(
  (set) => ({
    id: set.id,
    name: set.name,
    abbreviation: set.abbreviation,
    kind: set.kind,
    era: set.era as Era,
    inventory: set.inventory,
  }),
)

const candidatesFor = (category: 'contemporary' | 'classic' | 'mixed') =>
  allSets
    .filter(
      (candidate) =>
        !EXCLUDED_SET_IDS.includes(
          candidate.id as (typeof EXCLUDED_SET_IDS)[number],
        ) &&
        (category === 'mixed' || candidate.era === category),
    )
    .filter(
      (candidate) =>
        category !== 'mixed' ||
        candidate.id !== 'M' ||
        Object.keys(candidate.inventory).some((id) => !isJunglePiece(id)),
    )
    .map((candidate) => ({
      ...candidate,
      inventory:
        category === 'mixed'
          ? normalizeJungleCounts(candidate.inventory, 'laur')
          : candidate.inventory,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

const buildGreedyCounts = (
  requirements: number[],
  candidates: SetCandidate[],
  pieceIDs: string[],
): number[] => {
  const remaining = [...requirements]
  const counts = candidates.map(() => 0)

  while (remaining.some((count) => count > 0)) {
    let bestIndex = -1
    let bestCoverage = 0

    for (let setIndex = 0; setIndex < candidates.length; setIndex += 1) {
      const inventory = candidates[setIndex]?.inventory
      if (!inventory) continue
      let coverage = 0
      for (let pieceIndex = 0; pieceIndex < pieceIDs.length; pieceIndex += 1) {
        const pieceID = pieceIDs[pieceIndex]
        if (!pieceID) continue
        coverage += Math.min(
          remaining[pieceIndex] ?? 0,
          inventory[pieceID] ?? 0,
        )
      }
      if (coverage > bestCoverage) {
        bestCoverage = coverage
        bestIndex = setIndex
      }
    }

    if (bestIndex < 0) break
    const inventory = candidates[bestIndex]?.inventory
    if (!inventory) break
    counts[bestIndex] = (counts[bestIndex] ?? 0) + 1
    for (let pieceIndex = 0; pieceIndex < pieceIDs.length; pieceIndex += 1) {
      const pieceID = pieceIDs[pieceIndex]
      if (!pieceID) continue
      remaining[pieceIndex] = Math.max(
        0,
        (remaining[pieceIndex] ?? 0) - (inventory[pieceID] ?? 0),
      )
    }
  }

  return counts
}

const isCovered = (
  requirements: number[],
  candidates: SetCandidate[],
  pieceIDs: string[],
  counts: number[],
) =>
  requirements.every((needed, pieceIndex) => {
    let supplied = 0
    for (let setIndex = 0; setIndex < candidates.length; setIndex += 1) {
      supplied +=
        (counts[setIndex] ?? 0) *
        (candidates[setIndex]?.inventory[pieceIDs[pieceIndex] ?? ''] ?? 0)
    }
    return supplied >= needed
  })

const makeIrreducible = (
  counts: number[],
  requirements: number[],
  candidates: SetCandidate[],
  pieceIDs: string[],
) => {
  const result = [...counts]
  let changed = true
  while (changed) {
    changed = false
    for (let index = result.length - 1; index >= 0; index -= 1) {
      if (!(result[index] ?? 0)) continue
      result[index] = (result[index] ?? 0) - 1
      if (isCovered(requirements, candidates, pieceIDs, result)) {
        changed = true
      } else {
        result[index] = (result[index] ?? 0) + 1
      }
    }
  }
  return result
}

const isIrreducible = (
  counts: number[],
  requirements: number[],
  candidates: SetCandidate[],
  pieceIDs: string[],
) => {
  for (let index = 0; index < counts.length; index += 1) {
    if (!(counts[index] ?? 0)) continue
    counts[index] = (counts[index] ?? 0) - 1
    const stillCovered = isCovered(requirements, candidates, pieceIDs, counts)
    counts[index] = (counts[index] ?? 0) + 1
    if (stillCovered) return false
  }
  return true
}

const hasBothEras = (counts: number[], candidates: SetCandidate[]) => {
  let contemporary = false
  let classic = false
  for (let index = 0; index < counts.length; index += 1) {
    if (!(counts[index] ?? 0)) continue
    if (candidates[index]?.era === 'contemporary') contemporary = true
    if (candidates[index]?.era === 'classic') classic = true
  }
  return contemporary && classic
}

const toOption = (counts: number[], candidates: SetCandidate[]) => {
  const sets = candidates.flatMap((candidate, index) => {
    const count = counts[index] ?? 0
    return count
      ? [
          {
            setID: candidate.id,
            name: candidate.name,
            abbreviation: candidate.abbreviation,
            kind: candidate.kind,
            count,
          },
        ]
      : []
  })
  return {
    sets,
    boxCount: sets.reduce((sum, set) => sum + set.count, 0),
  }
}

const isSupersetOfPureOption = (
  mixed: SetsToBuildMapOption,
  pureOptions: SetsToBuildMapOption[],
) => {
  const mixedCounts = new Map(
    mixed.sets.map((set) => [set.setID, set.count] as const),
  )
  return pureOptions.some((pure) => {
    const pureCounts = new Map<string, number>()
    for (const set of pure.sets) {
      const setID = set.setID === 'M' ? 'L' : set.setID
      pureCounts.set(setID, (pureCounts.get(setID) ?? 0) + set.count)
    }
    return [...pureCounts].every(
      ([setID, count]) => (mixedCounts.get(setID) ?? 0) >= count,
    )
  })
}

const categoryTitle = {
  contemporary: 'Contemporary',
  classic: 'Classic',
  mixed: 'Mixed',
} as const

const impossibleReason = (
  category: 'contemporary' | 'classic',
  blockers: string[],
) =>
  `Not possible: this map uses ${blockers
    .slice(0, 3)
    .map(pieceTitle)
    .join(
      ', ',
    )}${blockers.length > 3 ? ' and other pieces' : ''}, which no ${categoryTitle[category]} set has.`

const solveCategory = (
  category: 'contemporary' | 'classic' | 'mixed',
  neededCounts: Record<string, number>,
  deadline: number,
  pureOptions: SetsToBuildMapOption[] = [],
) => {
  const normalizedNeeded =
    category === 'classic'
      ? normalizeJungleCounts(neededCounts, 'ticalla')
      : normalizeJungleCounts(neededCounts, 'laur')
  const pieceIDs = Object.keys(normalizedNeeded).sort((a, b) =>
    a.localeCompare(b),
  )
  const requirements = pieceIDs.map((pieceID) => normalizedNeeded[pieceID] ?? 0)
  const candidates = candidatesFor(category)
  const blockers = pieceIDs.filter(
    (pieceID) =>
      !candidates.some((candidate) => (candidate.inventory[pieceID] ?? 0) > 0),
  )

  if (blockers.length > 0) {
    return {
      options: [] as SetsToBuildMapOption[],
      reason:
        category === 'mixed'
          ? `Not possible: this map uses ${blockers
              .slice(0, 3)
              .map(pieceTitle)
              .join(
                ', ',
              )}${blockers.length > 3 ? ' and other pieces' : ''}, which no available set has.`
          : impossibleReason(category, blockers),
      approximate: false,
    }
  }

  if (pieceIDs.length === 0) {
    return {
      options: [{ sets: [], boxCount: 0 }],
      approximate: false,
    }
  }

  const greedyCounts = makeIrreducible(
    buildGreedyCounts(requirements, candidates, pieceIDs),
    requirements,
    candidates,
    pieceIDs,
  )
  const greedyOption = toOption(greedyCounts, candidates)
  const isMixedValid = (counts: number[]) =>
    category !== 'mixed' || hasBothEras(counts, candidates)
  const eligibleGreedy =
    isCovered(requirements, candidates, pieceIDs, greedyCounts) &&
    isMixedValid(greedyCounts)
      ? greedyOption
      : undefined

  if (greedyOption.boxCount > MAX_EXACT_SET_COPIES) {
    const options =
      eligibleGreedy &&
      (category !== 'mixed' ||
        !isSupersetOfPureOption(eligibleGreedy, pureOptions))
        ? [eligibleGreedy]
        : []
    return {
      options,
      reason:
        options.length > 0
          ? undefined
          : category === 'mixed'
            ? 'Mixed options could not be enumerated. Approximate.'
            : `${categoryTitle[category]} options could not be enumerated.`,
      approximate: true,
    }
  }

  let minimum: number | undefined
  const found: number[][] = []
  const foundKeys = new Set<string>()
  let timedOut = false

  const enumerate = (target: number) => {
    const counts = candidates.map(() => 0)

    const visit = (
      remaining: number[],
      startIndex: number,
      boxesLeft: number,
    ) => {
      if (Date.now() >= deadline) {
        timedOut = true
        return
      }
      if (remaining.every((count) => count === 0)) {
        if (boxesLeft !== 0) return
        if (!isMixedValid(counts)) return
        if (!isIrreducible(counts, requirements, candidates, pieceIDs)) return
        const key =
          category === 'mixed'
            ? counts
                .map((count, index) =>
                  candidates[index]?.id === 'L' ? 0 : count,
                )
                .join(',')
            : counts.join(',')
        if (!foundKeys.has(key)) {
          foundKeys.add(key)
          found.push([...counts])
        }
        return
      }
      if (boxesLeft === 0) return

      for (let pieceIndex = 0; pieceIndex < remaining.length; pieceIndex += 1) {
        const needed = remaining[pieceIndex] ?? 0
        if (!needed) continue
        let maxContribution = 0
        for (let index = startIndex; index < candidates.length; index += 1) {
          maxContribution = Math.max(
            maxContribution,
            candidates[index]?.inventory[pieceIDs[pieceIndex] ?? ''] ?? 0,
          )
        }
        if (
          maxContribution === 0 ||
          Math.ceil(needed / maxContribution) > boxesLeft
        ) {
          return
        }
      }

      for (let index = startIndex; index < candidates.length; index += 1) {
        const candidate = candidates[index]
        if (!candidate) continue
        const nextRemaining = remaining.map((needed, pieceIndex) => {
          const contribution =
            candidate.inventory[pieceIDs[pieceIndex] ?? ''] ?? 0
          return Math.max(0, needed - contribution)
        })
        if (nextRemaining.every((needed, i) => needed === remaining[i])) {
          continue
        }
        counts[index] = (counts[index] ?? 0) + 1
        visit(nextRemaining, index, boxesLeft - 1)
        counts[index] = (counts[index] ?? 1) - 1
        if (timedOut || found.length >= MAX_OPTIONS) return
      }
    }

    visit(requirements, 0, target)
  }

  const greedyTotal = greedyOption.boxCount
  for (let target = 1; target <= greedyTotal; target += 1) {
    enumerate(target)
    if (found.length > 0) {
      minimum = target
      break
    }
    if (timedOut || found.length >= MAX_OPTIONS) break
  }

  if (minimum !== undefined && !timedOut && found.length < MAX_OPTIONS) {
    for (
      let target = minimum + 1;
      target <= minimum + BOX_CEILING;
      target += 1
    ) {
      enumerate(target)
      if (timedOut || found.length >= MAX_OPTIONS) break
    }
  }

  let options = found.map((counts) => toOption(counts, candidates))
  if (options.length === 0 && eligibleGreedy) {
    options = [eligibleGreedy]
  }

  if (category === 'mixed') {
    options = options.filter(
      (option) => !isSupersetOfPureOption(option, pureOptions),
    )
  }
  // A finished search that found no option is exact, not approximate.
  const approximate = timedOut
  options.sort((a, b) => {
    if (a.boxCount !== b.boxCount) return a.boxCount - b.boxCount
    return a.sets
      .map((set) => `${set.setID}:${set.count}`)
      .join(',')
      .localeCompare(b.sets.map((set) => `${set.setID}:${set.count}`).join(','))
  })
  return {
    options: options.slice(0, MAX_OPTIONS),
    reason:
      options.length === 0 && category === 'mixed'
        ? `Mixed sets do not offer a better combination than the available pure catalogs.${approximate ? ' Approximate.' : ''}`
        : undefined,
    approximate,
  }
}

export function getSetsToBuildMapCatalog(
  boardPieces: BoardPiece[],
  timeBudgetMs = DEFAULT_TIME_BUDGET_MS,
): SetsToBuildMapCatalog {
  const deadline = Date.now() + Math.max(0, timeBudgetMs)
  const used = countPiecesUsedWithLaurStacking(boardPieces)
  const ignoredCounts: Record<string, number> = {}

  for (const boardPiece of boardPieces) {
    if (isGenericPieceID(boardPiece.inventoryID)) {
      ignoredCounts[boardPiece.inventoryID] =
        (ignoredCounts[boardPiece.inventoryID] ?? 0) + 1
    }
  }

  const neededCounts: Record<string, number> = {}
  for (const [inventoryID, count] of Object.entries(used)) {
    if (isIgnoredPiece(inventoryID)) {
      ignoredCounts[inventoryID] = count
    } else {
      neededCounts[inventoryID] = count
    }
  }

  const notInAnySet: Record<string, number> = {}
  for (const inventoryID of Object.keys(neededCounts)) {
    if (
      !allSets.some((candidate) => (candidate.inventory[inventoryID] ?? 0) > 0)
    ) {
      notInAnySet[inventoryID] = neededCounts[inventoryID] ?? 0
      delete neededCounts[inventoryID]
    }
  }

  const contemporary = solveCategory('contemporary', neededCounts, deadline)
  const classic = solveCategory('classic', neededCounts, deadline)
  const contemporaryPossible = contemporary.options.length > 0
  const classicPossible = classic.options.length > 0
  const categories: SetsToBuildMapCategory[] = []
  const addCategory = (
    id: SetsToBuildMapCategory['id'],
    result: ReturnType<typeof solveCategory>,
  ) => {
    categories.push({ id, title: categoryTitle[id], ...result })
  }

  if (contemporaryPossible && classicPossible) {
    addCategory('contemporary', contemporary)
    addCategory('classic', classic)
    const mixed = solveCategory('mixed', neededCounts, deadline, [
      ...contemporary.options,
      ...classic.options,
    ])
    if (mixed.options.length > 0 || mixed.reason) {
      addCategory('mixed', mixed)
    }
  } else if (!contemporaryPossible && !classicPossible) {
    const mixed = solveCategory('mixed', neededCounts, deadline)
    if (mixed.options.length > 0 || mixed.reason) {
      addCategory('mixed', mixed)
    }
    if (contemporary.reason) {
      addCategory('contemporary', contemporary)
    }
    if (classic.reason) {
      addCategory('classic', classic)
    }
  } else {
    if (contemporaryPossible || contemporary.reason) {
      addCategory('contemporary', contemporary)
    }
    if (classicPossible || classic.reason) {
      addCategory('classic', classic)
    }
  }

  return {
    categories,
    notInAnySet: getPieceCounts(notInAnySet),
    ignored: getPieceCounts(ignoredCounts),
  }
}

export function getPiecesMissingFromCollection(
  boardPieces: BoardPiece[],
  collection: PieceInventory,
): PieceCount[] {
  const used = reconcileLaurLegacyToStackableUsage({
    usedInventory: countPiecesUsedWithLaurStacking(boardPieces),
    availableInventory: collection,
  }).reconciledUsedInventory
  const missing: Record<string, number> = {}

  for (const [inventoryID, usedCount] of Object.entries(used)) {
    if (isIgnoredPiece(inventoryID)) continue
    const ownedCount = collection[inventoryID] ?? 0
    if (usedCount > ownedCount) {
      missing[inventoryID] = usedCount - ownedCount
    }
  }

  return getPieceCounts(missing)
}
