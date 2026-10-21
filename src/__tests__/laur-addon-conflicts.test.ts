import { describe, expect, it } from 'vitest'
import { evaluateLaurAddonConflicts } from '../data/laurAddonConflicts'
import { isLaurAddonSupported } from '../data/laurAddonSupport'
import type { BoardPiece, CubeCoordinate } from '../types'
import { Pieces } from '../types'
import { cloneBoard, makeTable, place } from './helpers/board'

const center = makeTable(9).center
const east = { q: center.q + 1, r: center.r, s: center.s - 1 }
const southeast = {
  q: center.q,
  r: center.r + 1,
  s: center.s - 1,
}

const piece = (
  uid: string,
  inventoryID: string,
  pieceCoords: CubeCoordinate,
  rotation: number,
  altitude = 0,
): BoardPiece => ({ uid, inventoryID, pieceCoords, rotation, altitude })

const sorted = (uids: string[]) => [...uids].sort()

describe('evaluateLaurAddonConflicts', () => {
  it('flags both add-ons occupying the same canonical side', () => {
    expect(
      sorted(
        evaluateLaurAddonConflicts(
          [
            piece('a', Pieces.laurWallShort, center, 0),
            piece('b', Pieces.laurWallShort, east, 3),
          ],
          {},
        ),
      ),
    ).toEqual(['a', 'b'])
  })

  it('flags an add-on and land in a supported footprint altitude band', () => {
    const land = place({
      board: cloneBoard(makeTable(9)),
      pieceID: 'g1',
      at: east,
      altitude: 0,
      uid: 'land',
      permissive: true,
    }).board
    expect(
      sorted(
        evaluateLaurAddonConflicts(
          [
            piece('addon', Pieces.laurWallRuin2, center, 0),
            ...land.boardPieces,
          ],
          land.boardHexes,
        ),
      ),
    ).toEqual(['addon', 'land'])
  })

  it('flags pieces placed over an existing add-on footprint', () => {
    const land = place({
      board: cloneBoard(makeTable(9)),
      pieceID: 'g1',
      at: east,
      altitude: 0,
      uid: 'later-land',
      permissive: true,
    }).board
    expect(
      sorted(
        evaluateLaurAddonConflicts(
          [
            ...land.boardPieces,
            piece('existing-addon', Pieces.laurWallRuin2, center, 0),
          ],
          land.boardHexes,
        ),
      ),
    ).toEqual(['existing-addon', 'later-land'])
  })

  it('flags supported physical overlap between two add-on footprints', () => {
    expect(
      sorted(
        evaluateLaurAddonConflicts(
          [
            piece('first', Pieces.laurWallRuin2, center, 0),
            piece('second', Pieces.laurWallRuin3, southeast, 5),
          ],
          {},
        ),
      ),
    ).toEqual(['first', 'second'])
  })

  it('does not mutate either input', () => {
    const boardPieces = [piece('addon', Pieces.laurWallRuin2, center, 0)]
    const beforePieces = structuredClone(boardPieces)
    const boardHexes = {}
    evaluateLaurAddonConflicts(boardPieces, boardHexes)
    expect(boardPieces).toEqual(beforePieces)
    expect(boardHexes).toEqual({})
  })

  it('leaves unmeasured add-on footprints to the canonical-edge check', () => {
    expect(
      evaluateLaurAddonConflicts(
        [piece('short', Pieces.laurWallShort, center, 0)],
        {},
      ),
    ).toEqual([])
  })
})

describe('Laur add-on support seam', () => {
  it('returns unknown when no verified support table entry exists', () => {
    const addon = piece('addon', Pieces.laurWallShort, center, 0)
    expect(isLaurAddonSupported({ boardPieces: [] }, addon)).toBe('unknown')
  })

  it.todo(
    'verified support-table values are keyed by pillar and add-on rotation',
  )
})
