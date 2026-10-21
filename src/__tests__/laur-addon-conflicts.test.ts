import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { evaluateLaurAddonConflicts } from '../data/laurAddonConflicts'
import { getLaurAddonFootprint } from '../data/laurAddonFootprints'
import { piecesSoFar } from '../data/pieces'
import type { BoardPiece, CubeCoordinate, HexMap } from '../types'
import { Pieces } from '../types'
import { normalizeBoardPiecesWithDropped } from '../utils/map-utils'
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
  it.each([
    [Pieces.laurWallShortStackable, 0, 12, 'registered height'],
    [Pieces.laurWallLongStackable, 0.5, 10, 'footprint height'],
  ])(
    'does not conflict for %s when %s altitude bands only touch',
    (inventoryID, rotation, height, heightSource) => {
      const addon = piece('lower', inventoryID, center, rotation, 0)
      const upperAddon = piece('upper', inventoryID, center, rotation, height)
      const footprint = getLaurAddonFootprint({
        inventoryID,
        anchor: center,
        altitude: 0,
        rotation,
      })
      expect(
        footprint?.heightInLevels ?? piecesSoFar[inventoryID]?.height,
        `${heightSource} should be used`,
      ).toBe(height)
      expect(evaluateLaurAddonConflicts([addon, upperAddon], {})).toEqual([])
    },
  )

  it.each([
    [Pieces.laurWallShortStackable, 0, 12],
    [Pieces.laurWallLongStackable, 0.5, 10],
  ])(
    'conflicts for %s when their altitude bands overlap',
    (inventoryID, rotation, height) => {
      const addon = piece('lower', inventoryID, center, rotation, 0)
      const upperAddon = piece(
        'upper',
        inventoryID,
        center,
        rotation,
        height - 1,
      )
      expect(evaluateLaurAddonConflicts([addon, upperAddon], {})).toEqual([
        'lower',
        'upper',
      ])
    },
  )

  it.each([
    [Pieces.laurWallShortStackable, Pieces.laurWallShortStackable, 0],
    [Pieces.laurWallLongStackable, Pieces.laurWallLongStackable, 0.5],
    [Pieces.laurWallArch, Pieces.laurWallLongStackable, 0.5],
  ])(
    'does not flag the legal +8 stack %s under %s',
    (lowerID, upperID, rotation) => {
      expect(
        evaluateLaurAddonConflicts(
          [
            piece('lower', lowerID, center, rotation, 1),
            piece('upper', upperID, center, rotation, 9),
          ],
          {},
        ),
      ).toEqual([])
    },
  )

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

  it('skips canonical band checks when a Laur add-on has no registered height', () => {
    const inventoryID = Pieces.laurWallShort
    const registeredPiece = piecesSoFar[inventoryID]
    if (!registeredPiece) throw new Error('Expected a registered Laur wall')
    delete piecesSoFar[inventoryID]
    try {
      expect(() =>
        evaluateLaurAddonConflicts(
          [
            piece('unknown-height-a', inventoryID, center, 0),
            piece('unknown-height-b', inventoryID, center, 0),
          ],
          {},
        ),
      ).not.toThrow()
      expect(
        evaluateLaurAddonConflicts(
          [
            piece('unknown-height-a', inventoryID, center, 0),
            piece('unknown-height-b', inventoryID, center, 0),
          ],
          {},
        ),
      ).toEqual([])
    } finally {
      piecesSoFar[inventoryID] = registeredPiece
    }
  })

  it('leaves unmeasured add-on footprints to the canonical-edge check', () => {
    expect(
      evaluateLaurAddonConflicts(
        [piece('short', Pieces.laurWallShort, center, 0)],
        {},
      ),
    ).toEqual([])
  })

  it('does not report conflicts in the public Library of Laur map', () => {
    const data = JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'public/json-maps/Web_4_Library_of_Laur.json'),
        'utf8',
      ),
    ) as { hexMap: HexMap; boardPieces: unknown }
    const normalized = normalizeBoardPiecesWithDropped(data.boardPieces)
    const board = buildupJsonFileMap(normalized.boardPieces, data.hexMap)
    const conflictedUIDs = evaluateLaurAddonConflicts(
      board.boardPieces,
      board.boardHexes,
    )
    const flaggedPieces = board.boardPieces
      .filter((boardPiece) => conflictedUIDs.includes(boardPiece.uid))
      .map(({ uid, inventoryID, pieceCoords, altitude }) => ({
        uid,
        inventoryID,
        pieceCoords,
        altitude,
      }))
    expect(flaggedPieces).toEqual([])
  })
})
