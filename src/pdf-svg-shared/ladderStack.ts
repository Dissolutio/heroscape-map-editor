import { edgeIdFromHex } from '../data/hexGrid/edgesAndNodes'
import { Pieces, type BoardPiece } from '../types'

const LADDER_STACK_ALTITUDE_STEP = 2

export type LadderStackInfo = {
  count: number
  isBottom: boolean
}

export function getLadderStackInfo(
  boardPieces: BoardPiece[],
  ladder: BoardPiece,
): LadderStackInfo {
  const edgeId = edgeIdFromHex(ladder.pieceCoords, ladder.rotation)
  const sameEdge = boardPieces.filter(
    (candidate) =>
      candidate.inventoryID === Pieces.ladder &&
      edgeIdFromHex(candidate.pieceCoords, candidate.rotation) === edgeId,
  )
  let bottomAltitude = ladder.altitude

  while (
    sameEdge.some(
      (candidate) =>
        candidate.altitude === bottomAltitude - LADDER_STACK_ALTITUDE_STEP,
    )
  ) {
    bottomAltitude -= LADDER_STACK_ALTITUDE_STEP
  }

  let count = 0
  let altitude = bottomAltitude
  while (sameEdge.some((candidate) => candidate.altitude === altitude)) {
    count += 1
    altitude += LADDER_STACK_ALTITUDE_STEP
  }

  return {
    count,
    isBottom: ladder.altitude === bottomAltitude,
  }
}
