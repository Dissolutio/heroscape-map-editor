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

const multiSizeObstacleFamilies = Object.entries(obstacleFamilies)
  .map(([family, pieces]) => ({
    family,
    pieces,
    sizes: [...new Set(pieces.map((piece) => piece.size))].sort(
      (a, b) => a - b,
    ),
  }))
  .filter(({ sizes }) => sizes.length > 1)

describe('obstacle piece size hotkeys', () => {
  it.each(multiSizeObstacleFamilies)(
    'resolves size keys to $family pieces',
    ({ family, pieces, sizes }) => {
      const basePiece = pieces[0]
      const hotkeyMap = getPieceSizeHotkeyMap(sizes)

      expect(getPieceSizeOptionsForPenMode(basePiece.id)).toEqual(sizes)
      expect(
        getNewPieceSizeForPenMode(basePiece.id, 'select', 0).newSizes,
      ).toEqual(sizes)

      for (const size of sizes) {
        const targetKey = hotkeyMap.get(String(size))
        expect(targetKey).toBeDefined()
        if (!targetKey) throw new Error(`Missing hotkey for size ${size}`)
        expect(getPieceSizeForHotkey(targetKey, sizes)).toBe(size)

        const expectedPiece =
          pieces.find((piece) => piece.size === size) ?? basePiece
        expect(getPieceIDForPenMode(basePiece.id, size)).toBe(expectedPiece.id)
        expect(piecesSoFar[expectedPiece.id].pieceSizeFamily).toBe(family)
      }

      for (const piece of pieces) {
        expect(getNewPieceSizeForPenMode(piece.id, 'select', 0).newSize).toBe(
          piece.size,
        )
      }
    },
  )

  it('keeps alternate tree models when their footprint size is unchanged', () => {
    const tree = piecesSoFar.tr12
    expect(getPieceIDForPenMode(tree.id, tree.size)).toBe(tree.id)
  })

  it('does not expose size hotkeys for families with one footprint size', () => {
    const snowTree = piecesSoFar.str10
    expect(getPieceSizeOptionsForPenMode(snowTree.id)).toEqual([])
  })

  it('picks the placed obstacle size as the active pen size', () => {
    expect(
      getPickedPenModeSettings({
        uid: 'outcrop',
        inventoryID: piecesSoFar.o3.id,
        altitude: 0,
        rotation: 2,
        pieceCoords: { q: 0, r: 0, s: 0 },
      }),
    ).toEqual({ penMode: piecesSoFar.o3.id, pieceSize: 3, rotation: 2 })

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
      pieceSize: undefined,
      rotation: 0,
    })
  })
})
