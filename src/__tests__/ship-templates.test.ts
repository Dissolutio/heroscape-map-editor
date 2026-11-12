/**
 * SHIP TEMPLATES: the vertical obstruction ranges, the Ship Wall and Ship Bow
 * footprints, and the rule that ships ignore fluid drop and need no support.
 * Levels are counted from the piece's own level as level 1.
 */
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { piecesSoFar } from '../data/pieces'
import getPieceTemplateCoords from '../data/rotationTransforms'
import {
  getObstructedLevelOffsets,
  getTemplateTopLevel,
  verticalObstructionTemplates,
} from '../data/vertical-obstruction-templates'
import { Pieces } from '../types'
import { getShipPlacementAltitude } from '../utils/board-utils'
import {
  hexAt,
  makeTable,
  place,
  remove,
  withGrassFloor,
} from './helpers/board'
import { getActiveDeckSection } from '../world/models/shipDeckColor'

const SUPPORT = 1 // the grass floor's cap; the ship's own level is the next one up
const OWN = SUPPORT + 1
const at = (board: ReturnType<typeof makeTable>) => board.center
const footprint = (
  pieceID: string,
  center: { q: number; r: number; s: number },
) =>
  getPieceTemplateCoords({
    clickedHex: center,
    rotation: 0,
    template: piecesSoFar[pieceID].template,
    isVsTile: false,
  })

describe('getObstructedLevelOffsets', () => {
  it('a number blocks levels 1..n (offsets 0..n-1)', () => {
    expect(getObstructedLevelOffsets(3)).toEqual([0, 1, 2])
    expect(getObstructedLevelOffsets(1)).toEqual([0])
  })
  it('a range blocks from..to inclusive, 1-based', () => {
    expect(getObstructedLevelOffsets({ from: 3, to: 13 })).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ])
    expect(getObstructedLevelOffsets({ from: 1, to: 2 })).toEqual([0, 1])
  })
  it('every ship template hex has a whole, positive entry', () => {
    for (const id of [Pieces.shipWall, Pieces.shipBow]) {
      for (const entry of verticalObstructionTemplates[id]) {
        for (const offset of getObstructedLevelOffsets(entry)) {
          expect(Number.isInteger(offset) && offset >= 0).toBe(true)
        }
      }
    }
    expect(getTemplateTopLevel(Pieces.shipBow)).toBe(13)
  })
})

describe('Ship Wall', () => {
  it('has a footprint of 4 hexes and a size that matches', () => {
    const t = makeTable()
    expect(footprint(Pieces.shipWall, at(t))).toHaveLength(4)
    expect(piecesSoFar[Pieces.shipWall].size).toBe(4)
  })
  it('blocks levels 1-10 on the first 3 hexes and only level 1 on the 4th', () => {
    const t = withGrassFloor(makeTable())
    const placed = place({
      board: t,
      pieceID: Pieces.shipWall,
      at: at(t),
      altitude: SUPPORT,
    })
    expect(placed.error).toBeUndefined()
    const cells = footprint(Pieces.shipWall, at(t))
    cells.forEach((cell, i) => {
      const top = i < 3 ? 10 : 1
      for (let level = 1; level <= 12; level++) {
        const hex = hexAt(placed.board, cell, OWN + level - 1)
        const blocked =
          hex?.boardPieceUID ===
          placed.board.boardPieces[placed.board.boardPieces.length - 1]?.uid
        expect(blocked, `hex ${i} level ${level}`).toBe(level <= top)
      }
    })
  })
})

