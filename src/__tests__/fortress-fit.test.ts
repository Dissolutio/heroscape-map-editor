import { describe, expect, it } from 'vitest'
import { type BoardHex, type BoardHexes, HexTerrain, Pieces } from '../types'
import { genBoardHexID } from '../utils/map-utils'
import {
  computeCoveredFortressTops,
  getCoveredFortressTops,
} from '../world/models/fortressCover'
import {
  fitMeshHeights,
  type HeightFit,
  heightRange,
  remapHeight,
} from '../world/models/fortressHeightFit'
import {
  CLASSIC_HEIGHTS,
  classicWallTop,
  vsFitTarget,
} from '../world/models/fortressModels'

// A wall column, as addPiece leaves it: the origin hex plus one clearance hex
// per level of obstacle height, all with the wall's terrain and uid.
function column(
  uid: string,
  terrain: string,
  q: number,
  r: number,
  from: number,
  to: number,
): BoardHex[] {
  const hexes: BoardHex[] = []
  for (let altitude = from; altitude <= to; altitude += 1) {
    hexes.push({
      id: genBoardHexID({ q, r, s: -q - r, altitude }),
      q,
      r,
      s: -q - r,
      altitude,
      terrain,
      pieceID: `${uid}-piece`,
      boardPieceUID: uid,
      inventoryID: '',
      pieceRotation: 0,
      ...(altitude === from
        ? { isObstacleOrigin: true, obstacleHeight: to - from }
        : { isVerticalClearanceHex: true }),
    } as BoardHex)
  }
  return hexes
}

const board = (...hexes: BoardHex[][]): BoardHexes =>
  Object.fromEntries(hexes.flat().map((hex) => [hex.id, hex]))

describe('covered fortress tops', () => {
  const wall = column('wall', HexTerrain.castleWall, 2, 1, 2, 11)

  it('is covered by a wall walk on the level above', () => {
    const walk = column('walk', HexTerrain.wallWalk, 2, 1, 12, 12)
    expect(computeCoveredFortressTops(board(wall, walk), 20).has('wall')).toBe(
      true,
    )
  })

  it('is covered by another wall stacked on it', () => {
    const upper = column('upper', HexTerrain.castleWall, 2, 1, 12, 20)
    const covered = computeCoveredFortressTops(board(wall, upper), 30)
    expect(covered.has('wall')).toBe(true)
    expect(covered.has('upper')).toBe(false)
  })

  it('is covered by any other whole-hex piece, such as land', () => {
    const land = column('land', HexTerrain.grass, 2, 1, 12, 12)
    expect(computeCoveredFortressTops(board(wall, land), 20).has('wall')).toBe(
      true,
    )
  })

  it('is uncovered with nothing above, or something on another hex', () => {
    expect(computeCoveredFortressTops(board(wall), 20).size).toBe(0)
    const nextDoor = column('walk', HexTerrain.wallWalk, 3, 1, 12, 12)
    expect(computeCoveredFortressTops(board(wall, nextDoor), 20).size).toBe(0)
  })

  it('is uncovered by edge pieces: a ladder hex does not fill the top', () => {
    const ladder = column('ladder', HexTerrain.ladder, 2, 1, 12, 12)
    expect(computeCoveredFortressTops(board(wall, ladder), 20).size).toBe(0)
  })

  it('is uncovered when the viewing level hides the piece on top', () => {
    const walk = column('walk', HexTerrain.wallWalk, 2, 1, 12, 12)
    expect(computeCoveredFortressTops(board(wall, walk), 11).size).toBe(0)
    expect(computeCoveredFortressTops(board(wall, walk), 12).size).toBe(1)
  })

  it('covers a castle base the same way', () => {
    const base = column('base', HexTerrain.castleBase, 0, 0, 2, 2)
    const land = column('land', HexTerrain.grass, 0, 0, 3, 3)
    expect(computeCoveredFortressTops(board(base, land), 5).has('base')).toBe(
      true,
    )
  })

  it('reuses one lookup for the same board and level', () => {
    const hexes = board(wall)
    const first = getCoveredFortressTops(hexes, 20)
    expect(getCoveredFortressTops(hexes, 20)).toBe(first)
    expect(getCoveredFortressTops(hexes, 19)).not.toBe(first)
  })
})

// A tiny wall: body from 0 to 3 (shoulder), receiver from 3 to 3.3, and a
// peg hanging below the bottom.
const quad = (y0: number, y1: number, x = 0) => [
  [x, y0, 0, x + 1, y0, 0, x, y1, 0],
  [x + 1, y0, 0, x + 1, y1, 0, x, y1, 0],
]
const BODY = quad(0, 3)
const RECEIVER = quad(3, 3.3, 0.2)
const PEG = quad(-0.2, -0.05, 0.4)

