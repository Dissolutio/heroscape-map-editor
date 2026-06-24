import { parse } from 'papaparse'
import type { PieceInventory } from '../types'
import { blankPieceInventory } from '../inventory/blankInventory'

export type ParsedPieceInventory = {
  inventory: PieceInventory
  importedRows: number
}

export const normalizePieceInventory = (
  maybeInventory?: PieceInventory | null,
): PieceInventory => {
  const normalized: PieceInventory = { ...blankPieceInventory }

  for (const pieceID of Object.keys(blankPieceInventory)) {
    const value = maybeInventory?.[pieceID]
    const count = Number.isFinite(value) ? Number(value) : 0
    normalized[pieceID] = Math.max(0, Math.floor(count))
  }

  return normalized
}

const readCountCell = (row: Record<string, string>): number => {
  const countValue =
    row.Count ??
    row.count ??
    row.Quantity ??
    row.quantity ??
    row.Qty ??
    row.qty ??
    '0'
  const parsed = Number.parseInt(`${countValue ?? ''}`, 10)
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
}

const readPieceIDCell = (row: Record<string, string>): string => {
  return `${row.ID ?? row.id ?? row.PieceID ?? row.pieceID ?? row['Piece ID'] ?? ''}`.trim()
}

// Accept a few common header spellings so inventory files exported elsewhere can
// still be used as terrain constraints without manual cleanup.
export const parsePieceInventoryRows = (
  rows: Record<string, string>[],
): ParsedPieceInventory => {
  const nextInventory = { ...blankPieceInventory }
  let importedRows = 0

  for (const row of rows) {
    const pieceID = readPieceIDCell(row)
    if (
      !pieceID ||
      !Object.prototype.hasOwnProperty.call(blankPieceInventory, pieceID)
    ) {
      continue
    }

    nextInventory[pieceID] = readCountCell(row)
    importedRows += 1
  }

  return {
    inventory: nextInventory,
    importedRows,
  }
}

export const parsePieceInventoryFile = (
  file: File,
): Promise<ParsedPieceInventory> => {
  return new Promise((resolve, reject) => {
    parse<Record<string, string>>(file, {
      header: true,
      delimiter: '',
      skipEmptyLines: 'greedy',
      complete: (results) => {
        resolve(parsePieceInventoryRows(results.data))
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}