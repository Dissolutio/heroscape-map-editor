/**
 * EDGE/NODE CELLS (data/hexGrid/pieceCells.ts)
 *
 * The Fortified Wall and Ruins 2/3 stand between hexes, on edges and nodes.
 * Every piece fills cells (hex interior, edge, node) over level ranges, and
 * two pieces conflict when they fill the same cell at an overlapping level.
 * Undeclared pieces fill the hex cell, 6 edges and 6 nodes of every hex they
 * write; the walls fill only their footprint's edges and nodes (derived from
 * the 3D models, src/data/hexGrid/wallFootprints.ts); the Cannon fills only
 * its hex cell.
 *
 * Wall at origin O, rotation 0 (see wallFootprints.ts for the diagram):
 * - FW at O+(-2,1) shares edge:-2,1,1 with it (two walls end to end);
 * - FW at O+SE (0,1) shares three template hexes but no cell.
 */
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import {
  hexesForEdge,
  hexesForNode,
  type HexEdgeId,
  type HexNodeId,
} from '../data/hexGrid/edgesAndNodes'
import {
  getEdgeNodePieceCells,
  getEdgeNodePieceColumns,
  isEdgeNodePieceID,
  isHexCenterPieceID,
} from '../data/hexGrid/pieceCells'
import { pieceCellDeclarations } from '../data/hexGrid/pieceFeatures'
import { wallFootprints } from '../data/hexGrid/wallFootprints'
import { piecesSoFar } from '../data/pieces'
import { getPlacementPreviewState } from '../data/placementPreview'
import {
  computeConflictedPieceUIDs,
  rebuildBoardStateFromPieces,
} from '../data/rebuildBoardState'
import { getSmartPlacementAltitude } from '../data/smartPlacement'
import {
  type BoardPiece,
  type CubeCoordinate,
  type HexMap,
  Pieces,
} from '../types'
import { hexUtilsAdd, hexUtilsRotateAroundOrigin_000 } from '../utils/hex-utils'
import fortifiedWallsAndRuins from './fixtures/fortified-walls-and-ruins.json'
import twinIronsDockyard from './fixtures/twin-irons-dockyard.json'
import {
  type Board,
  hexAt,
  makeTable,
  place,
  withGrassFloor,
} from './helpers/board'

const floor = withGrassFloor(makeTable())
const O = floor.center
const at = (q: number, r: number): CubeCoordinate =>
  hexUtilsAdd(O, { q, r, s: -q - r })
const SE = at(0, 1)
const WEST2 = at(-2, 1)

const bp = (
  uid: string,
  inventoryID: string,
  coords: CubeCoordinate,
  altitude = 1,
  rotation = 0,
): BoardPiece => ({ uid, inventoryID, altitude, rotation, pieceCoords: coords })

const floorPieces = floor.boardPieces
/** Replay the grass floor plus `pieces`; the conflicted uids, sorted. */
const conflictsOn = (...pieces: BoardPiece[]) =>
  computeConflictedPieceUIDs([...floorPieces, ...pieces]).sort()

const loadFixture = (fixture: { hexMap: unknown; boardPieces: unknown }) => {
  const map = buildupJsonFileMap(
    fixture.boardPieces as BoardPiece[],
    fixture.hexMap as HexMap,
  )
  return { map, conflicted: computeConflictedPieceUIDs(map.boardPieces) }
}

describe('fixture maps John built physically', () => {
  it('fortified-walls-and-ruins loads with zero conflicted pieces', () => {
    const { map, conflicted } = loadFixture(fortifiedWallsAndRuins)
    expect(map.droppedPieces).toEqual([])
    expect(map.boardPieces).toHaveLength(14)
    expect(conflicted).toEqual([])
  })

  /*
   * KNOWN GAP: the dockyard still reports its two Fortified Wall / Ship Wall
   * pairs. The Ship Wall is undeclared, so by default it fills all 6 edges
   * and 6 nodes of its 4 hexes. Each Ship Wall runs along a row whose lower
   * edges carry a Fortified Wall, and its knub hex is the Fortified Wall's
   * origin hex, so they share edges and nodes at levels 2-9. On the table
   * they fit, so the Ship Wall's declaration is what is wrong. Fix: declare
   * the Ship Wall (its own footprint, or hex-center) in pieceCellDeclarations
   * once John confirms its base; then change this to `it` and drop the pin
   * below.
   */
  it.fails('KNOWN GAP: twin-irons-dockyard loads with zero conflicted pieces', () => {
    expect(loadFixture(twinIronsDockyard).conflicted).toEqual([])
  })

  it('twin-irons-dockyard: only the Fortified Wall / Ship Wall pairs remain (the Cannons are clear)', () => {
    const { map, conflicted } = loadFixture(twinIronsDockyard)
    expect(map.droppedPieces).toEqual([])
    const conflictedIDs = conflicted
      .map(
        (uid) =>
          map.boardPieces.find((piece) => piece.uid === uid)?.inventoryID,
      )
      .sort()
    expect(conflictedIDs).toEqual([
      Pieces.fortifiedWall,
      Pieces.fortifiedWall,
      Pieces.shipWall,
      Pieces.shipWall,
    ])
  })
})

