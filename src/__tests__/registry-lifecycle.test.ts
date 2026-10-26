/**
 * This ratchet exercises every registered piece through place, delete, drag,
 * rotation, undo, and JSON save/load. New registry entries are picked up
 * automatically. Add a family-specific support in `makeFixture`; a failing
 * test name identifies both the piece and lifecycle step to investigate.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  getPossibleRotationsForPenMode,
  getRotationByListStep,
  hasIntegerRotationSteps,
} from '../controls/getPossibleRotationsForPenMode'
import { addPiece } from '../data/addPiece'
import { buildupJsonFileMap } from '../data/buildupMap'
import { decideDrop, evaluateDragTarget } from '../data/dragMove'
import { getGroupRotationBlockedReason } from '../data/evaluateGroupRotation'
import { getPillarPorts } from '../data/laurPillarPorts'
import { piecesSoFar } from '../data/pieces'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import {
  isPlacementBlocked,
  resolvePlacement,
  type PlacementResolution,
  type ResolvedPlacement,
} from '../data/placement'
import { rotateGroupAroundPivot } from '../data/rotateGroup'
import getPieceTemplateCoords from '../data/rotationTransforms'
import type { BoardHex, BoardPiece, CubeCoordinate, HexMap } from '../types'
import { HexTerrain, Pieces, type Piece } from '../types'
import {
  cubeToPixel,
  HEX_DIRECTIONS,
  hexUtilsAdd,
  hexUtilsGetNeighborForRotation,
} from '../utils/hex-utils'
import { normalizeBoardPiecesWithDropped } from '../utils/map-utils'
import {
  type Board,
  cloneBoard,
  hexAt,
  makeTable,
  place,
  remove,
  withGrassFloor,
} from './helpers/board'
import { pillarPartialHex } from './helpers/placementCases'

const HEX_MAP: HexMap = {
  id: 'registry-lifecycle',
  name: 'Registry lifecycle',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 10,
  length: 10,
}

const FLOOR_8 = withGrassFloor(makeTable(8))
const FLOOR_9 = withGrassFloor(makeTable(9))
const FLOOR_10 = withGrassFloor(makeTable(10))
const FLOOR_15 = withGrassFloor(makeTable(15))
const IDS = Object.keys(piecesSoFar)
const EDGE_IDS = new Set([Pieces.battlement, Pieces.roadWall])
const NO_OFFSET = { q: 0, r: 0, s: 0 }
const BLOCKED_ROTATION_MESSAGE = 'That rotation is blocked.'
let useBoundStore!: typeof import('../store/store').default

beforeAll(async () => {
  vi.useFakeTimers()
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  })
  vi.resetModules()
  ;({ default: useBoundStore } = await import('../store/store'))
})

afterAll(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.resetModules()
})

type Fixture = {
  board: Board
  piece: Piece
  pieceBoard: Board
  subject: BoardPiece
  pointerHex: BoardHex
  mapSize: number
}

const mod6 = (rotation: number) => ((rotation % 6) + 6) % 6

function cubeDistance(a: CubeCoordinate, b: CubeCoordinate) {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2
}

function edgePoint(hex: CubeCoordinate, edge: number) {
  const center = cubeToPixel(hex)
  const neighbor = hexUtilsGetNeighborForRotation(edge)
  const neighborCenter = cubeToPixel({
    q: hex.q + neighbor.q,
    r: hex.r + neighbor.r,
    s: hex.s + neighbor.s,
  })
  return {
    x: (center.x + neighborCenter.x) / 2,
    z: (center.y + neighborCenter.y) / 2,
  }
}

function requireResolution(
  resolution: PlacementResolution,
  pieceID: string,
): ResolvedPlacement {
  if (isPlacementBlocked(resolution)) {
    throw new Error(`${pieceID} placement was blocked: ${resolution.blocked}`)
  }
  return resolution
}

function addResolved(
  board: Board,
  resolved: ResolvedPlacement,
  uid: string,
): Board {
  const result = addPiece({
    piece: resolved.piece,
    boardHexes: board.boardHexes,
    boardPieces: board.boardPieces,
    pieceCoords: resolved.coords,
    placementAltitude: resolved.altitude,
    rotation: resolved.rotation,
    isVsTile: false,
    uid,
  })
  if (result.error) {
    throw new Error(
      `${resolved.piece.id} addPiece failed: ${result.error.message}`,
    )
  }
  return {
    boardHexes: result.newBoardHexes,
    boardPieces: result.newBoardPieces,
  }
}

function capAt(board: Board, coords: CubeCoordinate) {
  const cap = hexAt(board, coords, 1)
  if (!cap) throw new Error(`Missing land cap at ${JSON.stringify(coords)}`)
  return cap
}

function candidateCaps(board: Board, origin: CubeCoordinate) {
  const seen = new Set<string>()
  return Object.values(board.boardHexes)
    .filter((hex) => hex.altitude === 1 && hex.isCap)
    .filter((hex) => {
      const key = `${hex.q},${hex.r},${hex.s}`
      if (seen.has(key)) return false
      seen.add(key)
      return cubeDistance(hex, origin) >= 3
    })
    .sort((a, b) => cubeDistance(a, origin) - cubeDistance(b, origin))
}

function requiredAddonSupports(
  pieceID: string,
  anchor: CubeCoordinate,
  rotation: number,
) {
  if (
    pieceID === Pieces.laurWallShort ||
    pieceID === Pieces.laurWallShortStackable
  ) {
    return [
      {
        coords: hexUtilsAdd(anchor, HEX_DIRECTIONS[mod6(rotation)]),
        port: mod6(rotation + 3),
      },
    ]
  }
  if (
    pieceID === Pieces.laurWallLong ||
    pieceID === Pieces.laurWallLongStackable ||
    pieceID === Pieces.laurWallArch
  ) {
    const direction = Math.floor(mod6(rotation))
    return [
      {
        coords: hexUtilsAdd(
          hexUtilsAdd(anchor, HEX_DIRECTIONS[direction]),
          HEX_DIRECTIONS[(direction + 1) % 6],
        ),
        port: mod6(rotation + 3),
      },
    ]
  }
  return []
}

function pillarRotationForPort(port: number) {
  const rotation = Array.from({ length: 6 }, (_, index) => index).find(
    (candidate) =>
      getPillarPorts(Pieces.laurWallSquarePillar, candidate).includes(port),
  )
  if (rotation === undefined) {
    throw new Error(`No square pillar rotation supports port ${port}`)
  }
  return rotation
}

function placePillar(
  board: Board,
  uid: string,
  coords: CubeCoordinate,
  rotation: number,
) {
  const placed = place({
    board,
    pieceID: Pieces.laurWallSquarePillar,
    at: coords,
    altitude: 0,
    rotation,
    uid,
  })
  if (placed.error) throw new Error(placed.error.message)
  return placed.board
}

function makeFixture(piece: Piece): Fixture {
  const mapSize =
    piece.size >= 24
      ? 15
      : piece.size >= 8 || piece.terrain === HexTerrain.laurWallAddon
        ? 10
        : piece.size >= 4
          ? 9
          : 8
  const blankTable =
    piece.terrain === HexTerrain.laurWallAddon
      ? makeTable(mapSize)
      : mapSize === 8
        ? FLOOR_8
        : mapSize === 9
          ? FLOOR_9
          : mapSize === 10
            ? FLOOR_10
            : FLOOR_15
  let board: Board = cloneBoard(blankTable)
  const sourceCoords = blankTable.center
  const rotation = getPossibleRotationsForPenMode(piece.id)[0] ?? 0
  let pointerHex: BoardHex | undefined
  let targetAddonHex: BoardHex | undefined

  if (piece.terrain === HexTerrain.laurWallAddon) {
    // Add-ons are boardPieces-only; the shared placement helper supplies the
    // same partial pillar hit used by the real click handler.
    board = placePillar(board, 'source-pillar', sourceCoords, 2)
    pointerHex = pillarPartialHex(board, 'source-pillar')

    const sourceResolution = requireResolution(
      resolvePlacement(piece, pointerHex, rotation, board),
      piece.id,
    )
    for (const [index, support] of requiredAddonSupports(
      piece.id,
      sourceResolution.coords,
      sourceResolution.rotation,
    ).entries()) {
      board = placePillar(
        board,
        `source-support-${index}`,
        support.coords,
        pillarRotationForPort(support.port),
      )
    }

    const targetCoords = Object.values(board.boardHexes)
      .filter((hex) => hex.altitude === 0 && hex.terrain === HexTerrain.empty)
      .filter((hex) => cubeDistance(hex, sourceCoords) >= 4)
      .sort(
        (a, b) => cubeDistance(a, sourceCoords) - cubeDistance(b, sourceCoords),
      )[0]
    if (!targetCoords) throw new Error('Missing destination for Laur add-on')
    board = placePillar(board, 'target-pillar', targetCoords, 2)
    const targetPillarHex = pillarPartialHex(board, 'target-pillar')
    const targetResolution = requireResolution(
      resolvePlacement(piece, targetPillarHex, rotation, board),
      piece.id,
    )
    for (const [index, support] of requiredAddonSupports(
      piece.id,
      targetResolution.coords,
      targetResolution.rotation,
    ).entries()) {
      board = placePillar(
        board,
        `target-support-${index}`,
        support.coords,
        pillarRotationForPort(support.port),
      )
    }
    targetAddonHex = pillarPartialHex(board, 'target-pillar')
  }

  if (!pointerHex) pointerHex = capAt(board, sourceCoords)
  const resolved = requireResolution(
    resolvePlacement(piece, pointerHex, rotation, board),
    piece.id,
  )
  const pieceBoard = addResolved(board, resolved, 'subject')
  const subject = pieceBoard.boardPieces.find(
    (candidate) => candidate.uid === 'subject',
  )
  if (!subject) throw new Error(`Missing placed ${piece.id}`)

  return {
    board,
    piece,
    pieceBoard,
    subject,
    pointerHex: targetAddonHex ?? pointerHex,
    mapSize,
  }
}

const fixtureCache = new Map<string, Fixture>()
function fixtureFor(pieceID: string) {
  const piece = piecesSoFar[pieceID]
  if (!piece) throw new Error(`Missing registry definition for ${pieceID}`)
  let fixture = fixtureCache.get(pieceID)
  if (!fixture) {
    fixture = makeFixture(piece)
    fixtureCache.set(pieceID, fixture)
  }
  return fixture
}

function findDragTarget(fixture: Fixture) {
  const { piece, subject, pointerHex } = fixture
  if (piece.terrain === HexTerrain.laurWallAddon) {
    const target = evaluateDragTarget(
      fixture.pieceBoard,
      piece,
      subject,
      pointerHex,
      NO_OFFSET,
      [subject],
    )
    return target
  }

  for (const cap of candidateCaps(fixture.pieceBoard, subject.pieceCoords)) {
    const worldPoint = EDGE_IDS.has(piece.id) ? edgePoint(cap, 0) : undefined
    const target = evaluateDragTarget(
      fixture.pieceBoard,
      piece,
      subject,
      cap,
      NO_OFFSET,
      [subject],
      worldPoint,
    )
    if (
      !isPlacementBlocked(target.resolution) &&
      target.evaluation.status === 'ok' &&
      cubeDistance(target.resolution.coords, subject.pieceCoords) > 0
    ) {
      return target
    }
  }
  throw new Error(`No free drag destination found for ${piece.id}`)
}

function setStoreBoard(board: Board) {
  useBoundStore.setState({
    boardHexes: board.boardHexes,
    boardPieces: board.boardPieces,
    conflictedPieceUIDs: computeConflictedPieceUIDs(board.boardPieces),
    unsupportedPieceUIDs: [],
    viewingLevel: 0,
  })
  useBoundStore.temporal.getState().clear()
}

function saveAndLoad(boardPieces: BoardPiece[], mapSize: number) {
  const serialized = JSON.stringify({
    hexMap: { ...HEX_MAP, width: mapSize, length: mapSize },
    boardPieces,
  })
  const saved = JSON.parse(serialized) as {
    hexMap: HexMap
    boardPieces: BoardPiece[]
  }
  const normalized = normalizeBoardPiecesWithDropped(saved.boardPieces)
  return buildupJsonFileMap(
    normalized.boardPieces,
    saved.hexMap,
    normalized.droppedPieces,
  )
}

describe('registry-wide piece lifecycle', () => {
  it.each(IDS)('places %s through resolvePlacement and addPiece', (pieceID) => {
    const fixture = fixtureFor(pieceID)
    expect(fixture.pieceBoard.boardPieces).toContainEqual(fixture.subject)
    expect(fixture.subject.inventoryID).toBe(pieceID)
  })

  it.each(IDS)('deletes %s and restores the support board', (pieceID) => {
    const fixture = fixtureFor(pieceID)
    const removed = remove(fixture.pieceBoard, 'subject')
    expect(removed.error).toBeUndefined()
    expect(removed.board.boardHexes).toEqual(fixture.board.boardHexes)
    expect(removed.board.boardPieces).toEqual(fixture.board.boardPieces)
  })

  it.each(IDS)('drags %s and one-step undo restores the board', (pieceID) => {
    const fixture = fixtureFor(pieceID)
    const { piece } = fixture
    const target = findDragTarget(fixture)
    const expected = resolvePlacement(
      piece,
      target.pointerHex,
      EDGE_IDS.has(pieceID) ? 0 : fixture.subject.rotation,
      fixture.pieceBoard,
      {
        worldPoint:
          EDGE_IDS.has(pieceID) && target.pointerHex
            ? edgePoint(target.pointerHex, 0)
            : undefined,
        ignoreUID: fixture.subject.uid,
      },
    )
    const resolvedTarget = requireResolution(target.resolution, pieceID)
    expect(target.evaluation.status).toBe('ok')
    expect(resolvedTarget).toEqual(expected)
    const decision = decideDrop('subject', target)
    expect(decision.type).toBe('move')
    if (decision.type !== 'move') {
      throw new Error(`${pieceID} drag was refused: ${decision.reason}`)
    }

    setStoreBoard(fixture.pieceBoard)
    const before = structuredClone({
      boardHexes: useBoundStore.getState().boardHexes,
      boardPieces: useBoundStore.getState().boardPieces,
    })
    useBoundStore.getState().movePieces({
      moves: decision.moves ?? [
        {
          uid: decision.uid,
          newPieceCoords: decision.newPieceCoords,
          newAltitude: decision.newAltitude,
          newRotation: decision.newRotation,
        },
      ],
    })
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(1)
    expect(
      useBoundStore
        .getState()
        .boardPieces.find((candidate) => candidate.uid === 'subject'),
    ).toMatchObject({
      inventoryID: pieceID,
      pieceCoords: resolvedTarget.coords,
      altitude: resolvedTarget.altitude,
      rotation: resolvedTarget.rotation,
    })

    useBoundStore.temporal.getState().undo()
    expect({
      boardHexes: useBoundStore.getState().boardHexes,
      boardPieces: useBoundStore.getState().boardPieces,
    }).toEqual(before)
  })

  it.each(IDS)('cycles %s through its single-piece rotations', (pieceID) => {
    const fixture = fixtureFor(pieceID)
    const start = structuredClone({
      boardHexes: fixture.pieceBoard.boardHexes,
      boardPieces: fixture.pieceBoard.boardPieces,
    })
    const rotations = getPossibleRotationsForPenMode(pieceID)
    const startRotationIndex = rotations.indexOf(fixture.subject.rotation)
    expect(startRotationIndex).toBeGreaterThanOrEqual(0)
    setStoreBoard(fixture.pieceBoard)

    for (let step = 0; step < rotations.length; step += 1) {
      const current = useBoundStore
        .getState()
        .boardPieces.find((candidate) => candidate.uid === 'subject')
      if (!current) throw new Error(`Missing rotating ${pieceID}`)
      expect(current.rotation).toBe(
        rotations[(startRotationIndex + step) % rotations.length],
      )
      useBoundStore.getState().movePieces({
        moves: [
          {
            uid: current.uid,
            newPieceCoords: current.pieceCoords,
            newRotation: getRotationByListStep(pieceID, current.rotation, 1),
          },
        ],
      })
    }
    expect(
      useBoundStore
        .getState()
        .boardPieces.find((candidate) => candidate.uid === 'subject')?.rotation,
    ).toBe(fixture.subject.rotation)

    expect({
      boardHexes: useBoundStore.getState().boardHexes,
      boardPieces: useBoundStore.getState().boardPieces,
    }).toEqual(start)
  })

  it.each(IDS)(
    'rotates %s around a non-origin footprint hex or confirms the refusal',
    (pieceID) => {
      const piece = piecesSoFar[pieceID]
      if (!piece) throw new Error(`Missing registry definition for ${pieceID}`)
      const fixture = fixtureFor(pieceID)
      const footprint = getPieceTemplateCoords({
        clickedHex: fixture.subject.pieceCoords,
        rotation: fixture.subject.rotation,
        template: piece.template,
        isVsTile: false,
      })
      const pivot = footprint.find(
        (hex) => cubeDistance(hex, fixture.subject.pieceCoords) > 0,
      )

      if (!hasIntegerRotationSteps(pieceID)) {
        // SelectedPieceControls refuses non-origin rotation for fractional
        // Laur rotation families with this same generic warning.
        expect(hasIntegerRotationSteps(pieceID)).toBe(false)
        expect(BLOCKED_ROTATION_MESSAGE).toBe('That rotation is blocked.')
        return
      }
      if (!pivot) {
        expect(footprint).toHaveLength(1)
        return
      }

      const initial = structuredClone({
        boardHexes: fixture.pieceBoard.boardHexes,
        boardPieces: fixture.pieceBoard.boardPieces,
      })
      setStoreBoard(fixture.pieceBoard)
      for (let step = 0; step < 6; step += 1) {
        const current = useBoundStore
          .getState()
          .boardPieces.find((candidate) => candidate.uid === 'subject')
        if (!current) throw new Error(`Missing rotating ${pieceID}`)
        const moves = rotateGroupAroundPivot([current], pivot, 1)
        expect(
          getGroupRotationBlockedReason(
            {
              boardHexes: useBoundStore.getState().boardHexes,
              boardPieces: useBoundStore.getState().boardPieces,
            },
            [current],
            moves,
          ),
        ).toBeUndefined()
        useBoundStore.getState().movePieces({ moves })
      }

      expect({
        boardHexes: useBoundStore.getState().boardHexes,
        boardPieces: useBoundStore.getState().boardPieces,
      }).toEqual(initial)
    },
  )

  it.each(IDS)('round-trips %s through JSON map load', (pieceID) => {
    const fixture = fixtureFor(pieceID)
    const loaded = saveAndLoad(fixture.pieceBoard.boardPieces, fixture.mapSize)
    expect(loaded.droppedPieces).toEqual([])
    expect(loaded.boardPieces).toContainEqual(fixture.subject)
  })
})
