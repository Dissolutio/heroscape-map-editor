/**
 * Void and Pylons (community custom, VC): registry, VC gating helpers, pylon
 * ports, the Deflector Shield's support, preview and cells, and the Void
 * Mat's footprint, layer, selection, map fit and save/load.
 *
 * The VC setting at map load is a store test: vc-map-load.test.ts.
 */
import { describe, expect, it } from 'vitest'
import { getPossibleRotationsForPenMode } from '../controls/getPossibleRotationsForPenMode'
import { buildupJsonFileMap } from '../data/buildupMap'
import { trimAndNormalizeMap } from '../data/convertMapShape'
import { getMapTableFootprintCoords } from '../data/fitMapToPieces'
import { PEN_MODE_ACTION_TARGETS } from '../data/hotkeys'
import { nodeIdFromHexRotation } from '../data/hexGrid/edgesAndNodes'
import { getPieceFootprintCells } from '../data/hexGrid/pieceCells'
import { pieceCellDeclarations } from '../data/hexGrid/pieceFeatures'
import { isLaurAddonSupported } from '../data/laurAddonSupport'
import { getLaurAddonAllowedRotations } from '../data/laurAddonPlacement'
import { setInventories } from '../data/inventories'
import { terrainSetsByShortID } from '../data/terrainSets'
import { pieceGroups } from '../data/pieceGroups'
import { piecesSoFar } from '../data/pieces'
import { isPlacementBlocked, resolvePlacement } from '../data/placement'
import { getPlacementPreviewState } from '../data/placementPreview'
import {
  getPillarPorts,
  getPortAddonEnds,
  portAddons,
  portPillars,
} from '../data/portPieces'
import { rebuildBoardStateFromPieces } from '../data/rebuildBoardState'
import getPieceTemplateCoords from '../data/rotationTransforms'
import { getUnsupportedPieceUIDs } from '../data/unsupportedPieces'
import {
  VC_MAP_LOADED_MESSAGE,
  boardPiecesUseVC,
  isPieceOfferedForVC,
  isVCPieceID,
  isVCTerrainSetID,
} from '../data/vcContent'
import { findVoidMatAtTableHex, getVoidMatHexes } from '../data/voidMat'
import {
  isUndrawnExportPieceID,
  withoutUndrawnExportPieces,
} from '../pdf-svg-shared/undrawnExportPieces'
import {
  type BoardHex,
  type BoardPiece,
  type CubeCoordinate,
  type HexMap,
  HexTerrain,
  Pieces,
} from '../types'
import {
  HEX_DIRECTIONS,
  cubeToPixel,
  hexUtilsAdd,
  hexUtilsRotateAroundOrigin_000,
} from '../utils/hex-utils'
import { normalizeBoardPiecesWithDropped } from '../utils/map-utils'
import { getSetsToBuildMapCatalog } from '../utils/setsToBuildMap'
import { getTerrainSetsForEra } from '../utils/terrain-set-utils'
import { getObstacleSubstituteCandidates } from '../utils/adaptToCollection'
import {
  VOID_MAT_OUTLINE_AXIAL,
  buildVoidMatGeometryArrays,
  voidMatPoint,
  voidMatUV,
} from '../world/models/voidMatGeometry'
import { type Board, hexAt, makeTable, place } from './helpers/board'

const VC_IDS = [
  Pieces.voidMat,
  Pieces.twoWayPylon,
  Pieces.threeWayPylon,
  Pieces.deflectorShield,
]

const key = ({ q, r, s }: CubeCoordinate) => `${q},${r},${s}`
const sortKeys = (coords: CubeCoordinate[]) => coords.map(key).sort()

function bp(
  uid: string,
  inventoryID: string,
  pieceCoords: CubeCoordinate,
  rotation = 0,
  altitude = 0,
): BoardPiece {
  return { uid, inventoryID, pieceCoords, rotation, altitude }
}

/** Replay pieces on a bare table, as the app loads them. */
function conflictsOnTable(pieces: BoardPiece[], size = 15) {
  const table = makeTable(size)
  return rebuildBoardStateFromPieces(pieces, table.boardHexes)
    .conflictedPieceUIDs.slice()
    .sort()
}