describe('the cell rule', () => {
  it('two Fortified Walls sharing an edge at overlapping levels conflict', () => {
    expect(
      conflictsOn(
        bp('wall', Pieces.fortifiedWall, O),
        bp('next', Pieces.fortifiedWall, WEST2),
      ),
    ).toEqual(['next', 'wall'])
  })

  it('two walls in the same hexes but on different edges do not conflict', () => {
    expect(
      conflictsOn(
        bp('wall', Pieces.fortifiedWall, O),
        bp('beside', Pieces.fortifiedWall, SE),
      ),
    ).toEqual([])
    expect(
      conflictsOn(
        bp('wall', Pieces.fortifiedWall, O),
        bp('ruin', Pieces.ruins2, at(-2, 1)),
      ),
    ).toEqual([])
  })

  it('a wall above or below another does not conflict; overlapping levels do', () => {
    // The Fortified Wall stands 8 levels: at altitude 1 it fills [1, 9).
    expect(
      conflictsOn(
        bp('lower', Pieces.fortifiedWall, O, 1),
        bp('upper', Pieces.fortifiedWall, O, 9),
      ),
    ).toEqual([])
    expect(
      conflictsOn(
        bp('lower', Pieces.fortifiedWall, O, 1),
        bp('upper', Pieces.fortifiedWall, O, 8),
      ),
    ).toEqual(['lower', 'upper'])
  })

  it('a land tile at the wall level, in a hex next to the wall edge, conflicts', () => {
    expect(
      conflictsOn(bp('wall', Pieces.fortifiedWall, O), bp('land', 'g1', SE)),
    ).toEqual(['land', 'wall'])
    // in either order
    expect(
      conflictsOn(bp('land', 'g1', SE), bp('wall', Pieces.fortifiedWall, O)),
    ).toEqual(['land', 'wall'])
    // a hex outside the template that only shares the wall's end node
    expect(
      conflictsOn(
        bp('wall', Pieces.fortifiedWall, O),
        bp('land', 'g1', at(-2, 0)),
      ),
    ).toEqual(['land', 'wall'])
  })

  it('land under the wall, or above its top, does not conflict', () => {
    expect(conflictsOn(bp('wall', Pieces.fortifiedWall, O))).toEqual([])
    // placed at altitude 9, the tile is the hex at 10 and fills [9, 10)
    expect(
      conflictsOn(bp('wall', Pieces.fortifiedWall, O), bp('high', 'g1', SE, 9)),
    ).toEqual([])
  })

  it('a cannon in a hex next to the wall edge does not conflict', () => {
    expect(
      conflictsOn(bp('wall', Pieces.fortifiedWall, O), bp('cannon', 'cn', SE)),
    ).toEqual([])
    expect(
      conflictsOn(bp('cannon', 'cn', SE), bp('wall', Pieces.ruins2, at(1, 0))),
    ).toEqual([])
    // but it still conflicts with land in its own hex, as before
    expect(conflictsOn(bp('cannon', 'cn', SE), bp('land', 'g1', SE))).toEqual([
      'cannon',
      'land',
    ])
  })

  it('a ship wall or tree beside the wall: the default (all 6 edges and nodes) conflicts', () => {
    expect(
      conflictsOn(
        bp('wall', Pieces.fortifiedWall, O),
        bp('ship', Pieces.shipWall, SE),
      ),
    ).toEqual(['ship', 'wall'])
    expect(
      conflictsOn(bp('wall', Pieces.fortifiedWall, O), bp('tree', 'tr10', SE)),
    ).toEqual(['tree', 'wall'])
  })

  it("a wall's hexes never take a hex from another piece", () => {
    const board = place({
      board: floor,
      pieceID: 'cn',
      at: O,
      altitude: 1,
      uid: 'cannon',
    }).board
    const walled = place({
      board,
      pieceID: Pieces.fortifiedWall,
      at: O,
      altitude: 1,
      uid: 'wall',
      permissive: true,
    })
    expect(walled.displacedUIDs).toEqual([])
    expect(hexAt(walled.board, O, 2)?.boardPieceUID).toBe('cannon')
  })
})

