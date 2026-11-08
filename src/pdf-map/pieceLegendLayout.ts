import type { PieceKeyLandRow } from '../pdf-svg-shared/pieceKey'

export type LandTableChunkRow =
  | { kind: 'header' }
  | { kind: 'land'; row: PieceKeyLandRow }

export const chunkLandRows = (
  rows: PieceKeyLandRow[],
  getRowHeight: (row: PieceKeyLandRow) => number,
  headerHeight: number,
  maxChunkHeight: number,
): LandTableChunkRow[][] => {
  const chunks: LandTableChunkRow[][] = []
  let chunk: LandTableChunkRow[] = []
  let chunkHeight = 0

  const startChunk = () => {
    chunk = [{ kind: 'header' }]
    chunkHeight = headerHeight
  }
  const finishChunk = () => {
    if (chunk.length > 1) chunks.push(chunk)
    chunk = []
    chunkHeight = 0
  }

  for (const row of rows) {
    const rowHeight = getRowHeight(row)
    if (chunk.length === 0) startChunk()
    if (chunk.length > 1 && chunkHeight + rowHeight > maxChunkHeight) {
      finishChunk()
      startChunk()
    }

    chunk.push({ kind: 'land', row })
    chunkHeight += rowHeight
  }
  finishChunk()
  return chunks
}

export const chunkSpecialGroups = <T>(groups: T[], groupsPerRow = 3): T[][] => {
  if (groupsPerRow < 1) return []
  const rows: T[][] = []
  for (let offset = 0; offset < groups.length; offset += groupsPerRow) {
    rows.push(groups.slice(offset, offset + groupsPerRow))
  }
  return rows
}
