/**
 * PIECE REGISTRY GUARD RAILS
 *
 * A "piece" is declared in several places that nothing but convention keeps in
 * sync. These tests are the checklist for anyone adding new terrain: if you add
 * a piece and forget one of these registrations, a test here names the piece
 * and the missing step instead of the app crashing later in a click handler.
 *
 * Registries covered here (all under src/):
 *   types.ts            Pieces / PiecePrefixes   the inventory ID constants
 *   data/pieces.ts      piecesSoFar              the Piece definitions
 *   data/tileTemplates  tileTemplates            hex footprint, keyed by piece.template
 *   inventory/blankInventory                     every countable piece, count 0
 *   data/inventories    set contents             what each boxed set contains
 *   data/pieceCodes     pieceCodes               Virtualscape file code -> piece
 *
 * NOT covered (no tests yet): the 3D model + ModelLoader wiring in src/world,
 * and the SVG/PDF shapes in src/svg-map and src/pdf-map.
 */
import { describe, expect, it } from 'vitest'
import { pieceCodes } from '../data/pieceCodes'
import { piecesSoFar } from '../data/pieces'
import { terrainSetsByShortID } from '../data/terrainSets'
import tileTemplates from '../data/tileTemplates'
import { blankPieceInventory } from '../inventory/blankInventory'
import { Pieces } from '../types'

const allPieces = Object.values(piecesSoFar)

describe('piece registry', () => {
  it('every Pieces constant has a definition in piecesSoFar', () => {
    const undefinedConstants = Object.entries(Pieces)
      .filter(([, id]) => !(id in piecesSoFar))
      .map(([name]) => name)
    expect(undefinedConstants).toEqual([])
  })

  it('each definition is stored under its own id', () => {
    const mismatched = Object.entries(piecesSoFar)
      .filter(([key, piece]) => piece.id !== key)
      .map(([key]) => key)
    expect(mismatched).toEqual([])
  })

  it('every countable piece is in the blank inventory, and the inventory lists nothing unknown', () => {
    const countable = allPieces.filter(
      (p) => !p.isUninventoried && !p.isOverlayPiece,
    )
    const missingFromInventory = countable
      .filter((p) => !(p.id in blankPieceInventory))
      .map((p) => p.id)
    const unknownInInventory = Object.keys(blankPieceInventory).filter(
      (id) => !(id in piecesSoFar),
    )
    expect({ missingFromInventory, unknownInInventory }).toEqual({
      missingFromInventory: [],
      unknownInInventory: [],
    })
  })

  it('every Virtualscape import code maps to a registered piece', () => {
    const dangling = Object.entries(pieceCodes)
      .filter(([, id]) => !(id in piecesSoFar))
      .map(([code, id]) => `${code} -> ${id}`)
    expect(dangling).toEqual([])
  })

  it('every boxed terrain set only contains registered inventory pieces, with sane counts', () => {
    const problems: string[] = []
    for (const [setID, set] of Object.entries(terrainSetsByShortID)) {
      for (const [pieceID, count] of Object.entries(set.inventory ?? {})) {
        if (!(pieceID in blankPieceInventory)) {
          problems.push(
            `set ${setID} (${set.name}) lists unknown piece ${pieceID}`,
          )
        }
        if (!Number.isInteger(count) || count < 0) {
          problems.push(
            `set ${setID} (${set.name}) has bad count for ${pieceID}: ${count}`,
          )
        }
      }
    }
    expect(problems).toEqual([])
  })

  it('every land piece has as many template hexes as its declared size', () => {
    const wrong = allPieces
      .filter((p) => p.isHexTerrainPiece)
      .filter((p) => tileTemplates[p.template]?.length !== p.size)
      .map((p) => p.id)
    expect(wrong).toEqual([])
  })

  it('no two land pieces share the same (terrain, size)', () => {
    // utils/terrain-constraints.ts keeps ONE piece per (terrain, size) in a
    // Map, so a second piece with the same pair would silently overwrite the
    // first when constrained inventory is turned into pen-mode choices.
    const seen = new Map<string, string>()
    const collisions: string[] = []
    for (const p of allPieces.filter((p) => p.isHexTerrainPiece)) {
      const key = `${p.terrain}:${p.size}`
      const existing = seen.get(key)
      if (existing) collisions.push(`${existing} and ${p.id} are both ${key}`)
      seen.set(key, p.id)
    }
    expect(collisions).toEqual([])
  })

  it('every piece has a tile template', () => {
    // addPiece() looks the footprint up unconditionally (rotationTransforms.ts
    // -> tileTemplates[template].map), so a piece without one throws when
    // placed or loaded. Pieces that write no hexes (Laur add-ons, battlements)
    // still need a 1-hex basic1 entry.
    const missing = allPieces
      .filter((p) => !(p.template in tileTemplates))
      .map((p) => p.id)
    expect(missing).toEqual([])
  })
})
