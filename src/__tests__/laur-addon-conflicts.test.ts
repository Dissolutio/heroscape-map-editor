import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { evaluateLaurAddonConflicts } from '../data/laurAddonConflicts'
import { getLaurAddonFootprint } from '../data/laurAddonFootprints'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import { isLaurAddonSupported } from '../data/laurAddonSupport'
import { piecesSoFar } from '../data/pieces'
import type { BoardPiece, CubeCoordinate, HexMap } from '../types'
import { Pieces } from '../types'
import { normalizeBoardPiecesWithDropped } from '../utils/map-utils'
import { cloneBoard, makeTable, place, withGrassFloor } from './helpers/board'
import type { Board } from './helpers/board'

const center = makeTable(9).center
const east = { q: center.q + 1, r: center.r, s: center.s - 1 }
const southeast = {
  q: center.q,
  r: center.r + 1,
  s: center.s - 1,
}
const farEastSoutheast = {
  q: center.q + 1,
  r: center.r + 1,
  s: center.s - 2,
}

const piece = (
  uid: string,
  inventoryID: string,
  pieceCoords: CubeCoordinate,
  rotation: number,
  altitude = 0,
): BoardPiece => ({ uid, inventoryID, pieceCoords, rotation, altitude })

const sorted = (uids: string[]) => [...uids].sort()

const placeOnBoard = (
  board: ReturnType<typeof cloneBoard>,
  pieceID: string,
  at: CubeCoordinate,
  uid: string,
  rotation = 0,
  altitude = 0,
) =>
  place({
    board,
    pieceID,
    at,
    uid,
    rotation,
    altitude,
    permissive: true,
  }).board

type AttachedCase = {
  name: string
  inventoryID: string
  rotation: number
  pillars: { at: CubeCoordinate; rotation: number }[]
}

const attachedCases: AttachedCase[] = [
  {
    name: 'short wall',
    inventoryID: Pieces.laurWallShort,
    rotation: 0,
    pillars: [
      { at: center, rotation: 0 },
      { at: east, rotation: 0 },
    ],
  },
  {
    name: 'long wall',
    inventoryID: Pieces.laurWallLong,
    rotation: 0.5,
    pillars: [
      { at: center, rotation: 5 },
      { at: farEastSoutheast, rotation: 2 },
    ],
  },
  {
    name: 'ruin',
    inventoryID: Pieces.laurWallRuin2,
    rotation: 0,
    pillars: [{ at: center, rotation: 0 }],
  },
]