describe('Ship Bow', () => {
  const bowAt = () => {
    const t = withGrassFloor(makeTable())
    const placed = place({
      board: t,
      pieceID: Pieces.shipBow,
      at: at(t),
      altitude: SUPPORT,
      uid: 'bow',
    })
    return { t, placed, cells: footprint(Pieces.shipBow, at(t)) }
  }
  const altitudeOfBow = OWN

  it('has a 7 hex footprint and a size that matches', () => {
    expect(footprint(Pieces.shipBow, at(makeTable()))).toHaveLength(7)
    expect(piecesSoFar[Pieces.shipBow].size).toBe(7)
  })

  it('the main hexes block their heights', () => {
    const { placed, cells } = bowAt()
    expect(placed.error).toBeUndefined()
    const heights = [13, 12, 13, 10, 12]
    heights.forEach((h, i) => {
      for (let level = 1; level <= 14; level++) {
        const hex = hexAt(placed.board, cells[i], altitudeOfBow + level - 1)
        expect(hex?.boardPieceUID === 'bow', `hex ${i} level ${level}`).toBe(
          level <= h,
        )
      }
    })
  })

  it('the knub blocks only its own level', () => {
    const { placed, cells } = bowAt()
    for (let level = 1; level <= 4; level++) {
      const hex = hexAt(placed.board, cells[5], altitudeOfBow + level - 1)
      expect(hex?.boardPieceUID === 'bow').toBe(level === 1)
    }
  })

  it('the figurehead is open at levels 1 and 2 and blocks 3-13', () => {
    const { placed, cells } = bowAt()
    for (let level = 1; level <= 14; level++) {
      const hex = hexAt(placed.board, cells[6], altitudeOfBow + level - 1)
      expect(hex?.boardPieceUID === 'bow', `level ${level}`).toBe(
        level >= 3 && level <= 13,
      )
    }
  })

  it('a land tile fits on the figurehead hex at the bow level, with no conflict', () => {
    const { placed, cells } = bowAt()
    const land = place({
      board: placed.board,
      pieceID: 'g1',
      at: cells[6],
      altitude: SUPPORT,
    })
    expect(land.error).toBeUndefined()
    expect(land.displacedUIDs).toEqual([])
    // and permissive painting (the app's path) displaces nothing either
    const painted = place({
      board: placed.board,
      pieceID: 'g1',
      at: cells[6],
      altitude: SUPPORT,
      permissive: true,
    })
    expect(painted.displacedUIDs).toEqual([])
  })

  it('removing the bow clears every hex it obstructed, figurehead included', () => {
    const { t, placed } = bowAt()
    const removed = remove(placed.board, 'bow')
    expect(removed.error).toBeUndefined()
    expect(
      Object.values(removed.board.boardHexes).some(
        (hex) => hex.boardPieceUID === 'bow',
      ),
    ).toBe(false)
    expect(removed.board.boardHexes).toEqual(t.boardHexes)
  })

  it('survives a JSON load round trip with identical hexes', () => {
    const { placed } = bowAt()
    const loaded = buildupJsonFileMap(
      JSON.parse(JSON.stringify(placed.board.boardPieces)),
      {
        mapId: 'x',
        name: 'x',
        shape: 'rectangle',
        width: 15,
        length: 15,
        height: 15,
      } as never,
      [],
    )
    expect(loaded.droppedPieces).toEqual([])
    const strip = (hexes: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(hexes).filter(
          ([, h]) => (h as { boardPieceUID?: string }).boardPieceUID === 'bow',
        ),
      )
    expect(Object.keys(strip(loaded.boardHexes)).sort()).toEqual(
      Object.keys(strip(placed.board.boardHexes)).sort(),
    )
  })
})

describe('ships and fluid', () => {
  const overDoubleWater = () => {
    const t = makeTable()
    let board = t as ReturnType<typeof place>['board']
    const cells = footprint(Pieces.shipWall, at(t))
    for (const cell of cells) {
      board = place({ board, pieceID: 'w1', at: cell, altitude: 0 }).board
      board = place({ board, pieceID: 'w1', at: cell, altitude: 1 }).board
    }
    return { board, cells }
  }

  it('a half-level fluid cap counts as a full level for a ship', () => {
    expect(getShipPlacementAltitude(1)).toBe(1)
    expect(getShipPlacementAltitude(1.5)).toBe(2)
    expect(getShipPlacementAltitude(0)).toBe(0)
  })

  it('a Ship Wall over stacked water sits at a whole level, supported', () => {
    const { board, cells } = overDoubleWater()
    expect(hexAt(board, cells[0], 1.5)?.terrain).toBe('water')
    const placed = place({
      board,
      pieceID: Pieces.shipWall,
      at: at({ ...makeTable() }),
      altitude: 1.5,
    })
    expect(placed.error).toBeUndefined()
    const origin = Object.values(placed.board.boardHexes).find(
      (h) => h.inventoryID === Pieces.shipWall && h.isObstacleOrigin,
    )
    expect(Number.isInteger(origin?.altitude)).toBe(true)
    expect(origin?.altitude).toBe(3)
  })

  it('ships need no support from below, even over nothing', () => {
    const t = makeTable()
    const placed = place({
      board: t,
      pieceID: Pieces.shipBow,
      at: at(t),
      altitude: 3,
    })
    expect(placed.error).toBeUndefined()
  })
})

describe('deck highlight', () => {
  const base = {
    pid: 'bow',
    hoveredPieceID: 'bow',
    isSolidLandPenMode: true,
  }
  it('lights the section only while this ship is hovered with a solid pen', () => {
    expect(getActiveDeckSection({ ...base, section: 'forward' })).toBe(
      'forward',
    )
  })
  it('clears when the hover leaves the ship (piece built on the deck)', () => {
    expect(
      getActiveDeckSection({ ...base, section: 'aft', hoveredPieceID: '' }),
    ).toBeNull()
  })
  it('clears when the pen changes, and for the ghost preview with no pid', () => {
    expect(
      getActiveDeckSection({
        ...base,
        section: 'aft',
        isSolidLandPenMode: false,
      }),
    ).toBeNull()
    expect(
      getActiveDeckSection({ ...base, section: 'aft', pid: undefined }),
    ).toBeNull()
  })
})
