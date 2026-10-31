import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { evaluateLaurAddonConflicts } from '../data/laurAddonConflicts'
import { getLaurAddonFootprint } from '../data/laurAddonFootprints'
import {
  LAUR_ADDON_STACK_INCREMENT,
  canLaurAddonStackOn,
} from '../data/laurAddonStacking'
import {
  getUnsupportedLaurAddonUIDs,
  isLaurAddonSupported,
} from '../data/laurAddonSupport'
import { getPillarPorts } from '../data/laurPillarPorts'
import { piecesSoFar } from '../data/pieces'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import {
  type BoardHex,
  type BoardHexes,
  type BoardPiece,
  type BoardPieces,
  type CubeCoordinate,
  type HexMap,
  HexTerrain,
  Pieces,
} from '../types'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { normalizeBoardPiecesWithDropped } from '../utils/map-utils'
import { cloneBoard, makeTable, place, withGrassFloor } from './helpers/board'
import type { Board } from './helpers/board'
import { legacyLaurAddonCanonicalKey } from './helpers/laurLegacyIdentity'

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

const coordKey = ({ q, r, s }: CubeCoordinate) => `${q},${r},${s}`
const overlapsAltitude = (
  altitude: number,
  height: number,
  otherAltitude: number,
) => otherAltitude >= altitude && otherAltitude < altitude + height
const overlapsAltitudeBands = (
  altitude: number,
  height: number,
  otherAltitude: number,
  otherHeight: number,
) => altitude < otherAltitude + otherHeight && otherAltitude < altitude + height

const boardWithGroundAndPillarsForAddon = (
  inventoryID: string,
  rotation: number,
) => {
  const footprint = getLaurAddonFootprint({
    inventoryID,
    anchor: center,
    altitude: 1,
    rotation,
  })
  if (!footprint) throw new Error('Expected a registered Laur footprint')

  const coordinates = new Map<string, CubeCoordinate>()
  for (const coordinate of [...footprint.endHexes, ...footprint.blockedHexes]) {
    coordinates.set(coordKey(coordinate), coordinate)
  }
  let board: Board = cloneBoard(makeTable(9))
  for (const [index, coordinate] of [...coordinates.values()].entries()) {
    board = placeOnBoard(board, Pieces.grass1, coordinate, `ground-${index}`)
  }
  for (const [index, coordinate] of footprint.endHexes.entries()) {
    board = placeOnBoard(
      board,
      Pieces.laurWallSquarePillar,
      coordinate,
      `pillar-${index}`,
      0,
      1,
    )
  }
  return { board, footprint }
}

const portLocationKey = (coords: CubeCoordinate, altitude: number) =>
  `${coordKey(coords)}@${altitude}`

function legacyRequiredPorts(addon: BoardPiece) {
  const rotation = ((addon.rotation % 6) + 6) % 6
  if (!Number.isFinite(rotation) || !Number.isInteger(rotation * 2)) return null

  if (
    addon.inventoryID === Pieces.laurWallShort ||
    addon.inventoryID === Pieces.laurWallShortStackable
  ) {
    return [
      { coords: addon.pieceCoords, rotation },
      {
        coords: hexUtilsAdd(addon.pieceCoords, HEX_DIRECTIONS[rotation]),
        rotation: (rotation + 3) % 6,
      },
    ]
  }
  if (
    addon.inventoryID === Pieces.laurWallLong ||
    addon.inventoryID === Pieces.laurWallLongStackable ||
    addon.inventoryID === Pieces.laurWallArch
  ) {
    const direction = Math.floor(rotation)
    const farCoords = hexUtilsAdd(
      hexUtilsAdd(addon.pieceCoords, HEX_DIRECTIONS[direction]),
      HEX_DIRECTIONS[(direction + 1) % 6],
    )
    return [
      { coords: addon.pieceCoords, rotation },
      { coords: farCoords, rotation: (rotation + 3) % 6 },
    ]
  }
  if (
    addon.inventoryID === Pieces.laurWallRuin1 ||
    addon.inventoryID === Pieces.laurWallRuin2 ||
    addon.inventoryID === Pieces.laurWallRuin3
  ) {
    return [{ coords: addon.pieceCoords, rotation }]
  }
  return null
}