function mesh(triangles: number[][]) {
  const positions = triangles.flat()
  return {
    positions,
    normals: positions.map((_, i): number => (i % 3 === 0 ? 1 : 0)),
    index: null,
  }
}

const fitFor = (dstTop: number): HeightFit => ({
  srcBottom: 0,
  srcShoulder: 3,
  dstBottom: 0,
  dstTop,
})

const keptHeights = (out: ReturnType<typeof fitMeshHeights>) =>
  Array.from(out.index, (v) => out.positions[v * 3 + 1])

describe('piecewise height fit', () => {
  for (const levels of [9, 10]) {
    const dstTop = classicWallTop(levels + 0.99)
    it(`puts a ${levels}-level wall's bottom and shoulder on the classic ones`, () => {
      const fit = fitFor(dstTop)
      expect(remapHeight(0, fit)).toBeCloseTo(0, 9)
      expect(remapHeight(3, fit)).toBeCloseTo(dstTop, 5)
      // the receiver keeps its real height (0.3)
      expect(remapHeight(3.3, fit) - remapHeight(3, fit)).toBeCloseTo(0.3, 9)
      const out = fitMeshHeights(mesh([...BODY, ...RECEIVER]), fit, {
        keepReceiver: true,
      })
      const { min, max } = heightRange([
        { positions: keptHeights(out).flatMap((y) => [0, y, 0]) },
      ])
      expect(min).toBeCloseTo(0, 9)
      expect(max).toBeCloseTo(dstTop + 0.3, 5)
    })
  }

  it('drops the receiver when the top is covered, and keeps the body', () => {
    const dstTop = classicWallTop(9.99)
    const out = fitMeshHeights(mesh([...BODY, ...RECEIVER]), fitFor(dstTop), {
      keepReceiver: false,
    })
    expect(out.index.length).toBe(6) // the two body triangles
    expect(Math.max(...keptHeights(out))).toBeCloseTo(dstTop, 5)
  })

  it('drops pegs: nothing is left below the classic bottom', () => {
    const fit: HeightFit = {
      srcBottom: 0,
      srcShoulder: 0.3,
      dstBottom: 0,
      dstTop: CLASSIC_HEIGHTS.castleBase.top,
    }
    const out = fitMeshHeights(mesh([...quad(0, 0.3), ...PEG]), fit, {
      keepReceiver: true,
    })
    expect(out.index.length).toBe(6)
    expect(Math.min(...keptHeights(out))).toBeCloseTo(0, 9)
    // even a vertex just below the bottom is clamped onto it
    expect(remapHeight(-0.003, fit)).toBe(0)
  })

  it('keeps vertices (and so UVs) and fixes the normals of the stretched body', () => {
    const slope = mesh([[0, 0, 0, 1, 1, 0, 0, 1, 1]])
    slope.normals = [0.6, 0.8, 0, 0.6, 0.8, 0, 0.6, 0.8, 0]
    const out = fitMeshHeights(
      slope,
      { ...fitFor(6), srcShoulder: 1, dstTop: 2 },
      {
        keepReceiver: true,
      },
    )
    expect(out.positions.length).toBe(9)
    const [nx, ny] = [out.normals?.[0] ?? 0, out.normals?.[1] ?? 0]
    expect(Math.hypot(nx, ny)).toBeCloseTo(1, 6)
    // stretched twice as tall: the normal leans further from Y
    expect(ny / nx).toBeCloseTo(0.8 / 0.6 / 2, 6)
  })
})

describe('fit targets: the classic bottoms and tops', () => {
  it('fits walls to the classic cap top at any height, receiver as asked', () => {
    expect(vsFitTarget('castleWall', { scaleY: 9.99 })).toEqual({
      dstBottom: 0,
      dstTop: 9.99 * 0.35 + 0.1,
      shoulder: 'walkway',
      keepReceiver: true,
    })
    expect(
      vsFitTarget('castleWall', { scaleY: 10.99, isTopCovered: true }),
    ).toMatchObject({ dstTop: 10.99 * 0.35 + 0.1, keepReceiver: false })
  })

  it('fits the fixed pieces to their classic models', () => {
    expect(vsFitTarget('castleBase', { isTopCovered: true })).toEqual({
      dstBottom: 0,
      dstTop: 0.45,
      shoulder: 'walkway',
      keepReceiver: false,
    })
    expect(vsFitTarget('fortressArch')).toMatchObject({
      dstBottom: 0,
      dstTop: 3.6,
      shoulder: 'top',
    })
    expect(vsFitTarget('fortressLadder')).toMatchObject({
      dstBottom: 0,
      dstTop: 0.7,
      keepReceiver: true,
    })
    expect(vsFitTarget('fortressBattlement')).toMatchObject({
      dstBottom: 0.1,
      dstTop: 1.75,
      shoulder: 'top',
    })
  })

  it('only lists real castle pieces', () => {
    expect(Pieces.castleWallEnd).toBeTruthy()
  })
})
