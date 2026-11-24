/**
 * SHIP WALL SUPPORT (data/shipWallSupport.ts). The wall sits side by side
 * with solid land at its own level: all 4 interface hexes (the row north of it
 * at rotation 0) must be solid land. Counterweight is left to the builders.
 * Fluid never connects; nothing under the wall matters.
 * The Ship Bow is never unsupported.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { piecesSoFar } from '../data/pieces'
import {
  evaluateShipWallSupport,
  getShipWallSupportReasons,
} from '../data/shipWallSupport'
import { getUnsupportedPieceUIDs } from '../data/unsupportedPieces'
import type { BoardPiece, CubeCoordinate, HexMap } from '../types'
import { Pieces } from '../types'
import {
  type Board,
  makeTable,
  place,
  remove,
  withGrassFloor,
} from './helpers/board'

const c = (q: number, r: number): CubeCoordinate => ({ q, r, s: -q - r })
// One step of rotation, written independently of the library: east -> SE.
const rotateOnce = ({ q, r, s }: CubeCoordinate): CubeCoordinate => ({
  q: -r + 0,
  r: -s + 0,
  s: -q + 0,
})
const rotate = (v: CubeCoordinate, steps: number) =>
  Array.from({ length: steps }).reduce<CubeCoordinate>(
    (acc) => rotateOnce(acc),
    v,
  )
const add = (a: CubeCoordinate, b: CubeCoordinate): CubeCoordinate => ({
  q: a.q + b.q,
  r: a.r + b.r,
  s: a.s + b.s,
})

// rotation-0 cubes relative to the wall origin
const INTERFACE = [c(0, -1), c(1, -1), c(2, -1), c(3, -1)]

const ORIGIN = c(6, 8)

/** Land is a 1-hex tile of `pieceID` at `level` support altitude. */
function build({
  rotation,
  wallAltitude = 0,
  land,
  base = makeTable(),
}: {
  rotation: number
  wallAltitude?: number
  land: { at: CubeCoordinate; pieceID?: string; altitude?: number }[]
  base?: Board
}) {
  let board: Board = base
  for (const tile of land) {
    const placed = place({
      board,
      pieceID: tile.pieceID ?? 'g1',
      at: tile.at,
      altitude: tile.altitude ?? wallAltitude,
      permissive: true,
    })
    board = placed.board
  }
  const wall = place({
    board,
    pieceID: Pieces.shipWall,
    at: ORIGIN,
    altitude: wallAltitude,
    rotation,
    uid: 'wall',
    permissive: true,
  })
  const piece = wall.board.boardPieces.find((p) => p.uid === 'wall')
  if (!piece) throw new Error('wall not placed')
  return { board: wall.board, piece }
}

const at = (offset: CubeCoordinate, rotation: number) =>
  add(ORIGIN, rotate(offset, rotation))
const check = (b: ReturnType<typeof build>) =>
  evaluateShipWallSupport(b.piece, b.board.boardHexes, b.board.boardPieces)

describe.each([0, 2])('Ship Wall support at rotation %i', (rotation) => {
  const iface = INTERFACE.map((o) => at(o, rotation))
  const fullLand = iface.map((p) => ({ at: p }))

  it('is supported with all 4 interface hexes on solid land', () => {
    const result = check(build({ rotation, land: fullLand }))
    expect(result).toEqual({ supported: true, missingInterfaceHexes: [] })
  })

  it('is unsupported with an empty interface hex, and lists it', () => {
    const result = check(
      build({ rotation, land: fullLand.filter((l) => l.at !== iface[2]) }),
    )
    expect(result.supported).toBe(false)
    expect(result.missingInterfaceHexes).toEqual([iface[2]])
    expect(getShipWallSupportReasons(result)[0]).toBe(
      'Ship Wall: 1 of 4 interlocks not connected to solid land',
    )
  })

  it('does not connect to fluid in an interface hex', () => {
    const land = fullLand.map((l) =>
      l.at === iface[1] ? { ...l, pieceID: 'w1' } : l,
    )
    const result = check(build({ rotation, land }))
    expect(result.supported).toBe(false)
    expect(result.missingInterfaceHexes).toEqual([iface[1]])
  })

  it.each([1, -1])(
    'does not connect to land %i level(s) off the wall level',
    (delta) => {
      const wallAltitude = 1
      // stack a tile under so the offset one has a valid support
      const land = fullLand.map((l) =>
        l.at === iface[3]
          ? { ...l, altitude: wallAltitude + delta }
          : { ...l, altitude: wallAltitude },
      )
      const floor = iface.map((p) => ({
        at: p,
        altitude: 0,
      }))
      const result = check(
        build({ rotation, wallAltitude, land: [...floor, ...land] }),
      )
      expect(result.supported).toBe(false)
      expect(result.missingInterfaceHexes).toContainEqual(iface[3])
    },
  )

  it('is supported when stacked at level 2 on top of level-1 tiles', () => {
    const lower = iface.map((p) => ({ at: p, altitude: 0 }))
    const upper = iface.map((p) => ({ at: p, altitude: 1 }))
    const result = check(
      build({ rotation, wallAltitude: 1, land: [...lower, ...upper] }),
    )
    expect(result.supported).toBe(true)
  })

  it('needs nothing under the wall', () => {
    const b = build({ rotation, land: fullLand })
    expect(getUnsupportedPieceUIDs(b.board)).toEqual([])
  })
})

