import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getPossibleRotationsForPenMode,
  getRotationByListStep,
} from '../controls/getPossibleRotationsForPenMode'
import { buildupJsonFileMap } from '../data/buildupMap'
import { getGroupRotationBlockedReason } from '../data/evaluateGroupRotation'
import { getLaurAddonCanonicalKey } from '../data/laurAddonPlacement'
import { getPillarPorts } from '../data/laurPillarPorts'
import { piecesSoFar } from '../data/pieces'
import type { PlacementBoard, PlacementBlockedReason } from '../data/placement'
import { rotateGroupAroundPivot } from '../data/rotateGroup'
import getPieceTemplateCoords from '../data/rotationTransforms'
import type {
  BoardPiece,
  CubeCoordinate,
  HexMap,
  MapState,
  Piece,
} from '../types'
import { HexTerrain, Pieces } from '../types'
import { hexUtilsGetNeighborForRotation } from '../utils/hex-utils'
import { makeTable, place } from './helpers/board'
import type { Board } from './helpers/board'

const at = (q: number, r: number): CubeCoordinate => ({
  q,
  r,
  s: -q - r,
})
const uidPiece = (
  uid: string,
  inventoryID: string,
  pieceCoords: CubeCoordinate,
  altitude = 0,
  rotation = 0,
): BoardPiece => ({
  uid,
  inventoryID,
  pieceCoords,
  altitude,
  rotation,
})
const coordKey = ({ q, r, s }: CubeCoordinate) => `${q},${r},${s}`
const sortedCoordKeys = (coords: CubeCoordinate[]) =>
  coords.map(coordKey).sort()

function rotateAroundPivot(
  coords: CubeCoordinate,
  pivot: CubeCoordinate,
  direction: 1 | -1,
): CubeCoordinate {
  const relative = {
    q: coords.q - pivot.q,
    r: coords.r - pivot.r,
    s: coords.s - pivot.s,
  }
  const rotated =
    direction === 1
      ? { q: -relative.r, r: -relative.s, s: -relative.q }
      : { q: -relative.s, r: -relative.q, s: -relative.r }
  return {
    q: pivot.q + rotated.q,
    r: pivot.r + rotated.r,
    s: pivot.s + rotated.s,
  }
}

const hexMap: HexMap = {
  id: 'group-rotation',
  name: 'Group Rotation',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 12,
  length: 12,
}

const storageValues = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => storageValues.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storageValues.set(key, value)
  }),
  removeItem: vi.fn((key: string) => {
    storageValues.delete(key)
  }),
}

let store: typeof import('../store/store').default

function loadStore(boardPieces: BoardPiece[] = []) {
  const map: MapState = buildupJsonFileMap(boardPieces, hexMap)
  const temporal = store.temporal.getState()
  temporal.pause()
  store.getState().loadMap(map, { holdAutosave: true })
  temporal.clear()
  temporal.resume()
}

const historyLength = () => store.temporal.getState().pastStates.length