function placeAll(board: Board, pieces: BoardPiece[]) {
  let next = board
  for (const piece of pieces) {
    const placed = place({
      board: next,
      pieceID: piece.inventoryID,
      at: piece.pieceCoords,
      altitude: piece.altitude,
      rotation: piece.rotation,
      uid: piece.uid,
      permissive: true,
    })
    next = placed.board
  }
  return next
}

const pylonHit = (piece: BoardPiece): BoardHex =>
  ({
    ...piece.pieceCoords,
    boardPieceUID: piece.uid,
    altitude: piece.altitude,
    inventoryID: piece.inventoryID,
    pieceID: '',
    pieceRotation: piece.rotation,
    terrain: HexTerrain.voidPylon,
  }) as BoardHex

// Two Two-Way Pylons at rotation 0 (ports north and south), the second two
// rows south of the first, and a shield from the first's south port.
const A: CubeCoordinate = { q: 4, r: 3, s: -7 }
const B = hexUtilsAdd(hexUtilsAdd(A, HEX_DIRECTIONS[1]), HEX_DIRECTIONS[2])
const pylonA = bp('pylon-a', Pieces.twoWayPylon, A)
const pylonB = bp('pylon-b', Pieces.twoWayPylon, B)
const shield = bp('shield', Pieces.deflectorShield, A, 1.5)

describe('Void and Pylons registry', () => {
  it('registers the four pieces with their terrains, heights and templates', () => {
    expect(VC_IDS).toEqual(['vc1', 'vc2', 'vc3', 'vc4'])
    expect(
      VC_IDS.map((id) => {
        const piece = piecesSoFar[id]
        return [id, piece.title, piece.terrain, piece.height, piece.size]
      }),
    ).toEqual([
      ['vc1', 'Void Mat', HexTerrain.voidMat, 0, 14],
      ['vc2', 'Two-Way Pylon', HexTerrain.voidPylon, 8, 1],
      ['vc3', 'Three-Way Pylon', HexTerrain.voidPylon, 8, 1],
      ['vc4', 'Deflector Shield', HexTerrain.deflectorShield, 8, 1],
    ])
    expect(piecesSoFar[Pieces.twoWayPylon].isObstaclePiece).toBe(true)
    expect(piecesSoFar[Pieces.threeWayPylon].isObstaclePiece).toBe(true)
    expect(piecesSoFar[Pieces.deflectorShield].isObstaclePiece).toBe(false)
    expect(piecesSoFar[Pieces.voidMat].isObstaclePiece).toBe(false)
  })

  it('registers the Void and Pylons set, flagged VC, with its counts', () => {
    const set = terrainSetsByShortID.FF
    expect(set.name).toBe('Void and Pylons')
    expect(set.isVC).toBe(true)
    expect(set.inventory).toEqual({
      [Pieces.voidMat]: 10,
      [Pieces.threeWayPylon]: 6,
      [Pieces.twoWayPylon]: 4,
      [Pieces.deflectorShield]: 10,
    })
    expect(set.inventory).toBe(setInventories.voidAndPylonsPieceSet)
    expect(isVCTerrainSetID('FF')).toBe(true)
    expect(
      Object.values(terrainSetsByShortID)
        .filter((candidate) => candidate.id !== 'FF')
        .every((candidate) => !isVCTerrainSetID(candidate.id)),
    ).toBe(true)
  })

  it('derives VC pieces from the set flag alone', () => {
    for (const id of VC_IDS) expect(isVCPieceID(id), id).toBe(true)
    for (const id of Object.keys(piecesSoFar).filter(
      (candidate) => !VC_IDS.includes(candidate),
    )) {
      expect(isVCPieceID(id), id).toBe(false)
    }
  })

  it('declares the pylons as port pillars and the shield as a long add-on', () => {
    expect(portPillars[Pieces.twoWayPylon]).toEqual({
      family: 'void',
      ports: [1.5, 4.5],
      rotations: 'whole-step',
    })
    expect(portPillars[Pieces.threeWayPylon]).toEqual({
      family: 'void',
      ports: [0.5, 2.5, 4.5],
      rotations: 'whole-step',
    })
    expect(portAddons[Pieces.deflectorShield]).toEqual({
      family: 'void',
      span: 'long',
    })
    expect(getPossibleRotationsForPenMode(Pieces.twoWayPylon)).toEqual([
      0, 1, 2, 3, 4, 5,
    ])
    expect(getPossibleRotationsForPenMode(Pieces.threeWayPylon)).toEqual([
      0, 1, 2, 3, 4, 5,
    ])
    expect(getPossibleRotationsForPenMode(Pieces.deflectorShield)).toEqual([
      0.5, 1.5, 2.5, 3.5, 4.5, 5.5,
    ])
    expect(getPossibleRotationsForPenMode(Pieces.voidMat)).toEqual([
      0, 1, 2, 3, 4, 5,
    ])
  })

  it('leaves the four pieces out of 2D, SVG and PDF until phase 2', () => {
    for (const id of VC_IDS) expect(isUndrawnExportPieceID(id)).toBe(true)
    const board = placeAll(withTable(), [
      pylonA,
      pylonB,
      shield,
      bp('mat', Pieces.voidMat, A),
      bp('grass', Pieces.grass1, { q: 9, r: 9, s: -18 }),
    ])
    const drawn = withoutUndrawnExportPieces(
      board.boardHexes,
      board.boardPieces,
    )
    expect(drawn.boardPieces.map((piece) => piece.uid)).toEqual(['grass'])
    expect(
      Object.values(drawn.boardHexes).some((hex) =>
        isUndrawnExportPieceID(hex.inventoryID),
      ),
    ).toBe(false)
    // Nothing to leave out: the same objects, so memoized renders hold.
    const plain = placeAll(withTable(), [
      bp('grass', Pieces.grass1, { q: 9, r: 9, s: -18 }),
    ])
    const same = withoutUndrawnExportPieces(plain.boardHexes, plain.boardPieces)
    expect(same.boardHexes).toBe(plain.boardHexes)
    expect(same.boardPieces).toBe(plain.boardPieces)
  })
})