describe('the declarations', () => {
  it('declares the three walls as edges-and-nodes and only the Cannon as hex-center', () => {
    expect(
      Object.entries(pieceCellDeclarations)
        .map(([id, declaration]) => `${id}:${declaration.fills}`)
        .sort(),
    ).toEqual([
      'cn:hex-center',
      'fw:edges-and-nodes',
      'rs2:edges-and-nodes',
      'rs3:edges-and-nodes',
    ])
    for (const id of Object.keys(pieceCellDeclarations)) {
      expect(piecesSoFar[id], id).toBeDefined()
    }
    expect(isEdgeNodePieceID(Pieces.fortifiedWall)).toBe(true)
    expect(isEdgeNodePieceID('g1')).toBe(false)
    expect(isHexCenterPieceID(Pieces.cannon)).toBe(true)
  })
})

describe('footprints', () => {
  const walls = [Pieces.fortifiedWall, Pieces.ruins2, Pieces.ruins3]
  const origin = { q: 0, r: 0, s: 0 }
  const cellsAt = (inventoryID: string, rotation: number, altitude = 0) =>
    getEdgeNodePieceCells({
      inventoryID,
      pieceCoords: origin,
      rotation,
      altitude,
    })
  const touching = (cell: string) =>
    (cell.startsWith('edge:')
      ? hexesForEdge(cell as HexEdgeId)
      : hexesForNode(cell as HexNodeId)
    )
      .map(({ q, r, s }) => `${q + 0},${r + 0},${s + 0}`)
      .sort()

  it.each(walls)('%s at rotation 0 matches the table', (inventoryID) => {
    expect(
      Object.fromEntries(
        cellsAt(inventoryID, 0).map(({ cell, bottom, top }) => [
          cell,
          [bottom, top],
        ]),
      ),
    ).toEqual(
      Object.fromEntries(
        Object.entries(wallFootprints[inventoryID]).map(([cell, levels]) => [
          cell,
          [0, levels],
        ]),
      ),
    )
  })

  it('the tables are the derived shapes', () => {
    const summary = (inventoryID: string) => {
      const cells = Object.keys(wallFootprints[inventoryID])
      return {
        edges: cells.filter((cell) => cell.startsWith('edge:')).length,
        nodes: cells.filter((cell) => cell.startsWith('node:')).length,
        tallest: Math.max(
          ...Object.values(wallFootprints[inventoryID]).map(Number),
        ),
      }
    }
    expect(summary(Pieces.fortifiedWall)).toEqual({
      edges: 7,
      nodes: 8,
      tallest: 8,
    })
    expect(summary(Pieces.ruins2)).toEqual({ edges: 5, nodes: 6, tallest: 10 })
    expect(summary(Pieces.ruins3)).toEqual({ edges: 7, nodes: 8, tallest: 10 })
  })

  it.each(walls)(
    '%s at each of the 6 rotations is the rotation-0 table, rotated',
    (inventoryID) => {
      const base = cellsAt(inventoryID, 0)
      for (let rotation = 0; rotation < 6; rotation++) {
        const rotated = cellsAt(inventoryID, rotation)
        expect(rotated).toHaveLength(base.length)
        // Rotating a cell rotates the hexes it borders (checked through the
        // hexes, not the scaled ids the code rotates).
        expect(
          rotated.map(({ cell, bottom, top }) => ({
            hexes: touching(cell),
            bottom,
            top,
          })),
        ).toEqual(
          base.map(({ cell, bottom, top }) => ({
            hexes: touching(cell)
              .map((key) => {
                const [q, r, s] = key.split(',').map(Number)
                const hex = hexUtilsRotateAroundOrigin_000(
                  { q, r, s },
                  rotation,
                )
                return `${hex.q + 0},${hex.r + 0},${hex.s + 0}`
              })
              .sort(),
            bottom,
            top,
          })),
        )
      }
    },
  )

  it('cells follow the piece origin and altitude', () => {
    const moved = getEdgeNodePieceCells({
      inventoryID: Pieces.fortifiedWall,
      pieceCoords: { q: 2, r: -1, s: -1 },
      rotation: 0,
      altitude: 3,
    })
    expect(moved.map(({ cell }) => cell)).toContain('edge:5,-2,-3') // 2*(2,-1,-1) + (1,0,-1)
    expect(moved.every(({ bottom, top }) => bottom === 3 && top === 11)).toBe(
      true,
    )
  })

  it('a wall borders the hexes of its template, plus the hexes at its two ends', () => {
    const columns = getEdgeNodePieceColumns({
      inventoryID: Pieces.fortifiedWall,
      pieceCoords: origin,
      rotation: 0,
      altitude: 0,
    })
    expect(columns).toHaveLength(10)
  })
})

