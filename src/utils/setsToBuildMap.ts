import { piecesSoFar } from '../data/pieces'
import { terrainSetsByShortID } from '../data/terrainSets'
import {
  countPiecesUsedWithLaurStacking,
  reconcileLaurLegacyToStackableUsage,
} from '../inventory/laurInventoryReconcile'
import {
  isGenericPieceID,
  type BoardPiece,
  type PieceInventory,
} from '../types'

// Search for at most 50ms; large solutions bypass recursion to limit stack depth.
const EXACT_SEARCH_TIME_BUDGET_MS = 50
const MAX_EXACT_SET_COPIES = 128

export type PieceCount = {
  inventoryID: string
  title: string
  count: number
}

export type SetCount = {
  setID: string
  name: string
  abbreviation: string
  count: number
}

export type SetsToBuildMapResult = {
  sets: SetCount[]
  notInAnySet: PieceCount[]
  ignored: PieceCount[]
  approximate: boolean
}

type SetCandidate = {
  id: string
  name: string
  abbreviation: string
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

// The fallback repeatedly chooses the set covering the most remaining pieces.
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

      // Candidates are ID-sorted, so ties consistently favor the lower ID.
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

const isPreferredTie = (next: number[], current: number[]) => {
  // Set candidates are ID-sorted; ties favor more copies of the lowest ID.
  for (let index = 0; index < next.length; index += 1) {
    const nextCount = next[index] ?? 0
    const currentCount = current[index] ?? 0
    if (nextCount !== currentCount) return nextCount > currentCount
  }
  return false
}

const getExactCounts = (
  requirements: number[],
  candidates: SetCandidate[],
  pieceIDs: string[],
  greedyCounts: number[],
  timeBudgetMs: number,
): number[] | undefined => {
  const contributions = candidates.map((candidate) =>
    pieceIDs.map((pieceID) => candidate.inventory[pieceID] ?? 0),
  )
  let bestCounts = [...greedyCounts]
  let bestTotal = bestCounts.reduce((sum, count) => sum + count, 0)
  const deadline = Date.now() + Math.max(0, timeBudgetMs)
  const seen = new Map<string, { depth: number; counts: number[] }>()
  let timedOut = false

  const search = (
    remaining: number[],
    counts: number[],
    usedCopies: number,
  ) => {
    if (Date.now() >= deadline) {
      timedOut = true
      return
    }

    if (remaining.every((count) => count === 0)) {
      if (
        usedCopies < bestTotal ||
        (usedCopies === bestTotal && isPreferredTie(counts, bestCounts))
      ) {
        bestCounts = [...counts]
        bestTotal = usedCopies
      }
      return
    }

    if (usedCopies >= bestTotal) return

    let lowerBound = 0
    for (let pieceIndex = 0; pieceIndex < remaining.length; pieceIndex += 1) {
      const needed = remaining[pieceIndex] ?? 0
      if (!needed) continue
      let maxContribution = 0
      for (const setContribution of contributions) {
        maxContribution = Math.max(
          maxContribution,
          setContribution[pieceIndex] ?? 0,
        )
      }
      if (maxContribution === 0) return
      lowerBound = Math.max(lowerBound, Math.ceil(needed / maxContribution))
    }
    if (usedCopies + lowerBound > bestTotal) return

    const stateKey = remaining.join(',')
    const previous = seen.get(stateKey)
    if (
      previous &&
      (previous.depth < usedCopies ||
        (previous.depth === usedCopies &&
          !isPreferredTie(counts, previous.counts)))
    ) {
      return
    }
    seen.set(stateKey, { depth: usedCopies, counts: [...counts] })

    let chosenPieceIndex = -1
    let fewestOptions = Number.POSITIVE_INFINITY
    for (let pieceIndex = 0; pieceIndex < remaining.length; pieceIndex += 1) {
      if (!(remaining[pieceIndex] ?? 0)) continue
      let options = 0
      for (const setContribution of contributions) {
        if ((setContribution[pieceIndex] ?? 0) > 0) options += 1
      }
      if (options < fewestOptions) {
        chosenPieceIndex = pieceIndex
        fewestOptions = options
      }
    }

    if (chosenPieceIndex < 0) return
    for (let setIndex = 0; setIndex < candidates.length; setIndex += 1) {
      const setContribution = contributions[setIndex]
      if (!setContribution || !(setContribution[chosenPieceIndex] ?? 0)) {
        continue
      }
      const nextRemaining = remaining.map((needed, pieceIndex) =>
        Math.max(0, needed - (setContribution[pieceIndex] ?? 0)),
      )
      counts[setIndex] = (counts[setIndex] ?? 0) + 1
      search(nextRemaining, counts, usedCopies + 1)
      counts[setIndex] = (counts[setIndex] ?? 1) - 1
      if (timedOut) return
    }
  }

  search(
    requirements,
    candidates.map(() => 0),
    0,
  )
  return timedOut ? undefined : bestCounts
}

/**
 * Minimize set copies exactly, preferring lower IDs for equal-size solutions.
 * After 50ms or when the greedy cover exceeds 128 copies, return the greedy
 * estimate, which repeatedly adds the set covering the most remaining pieces.
 */
export function getSetsToBuildMap(
  boardPieces: BoardPiece[],
  timeBudgetMs = EXACT_SEARCH_TIME_BUDGET_MS,
): SetsToBuildMapResult {
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

  const setCandidates: SetCandidate[] = Object.values(terrainSetsByShortID)
    .map((set) => ({
      id: set.id,
      name: set.name,
      abbreviation: set.abbreviation,
      inventory: set.inventory,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

  const notInAnySet: Record<string, number> = {}
  const requirementsByID = Object.entries(neededCounts)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([inventoryID, count]) => {
      if (
        !setCandidates.some(
          (candidate) => (candidate.inventory[inventoryID] ?? 0) > 0,
        )
      ) {
        notInAnySet[inventoryID] = count
        return []
      }
      return [[inventoryID, count] as const]
    })

  const pieceIDs = requirementsByID.map(([inventoryID]) => inventoryID)
  const requirements = requirementsByID.map(([, count]) => count)
  const candidates = setCandidates.filter((candidate) =>
    pieceIDs.some((pieceID) => (candidate.inventory[pieceID] ?? 0) > 0),
  )

  const greedyCounts = buildGreedyCounts(requirements, candidates, pieceIDs)
  const greedySetCount = greedyCounts.reduce((sum, count) => sum + count, 0)
  const exactCounts =
    requirements.length === 0
      ? greedyCounts
      : greedySetCount > MAX_EXACT_SET_COPIES
        ? undefined
        : getExactCounts(
            requirements,
            candidates,
            pieceIDs,
            greedyCounts,
            timeBudgetMs,
          )
  const counts = exactCounts ?? greedyCounts

  return {
    sets: candidates.flatMap((candidate, index) => {
      const count = counts[index] ?? 0
      return count
        ? [
            {
              setID: candidate.id,
              name: candidate.name,
              abbreviation: candidate.abbreviation,
              count,
            },
          ]
        : []
    }),
    notInAnySet: getPieceCounts(notInAnySet),
    ignored: getPieceCounts(ignoredCounts),
    approximate: exactCounts === undefined,
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
