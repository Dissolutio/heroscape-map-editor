import { edgeIdFromHex } from '../data/hexGrid/edgesAndNodes'
import { Pieces, type BoardPiece } from '../types'

// One ladder piece spans two levels, so ladders of one stack are placed two
// altitudes apart.
const LADDER_STACK_ALTITUDE_STEP = 2

// A run of ladders on one edge at consecutive ladder altitudes (the pieces
// count includes any duplicate placed at the same altitude).
export type LadderStack = {
  edgeId: string
  // 0-based position among the runs on this edge, counted from the bottom
  runIndex: number
  // number of ladder pieces in the run
  count: number
  // ladders of the run, lowest altitude first
  pieces: BoardPiece[]
  // lowest ladder of the run: its hex and rotation place the overlay marker
  bottom: BoardPiece
}

const isLadder = (piece: BoardPiece) => piece.inventoryID === Pieces.ladder

const ladderEdgeId = (ladder: BoardPiece) =>
  edgeIdFromHex(ladder.pieceCoords, ladder.rotation)

// Every ladder run on the map. Ladders are grouped by edge, sorted by
// altitude, and split wherever the altitudes are not consecutive (land between
// two ladder runs). Result order: edge first seen, then bottom to top.
export function getLadderStacks(boardPieces: BoardPiece[]): LadderStack[] {
  const laddersByEdge = new Map<string, BoardPiece[]>()
  for (const piece of boardPieces) {
    if (!isLadder(piece)) continue
    const edgeId = ladderEdgeId(piece)
    const edgeLadders = laddersByEdge.get(edgeId)
    if (edgeLadders) edgeLadders.push(piece)
    else laddersByEdge.set(edgeId, [piece])
  }

  const stacks: LadderStack[] = []
  for (const [edgeId, edgeLadders] of laddersByEdge) {
    const sorted = [...edgeLadders].sort((a, b) => a.altitude - b.altitude)
    let runPieces: BoardPiece[] = []
    let runIndex = 0
    const closeRun = () => {
      if (runPieces.length === 0) return
      stacks.push({
        edgeId,
        runIndex,
        count: runPieces.length,
        pieces: runPieces,
        bottom: runPieces[0],
      })
      runIndex += 1
      runPieces = []
    }
    for (const ladder of sorted) {
      const previous = runPieces[runPieces.length - 1]
      // same altitude as the previous ladder: a duplicate, it stays in the run
      const gap = previous ? ladder.altitude - previous.altitude : undefined
      const continuesRun = gap === 0 || gap === LADDER_STACK_ALTITUDE_STEP
      if (!continuesRun) closeRun()
      runPieces.push(ladder)
    }
    closeRun()
  }
  return stacks
}

// PDF ladder overlay levels. Level k (index k - 1) holds every edge's k-th run
// counted from the bottom, so there are as many levels as the most runs on any
// single edge. No ladders: no levels.
export function getLadderOverlayLevels(
  boardPieces: BoardPiece[],
): LadderStack[][] {
  const levels: LadderStack[][] = []
  for (const stack of getLadderStacks(boardPieces)) {
    if (!levels[stack.runIndex]) levels[stack.runIndex] = []
    levels[stack.runIndex].push(stack)
  }
  return levels
}
