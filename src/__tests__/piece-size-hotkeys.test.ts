import { describe, expect, it } from 'vitest'
import {
  getPieceSizeForHotkey,
  getPieceSizeHotkeyMap,
} from '../controls/useApplyHotkeys'
import {
  getNewPieceSizeForPenMode,
  getPieceIDForPenMode,
  getPieceSizeOptionsForPenMode,
} from '../data/flatPieceSizes'
import { piecesSoFar } from '../data/pieces'
import { getPickedPenModeSettings } from '../hooks/useMiddleClickPickPenMode'
import { Pieces } from '../types'

const obstacleFamilies = Object.values(piecesSoFar).reduce<
  Record<string, (typeof piecesSoFar)[string][]>
>((families, piece) => {
  if (piece.pieceSizeFamily) {
    families[piece.pieceSizeFamily] = [
      ...(families[piece.pieceSizeFamily] ?? []),
      piece,
    ]
  }
  return families
}, {})

const orderedObstacleFamilies = Object.entries(obstacleFamilies).map(
  ([family, pieces]) => ({
    family,
    pieces: [...pieces].sort(
      (a, b) => (a.variantOrder ?? 0) - (b.variantOrder ?? 0),
    ),
  }),
)

describe('obstacle piece variant hotkeys', () => {
  it.each(orderedObstacleFamilies)(
    'lists every $family variant in data order',
    ({ family, pieces }) => {
      const basePiece = pieces[0]
      const variants = pieces.map((piece) => piece.variantOrder)
      const options = pieces.map((_, index) => index + 1)

      expect(variants).toEqual(options)
      expect(pieces.every((piece) => piece.variantLabel)).toBe(true)
      expect(getPieceSizeOptionsForPenMode(basePiece.id)).toEqual(options)
      expect(getNewPieceSizeForPenMode(basePiece.id, 'select', 0)).toEqual({
        newSize: 1,
        newSizes: options,
      })

      pieces.forEach((piece, index) => {
        expect(getPieceIDForPenMode(basePiece.id, index + 1)).toBe(piece.id)
        expect(piecesSoFar[piece.id].pieceSizeFamily).toBe(family)
      })

      if (pieces.length <= 5) {
        const hotkeyMap = getPieceSizeHotkeyMap(options, true)
        options.forEach((option, index) => {
          expect(hotkeyMap.get(String(option))).toBe(String(index + 1))
          expect(getPieceSizeForHotkey(String(index + 1), options, true)).toBe(
            option,
          )
        })
      } else {
        expect(getPieceSizeHotkeyMap(options, true).size).toBe(0)
        expect(getPieceSizeForHotkey('1', options, true, 1)).toBe(2)
        expect(getPieceSizeForHotkey('1', options, true, options.length)).toBe(
          1,
        )
        expect(getPieceSizeForHotkey('shift+1', options, true, 1)).toBe(
          options.length,
        )
        expect(getPieceSizeForHotkey('shift+1', options, true, 6)).toBe(5)
        expect(getPieceSizeForHotkey('2', options, true, 1)).toBeNull()
      }
    },
  )

  it('orders Evergreen Trees as tr10, tr11, tr12, then the Large Tree', () => {
    const tree = piecesSoFar.tr10
    const options = getPieceSizeOptionsForPenMode(tree.id)

    expect(options).toEqual([1, 2, 3, 4])
    expect(
      options.map((option) => getPieceIDForPenMode(tree.id, option)),
    ).toEqual(['tr10', 'tr11', 'tr12', 'tr15'])
    expect(piecesSoFar.tr15.variantLabel).toBe('Large Evergreen Tree (15)')
  })

  it('lists the ship family variants in the requested order', () => {
    expect(
      [Pieces.shipWall, Pieces.shipBow, Pieces.ropeLadder, Pieces.cannon].map(
        (id) => {
          const piece = piecesSoFar[id]
          return {
            id: piece.id,
            pieceSizeFamily: piece.pieceSizeFamily,
            variantOrder: piece.variantOrder,
            variantLabel: piece.variantLabel,
          }
        },
      ),
    ).toEqual([
      {
        id: Pieces.shipWall,
        pieceSizeFamily: 'ship',
        variantOrder: 1,
        variantLabel: 'Ship Wall',
      },
      {
        id: Pieces.shipBow,
        pieceSizeFamily: 'ship',
        variantOrder: 2,
        variantLabel: 'Ship Bow',
      },
      {
        id: Pieces.ropeLadder,
        pieceSizeFamily: 'ship',
        variantOrder: 3,
        variantLabel: 'Rope Ladder',
      },
      {
        id: Pieces.cannon,
        pieceSizeFamily: 'ship',
        variantOrder: 4,
        variantLabel: 'Cannon',
      },
    ])
  })

  it('selects ship variants by number and middle-clicks each variant', () => {
    const shipPieces = [
      Pieces.shipWall,
      Pieces.shipBow,
      Pieces.ropeLadder,
      Pieces.cannon,
    ]

    for (const penMode of shipPieces) {
      const options = getPieceSizeOptionsForPenMode(penMode)
      expect(options).toEqual([1, 2, 3, 4])
      for (const [index, pieceID] of shipPieces.entries()) {
        const hotkeySize = getPieceSizeForHotkey(
          String(index + 1),
          options,
          true,
        )
        expect(hotkeySize).toBe(index + 1)
        expect(getPieceIDForPenMode(penMode, hotkeySize ?? 0)).toBe(pieceID)
        expect(
          getNewPieceSizeForPenMode(pieceID, piecesSoFar.o1.id, 2).newSize,
        ).toBe(index + 1)
      }
    }

    for (const [index, inventoryID] of shipPieces.entries()) {
      expect(
        getPickedPenModeSettings({
          uid: `ship-${index}`,
          inventoryID,
          altitude: 0,
          rotation: 2,
          pieceCoords: { q: 0, r: 0, s: 0 },
        }),
      ).toEqual({
        penMode: inventoryID,
        pieceSize: index + 1,
        rotation: 2,
      })
    }
  })

  it('resets to Ship Wall when switching into the ship family', () => {
    expect(
      getNewPieceSizeForPenMode(Pieces.shipWall, piecesSoFar.o1.id, 2),
    ).toMatchObject({ newSize: 1, newSizes: [1, 2, 3, 4] })
  })

  it('picks the placed obstacle variant as the active pen variant', () => {
    expect(
      getPickedPenModeSettings({
        uid: 'outcrop',
        inventoryID: piecesSoFar.o3.id,
        altitude: 0,
        rotation: 2,
        pieceCoords: { q: 0, r: 0, s: 0 },
      }),
    ).toEqual({ penMode: piecesSoFar.o3.id, pieceSize: 2, rotation: 2 })

    expect(
      getPickedPenModeSettings({
        uid: 'snow-tree',
        inventoryID: piecesSoFar.str10.id,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 0, r: 0, s: 0 },
      }),
    ).toEqual({
      penMode: piecesSoFar.str10.id,
      pieceSize: 1,
      rotation: 0,
    })
  })

  it('resets to the first variant across families and keeps it within one', () => {
    expect(
      getNewPieceSizeForPenMode(piecesSoFar.tr10.id, piecesSoFar.tr11.id, 2)
        .newSize,
    ).toBe(2)
    expect(
      getNewPieceSizeForPenMode(piecesSoFar.o1.id, piecesSoFar.tr11.id, 2)
        .newSize,
    ).toBe(1)
  })

  it('keeps the land hex-size hotkey mapping unchanged', () => {
    const sizes = [1, 2, 3, 7, 24]

    expect(getPieceSizeOptionsForPenMode('g')).toEqual(sizes)
    expect(getPieceSizeHotkeyMap(sizes)).toEqual(
      new Map([
        ['1', '1'],
        ['2', '2'],
        ['3', '3'],
        ['7', '4'],
        ['24', '5'],
      ]),
    )
    expect(
      sizes.map((_, index) => getPieceSizeForHotkey(String(index + 1), sizes)),
    ).toEqual(sizes)
  })
})