function bruteForceUnsupportedLaurAddonUIDs(boardPieces: BoardPieces) {
  const portsByLocation = new Map<string, Set<number>>()
  for (const pillar of boardPieces) {
    const ports = getPillarPorts(pillar.inventoryID, pillar.rotation)
    if (!ports.length) continue
    const key = portLocationKey(pillar.pieceCoords, pillar.altitude)
    const current = portsByLocation.get(key) ?? new Set<number>()
    for (const port of ports) current.add(port)
    portsByLocation.set(key, current)
  }
  return boardPieces
    .filter((item) => isLaurWallAddonPieceID(item.inventoryID))
    .filter((addon) => {
      const requiredPorts = legacyRequiredPorts(addon)
      return (
        !requiredPorts ||
        !requiredPorts.every(({ coords, rotation }) =>
          portsByLocation
            .get(portLocationKey(coords, addon.altitude))
            ?.has(rotation),
        )
      )
    })
    .map(({ uid }) => uid)
}

function bruteForceLaurAddonConflicts(
  boardPieces: BoardPieces,
  boardHexes: BoardHexes,
) {
  const conflicts = new Set<string>()
  const pieceByUID = new Map(boardPieces.map((item) => [item.uid, item]))
  const addons = boardPieces.flatMap((item) => {
    if (!isLaurWallAddonPieceID(item.inventoryID)) return []
    const canonicalKey = legacyLaurAddonCanonicalKey(
      item.pieceCoords,
      item.rotation,
    )
    if (!canonicalKey) return []
    const footprint = getLaurAddonFootprint({
      inventoryID: item.inventoryID,
      anchor: item.pieceCoords,
      altitude: item.altitude,
      rotation: item.rotation,
    })
    return [
      {
        piece: item,
        canonicalKey,
        footprint,
        heightInLevels:
          footprint?.heightInLevels ?? piecesSoFar[item.inventoryID]?.height,
      },
    ]
  })

  for (let i = 0; i < addons.length; i++) {
    const addon = addons[i]
    for (let j = i + 1; j < addons.length; j++) {
      const other = addons[j]
      const [lower, upper] =
        addon.piece.altitude < other.piece.altitude
          ? [addon, other]
          : [other, addon]
      const isLegalStack =
        addon.canonicalKey === other.canonicalKey &&
        upper.piece.altitude - lower.piece.altitude ===
          LAUR_ADDON_STACK_INCREMENT &&
        canLaurAddonStackOn(upper.piece.inventoryID, lower.piece.inventoryID)
      if (
        !isLegalStack &&
        addon.canonicalKey === other.canonicalKey &&
        addon.heightInLevels !== undefined &&
        other.heightInLevels !== undefined &&
        overlapsAltitudeBands(
          addon.piece.altitude,
          addon.heightInLevels,
          other.piece.altitude,
          other.heightInLevels,
        )
      ) {
        conflicts.add(addon.piece.uid)
        conflicts.add(other.piece.uid)
      }
      if (!addon.footprint || !other.footprint) continue
      if (
        !isLegalStack &&
        addon.footprint.blockedHexes.some((hex) =>
          other.footprint?.blockedHexes.some(
            (otherHex) => coordKey(hex) === coordKey(otherHex),
          ),
        ) &&
        overlapsAltitudeBands(
          addon.piece.altitude,
          addon.footprint.heightInLevels,
          other.piece.altitude,
          other.footprint.heightInLevels,
        )
      ) {
        conflicts.add(addon.piece.uid)
        conflicts.add(other.piece.uid)
      }
    }
  }

  const occupantsByCoordinate = new Map<string, BoardHex[]>()
  for (const hex of Object.values(boardHexes)) {
    if (hex.boardPieceUID) {
      const entries = occupantsByCoordinate.get(coordKey(hex))
      if (entries) entries.push(hex)
      else occupantsByCoordinate.set(coordKey(hex), [hex])
    }
  }
  const pillarIDs = new Set<string>([
    Pieces.laurWallSquarePillar,
    Pieces.laurWallPillarStackable,
    Pieces.laurWallTrianglePillar,
  ])
  const pillarsByCoordinate = new Map<string, BoardPiece[]>()
  for (const item of boardPieces) {
    if (!pillarIDs.has(item.inventoryID)) continue
    const key = coordKey(item.pieceCoords)
    const entries = pillarsByCoordinate.get(key)
    if (entries) entries.push(item)
    else pillarsByCoordinate.set(key, [item])
  }

  for (const addon of addons) {
    const footprint = addon.footprint
    if (!footprint) continue
    const inspectHexes = (
      coordinates: CubeCoordinate[],
      attachmentEnds: boolean,
    ) => {
      for (const coordinate of coordinates) {
        const hasPillarAtEnd =
          attachmentEnds &&
          (pillarsByCoordinate.get(coordKey(coordinate)) ?? []).some(
            (pillar) =>
              pillar.altitude >= footprint.altitude &&
              pillar.altitude < footprint.altitude + footprint.heightInLevels,
          )
        const occupants: BoardHex[] = (
          occupantsByCoordinate.get(coordKey(coordinate)) ?? []
        ).filter((hex) =>
          overlapsAltitude(
            footprint.altitude + 1,
            footprint.heightInLevels,
            hex.altitude,
          ),
        )
        for (const hex of occupants) {
          const uid: string | undefined = hex.boardPieceUID
          if (!uid || uid === addon.piece.uid) continue
          const inventoryID =
            pieceByUID.get(uid)?.inventoryID ?? hex.inventoryID
          if (
            (attachmentEnds &&
              (pillarIDs.has(inventoryID) ||
                (hasPillarAtEnd &&
                  piecesSoFar[inventoryID]?.isHexTerrainPiece))) ||
            (!attachmentEnds && isLaurWallAddonPieceID(inventoryID))
          ) {
            continue
          }
          if (
            hex.terrain !== HexTerrain.empty ||
            hex.inventoryID ||
            hex.pieceID
          ) {
            conflicts.add(addon.piece.uid)
            conflicts.add(uid)
          }
        }
      }
    }
    inspectHexes(footprint.endHexes, true)
    inspectHexes(footprint.blockedHexes, false)
  }

  return [...conflicts]
}

