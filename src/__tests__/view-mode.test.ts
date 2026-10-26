import { describe, expect, it } from 'vitest'
import { getViewMode } from '../controls/viewMode'

describe('view mode', () => {
  it.each([
    { is2DOpen: false, isPdfOpen: false, expected: '3d' },
    { is2DOpen: true, isPdfOpen: false, expected: '2d' },
    { is2DOpen: false, isPdfOpen: true, expected: 'pdf' },
    { is2DOpen: true, isPdfOpen: true, expected: 'pdf' },
  ])(
    'selects $expected when is2DOpen=$is2DOpen and isPdfOpen=$isPdfOpen',
    ({ is2DOpen, isPdfOpen, expected }) => {
      expect(getViewMode(is2DOpen, isPdfOpen)).toBe(expected)
    },
  )
})
