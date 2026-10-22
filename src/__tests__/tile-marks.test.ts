import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { piecesSoFar } from '../data/pieces'
import { type BoardHex, type BoardPiece, Pieces } from '../types'
import { getTerrainTileAnnotation } from '../utils/tileLetters'
import {
  getBuriedMarksForHex,
  getBuriedTileMarks,
  makeBuriedMarksByUID,
} from '../utils/tileMarks'

const status = (
  isBuried: boolean,
  isSubterrainBuried: boolean,
  isPartiallyBuried = false,
) => ({ isBuried, isSubterrainBuried, isPartiallyBuried })

const boardPiece = (inventoryID: string): BoardPiece => ({
  uid: inventoryID,
  inventoryID,
  altitude: 0,
  rotation: 0,
  pieceCoords: { q: 0, r: 0, s: 0 },
})

const boardHex = (inventoryID: string, terrain: string): BoardHex => ({
  id: '1~0~0',
  q: 0,
  r: 0,
  s: 0,
  altitude: 1,
  pieceID: 'piece',
  boardPieceUID: inventoryID,
  inventoryID,
  terrain,
  pieceRotation: 0,
  isObstacleOrigin: true,
})

describe('buried tile marks', () => {
  it.each([
    [false, false, ''],
    [true, false, '*'],
    [false, true, '†'],
    [true, true, '*†'],
  ])('maps buried status (%s, %s) to "%s"', (buried, subterrain, marks) => {
    expect(
      getBuriedTileMarks(boardPiece('g1'), status(buried, subterrain)),
    ).toBe(marks)
  })

  it('does not mark a piece that is only partially buried', () => {
    expect(
      getBuriedTileMarks(boardPiece('g1'), status(false, false, true)),
    ).toBe('')
  })

  it('adds marks after a terrain letter, or alone for terrain without one', () => {
    const grass = boardHex('g1', 'grass')
    const water = boardHex('w1', 'water')

    expect(getTerrainTileAnnotation(grass, 1, true, '*†')).toBe('G*†')
    expect(getTerrainTileAnnotation(water, 1, true, '*')).toBe('*')
    expect(getTerrainTileAnnotation(grass, 1, false, '*')).toBe('*')
  })

  it.each([
    Pieces.tree415,
    Pieces.glyphPower,
    Pieces.startZone1,
    Pieces.laurWallRuin1,
  ])(
    'does not mark obstacles, glyphs, start zones, or Laur pieces (%s)',
    (id) => {
      expect(
        piecesSoFar[id],
        `test piece "${id}" should be registered`,
      ).toBeDefined()
      expect(getBuriedTileMarks(boardPiece(id), status(true, true))).toBe('')
    },
  )

  it('uses buried status from the small Prison of Baldur board fixture', () => {
    const piece = (
      uid: string,
      inventoryID: string,
      q: number,
      altitude: number,
      rotation = 0,
    ) => ({
      uid,
      inventoryID,
      altitude,
      rotation,
      pieceCoords: { q, r: 0, s: -q },
    })
    const board = buildupJsonFileMap(
      [
        piece('water-a', 'w1', 0, 0),
        piece('water-b', 'w1', 1, 0),
        piece('grass-c', 'g1', 2, 0),
        piece('bridge', 'g2', 2, 1, 3),
        piece('stacked', 'w1', 0, 1, 3),
        piece('grass-top', 'g1', 0, 1.5, 3),
      ],
      {
        id: 'tile-mark-fixture',
        name: 'Tile mark fixture',
        author: '',
        version: 1,
        shape: 'rectangle',
        width: 3,
        length: 1,
      },
    )
    const marksByUID = makeBuriedMarksByUID(board.boardHexes, board.boardPieces)
    const waterHex = Object.values(board.boardHexes).find(
      (hex) => hex.boardPieceUID === 'water-a' && hex.isObstacleOrigin,
    )

    if (!waterHex) {
      throw new Error('The buried-status fixture is missing water-a')
    }
    expect(
      getBuriedMarksForHex(waterHex, waterHex.altitude, marksByUID),
    ).toContain('*')
    expect(
      getBuriedMarksForHex(
        { ...waterHex, isObstacleOrigin: false },
        waterHex.altitude,
        marksByUID,
      ),
    ).toBe('')
  })
})