const generatedAddonIDs = [
  Pieces.laurWallShort,
  Pieces.laurWallShortStackable,
  Pieces.laurWallLong,
  Pieces.laurWallLongStackable,
  Pieces.laurWallArch,
  Pieces.laurWallRuin1,
  Pieces.laurWallRuin2,
  Pieces.laurWallRuin3,
]

function makeGeneratedConflictBoard() {
  const boardPieces: BoardPieces = []
  const boardHexes: BoardHexes = {}
  let seed = 0x51a7
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed
  }
  const coordinates = () => {
    const q = (random() % 17) - 8
    const r = (random() % 17) - 8
    return { q, r, s: -q - r }
  }
  const altitudes = [0, 1, 8, 9, 12, 16, 24]
  const addOccupant = (
    uid: string,
    inventoryID: string,
    at: CubeCoordinate,
    altitude: number,
  ) => {
    const occupant: BoardPiece = {
      uid,
      inventoryID,
      pieceCoords: at,
      rotation: 0,
      altitude,
    }
    boardPieces.push(occupant)
    boardHexes[uid] = {
      ...at,
      id: `${uid}-hex`,
      altitude,
      pieceID: uid,
      boardPieceUID: uid,
      inventoryID,
      terrain:
        inventoryID === Pieces.grass1 ? HexTerrain.grass : HexTerrain.tree,
      pieceRotation: 0,
    }
  }

  for (let index = 0; index < 320; index++) {
    const inventoryID = generatedAddonIDs[index % generatedAddonIDs.length]
    const rotation =
      inventoryID === Pieces.laurWallShort ||
      inventoryID === Pieces.laurWallShortStackable
        ? random() % 6
        : inventoryID === Pieces.laurWallLong ||
            inventoryID === Pieces.laurWallLongStackable ||
            inventoryID === Pieces.laurWallArch
          ? (random() % 6) + 0.5
          : (random() % 12) / 2
    boardPieces.push(
      piece(
        `generated-addon-${index}`,
        inventoryID,
        coordinates(),
        rotation,
        altitudes[random() % altitudes.length],
      ),
    )
  }

  for (let index = 0; index < 24; index++) {
    const at = coordinates()
    const altitude = altitudes[random() % altitudes.length]
    addOccupant(
      `pillar-base-${index}`,
      index % 2 ? Pieces.laurWallSquarePillar : Pieces.laurWallTrianglePillar,
      at,
      altitude,
    )
    addOccupant(
      `pillar-stack-${index}`,
      Pieces.laurWallPillarStackable,
      at,
      altitude + LAUR_ADDON_STACK_INCREMENT,
    )
  }

  for (let index = 0; index < 80; index++) {
    addOccupant(
      `generated-occupant-${index}`,
      index % 2 ? Pieces.grass1 : Pieces.tree10,
      coordinates(),
      altitudes[random() % altitudes.length],
    )
  }

  const stackAnchor = { q: 30, r: -11, s: -19 }
  boardPieces.push(
    piece('legal-short-base', Pieces.laurWallShortStackable, stackAnchor, 2, 1),
    piece('legal-short-top', Pieces.laurWallShortStackable, stackAnchor, 2, 9),
    piece('legal-long-base', Pieces.laurWallLongStackable, stackAnchor, 2.5, 1),
    piece('legal-long-top', Pieces.laurWallArch, stackAnchor, 2.5, 9),
  )
  return { boardPieces, boardHexes }
}

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