function withTable(size = 15): Board {
  const { boardHexes, boardPieces } = makeTable(size)
  return { boardHexes, boardPieces }
}

describe('VC gating (Include VC unit/terrain data off)', () => {
  it('offers no VC piece and no VC set with the setting off', () => {
    for (const id of VC_IDS) {
      expect(isPieceOfferedForVC(id, false)).toBe(false)
      expect(isPieceOfferedForVC(id, true)).toBe(true)
    }
    expect(isPieceOfferedForVC(Pieces.laurWallSquarePillar, false)).toBe(true)
    const setIDs = (include: boolean) =>
      [
        ...getTerrainSetsForEra('contemporary', include),
        ...getTerrainSetsForEra('classic', include),
      ].map((set) => set.id)
    expect(setIDs(false)).not.toContain('FF')
    expect(setIDs(true)).toContain('FF')
  })

  it('keeps the pieces in their own piece-grid group, without hotkeys', () => {
    expect(
      pieceGroups.find((group) => group.label === 'Void and Pylons')?.pieces,
    ).toEqual(VC_IDS)
    const otherGroups = pieceGroups.filter(
      (group) => group.label !== 'Void and Pylons',
    )
    for (const id of VC_IDS) {
      expect(otherGroups.some((group) => group.pieces.includes(id))).toBe(false)
    }
    // No hotkey selects a VC pen, so the hotkey lists never show one.
    for (const target of Object.values(PEN_MODE_ACTION_TARGETS)) {
      expect(isVCPieceID(target), target).toBe(false)
    }
  })

  it('leaves VC pieces and sets out of the Sets dialog with the setting off', () => {
    const pieces = [pylonA, pylonB, shield, bp('mat', Pieces.voidMat, A)]
    const off = getSetsToBuildMapCatalog(pieces, 50)
    const offText = JSON.stringify(off)
    for (const id of [...VC_IDS, 'FF']) {
      expect(offText).not.toContain(`"${id}"`)
    }
    const on = getSetsToBuildMapCatalog(pieces, 50, { includeVCContent: true })
    expect(on.notInAnySet).toEqual([])
    expect(
      on.categories.some((category) =>
        category.options.some((option) =>
          option.sets.some((set) => set.setID === 'FF'),
        ),
      ),
    ).toBe(true)
  })

  it('never offers a pylon to Adapt as a substitute for another obstacle', () => {
    const candidates = getObstacleSubstituteCandidates(
      Pieces.laurWallSquarePillar,
      { [Pieces.twoWayPylon]: 4, [Pieces.threeWayPylon]: 6 },
      [bp('pillar', Pieces.laurWallSquarePillar, A)],
    )
    expect(candidates.some((id) => isVCPieceID(id))).toBe(false)
  })

  it('knows when a map uses VC pieces', () => {
    expect(boardPiecesUseVC([pylonA])).toBe(true)
    expect(boardPiecesUseVC([bp('grass', Pieces.grass1, A)])).toBe(false)
    expect(VC_MAP_LOADED_MESSAGE).toBe(
      'This map uses community custom (VC) terrain, so Include VC unit/terrain data is now on.',
    )
  })
})