describe('evaluateLaurAddonConflicts', () => {
  it('loads the legacy stacking example and flags its stacked pillars', () => {
    const data = JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'public/json-maps/Stacking_Legacy_Example.json'),
        'utf8',
      ),
    ) as { hexMap: HexMap; boardPieces: unknown }
    const normalized = normalizeBoardPiecesWithDropped(data.boardPieces)
    const board = buildupJsonFileMap(
      normalized.boardPieces,
      data.hexMap,
      normalized.droppedPieces,
    )

    expect(board.droppedPieces).toEqual([])
    expect(board.boardPieces).toHaveLength(normalized.boardPieces.length)
    expect(Object.keys(board.boardHexes).length).toBeGreaterThan(0)

    const conflictedPieceUIDs = computeConflictedPieceUIDs(board.boardPieces)
    const pillarIDs = new Set<string>([
      Pieces.laurWallSquarePillar,
      Pieces.laurWallTrianglePillar,
    ])
    const stackedPillars = board.boardPieces.filter((piece) => {
      if (piece.altitude !== 0 || !pillarIDs.has(piece.inventoryID))
        return false
      return board.boardPieces.some(
        (other) =>
          other.inventoryID === piece.inventoryID &&
          other.altitude === 9 &&
          other.rotation === piece.rotation &&
          other.pieceCoords.q === piece.pieceCoords.q &&
          other.pieceCoords.r === piece.pieceCoords.r &&
          other.pieceCoords.s === piece.pieceCoords.s,
      )
    })
    const stackedPillarUIDs = [
      ...stackedPillars.map(({ uid }) => uid),
      ...board.boardPieces
        .filter(
          (piece) =>
            piece.altitude === 9 &&
            stackedPillars.some(
              (lower) =>
                lower.inventoryID === piece.inventoryID &&
                lower.rotation === piece.rotation &&
                lower.pieceCoords.q === piece.pieceCoords.q &&
                lower.pieceCoords.r === piece.pieceCoords.r &&
                lower.pieceCoords.s === piece.pieceCoords.s,
            ),
        )
        .map(({ uid }) => uid),
    ]

    expect(stackedPillars.length).toBeGreaterThan(0)
    expect(conflictedPieceUIDs).toEqual(
      expect.arrayContaining(stackedPillarUIDs),
    )
  })

  it.each([
    [Pieces.laurWallShortStackable, 0, 12],
    [Pieces.laurWallLongStackable, 0.5, 12],
  ])(
    'does not conflict when %s altitude bands only touch',
    (inventoryID, rotation, height) => {
      const lower = piece('lower', inventoryID, center, rotation, 0)
      const upper = piece('upper', inventoryID, center, rotation, height)
      expect(evaluateLaurAddonConflicts([lower, upper], {})).toEqual([])
    },
  )

  it.each([
    [Pieces.laurWallShortStackable, 0, 12],
    [Pieces.laurWallLongStackable, 0.5, 12],
  ])(
    'flags both %s pieces when their altitude bands overlap',
    (inventoryID, rotation, height) => {
      const lower = piece('lower', inventoryID, center, rotation, 0)
      const upper = piece('upper', inventoryID, center, rotation, height - 1)
      expect(sorted(evaluateLaurAddonConflicts([lower, upper], {}))).toEqual([
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

  it.each(attachedCases)(
    'does not flag a correctly attached $name on its end pillars',
    ({ inventoryID, rotation, pillars }) => {
      let board: Board = cloneBoard(makeTable(9))
      for (const [
        index,
        { at, rotation: pillarRotation },
      ] of pillars.entries()) {
        board = placeOnBoard(
          board,
          Pieces.laurWallSquarePillar,
          at,
          `pillar-${index}`,
          pillarRotation,
        )
      }
      const addon = piece('addon', inventoryID, center, rotation)
      const boardPieces = [...board.boardPieces, addon]

      expect(isLaurAddonSupported({ boardPieces }, addon)).toBe('supported')
      expect(evaluateLaurAddonConflicts(boardPieces, board.boardHexes)).toEqual(
        [],
      )
    },
  )

  it.each([
    {
      addonID: Pieces.laurWallShort,
      rotation: 0,
      occupantID: Pieces.grass1,
      location: 'end',
    },
    {
      addonID: Pieces.laurWallShort,
      rotation: 0,
      occupantID: Pieces.tree10,
      location: 'end',
    },
    {
      addonID: Pieces.laurWallRuin2,
      rotation: 0,
      occupantID: Pieces.grass1,
      location: 'blocked',
    },
    {
      addonID: Pieces.laurWallRuin2,
      rotation: 0,
      occupantID: Pieces.tree10,
      location: 'blocked',
    },
  ])(
    'flags a non-pillar $location hex occupant for $addonID',
    ({ addonID, rotation, occupantID }) => {
      const occupied = placeOnBoard(
        cloneBoard(makeTable(9)),
        occupantID,
        east,
        'occupant',
      )
      const addon = piece('addon', addonID, center, rotation)
      expect(
        sorted(
          evaluateLaurAddonConflicts(
            [...occupied.boardPieces, addon],
            occupied.boardHexes,
          ),
        ),
      ).toEqual(['addon', 'occupant'])
    },
  )

  it('does not flag two walls on different ports of the same pillar', () => {
    expect(
      evaluateLaurAddonConflicts(
        [
          piece('east-wall', Pieces.laurWallShort, center, 0),
          piece('west-wall', Pieces.laurWallShort, center, 3),
        ],
        {},
      ),
    ).toEqual([])
  })

  it('does not flag pillars, including a stacked pillar, within an end band', () => {
    let board: Board = cloneBoard(makeTable(9))
    board = placeOnBoard(
      board,
      Pieces.laurWallSquarePillar,
      center,
      'base-pillar',
      0,
      0,
    )
    board = placeOnBoard(
      board,
      Pieces.laurWallPillarStackable,
      center,
      'stacked-pillar',
      0,
      8,
    )
    const addon = piece('addon', Pieces.laurWallShort, center, 0, 0)
    expect(
      evaluateLaurAddonConflicts(
        [...board.boardPieces, addon],
        board.boardHexes,
      ),
    ).toEqual([])
  })

  it('still flags a non-land obstacle at an attached pillar end', () => {
    let board: Board = cloneBoard(withGrassFloor(makeTable(9)))
    board = placeOnBoard(
      board,
      Pieces.laurWallSquarePillar,
      center,
      'pillar',
      0,
      1,
    )
    board = placeOnBoard(
      board,
      Pieces.laurWallSquarePillar,
      east,
      'far-pillar',
      0,
      1,
    )
    board = placeOnBoard(board, Pieces.tree10, center, 'tree', 0, 2)
    const addon = piece('addon', Pieces.laurWallShort, center, 0, 1)

    expect(
      sorted(
        evaluateLaurAddonConflicts(
          [...board.boardPieces, addon],
          board.boardHexes,
        ),
      ),
    ).toEqual(['addon', 'tree'])
  })

  it('flags two add-ons whose blocked hexes overlap within their bands', () => {
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

  it('flags pieces placed over an existing add-on footprint', () => {
    const land = placeOnBoard(
      cloneBoard(makeTable(9)),
      Pieces.grass1,
      east,
      'later-land',
    )
    const existingAddon = piece(
      'existing-addon',
      Pieces.laurWallRuin2,
      center,
      0,
    )
    expect(
      sorted(
        evaluateLaurAddonConflicts(
          [...land.boardPieces, existingAddon],
          land.boardHexes,
        ),
      ),
    ).toEqual(['existing-addon', 'later-land'])
  })

  it('keeps shared canonical side conflicts altitude-aware', () => {
    const lower = piece('lower', Pieces.laurWallShort, center, 0, 0)
    const adjacent = piece('adjacent', Pieces.laurWallShort, east, 3, 0)
    const above = piece('above', Pieces.laurWallShort, east, 3, 12)
    expect(sorted(evaluateLaurAddonConflicts([lower, adjacent], {}))).toEqual([
      'adjacent',
      'lower',
    ])
    expect(evaluateLaurAddonConflicts([lower, above], {})).toEqual([])
  })

  it('does not mutate either board input', () => {
    const board = placeOnBoard(
      cloneBoard(makeTable(9)),
      Pieces.grass1,
      east,
      'land',
    )
    const boardPieces = [
      ...board.boardPieces,
      piece('addon', Pieces.laurWallRuin2, center, 0),
    ]
    const beforePieces = structuredClone(boardPieces)
    const beforeHexes = structuredClone(board.boardHexes)
    evaluateLaurAddonConflicts(boardPieces, board.boardHexes)
    expect(boardPieces).toEqual(beforePieces)
    expect(board.boardHexes).toEqual(beforeHexes)
  })

  it('skips band checks when an add-on has no registered height', () => {
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
