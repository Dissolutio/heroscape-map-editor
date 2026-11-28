import { describe, expect, it, vi } from 'vitest'

vi.mock('three', () => {
  throw new Error('format data must not import Three.js')
})
vi.mock('react', () => {
  throw new Error('format data must not import React')
})

describe('format data Node imports', () => {
  it('loads piece data, templates, port rules, and rotation helpers without UI modules', async () => {
    const [
      { piecesSoFar },
      { default: tileTemplates },
      portPieces,
      rotations,
      penModeRotations,
    ] = await Promise.all([
      import('../data/pieces'),
      import('../data/tileTemplates'),
      import('../data/portPieces'),
      import('../data/rotationTransforms'),
      import('../controls/getPossibleRotationsForPenMode'),
    ])

    expect(piecesSoFar.g7).toBeDefined()
    expect(tileTemplates['7']).toBeDefined()
    expect(portPieces.getPortPieceRotations('lwp')).toBeDefined()
    expect(rotations.default).toBeTypeOf('function')
    expect(penModeRotations.getPossibleRotationsForPenMode('g7')).toContain(0)
  })
})