describe('pylon ports', () => {
  // Pen rotations: n faces side n (0 east, clockwise); n + 0.5 the vertex
  // between sides n and n + 1 (1.5 south, 4.5 north).
  const expected: Record<string, number[][]> = {
    [Pieces.twoWayPylon]: [
      [1.5, 4.5],
      [2.5, 5.5],
      [3.5, 0.5],
      [4.5, 1.5],
      [5.5, 2.5],
      [0.5, 3.5],
    ],
    [Pieces.threeWayPylon]: [
      [0.5, 2.5, 4.5],
      [1.5, 3.5, 5.5],
      [2.5, 4.5, 0.5],
      [3.5, 5.5, 1.5],
      [4.5, 0.5, 2.5],
      [5.5, 1.5, 3.5],
    ],
  }

  it.each(Object.keys(expected))(
    '%s ports face vertices at all 6 rotations',
    (pylonID) => {
      for (let rotation = 0; rotation < 6; rotation += 1) {
        expect(
          getPillarPorts(pylonID, rotation),
          `rotation ${rotation}`,
        ).toEqual(expected[pylonID][rotation])
      }
      // Vertices only; and no half-step pylon rotations.
      expect(getPillarPorts(pylonID, 0.5)).toEqual([])
    },
  )

  it('the Two-Way faces north and south, the Three-Way north, SE and SW', () => {
    // On screen (y down): a vertex at angle 30 * (2 * port) degrees from east.
    const angle = (port: number) => (port * 60 + 360) % 360
    expect(getPillarPorts(Pieces.twoWayPylon, 0).map(angle)).toEqual([90, 270])
    expect(getPillarPorts(Pieces.threeWayPylon, 0).map(angle)).toEqual([
      30, 150, 270,
    ])
  })
})

