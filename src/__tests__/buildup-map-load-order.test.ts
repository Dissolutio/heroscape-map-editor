import { describe, expect, it } from 'vitest'
import { addPiece } from '../data/addPiece'
import { buildupJsonFileMap } from '../data/buildupMap'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import { getUnsupportedLaurAddonUIDs } from '../data/laurAddonSupport'
import { piecesSoFar } from '../data/pieces'
import { getPillarPorts } from '../data/laurPillarPorts'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { normalizeBoardPiecesWithDropped } from '../utils/map-utils'
import { Pieces, type BoardPiece, type HexMap } from '../types'
import { hexAt, makeTable } from './helpers/board'

const hexMap: HexMap = {
  id: 'load-order',
  name: 'Load order',
  author: '',
  version: 1,
  shape: 'rectangle',
  length: 15,
  width: 15,
}

const shortWall = {
  inventoryID: Pieces.laurWallShortStackable,
  rotation: 0,
  supportKind: 'short' as const,
}
const longWall = {
  inventoryID: Pieces.laurWallLongStackable,
  rotation: 0.5,
  supportKind: 'long' as const,
}
const arch = {
  inventoryID: Pieces.laurWallArch,
  rotation: 0.5,
  supportKind: 'long' as const,
}
const ruin2 = {
  inventoryID: Pieces.laurWallRuin2,
  rotation: 0.5,
  supportKind: 'ruin' as const,
}
const ruin3 = {
  inventoryID: Pieces.laurWallRuin3,
  rotation: 0.5,
  supportKind: 'ruin' as const,
}
const boardPiecesOnlyOverlays = [
  {
    inventoryID: Pieces.roadWall,
    rotation: 0,
    supportKind: 'surface' as const,
  },
  {
    inventoryID: Pieces.ropeLadder,
    rotation: 0,
    supportKind: 'surface' as const,
  },
]
const missingPieces = [
  shortWall,
  longWall,
  arch,
  ruin2,
  ruin3,
  ...boardPiecesOnlyOverlays,
]

function makePiece(
  uid: string,
  inventoryID: string,
  pieceCoords: BoardPiece['pieceCoords'],
  rotation = 0,
  altitude = 0,
): BoardPiece {
  return { uid, inventoryID, pieceCoords, rotation, altitude }
}

function matchingPillarRotation(port: number) {
  const rotation = Array.from({ length: 6 }, (_, index) => index).find(
    (candidate) =>
      getPillarPorts(Pieces.laurWallSquarePillar, candidate).includes(port),
  )
  if (rotation === undefined) {
    throw new Error(`No square pillar rotation supports port ${port}`)
  }
  return rotation
}

function getLaurSupports(
  supportKind: 'short' | 'long' | 'ruin',
  anchor: BoardPiece['pieceCoords'],
  rotation: number,
) {
  const direction = Math.floor(rotation)
  const required =
    supportKind === 'short'
      ? [
          { coords: anchor, port: rotation },
          {
            coords: hexUtilsAdd(anchor, HEX_DIRECTIONS[direction]),
            port: (rotation + 3) % 6,
          },
        ]
      : supportKind === 'long'
        ? [
            { coords: anchor, port: rotation },
            {
              coords: hexUtilsAdd(
                hexUtilsAdd(anchor, HEX_DIRECTIONS[direction]),
                HEX_DIRECTIONS[(direction + 1) % 6],
              ),
              port: (rotation + 3) % 6,
            },
          ]
        : [{ coords: anchor, port: rotation }]

  return required.map(({ coords, port }, index) =>
    makePiece(
      `support-${index}`,
      Pieces.laurWallSquarePillar,
      coords,
      matchingPillarRotation(port),
    ),
  )
}

function derivedLists(boardPieces: BoardPiece[]) {
  return {
    conflicts: computeConflictedPieceUIDs(boardPieces).sort(),
    unsupported: getUnsupportedLaurAddonUIDs({ boardPieces }).sort(),
  }
}

function load(boardPieces: BoardPiece[]) {
  return buildupJsonFileMap(boardPieces, hexMap)
}