describe('the same rule in previews and smart placement', () => {
  const walled: Board = place({
    board: floor,
    pieceID: Pieces.fortifiedWall,
    at: O,
    altitude: 1,
    uid: 'wall',
  }).board
  const pointerAt = (coords: CubeCoordinate) => {
    const hex = hexAt(walled, coords, 1)
    if (!hex) throw new Error('no floor hex')
    return hex
  }

  it('hovering a Fortified Wall beside a wall that shares no cell shows ok', () => {
    const preview = getPlacementPreviewState(
      piecesSoFar[Pieces.fortifiedWall],
      pointerAt(SE),
      0,
      walled,
    )
    expect(preview.evaluation.status).toBe('ok')
  })

  it('hovering a Fortified Wall that shares an edge shows conflict', () => {
    const preview = getPlacementPreviewState(
      piecesSoFar[Pieces.fortifiedWall],
      pointerAt(WEST2),
      0,
      walled,
    )
    expect(preview.evaluation.status).toBe('conflict')
    expect(preview.evaluation.displacedUIDs).toEqual(['wall'])
  })

  it('hovering land or a cannon next to the wall edge', () => {
    expect(
      getPlacementPreviewState(piecesSoFar.g1, pointerAt(SE), 0, walled)
        .evaluation.status,
    ).toBe('conflict')
    expect(
      getPlacementPreviewState(piecesSoFar.cn, pointerAt(SE), 0, walled)
        .evaluation.status,
    ).toBe('ok')
  })

  it('smart placement does not settle on a level that shares a wall cell', () => {
    // A g2 from SE (borders the wall) to SE+east (does not), over a raised
    // g1 on SE+east: level 2 is clean by hexes alone, but at SE it would
    // stand in the wall's edges.
    const raised = place({
      board: walled,
      pieceID: 'g1',
      at: at(1, 1),
      altitude: 1,
      uid: 'raised',
    }).board
    const altitude = (boardPieces: Board['boardPieces']) =>
      getSmartPlacementAltitude({
        boardHexes: raised.boardHexes,
        boardPieces,
        piece: piecesSoFar.g2,
        pieceCoords: SE,
        altitude: 1,
        rotation: 0,
      })
    expect(altitude([])).toBe(2)
    // No level is clean: it keeps the hovered level, as it always does then.
    expect(altitude(raised.boardPieces)).toBe(1)
  })
})

describe('replay', () => {
  it('a fresh replay of a board with walls gives the same boardHexes as placing one at a time', () => {
    const pieces = [
      ...floorPieces,
      bp('wall', Pieces.fortifiedWall, O),
      bp('beside', Pieces.fortifiedWall, SE),
      bp('cannon', 'cn', at(1, 1)),
      bp('ruin', Pieces.ruins3, at(-3, 4), 1, 2),
      bp('land', 'g1', at(-2, 0)),
    ]
    let board: Board = { boardHexes: makeTable().boardHexes, boardPieces: [] }
    for (const piece of pieces) {
      board = place({
        board,
        pieceID: piece.inventoryID,
        at: piece.pieceCoords,
        altitude: piece.altitude,
        rotation: piece.rotation,
        uid: piece.uid,
        permissive: true,
      }).board
    }
    const replayed = rebuildBoardStateFromPieces(pieces, makeTable().boardHexes)
    expect(replayed.boardHexes).toEqual(board.boardHexes)
    expect(replayed.conflictedPieceUIDs.sort()).toEqual(['land', 'wall'])
  })
})