describe('Deflector Shield', () => {
  it('spans the Laur long-wall distance between facing pylon ports', () => {
    expect(getPortAddonEnds(shield)).toEqual([
      {
        coords: A,
        rotation: 1.5,
        featureId: nodeIdFromHexRotation(A, 1.5),
      },
      {
        coords: B,
        rotation: 4.5,
        featureId: nodeIdFromHexRotation(B, 4.5),
      },
    ])
    const a = cubeToPixel(A)
    const b = cubeToPixel(B)
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(3)
  })

  it('is supported between two facing ports, with no conflicts', () => {
    const board = { boardPieces: [pylonA, pylonB, shield] }
    expect(isLaurAddonSupported(board, shield)).toBe('supported')
    expect(getUnsupportedPieceUIDs({ ...board, boardHexes: {} })).toEqual([])
    expect(conflictsOnTable([pylonA, pylonB, shield])).toEqual([])
    // Order does not matter: the shield first, then its pylons.
    expect(conflictsOnTable([shield, pylonA, pylonB])).toEqual([])
  })

  it('is unsupported (amber) with one end free', () => {
    expect(
      getUnsupportedPieceUIDs({
        boardPieces: [pylonA, shield],
        boardHexes: {},
      }),
    ).toEqual(['shield'])
    // A pylon turned so no port faces the shield's end.
    const turned = { ...pylonB, rotation: 1 }
    expect(
      getUnsupportedPieceUIDs({
        boardPieces: [pylonA, turned, shield],
        boardHexes: {},
      }),
    ).toEqual(['shield'])
    // Ports at another altitude do not hold it either.
    expect(
      getUnsupportedPieceUIDs({
        boardPieces: [pylonA, { ...pylonB, altitude: 1 }, shield],
        boardHexes: {},
      }),
    ).toEqual(['shield'])
  })

  it('does not clip into Laur pillars, nor Laur walls into pylons', () => {
    const laurA = bp('laur-a', Pieces.laurWallSquarePillar, A, 0)
    const laurB = bp('laur-b', Pieces.laurWallSquarePillar, B, 0)
    expect(
      isLaurAddonSupported({ boardPieces: [laurA, laurB, shield] }, shield),
    ).toBe('unsupported')
    const laurLong = bp('long', Pieces.laurWallLong, A, 1.5)
    expect(
      isLaurAddonSupported(
        { boardPieces: [pylonA, pylonB, laurLong] },
        laurLong,
      ),
    ).toBe('unsupported')
  })

  it('preview offers only the port rotations of the hovered pylon', () => {
    for (const [pylonID, rotation] of [
      [Pieces.twoWayPylon, 0],
      [Pieces.twoWayPylon, 2],
      [Pieces.threeWayPylon, 0],
      [Pieces.threeWayPylon, 5],
    ] as const) {
      const hovered = bp('p', pylonID, A, rotation)
      expect(
        getLaurAddonAllowedRotations(Pieces.deflectorShield, pylonHit(hovered)),
      ).toEqual([...getPillarPorts(pylonID, rotation)].sort((x, y) => x - y))
    }
    // Over a Laur pillar it is not a port: every shield rotation stays.
    expect(
      getLaurAddonAllowedRotations(Pieces.deflectorShield, {
        inventoryID: Pieces.laurWallSquarePillar,
        pieceRotation: 0,
      }),
    ).toEqual([0.5, 1.5, 2.5, 3.5, 4.5, 5.5])
  })

  it('preview snaps to the port nearest the pointer and agrees with the replay', () => {
    const board = placeAll(withTable(), [pylonA, pylonB])
    const south = cubeToPixel(A)
    const worldPoint = { x: south.x, z: south.y + 0.9 }
    const preview = getPlacementPreviewState(
      piecesSoFar[Pieces.deflectorShield],
      pylonHit(pylonA),
      4.5,
      board,
      worldPoint,
    )
    expect(isPlacementBlocked(preview.resolution)).toBe(false)
    if (isPlacementBlocked(preview.resolution)) return
    expect(preview.resolution.rotation).toBe(1.5)
    expect(preview.resolution.altitude).toBe(0)
    expect(preview.evaluation.status).toBe('ok')
    expect(preview.unsupported).toBe(false)

    // The far port free: amber, still placeable.
    const lonely = placeAll(withTable(), [pylonA])
    const amber = getPlacementPreviewState(
      piecesSoFar[Pieces.deflectorShield],
      pylonHit(pylonA),
      1.5,
      lonely,
      worldPoint,
    )
    expect(amber.evaluation.status).toBe('ok')
    expect(amber.unsupported).toBe(true)
  })

  it('two shields on one port conflict', () => {
    const second = { ...shield, uid: 'shield-2' }
    expect(conflictsOnTable([pylonA, pylonB, shield, second])).toEqual([
      'shield',
      'shield-2',
    ])
    // Two shields on different ports of one pylon do not.
    const C = hexUtilsAdd(hexUtilsAdd(A, HEX_DIRECTIONS[4]), HEX_DIRECTIONS[5])
    const pylonC = bp('pylon-c', Pieces.twoWayPylon, C)
    const north = bp('shield-n', Pieces.deflectorShield, A, 4.5)
    expect(conflictsOnTable([pylonA, pylonB, pylonC, shield, north])).toEqual(
      [],
    )
  })

  it('conflicts with a land tile across its span at its levels', () => {
    // The hex east of A is one of the two the shield passes between.
    const between = hexUtilsAdd(A, HEX_DIRECTIONS[1])
    const grass = bp('grass', Pieces.grass1, between)
    expect(conflictsOnTable([pylonA, pylonB, shield, grass])).toEqual([
      'grass',
      'shield',
    ])
    expect(conflictsOnTable([grass, pylonA, pylonB, shield])).toEqual([
      'grass',
      'shield',
    ])
    // Below its levels (it stands on land at altitude 1 there): no conflict.
    const floor = [A, B, between, hexUtilsAdd(A, HEX_DIRECTIONS[2])].map(
      (coords, index) => bp(`floor-${index}`, Pieces.grass1, coords),
    )
    const raised = [pylonA, pylonB, shield].map((piece) => ({
      ...piece,
      altitude: 1,
    }))
    expect(conflictsOnTable([...floor, ...raised])).toEqual([])
  })

  it('fills its two port vertices and the edge between, at all rotations', () => {
    expect(pieceCellDeclarations[Pieces.deflectorShield]).toMatchObject({
      fills: 'edges-and-nodes',
      rotationOffset: 0.5,
    })
    for (const rotation of [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]) {
      const piece = bp('s', Pieces.deflectorShield, A, rotation, 2)
      const cells = getPieceFootprintCells(piece)
      const ends = getPortAddonEnds(piece) ?? []
      const direction = Math.floor(rotation)
      const sideA = hexUtilsAdd(A, HEX_DIRECTIONS[direction])
      const sideB = hexUtilsAdd(A, HEX_DIRECTIONS[(direction + 1) % 6])
      const edge = `edge:${sideA.q + sideB.q},${sideA.r + sideB.r},${sideA.s + sideB.s}`
      expect(cells.map((cell) => cell.cell).sort()).toEqual(
        [...ends.map((end) => end.featureId), edge].sort(),
      )
      for (const cell of cells) {
        expect([cell.bottom, cell.top]).toEqual([2, 10])
      }
    }
    expect(
      getPieceFootprintCells(bp('s', Pieces.deflectorShield, A, 1)),
    ).toEqual([])
  })

  it('pylons fill their hex center and the vertices their ports face', () => {
    for (const pylonID of [Pieces.twoWayPylon, Pieces.threeWayPylon]) {
      for (let rotation = 0; rotation < 6; rotation += 1) {
        const pylon = bp('p', pylonID, A, rotation)
        const cells = getPieceFootprintCells(pylon).map((cell) => cell.cell)
        expect(cells.sort()).toEqual(
          [
            `hex:${A.q},${A.r},${A.s}`,
            ...getPillarPorts(pylonID, rotation).map((port) =>
              nodeIdFromHexRotation(A, port),
            ),
          ].sort(),
        )
      }
    }
  })

  it('a shield through another pylon port (not its own) conflicts', () => {
    // A Three-Way in the hex east of A, turned so a port faces the shield's
    // anchor vertex: two tabs in one vertex.
    const between = hexUtilsAdd(A, HEX_DIRECTIONS[1])
    const intruder = bp('intruder', Pieces.threeWayPylon, between, 0)
    const anchorNode = nodeIdFromHexRotation(A, 1.5)
    const facing = [0, 1, 2, 3, 4, 5].find((rotation) =>
      getPillarPorts(Pieces.threeWayPylon, rotation).some(
        (port) => nodeIdFromHexRotation(between, port) === anchorNode,
      ),
    )
    expect(facing).toBeDefined()
    expect(
      conflictsOnTable([
        pylonA,
        pylonB,
        shield,
        { ...intruder, rotation: facing ?? 0 },
      ]),
    ).toEqual(['intruder', 'shield'])
  })
})