const groundUnderPillarCases = [
  ...[Pieces.laurWallRuin1, Pieces.laurWallRuin2, Pieces.laurWallRuin3].flatMap(
    (inventoryID) =>
      Array.from({ length: 12 }, (_, halfStep) => ({
        inventoryID,
        rotation: halfStep / 2,
      })),
  ),
  ...[Pieces.laurWallShort, Pieces.laurWallShortStackable].flatMap(
    (inventoryID) =>
      Array.from({ length: 6 }, (_, rotation) => ({
        inventoryID,
        rotation,
      })),
  ),
  ...[
    Pieces.laurWallLong,
    Pieces.laurWallLongStackable,
    Pieces.laurWallArch,
  ].flatMap((inventoryID) =>
    Array.from({ length: 6 }, (_, halfStep) => ({
      inventoryID,
      rotation: halfStep + 0.5,
    })),
  ),
]

describe('evaluateLaurAddonConflicts', () => {
  it.each(groundUnderPillarCases)(
    'does not conflict with ground at the pillar base for $inventoryID at rotation $rotation',
    ({ inventoryID, rotation }) => {
      const { board } = boardWithGroundAndPillarsForAddon(inventoryID, rotation)
      const addon = piece('addon', inventoryID, center, rotation, 1)

      expect(
        evaluateLaurAddonConflicts(
          [...board.boardPieces, addon],
          board.boardHexes,
        ),
      ).toEqual([])
    },
  )

  it('still conflicts with an obstacle at the add-on height in its blocked hex', () => {
    const inventoryID = Pieces.laurWallRuin2
    const rotation = 0
    const { board, footprint } = boardWithGroundAndPillarsForAddon(
      inventoryID,
      rotation,
    )
    const obstacleBoard = placeOnBoard(
      board,
      Pieces.tree10,
      footprint.blockedHexes[0],
      'obstacle',
      0,
      1,
    )
    const addon = piece('addon', inventoryID, center, rotation, 1)

    expect(
      sorted(
        evaluateLaurAddonConflicts(
          [...obstacleBoard.boardPieces, addon],
          obstacleBoard.boardHexes,
        ),
      ),
    ).toEqual(['addon', 'obstacle'])
  })

  it('still conflicts with ground higher than the pillar base in its blocked hex', () => {
    const inventoryID = Pieces.laurWallRuin2
    const rotation = 0
    const { board, footprint } = boardWithGroundAndPillarsForAddon(
      inventoryID,
      rotation,
    )
    const raisedGroundBoard = placeOnBoard(
      board,
      Pieces.grass1,
      footprint.blockedHexes[0],
      'raised-ground',
      0,
      2,
    )
    const addon = piece('addon', inventoryID, center, rotation, 1)

    expect(
      sorted(
        evaluateLaurAddonConflicts(
          [...raisedGroundBoard.boardPieces, addon],
          raisedGroundBoard.boardHexes,
        ),
      ),
    ).toEqual(['addon', 'raised-ground'])
  })

  it('does not report a conflict in the saved Laur ground-under-ruin example', () => {
    const data = JSON.parse(
      readFileSync(
        resolve(
          process.cwd(),
          'public/json-maps/Example_Laur_Ruin_Conflict_With_Ground_Underneath.json',
        ),
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
    expect(
      evaluateLaurAddonConflicts(board.boardPieces, board.boardHexes),
    ).toEqual([])
  })

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

  it('matches legacy conflict and support references on a generated mixed board', () => {
    const { boardPieces, boardHexes } = makeGeneratedConflictBoard()
    const conflicts = evaluateLaurAddonConflicts(boardPieces, boardHexes)
    expect(conflicts).not.toHaveLength(0)
    expect(
      boardPieces.some(
        ({ inventoryID, uid }) =>
          generatedAddonIDs.includes(inventoryID) && !conflicts.includes(uid),
      ),
    ).toBe(true)
    expect(sorted(conflicts)).toEqual(
      sorted(bruteForceLaurAddonConflicts(boardPieces, boardHexes)),
    )
    expect(getUnsupportedLaurAddonUIDs({ boardPieces })).toEqual(
      bruteForceUnsupportedLaurAddonUIDs(boardPieces),
    )
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