describe('Ship Bow', () => {
  it('is never unsupported, alone on the table or beside anything', () => {
    const table = makeTable()
    const alone = place({
      board: table,
      pieceID: Pieces.shipBow,
      at: ORIGIN,
      altitude: 0,
      uid: 'bow',
      permissive: true,
    })
    expect(getUnsupportedPieceUIDs(alone.board)).toEqual([])
    const beside = place({
      board: alone.board,
      pieceID: 'w3',
      at: c(ORIGIN.q + 1, ORIGIN.r - 1),
      altitude: 0,
      permissive: true,
    })
    expect(getUnsupportedPieceUIDs(beside.board)).toEqual([])
  })
})

describe('board level derivation', () => {
  it('flags a wall with nothing beside it and clears it when land is added', () => {
    const lone = build({ rotation: 0, land: [] })
    expect(getUnsupportedPieceUIDs(lone.board)).toEqual(['wall'])
    expect(piecesSoFar[Pieces.shipWall]).toBeDefined()
  })
  it('flags the wall again once an interface tile is removed', () => {
    const iface = INTERFACE.map((o) => at(o, 0))
    const b = build({
      rotation: 0,
      land: iface.map((p) => ({ at: p })),
    })
    expect(getUnsupportedPieceUIDs(b.board)).toEqual([])
    const tile = b.board.boardPieces.find(
      (p) =>
        p.inventoryID === 'g1' &&
        p.pieceCoords.q === iface[0].q &&
        p.pieceCoords.r === iface[0].r,
    )
    if (!tile) throw new Error('tile')
    const removed = remove(b.board, tile.uid)
    expect(getUnsupportedPieceUIDs(removed.board)).toEqual(['wall'])
  })
})

describe('store', () => {
  const hexMap: HexMap = {
    id: 'ship-wall-support',
    name: 'Ship wall support',
    author: '',
    version: 1,
    shape: 'rectangle',
    width: 15,
    length: 15,
  }
  let store: typeof import('../store/store').default
  let undo: () => void
  const storage = new Map<string, string>()
  const localStorageMock = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.stubGlobal('localStorage', localStorageMock)
    vi.resetModules()
    ;({ default: store } = await import('../store/store'))
    ;({ undoWithSelectionRestore: undo } = await import(
      '../utils/undoWithSelectionRestore'
    ))
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('turns the wall amber when an interface tile is removed, and undo restores it', () => {
    const iface = INTERFACE.map((o) => at(o, 0))
    const land = iface
    const pieces: BoardPiece[] = [
      ...land.map((p, i) => ({
        uid: `land-${i}`,
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: p,
      })),
      {
        uid: 'wall',
        inventoryID: Pieces.shipWall,
        altitude: 0,
        rotation: 0,
        pieceCoords: ORIGIN,
      },
    ]
    const temporal = store.temporal.getState()
    temporal.pause()
    store.getState().loadMap(buildupJsonFileMap(pieces, hexMap), {
      holdAutosave: true,
    })
    temporal.clear()
    temporal.resume()
    expect(store.getState().unsupportedPieceUIDs).toEqual([])

    store.getState().unpaintTile('land-0')
    expect(store.getState().unsupportedPieceUIDs).toEqual(['wall'])

    undo()
    expect(store.getState().unsupportedPieceUIDs).toEqual([])
  })
})