function expectSaveReloadStable(firstLoad: ReturnType<typeof load>) {
  const serialized = JSON.stringify({
    hexMap: firstLoad.hexMap,
    boardPieces: firstLoad.boardPieces,
  })
  const saved = JSON.parse(serialized) as {
    hexMap: HexMap
    boardPieces: BoardPiece[]
  }
  const normalized = normalizeBoardPiecesWithDropped(saved.boardPieces)
  const secondLoad = buildupJsonFileMap(
    normalized.boardPieces,
    saved.hexMap,
    normalized.droppedPieces,
  )

  expect(secondLoad.boardPieces).toEqual(firstLoad.boardPieces)
  expect(secondLoad.boardHexes).toEqual(firstLoad.boardHexes)
  expect(derivedLists(secondLoad.boardPieces)).toEqual(
    derivedLists(firstLoad.boardPieces),
  )
}

function replayInArrayOrder(boardPieces: BoardPiece[]) {
  let { boardHexes } = makeTable()
  let rebuiltPieces: BoardPiece[] = []

  for (const boardPiece of boardPieces) {
    const piece = piecesSoFar[boardPiece.inventoryID]
    if (!piece) throw new Error(`Unknown test piece: ${boardPiece.inventoryID}`)
    const result = addPiece({
      piece,
      boardHexes,
      boardPieces: rebuiltPieces,
      pieceCoords: boardPiece.pieceCoords,
      placementAltitude: boardPiece.altitude,
      rotation: boardPiece.rotation,
      isVsTile: false,
      uid: boardPiece.uid,
      permissive: true,
    })
    boardHexes = result.newBoardHexes
    rebuiltPieces = result.newBoardPieces
  }

  return { boardHexes, boardPieces: rebuiltPieces }
}

describe('buildupJsonFileMap support-dependent load order', () => {
  it.each(missingPieces)(
    '$inventoryID loads after its same-altitude support and overlap',
    ({ inventoryID, rotation, supportKind }) => {
      const anchor = makeTable().center
      const target = makePiece('target', inventoryID, anchor, rotation)
      const overlap = makePiece('overlap', inventoryID, anchor, rotation)
      const supports =
        supportKind === 'surface'
          ? [makePiece('surface', Pieces.grass1, anchor)]
          : getLaurSupports(supportKind, anchor, rotation)

      const savedOrder = [target, ...supports, overlap]
      const supportsFirst = [...supports, target, overlap]
      const savedLoad = load(savedOrder)
      const supportsFirstLoad = load(supportsFirst)
      const measuredDerived = derivedLists(savedLoad.boardPieces)

      expect(savedOrder[0]?.altitude).toBe(supports[0]?.altitude)
      expect(
        savedOrder.findIndex((piece) => piece.uid === 'target'),
      ).toBeLessThan(savedOrder.findIndex((piece) => piece.uid === 'overlap'))
      expect(savedLoad.boardHexes).toEqual(supportsFirstLoad.boardHexes)
      expect(savedLoad.boardPieces).toEqual(supportsFirstLoad.boardPieces)
      expect(measuredDerived).toEqual({
        conflicts: supportKind === 'surface' ? [] : ['overlap', 'target'],
        unsupported: [],
      })
      expect(measuredDerived).toEqual(
        derivedLists(supportsFirstLoad.boardPieces),
      )
      expectSaveReloadStable(savedLoad)
    },
  )

  it('keeps the listed ladder control after its support and overlapping surface', () => {
    const anchor = makeTable().center
    const floor = makePiece('floor', Pieces.grass1, anchor, 0, 0)
    const upperSurface = makePiece('upper', Pieces.grass1, anchor, 0, 1)
    const ladder = makePiece('ladder', Pieces.ladder, anchor, 0, 1)
    const savedOrder = [ladder, upperSurface, floor]
    const supportsFirst = [floor, upperSurface, ladder]
    const savedLoad = load(savedOrder)
    const supportsFirstLoad = load(supportsFirst)
    const unsortedReplay = replayInArrayOrder(savedOrder)

    expect(savedLoad.boardHexes).toEqual(supportsFirstLoad.boardHexes)
    expect(savedLoad.boardPieces.map(({ uid }) => uid)).toEqual([
      'floor',
      'upper',
      'ladder',
    ])
    expect(hexAt(savedLoad, anchor, 2)?.terrain).toBe(
      piecesSoFar[Pieces.ladder]?.terrain,
    )
    expect(hexAt(unsortedReplay, anchor, 2)?.terrain).toBe(
      piecesSoFar[Pieces.grass1]?.terrain,
    )
    expect(unsortedReplay.boardHexes).not.toEqual(savedLoad.boardHexes)
    expect(derivedLists(savedLoad.boardPieces)).toEqual(
      derivedLists(supportsFirstLoad.boardPieces),
    )
    expectSaveReloadStable(savedLoad)
  })
})