describe('Void Mat', () => {
  const MAT_TEMPLATE = [
    [0, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [-2, 2],
    [-1, 2],
    [0, 2],
    [1, 2],
    [-2, 3],
    [-1, 3],
    [0, 3],
    [-2, 4],
    [-1, 4],
  ].map(([q, r]) => ({ q, r, s: -q - r }))
  const origin: CubeCoordinate = { q: 5, r: 3, s: -8 }
  const mat = bp('mat', Pieces.voidMat, origin)

  it('its template is the 14 hexes, at all 6 rotations', () => {
    for (let rotation = 0; rotation < 6; rotation += 1) {
      const coords = getPieceTemplateCoords({
        clickedHex: origin,
        rotation,
        template: Pieces.voidMat,
        isVsTile: false,
      })
      expect(coords).toHaveLength(14)
      expect(sortKeys(coords)).toEqual(
        sortKeys(
          MAT_TEMPLATE.map((offset) =>
            hexUtilsAdd(
              origin,
              hexUtilsRotateAroundOrigin_000(offset, rotation),
            ),
          ),
        ),
      )
    }
    // In John's order, origin first.
    expect(
      getPieceTemplateCoords({
        clickedHex: { q: 0, r: 0, s: 0 },
        rotation: 0,
        template: Pieces.voidMat,
        isVsTile: false,
      }).map(key),
    ).toEqual(MAT_TEMPLATE.map(key))
  })

  it('places on level 0 wherever the pointer is', () => {
    const board = placeAll(withTable(), [bp('grass', Pieces.grass1, origin)])
    const grassCap = hexAt(board, origin, 1)
    if (!grassCap) throw new Error('missing grass cap')
    const resolution = resolvePlacement(
      piecesSoFar[Pieces.voidMat],
      grassCap,
      2,
      board,
    )
    expect(isPlacementBlocked(resolution)).toBe(false)
    if (isPlacementBlocked(resolution)) return
    expect(resolution).toMatchObject({
      coords: origin,
      altitude: 0,
      rotation: 2,
      rule: 'voidMat',
    })
  })

  it('is a board piece only: no hexes, no cells', () => {
    const board = placeAll(withTable(), [mat])
    expect(board.boardPieces).toEqual([mat])
    expect(
      Object.values(board.boardHexes).some(
        (hex) => hex.boardPieceUID === 'mat',
      ),
    ).toBe(false)
    expect(pieceCellDeclarations[Pieces.voidMat]).toBeUndefined()
  })

  it('overlaps another mat with no conflict', () => {
    const other = bp(
      'mat-2',
      Pieces.voidMat,
      hexUtilsAdd(origin, HEX_DIRECTIONS[0]),
      3,
    )
    expect(conflictsOnTable([mat, other, { ...mat, uid: 'mat-3' }])).toEqual([])
  })

  it('takes land at altitude 0 with no conflict, before or after it', () => {
    const grass = getVoidMatHexes(mat).map((coords, index) =>
      bp(`grass-${index}`, Pieces.grass1, coords),
    )
    expect(conflictsOnTable([mat, ...grass])).toEqual([])
    expect(conflictsOnTable([...grass, mat])).toEqual([])
    // and the land stands on the table, as on a bare table
    const board = placeAll(withTable(), [mat, ...grass])
    expect(hexAt(board, origin, 1)?.terrain).toBe(HexTerrain.grass)
  })

  it('takes pylons and a shield on it', () => {
    const onMat = [pylonA, pylonB, shield]
    const under = bp('mat-under', Pieces.voidMat, A)
    expect(conflictsOnTable([under, ...onMat])).toEqual([])
    expect(
      getUnsupportedPieceUIDs({
        boardPieces: [under, ...onMat],
        boardHexes: {},
      }),
    ).toEqual([])
  })

  it('a click on a table hex selects it only when nothing else is there', () => {
    const inside = getVoidMatHexes(mat)[5]
    const outside = hexUtilsAdd(origin, { q: 0, r: -2, s: 2 })
    const board = placeAll(withTable(), [mat])
    expect(
      findVoidMatAtTableHex(board.boardPieces, board.boardHexes, inside)?.uid,
    ).toBe('mat')
    expect(
      findVoidMatAtTableHex(board.boardPieces, board.boardHexes, outside),
    ).toBeUndefined()
    // The topmost (last placed) of two overlapping mats.
    const two = placeAll(board, [{ ...mat, uid: 'mat-top' }])
    expect(
      findVoidMatAtTableHex(two.boardPieces, two.boardHexes, inside)?.uid,
    ).toBe('mat-top')
    // A piece standing there takes the click.
    const covered = placeAll(board, [bp('pylon', Pieces.twoWayPylon, inside)])
    expect(
      findVoidMatAtTableHex(covered.boardPieces, covered.boardHexes, inside),
    ).toBeUndefined()
  })

  it('map fit, Trim and Convert count only its 14 hexes', () => {
    const hexMap: HexMap = {
      id: 'mat',
      name: 'Mat',
      author: '',
      version: 1,
      shape: 'rectangle',
      width: 20,
      length: 20,
    }
    const footprint = getMapTableFootprintCoords(hexMap, [mat])
    expect(sortKeys(footprint)).toEqual(sortKeys(getVoidMatHexes(mat)))

    // Trimmed, a mat needs exactly the table 14 single tiles on its hexes do.
    const tiles = getVoidMatHexes(mat).map((coords, index) =>
      bp(`g${index}`, Pieces.grass1, coords),
    )
    const trimmedMat = trimAndNormalizeMap(hexMap, [mat])
    const trimmedTiles = trimAndNormalizeMap(hexMap, tiles)
    expect(trimmedMat.ok && trimmedTiles.ok).toBe(true)
    if (!trimmedMat.ok || !trimmedTiles.ok) return
    expect([trimmedMat.hexMap.width, trimmedMat.hexMap.length]).toEqual([
      trimmedTiles.hexMap.width,
      trimmedTiles.hexMap.length,
    ])
    expect(trimmedMat.hexMap.length).toBe(5)
  })

  it('round-trips through save and load', () => {
    const hexMap: HexMap = {
      id: 'mat-save',
      name: 'Mat save',
      author: '',
      version: 1,
      shape: 'rectangle',
      width: 15,
      length: 15,
    }
    const pieces = [mat, pylonA, pylonB, shield]
    const saved = JSON.parse(JSON.stringify({ hexMap, boardPieces: pieces }))
    const normalized = normalizeBoardPiecesWithDropped(saved.boardPieces)
    expect(normalized.droppedPieces).toEqual([])
    const loaded = buildupJsonFileMap(
      normalized.boardPieces,
      saved.hexMap,
      normalized.droppedPieces,
    )
    expect(loaded.droppedPieces).toEqual([])
    expect(loaded.boardPieces).toEqual(pieces)
    const again = buildupJsonFileMap(
      JSON.parse(JSON.stringify(loaded.boardPieces)),
      loaded.hexMap,
    )
    expect(again.boardPieces).toEqual(loaded.boardPieces)
    expect(again.boardHexes).toEqual(loaded.boardHexes)
  })

  it('draws the printed ring around its 14 hexes, textured to line up', () => {
    // Every template hex center lies inside the outline.
    const outline = VOID_MAT_OUTLINE_AXIAL.map(([q, r]) => voidMatPoint(q, r))
    const inside = ([x, z]: [number, number]) =>
      outline.every(([x1, z1], index) => {
        const [x2, z2] = outline[(index + 1) % outline.length]
        return (x2 - x1) * (z - z1) - (z2 - z1) * (x - x1) > 0
      })
    for (const { q, r } of MAT_TEMPLATE) {
      expect(inside(voidMatPoint(q, r)), `${q},${r}`).toBe(true)
    }
    // The outline corners are the trimmed image's edges: the left edge
    // through two corners, the right edge through two, the top and bottom
    // corners at v = 1 and v = 0.
    const uvs = VOID_MAT_OUTLINE_AXIAL.map(([q, r]) => voidMatUV(q, r))
    const near = (value: number, target: number) =>
      Math.abs(value - target) < 1e-9
    expect(uvs.filter(([u]) => near(u, 0))).toHaveLength(2)
    expect(uvs.filter(([u]) => near(u, 1))).toHaveLength(2)
    expect(uvs.filter(([, v]) => near(v, 1))).toHaveLength(1)
    expect(uvs.filter(([, v]) => near(v, 0))).toHaveLength(1)
    // The texture keeps the printed hexes' shape: one world unit is the
    // same length in u and v.
    const [u0, v0] = voidMatUV(0, 0)
    const [u1, v1] = voidMatUV(1, 0)
    const [x0, z0] = voidMatPoint(0, 0)
    const [x1, z1] = voidMatPoint(1, 0)
    expect(
      Math.hypot((u1 - u0) * 7.5, (v1 - v0) * 5.5 * Math.sqrt(3)),
    ).toBeCloseTo(Math.hypot(x1 - x0, z1 - z0))
    // A flat fan facing up.
    const { positions, indices } = buildVoidMatGeometryArrays()
    expect(indices).toHaveLength(18)
    for (let index = 0; index < indices.length; index += 3) {
      const [a, b, c] = indices
        .slice(index, index + 3)
        .map((vertex) => [positions[vertex * 3], positions[vertex * 3 + 2]])
      const normalY =
        (b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1])
      expect(normalY).toBeGreaterThan(0)
    }
  })

  it('rotates in 3D the way its template rotates', () => {
    // MapBoardPiece3D turns the mat by rotation * -60 degrees about y, which
    // maps world (x, z) by +60 degrees per step on screen.
    for (let rotation = 0; rotation < 6; rotation += 1) {
      const angle = (rotation * Math.PI) / 3
      for (const offset of MAT_TEMPLATE) {
        const [x, z] = voidMatPoint(offset.q, offset.r)
        const turned = cubeToPixel(
          hexUtilsRotateAroundOrigin_000(offset, rotation),
        )
        expect(x * Math.cos(angle) - z * Math.sin(angle)).toBeCloseTo(turned.x)
        expect(x * Math.sin(angle) + z * Math.cos(angle)).toBeCloseTo(turned.y)
      }
    }
  })
})
