import { describe, expect, it } from 'vitest'
import { chunkLandRows, chunkSpecialGroups } from '../pdf-map/pieceLegendLayout'
import type { PieceKeyLandRow } from '../pdf-svg-shared/pieceKey'

const landRows: PieceKeyLandRow[] = [1, 2, 3, 7, 24].map((size) => ({
  size,
  title: `${size} space`,
  description: 'dark borders',
}))

describe('PDF piece key pagination helpers', () => {
  it('chunks Special Tiles three at a time in model order', () => {
    const groups = Array.from({ length: 8 }, (_, index) => `group-${index}`)

    expect(chunkSpecialGroups(groups)).toEqual([
      ['group-0', 'group-1', 'group-2'],
      ['group-3', 'group-4', 'group-5'],
      ['group-6', 'group-7'],
    ])
  })

  it('keeps land rows whole and starts every chunk with a table header', () => {
    const chunks = chunkLandRows(landRows, (row) => row.size, 4, 10)

    expect(chunks).toEqual([
      [
        { kind: 'header' },
        { kind: 'land', row: landRows[0] },
        { kind: 'land', row: landRows[1] },
        { kind: 'land', row: landRows[2] },
      ],
      [{ kind: 'header' }, { kind: 'land', row: landRows[3] }],
      [{ kind: 'header' }, { kind: 'land', row: landRows[4] }],
    ])
    expect(chunks.every((chunk) => chunk[0].kind === 'header')).toBe(true)
    expect(
      chunks.flatMap((chunk) =>
        chunk.flatMap((row) => (row.kind === 'land' ? [row.row] : [])),
      ),
    ).toEqual(landRows)
  })

  it('leaves a taller-than-budget land row whole in its own chunk', () => {
    const [row] = landRows
    const chunks = chunkLandRows([row], () => 100, 4, 50)

    expect(chunks).toEqual([[{ kind: 'header' }, { kind: 'land', row }]])
  })
})