beforeEach(async () => {
  storageValues.clear()
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.stubGlobal('localStorage', localStorageMock)
  vi.resetModules()
  ;({ default: store } = await import('../store/store'))
  loadStore()
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('rotateGroupAroundPivot', () => {
  const pivot = at(5, 5)
  const members = [
    uidPiece('a', 'g1', at(7, 5), 2, 0),
    uidPiece('b', 'r1', at(5, 7), 1, 2),
    uidPiece('pivot', 's1', pivot, 3, 4),
  ]

  it.each([1, -1] as const)(
    'rotates positions and orientations in direction %s',
    (direction) => {
      const moves = rotateGroupAroundPivot(members, 'pivot', direction)
      expect(moves).toEqual(
        members.map((piece) => ({
          uid: piece.uid,
          newPieceCoords: rotateAroundPivot(
            piece.pieceCoords,
            pivot,
            direction,
          ),
          newRotation: (((piece.rotation + direction) % 6) + 6) % 6,
        })),
      )
      expect(
        moves.find((move) => move.uid === 'pivot')?.newPieceCoords,
      ).toEqual(pivot)
    },
  )

  it('returns every selected piece to its exact start after six steps', () => {
    for (const direction of [1, -1] as const) {
      let current = members
      for (let step = 0; step < 6; step += 1) {
        const moves = rotateGroupAroundPivot(current, 'pivot', direction)
        current = current.map((piece) => {
          const move = moves.find((candidate) => candidate.uid === piece.uid)
          if (!move) throw new Error(`Missing move for ${piece.uid}`)
          return {
            ...piece,
            pieceCoords: move.newPieceCoords,
            rotation: move.newRotation ?? piece.rotation,
          }
        })
      }
      expect(current).toEqual(members)
    }
  })

  it('rotates a multi-hex group around a non-origin footprint hex', () => {
    const table = makeTable(15)
    const placed = place({
      board: table,
      pieceID: Pieces.grass3,
      at: at(5, 5),
      altitude: 0,
      uid: 'tile',
    })
    const tile = placed.board.boardPieces.find((piece) => piece.uid === 'tile')
    if (!tile) throw new Error('Missing multi-hex pivot piece')
    const pivotHex = Object.values(placed.board.boardHexes).find(
      (hex) =>
        hex.boardPieceUID === tile.uid &&
        (hex.q !== tile.pieceCoords.q || hex.r !== tile.pieceCoords.r),
    )
    if (!pivotHex) throw new Error('Missing non-origin pivot hex')
    const member = uidPiece('member', Pieces.rock1, at(9, 5), 0, 4)
    const selected = [tile, member]
    const pivotCoords = {
      q: pivotHex.q,
      r: pivotHex.r,
      s: pivotHex.s,
    }
    const tileDefinition = piecesSoFar[tile.inventoryID]
    if (!tileDefinition) throw new Error('Missing tile definition')
    const originalTileFootprint = getPieceTemplateCoords({
      clickedHex: tile.pieceCoords,
      rotation: tile.rotation,
      template: tileDefinition.template,
      isVsTile: false,
    })

    let current = selected
    for (let step = 0; step < 6; step += 1) {
      const moves = rotateGroupAroundPivot(current, pivotCoords, 1)
      current = current.map((piece) => {
        const move = moves.find((candidate) => candidate.uid === piece.uid)
        if (!move) throw new Error(`Missing move for ${piece.uid}`)
        return {
          ...piece,
          pieceCoords: move.newPieceCoords,
          rotation: move.newRotation ?? piece.rotation,
        }
      })
      if (step === 0) {
        const tileMove = current.find((piece) => piece.uid === 'tile')
        const memberMove = current.find((piece) => piece.uid === 'member')
        if (!tileMove || !memberMove) throw new Error('Missing rotated pieces')
        expect(memberMove.pieceCoords).toEqual(
          rotateAroundPivot(member.pieceCoords, pivotCoords, 1),
        )
        const movedTileDefinition = piecesSoFar[tileMove.inventoryID]
        if (!movedTileDefinition)
          throw new Error('Missing moved tile definition')
        const movedFootprint = getPieceTemplateCoords({
          clickedHex: tileMove.pieceCoords,
          rotation: tileMove.rotation,
          template: movedTileDefinition.template,
          isVsTile: false,
        })
        expect(sortedCoordKeys(movedFootprint)).toEqual(
          sortedCoordKeys(
            originalTileFootprint.map((hex) =>
              rotateAroundPivot(hex, pivotCoords, 1),
            ),
          ),
        )
      }
    }
    expect(current).toEqual(selected)
  })

  it('rejects a pivot that is not in the selected pieces', () => {
    expect(() => rotateGroupAroundPivot(members, 'missing', 1)).toThrow(
      'Rotation pivot missing is not in the selected pieces',
    )
  })
})

describe('rotation equivariance', () => {
  const registeredPieces = Object.values(piecesSoFar).filter(
    (piece): piece is Piece => Boolean(piece),
  )
  const pivot = at(8, 8)
  const anchor = at(10, 7)

  it.each(registeredPieces)(
    'rotates the footprint and anchor together for $id',
    (piece) => {
      for (const rotation of getPossibleRotationsForPenMode(piece.id)) {
        for (const direction of [1, -1] as const) {
          const selected = [
            uidPiece('member', piece.id, anchor, 2, rotation),
            uidPiece('pivot', Pieces.grass1, pivot, 0),
          ]
          const move = rotateGroupAroundPivot(
            selected,
            'pivot',
            direction,
          ).find((candidate) => candidate.uid === 'member')
          if (!move) throw new Error(`Missing move for ${piece.id}`)
          const originalFootprint = getPieceTemplateCoords({
            clickedHex: anchor,
            rotation,
            template: piece.template,
            isVsTile: false,
          }).map((coord) => rotateAroundPivot(coord, pivot, direction))
          const movedFootprint = getPieceTemplateCoords({
            clickedHex: move.newPieceCoords,
            rotation: move.newRotation ?? rotation,
            template: piece.template,
            isVsTile: false,
          })
          expect(sortedCoordKeys(movedFootprint)).toEqual(
            sortedCoordKeys(originalFootprint),
          )
          expect(
            getPossibleRotationsForPenMode(piece.id).includes(
              move.newRotation ?? rotation,
            ),
          ).toBe(true)
        }
      }
    },
  )

  it.each(registeredPieces)(
    'rotates $id equivariantly around a non-origin footprint pivot',
    (piece) => {
      const pivotTile = piecesSoFar[Pieces.grass3]
      const pivotTileCoords = at(7, 8)
      const pivotHex = getPieceTemplateCoords({
        clickedHex: pivotTileCoords,
        rotation: 0,
        template: pivotTile.template,
        isVsTile: false,
      }).find((hex) => coordKey(hex) !== coordKey(pivotTileCoords))
      if (!pivotHex) throw new Error('Missing non-origin pivot footprint hex')

      for (const rotation of getPossibleRotationsForPenMode(piece.id)) {
        for (const direction of [1, -1] as const) {
          const member = uidPiece('member', piece.id, anchor, 2, rotation)
          const pivotPiece = uidPiece(
            'pivot-tile',
            Pieces.grass3,
            pivotTileCoords,
          )
          const move = rotateGroupAroundPivot(
            [member, pivotPiece],
            pivotHex,
            direction,
          ).find((candidate) => candidate.uid === 'member')
          if (!move) throw new Error(`Missing move for ${piece.id}`)
          const originalFootprint = getPieceTemplateCoords({
            clickedHex: anchor,
            rotation,
            template: piece.template,
            isVsTile: false,
          }).map((coord) => rotateAroundPivot(coord, pivotHex, direction))
          const movedFootprint = getPieceTemplateCoords({
            clickedHex: move.newPieceCoords,
            rotation: move.newRotation ?? rotation,
            template: piece.template,
            isVsTile: false,
          })
          expect(sortedCoordKeys(movedFootprint)).toEqual(
            sortedCoordKeys(originalFootprint),
          )
        }
      }
    },
  )

  it.each(registeredPieces)(
    'rotates a single $id equivariantly around a non-origin pivot',
    (piece) => {
      const pivotTile = piecesSoFar[Pieces.grass3]
      const pivotTileCoords = at(7, 8)
      const pivotHex = getPieceTemplateCoords({
        clickedHex: pivotTileCoords,
        rotation: 0,
        template: pivotTile.template,
        isVsTile: false,
      }).find((hex) => coordKey(hex) !== coordKey(pivotTileCoords))
      if (!pivotHex) throw new Error('Missing non-origin pivot footprint hex')

      for (const rotation of getPossibleRotationsForPenMode(piece.id)) {
        for (const direction of [1, -1] as const) {
          const member = uidPiece('member', piece.id, anchor, 2, rotation)
          const move = rotateGroupAroundPivot([member], pivotHex, direction)[0]
          if (!move) throw new Error(`Missing move for ${piece.id}`)
          const originalFootprint = getPieceTemplateCoords({
            clickedHex: anchor,
            rotation,
            template: piece.template,
            isVsTile: false,
          }).map((coord) => rotateAroundPivot(coord, pivotHex, direction))
          const movedFootprint = getPieceTemplateCoords({
            clickedHex: move.newPieceCoords,
            rotation: move.newRotation ?? rotation,
            template: piece.template,
            isVsTile: false,
          })
          expect(sortedCoordKeys(movedFootprint)).toEqual(
            sortedCoordKeys(originalFootprint),
          )
        }
      }
    },
  )

  it('keeps edge support hexes and rope-ladder anchors equivariant', () => {
    const edgeSupport = (
      pieceID: string,
      coords: CubeCoordinate,
      rotation: number,
    ) => {
      if (pieceID === Pieces.ropeLadder) return coords
      const edgeIndex =
        pieceID === Pieces.battlement ? (rotation + 3) % 6 : rotation
      const neighborIndex =
        pieceID === Pieces.battlement ? edgeIndex : (edgeIndex + 4) % 6
      const neighbor = hexUtilsGetNeighborForRotation(neighborIndex)
      return {
        q: coords.q - neighbor.q,
        r: coords.r - neighbor.r,
        s: coords.s - neighbor.s,
      }
    }
    const edgePieces = [Pieces.battlement, Pieces.roadWall, Pieces.ropeLadder]

    for (const inventoryID of edgePieces) {
      for (let rotation = 0; rotation < 6; rotation += 1) {
        const member = uidPiece('member', inventoryID, anchor, 0, rotation)
        const pivotPiece = uidPiece('pivot', Pieces.grass1, pivot)
        const moved = rotateGroupAroundPivot(
          [member, pivotPiece],
          'pivot',
          1,
        ).find((candidate) => candidate.uid === 'member')
        if (!moved) throw new Error(`Missing move for ${inventoryID}`)
        expect(
          edgeSupport(
            inventoryID,
            moved.newPieceCoords,
            moved.newRotation ?? rotation,
          ),
        ).toEqual(
          rotateAroundPivot(
            edgeSupport(inventoryID, anchor, rotation),
            pivot,
            1,
          ),
        )
      }
    }
  })

  it('rotates Laur pillar ports, add-on side and vertex keys', () => {
    for (const pillarID of [
      Pieces.laurWallSquarePillar,
      Pieces.laurWallTrianglePillar,
    ]) {
      for (let rotation = 0; rotation < 6; rotation += 1) {
        const currentPorts = getPillarPorts(pillarID, rotation)
          .map((port) => (port + 1) % 6)
          .sort((a, b) => a - b)
        expect(
          getPillarPorts(pillarID, rotation + 1).sort((a, b) => a - b),
        ).toEqual(currentPorts)
      }
    }

    const parseKey = (key: string) => {
      const [kind, coordinates] = key.split(':')
      return {
        kind,
        coords: coordinates.split('|').map((coordinate) => {
          const [q, r, s] = coordinate.split(',').map(Number)
          return { q, r, s }
        }),
      }
    }
    const addonPieces = registeredPieces.filter(
      (piece) => piece.terrain === HexTerrain.laurWallAddon,
    )
    for (const piece of addonPieces) {
      for (const rotation of getPossibleRotationsForPenMode(piece.id)) {
        const before = getLaurAddonCanonicalKey(anchor, rotation)
        if (!before) throw new Error(`No canonical key for ${piece.id}`)
        const afterAnchor = rotateAroundPivot(anchor, pivot, 1)
        const after = getLaurAddonCanonicalKey(afterAnchor, rotation + 1)
        if (!after) throw new Error(`No rotated key for ${piece.id}`)
        const beforeParts = parseKey(before)
        const afterParts = parseKey(after)
        expect(afterParts.kind).toBe(beforeParts.kind)
        expect(sortedCoordKeys(afterParts.coords)).toEqual(
          sortedCoordKeys(
            beforeParts.coords.map((coord) =>
              rotateAroundPivot(coord, pivot, 1),
            ),
          ),
        )
      }
    }
  })

  it.each(['g7', 'g24'])(
    'keeps interlock orientations aligned for %s tiles',
    (inventoryID) => {
      const table = makeTable(20)
      const pivot = table.center
      const before = place({
        board: table,
        pieceID: inventoryID,
        at: pivot,
        altitude: 0,
        rotation: 0,
        uid: 'tile',
      })
      expect(before.error).toBeUndefined()
      const after = place({
        board: table,
        pieceID: inventoryID,
        at: pivot,
        altitude: 0,
        rotation: 1,
        uid: 'tile',
      })
      expect(after.error).toBeUndefined()
      const beforeHexes = Object.values(before.board.boardHexes).filter(
        (hex) => hex.boardPieceUID === 'tile',
      )
      const afterHexes = Object.values(after.board.boardHexes).filter(
        (hex) => hex.boardPieceUID === 'tile',
      )
      expect(beforeHexes).toHaveLength(inventoryID === 'g7' ? 7 : 24)
      for (const beforeHex of beforeHexes) {
        const afterHex = afterHexes.find(
          (hex) =>
            coordKey(hex) === coordKey(rotateAroundPivot(beforeHex, pivot, 1)),
        )
        if (!afterHex) throw new Error(`Missing rotated ${inventoryID} hex`)
        expect(afterHex.interlockType).toBe(beforeHex.interlockType)
        expect(afterHex.interlockRotation).toBe(beforeHex.interlockRotation)
        expect(
          ((afterHex.interlockRotation ?? 0) + afterHex.pieceRotation) % 6,
        ).toBe(
          ((beforeHex.interlockRotation ?? 0) + beforeHex.pieceRotation + 1) %
            6,
        )
      }
    },
  )

  it('keeps ladder vertical-clearance cells with the rotated anchor', () => {
    const table = makeTable(15)
    const ladder = place({
      board: table,
      pieceID: Pieces.ladder,
      at: anchor,
      altitude: 0,
      rotation: 0,
      uid: 'ladder',
    })
    expect(ladder.error).toBeUndefined()
    const movedAnchor = rotateAroundPivot(anchor, pivot, 1)
    const movedLadder = place({
      board: table,
      pieceID: Pieces.ladder,
      at: movedAnchor,
      altitude: 0,
      rotation: 1,
      uid: 'ladder',
    })
    expect(movedLadder.error).toBeUndefined()
    const originalCells = Object.values(ladder.board.boardHexes).filter(
      (hex) => hex.boardPieceUID === 'ladder',
    )
    const movedCells = Object.values(movedLadder.board.boardHexes).filter(
      (hex) => hex.boardPieceUID === 'ladder',
    )
    expect(
      movedCells.map((hex) => ({
        coords: coordKey(hex),
        altitude: hex.altitude,
        isVerticalClearanceHex: hex.isVerticalClearanceHex,
        pieceRotation: hex.pieceRotation,
      })),
    ).toEqual(
      originalCells.map((hex) => ({
        coords: coordKey(rotateAroundPivot(hex, pivot, 1)),
        altitude: hex.altitude,
        isVerticalClearanceHex: hex.isVerticalClearanceHex,
        pieceRotation: 1,
      })),
    )
  })
})

describe('existing single-piece rotation steps', () => {
  it('keeps the original list-index step sizes for ordinary and 30-degree pieces', () => {
    expect(getRotationByListStep(Pieces.grass1, 0, 1)).toBe(1)
    expect(getRotationByListStep(Pieces.grass1, 0, -1)).toBe(5)
    expect(getRotationByListStep(Pieces.laurWallLong, 0.5, 1)).toBe(1.5)
    expect(getRotationByListStep(Pieces.laurWallLong, 0.5, -1)).toBe(5.5)
    expect(getRotationByListStep(Pieces.laurWallLong, 0.5, 1, 2)).toBe(2.5)
    expect(getRotationByListStep(Pieces.laurWallLong, 0.5, -1, 2)).toBe(4.5)
    expect(getRotationByListStep(Pieces.laurWallTrianglePillar, 5.5, 1)).toBe(0)
  })
})

describe('group rotation placement checks', () => {
  it('blocks a single multi-hex rotation that would move off the map', () => {
    const table = makeTable(5)
    const coordinates = Object.values(table.boardHexes)
      .filter((hex) => hex.altitude === 0)
      .map(({ q, r, s }) => ({ q, r, s }))
    let blocked = false

    for (const anchor of coordinates) {
      const placed = place({
        board: table,
        pieceID: Pieces.grass3,
        at: anchor,
        altitude: 0,
        uid: 'tile',
      })
      if (placed.error) continue
      const tile = placed.board.boardPieces.find(
        (piece) => piece.uid === 'tile',
      )
      if (!tile) continue
      const pivotHex = Object.values(placed.board.boardHexes).find(
        (hex) =>
          hex.boardPieceUID === tile.uid &&
          !hex.isVerticalClearanceHex &&
          (hex.q !== tile.pieceCoords.q || hex.r !== tile.pieceCoords.r),
      )
      if (!pivotHex) continue
      const pivotCoords = {
        q: pivotHex.q,
        r: pivotHex.r,
        s: pivotHex.s,
      }

      for (const direction of [1, -1] as const) {
        const moves = rotateGroupAroundPivot([tile], pivotCoords, direction)
        const reason = getGroupRotationBlockedReason(
          placed.board,
          [tile],
          moves,
        )
        if (reason === 'offMap') {
          blocked = true
          break
        }
      }
      if (blocked) break
    }

    expect(blocked).toBe(true)
  })

  it('blocks a member that would move off the map', () => {
    const table = makeTable(5)
    const onMap = new Set(
      Object.values(table.boardHexes)
        .filter((hex) => hex.altitude === 0)
        .map(coordKey),
    )
    let found: { pivot: CubeCoordinate; member: CubeCoordinate } | undefined
    const coordinates = Object.values(table.boardHexes)
      .filter((hex) => hex.altitude === 0)
      .map(({ q, r, s }) => ({ q, r, s }))
    for (const pivot of coordinates) {
      for (const member of coordinates) {
        if (coordKey(pivot) === coordKey(member)) continue
        if (!onMap.has(coordKey(rotateAroundPivot(member, pivot, 1)))) {
          found = { pivot, member }
          break
        }
      }
      if (found) break
    }
    if (!found) throw new Error('Could not find an off-map rotation fixture')
    const board = place({
      board: table,
      pieceID: Pieces.grass1,
      at: found.pivot,
      altitude: 0,
      uid: 'pivot',
    }).board
    const withMember = place({
      board,
      pieceID: Pieces.rock1,
      at: found.member,
      altitude: 0,
      uid: 'member',
    }).board
    const selected = withMember.boardPieces
    const moves = rotateGroupAroundPivot(selected, 'pivot', 1)
    expect(getGroupRotationBlockedReason(withMember, selected, moves)).toBe(
      'offMap',
    )
  })

  it('blocks a member from landing on a castle wall top', () => {
    let board: Board = makeTable(12)
    const pivot = at(4, 4)
    const source = at(5, 4)
    const wall = at(4, 5)
    board = place({
      board,
      pieceID: Pieces.grass1,
      at: pivot,
      altitude: 0,
      uid: 'pivot',
    }).board
    board = place({
      board,
      pieceID: Pieces.rock1,
      at: source,
      altitude: 0,
      uid: 'member',
    }).board
    board = place({
      board,
      pieceID: Pieces.castleWallEnd,
      at: wall,
      altitude: 0,
      uid: 'wall',
      permissive: true,
    }).board
    const selected = board.boardPieces.filter((piece) =>
      ['pivot', 'member'].includes(piece.uid),
    )
    const moves = rotateGroupAroundPivot(selected, 'pivot', 1)
    expect(getGroupRotationBlockedReason(board, selected, moves)).toBe(
      'notOnCastleWallTop',
    )
  })

  it('blocks a duplicate start-zone destination without mutating frozen state', () => {
    let board: Board = makeTable(12)
    const pivot = at(4, 4)
    const source = at(5, 4)
    const occupied = at(4, 5)
    board = place({
      board,
      pieceID: Pieces.grass1,
      at: pivot,
      altitude: 0,
      uid: 'pivot',
    }).board
    board = place({
      board,
      pieceID: Pieces.startZone2,
      at: source,
      altitude: 0,
      uid: 'moving-zone',
    }).board
    board = place({
      board,
      pieceID: Pieces.startZone1,
      at: occupied,
      altitude: 0,
      uid: 'stationary-zone',
    }).board
    const selected = board.boardPieces.filter((piece) =>
      ['pivot', 'moving-zone'].includes(piece.uid),
    )
    const moves = rotateGroupAroundPivot(selected, 'pivot', 1)
    const frozenBoard: PlacementBoard = {
      boardHexes: Object.freeze(
        Object.fromEntries(
          Object.entries(board.boardHexes).map(([id, hex]) => [
            id,
            Object.freeze({ ...hex }),
          ]),
        ),
      ),
      boardPieces: Object.freeze(
        board.boardPieces.map((piece) =>
          Object.freeze({
            ...piece,
            pieceCoords: Object.freeze({ ...piece.pieceCoords }),
          }),
        ),
      ) as BoardPiece[],
    }
    const before = structuredClone(frozenBoard)
    expect(getGroupRotationBlockedReason(frozenBoard, selected, moves)).toBe(
      'duplicateStartZone' satisfies PlacementBlockedReason,
    )
    expect(frozenBoard).toEqual(before)
  })

  it('allows conflicts and applies all moved pieces as one undoable update', async () => {
    const pieces = [
      uidPiece('pivot', Pieces.grass1, at(4, 4)),
      uidPiece('member', Pieces.rock1, at(5, 4)),
      uidPiece('stationary', Pieces.grass1, at(4, 5)),
    ]
    loadStore(pieces)
    store.getState().toggleSelectedPieceID('pivot')
    store.getState().toggleSelectedPieceID('member', true)
    const selected = store
      .getState()
      .boardPieces.filter((piece) =>
        store.getState().selectedPieceIDs.includes(piece.uid),
      )
    const moves = rotateGroupAroundPivot(selected, 'pivot', 1)
    const currentState = store.getState()
    expect(
      getGroupRotationBlockedReason(
        {
          boardHexes: currentState.boardHexes,
          boardPieces: currentState.boardPieces,
        },
        selected,
        moves,
      ),
    ).toBeUndefined()
    store.getState().movePieces({ moves })
    expect(historyLength()).toBe(1)
    expect(
      store.getState().boardPieces.find((piece) => piece.uid === 'member')
        ?.pieceCoords,
    ).toEqual(at(4, 5))
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['member', 'stationary']),
    )

    const before = pieces
    const { undoWithSelectionRestore, redoWithSelectionRestore } = await import(
      '../utils/undoWithSelectionRestore'
    )
    undoWithSelectionRestore()
    expect(
      store
        .getState()
        .boardPieces.map((piece) => ({
          uid: piece.uid,
          pieceCoords: piece.pieceCoords,
          rotation: piece.rotation,
        }))
        .sort((a, b) => a.uid.localeCompare(b.uid)),
    ).toEqual(
      before
        .map((piece) => ({
          uid: piece.uid,
          pieceCoords: piece.pieceCoords,
          rotation: piece.rotation,
        }))
        .sort((a, b) => a.uid.localeCompare(b.uid)),
    )
    redoWithSelectionRestore()
    expect(
      store.getState().boardPieces.find((piece) => piece.uid === 'member')
        ?.pieceCoords,
    ).toEqual(at(4, 5))
  })

  it('uses the last selected UID as pivot and preserves selection order through undo/redo', async () => {
    const initial = [
      uidPiece('pivot', Pieces.sand1, at(3, 6), 0, 4),
      uidPiece('first', Pieces.grass1, at(3, 3), 0, 0),
      uidPiece('second', Pieces.rock1, at(6, 3), 0, 2),
    ]
    loadStore(initial)
    store.getState().toggleSelectedPieceID('first')
    store.getState().toggleSelectedPieceID('second', true)
    store.getState().toggleSelectedPieceID('pivot', true)
    expect(store.getState().selectedPieceIDs).toEqual([
      'first',
      'second',
      'pivot',
    ])

    const selected = store
      .getState()
      .boardPieces.filter((piece) =>
        store.getState().selectedPieceIDs.includes(piece.uid),
      )
    const selectedPieceIDs = store.getState().selectedPieceIDs
    const moves = rotateGroupAroundPivot(
      selected,
      selectedPieceIDs[selectedPieceIDs.length - 1] ?? '',
      1,
    )
    expect(moves.find((move) => move.uid === 'pivot')?.newPieceCoords).toEqual(
      at(3, 6),
    )
    store.getState().movePieces({ moves })
    expect(store.getState().selectedPieceIDs).toEqual([
      'first',
      'second',
      'pivot',
    ])
    const { undoWithSelectionRestore, redoWithSelectionRestore } = await import(
      '../utils/undoWithSelectionRestore'
    )
    undoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([
      'first',
      'second',
      'pivot',
    ])
    redoWithSelectionRestore()
    expect(store.getState().selectedPieceIDs).toEqual([
      'first',
      'second',
      'pivot',
    ])
  })
})
