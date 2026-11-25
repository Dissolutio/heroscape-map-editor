import { describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { evaluatePlacement, evaluatePlacementPlan } from '../data/placement'
import { getPlacementPreviewState } from '../data/placementPreview'
import type { PlacementStatus } from '../data/placement'
import type { BoardHex, CubeCoordinate } from '../types'
import { Pieces } from '../types'
import { getPlacementPreviewStyle } from '../world/placementPreviewStyle'
import {
  type Board,
  cloneBoard,
  hexAt,
  makeTable,
  place,
  withGrassFloor,
} from './helpers/board'

const table = withGrassFloor(makeTable(9))
const center = table.center

function requiredHex(
  board: Board,
  coords: CubeCoordinate,
  altitude: number,
): BoardHex {
  const hex = hexAt(board, coords, altitude)
  if (!hex) throw new Error(`missing hex at ${JSON.stringify(coords)}`)
  return hex
}

function preview(
  board: Board,
  pieceID: string,
  pointerHex?: BoardHex,
  rotation = 0,
) {
  const piece = piecesSoFar[pieceID]
  if (!piece) throw new Error(`missing piece ${pieceID}`)
  return getPlacementPreviewState(
    piece,
    pointerHex ?? requiredHex(board, center, 1),
    rotation,
    board,
  )
}

describe('placement preview state', () => {
  it('reports a free land placement as ok', () => {
    const emptyTable = makeTable(9)
    expect(
      preview(emptyTable, 'g1', requiredHex(emptyTable, center, 0)).evaluation
        .status,
    ).toBe('ok')
  })

  it.each(Array.from({ length: 6 }, (_, rotation) => rotation))(
    'previews the base and ruin together at rotation %s',
    (rotation) => {
      const state = preview(table, Pieces.marvel, undefined, rotation)

      expect(state).toMatchObject({
        resolution: {
          coords: center,
          altitude: 2,
          rotation,
        },
        automaticBases: [
          {
            coords: center,
            altitude: 1,
            rotation,
          },
        ],
        evaluation: {
          status: 'ok',
          footprintHexes: expect.arrayContaining([
            expect.objectContaining({ altitude: 1 }),
            expect.objectContaining({ altitude: 2 }),
          ]),
        },
      })
      expect(state.evaluation.footprintHexes).toHaveLength(12)
    },
  )

  it('blocks a Marvel Ruin when its Concrete-6 base is not placeable', () => {
    const waterBoard = place({
      board: cloneBoard(table),
      pieceID: Pieces.water1,
      at: center,
      altitude: 1,
    }).board
    const waterCap = requiredHex(waterBoard, center, 2)

    expect(preview(waterBoard, Pieces.marvel, waterCap, 3)).toMatchObject({
      resolution: { blocked: 'landTileNotOnHex' },
      evaluation: { status: 'blocked', reason: 'landTileNotOnHex' },
    })
  })

  it('carries a Concrete-6 conflict into the combined preview', () => {
    const tree = place({
      board: cloneBoard(table),
      pieceID: 'tr10',
      at: center,
      altitude: 1,
      uid: 'tree',
      permissive: true,
    }).board
    const automaticBase = {
      piece: piecesSoFar[Pieces.concrete6],
      coords: center,
      altitude: 1,
      rotation: 0,
      rule: 'land' as const,
    }
    const plan = {
      automaticBases: [automaticBase],
      resolution: {
        piece: piecesSoFar[Pieces.marvel],
        coords: center,
        altitude: 2,
        rotation: 0,
        rule: 'default' as const,
      },
    }
    const baseAlone = evaluatePlacement(tree, automaticBase)

    expect(baseAlone.status).toBe('conflict')
    expect(evaluatePlacementPlan(tree, plan).status).toBe(baseAlone.status)
  })

  it('reports an overlap as conflict', () => {
    const tree = place({
      board: cloneBoard(table),
      pieceID: 'tr10',
      at: center,
      altitude: 1,
      uid: 'tree',
      permissive: true,
    }).board
    expect(preview(tree, 'tr10').evaluation.status).toBe('conflict')
  })

  it('reports a Laur add-on on grass as unsupported without a conflict', () => {
    expect(preview(table, 'lws')).toMatchObject({
      evaluation: { status: 'ok' },
      unsupported: true,
    })
  })

  it('reports a Laur add-on supported by matching pillars at both ends', () => {
    const supportedBoard = place({
      board: place({
        board: cloneBoard(table),
        pieceID: 'lwp',
        at: center,
        altitude: 1,
        uid: 'anchor-pillar',
        permissive: true,
      }).board,
      pieceID: 'lwp',
      at: { q: center.q + 1, r: center.r, s: center.s - 1 },
      altitude: 1,
      uid: 'far-pillar',
      permissive: true,
    }).board
    expect(preview(supportedBoard, 'lws')).toMatchObject({
      evaluation: { status: 'ok' },
      unsupported: false,
    })
  })

  it('shows a same-edge Laur add-on preview as a conflict', () => {
    const existing = place({
      board: cloneBoard(table),
      pieceID: 'lws',
      at: center,
      altitude: 1,
      rotation: 0,
      uid: 'existing-addon',
      permissive: true,
    }).board
    expect(preview(existing, 'lws')).toMatchObject({
      evaluation: { status: 'conflict' },
      unsupported: true,
    })
  })

  it('reports an arch on a castle wall top as blocked', () => {
    const wall = place({
      board: cloneBoard(table),
      pieceID: 'cws',
      at: center,
      altitude: 1,
      uid: 'wall',
      permissive: true,
    }).board
    const top = requiredHex(wall, center, 2)
    expect(preview(wall, 'ca', top).evaluation).toMatchObject({
      status: 'blocked',
      reason: 'castleArchNeedsLand',
      footprintHexes: [],
    })
  })

  it('reports an off-map footprint as blocked and includes its hexes', () => {
    const corner = { q: 0, r: 0, s: 0 }
    const state = preview(table, 'g24', requiredHex(table, corner, 1))
    expect(state.evaluation).toMatchObject({
      status: 'blocked',
      reason: 'offMap',
    })
    expect(state.evaluation.footprintHexes).toHaveLength(24)
  })

  it('reports a castle wall on an arch top as ok', () => {
    const arch = place({
      board: cloneBoard(table),
      pieceID: 'ca',
      at: center,
      altitude: 1,
      uid: 'arch',
      permissive: true,
    }).board
    expect(
      preview(arch, 'cws', requiredHex(arch, center, 2)).evaluation.status,
    ).toBe('ok')
  })

  it('does not mutate the board', () => {
    const before = cloneBoard(table)
    preview(table, 'g7')
    preview(table, 'lws')
    preview(table, 'g24', requiredHex(table, { q: 0, r: 0, s: 0 }, 1))
    expect(table).toEqual(before)

    const overlappingTree = place({
      board: cloneBoard(table),
      pieceID: 'tr10',
      at: center,
      altitude: 1,
      uid: 'tree',
      permissive: true,
    }).board
    const treeBefore = cloneBoard(overlappingTree)
    preview(overlappingTree, 'tr10')
    expect(overlappingTree).toEqual(treeBefore)
  })
})

describe('placement preview styles', () => {
  it('maps each status to a distinct color and pattern', () => {
    const statuses: PlacementStatus[] = ['ok', 'conflict', 'blocked']
    const styles = statuses.map((status) => getPlacementPreviewStyle(status))
    expect(new Set(styles.map((style) => style.color)).size).toBe(3)
    expect(new Set(styles.map((style) => style.pattern)).size).toBe(3)
  })

  it('keeps the conflict style and adds a cross for unsupported support', () => {
    expect(getPlacementPreviewStyle('ok', true)).toMatchObject({
      color: '#d97706',
      secondaryPattern: 'cross',
    })
    expect(getPlacementPreviewStyle('conflict', true)).toMatchObject({
      color: '#ea580c',
      pattern: 'dashed',
      secondaryPattern: 'cross',
    })
  })
})
