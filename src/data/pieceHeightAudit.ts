import { Pieces } from '../types'

export type MeasuredPieceID =
  | typeof Pieces.tree10
  | typeof Pieces.tree12
  | typeof Pieces.snowTree10
  | typeof Pieces.snowTree12
  | typeof Pieces.laurWallSquarePillar
  | typeof Pieces.laurWallPillarStackable
  | typeof Pieces.laurWallTrianglePillar

export const MEASURED_PIECE_HEIGHTS: Record<
  MeasuredPieceID,
  { blockedLevels: number; note?: string }
> = {
  [Pieces.tree10]: { blockedLevels: 9 },
  [Pieces.tree12]: { blockedLevels: 11 },
  [Pieces.snowTree10]: { blockedLevels: 10 },
  [Pieces.snowTree12]: { blockedLevels: 12 },
  [Pieces.laurWallSquarePillar]: { blockedLevels: 12 },
  [Pieces.laurWallPillarStackable]: { blockedLevels: 12 },
  [Pieces.laurWallTrianglePillar]: { blockedLevels: 12 },
}

// Backlog: a level-16 tile can sit over Big Tree 415 when its outer bottom lip
// clears the tree (7-hex and 24-hex tiles do; the 2-hex tile does not).
// Keep the registered height at 15; this audit note is not a height override.
