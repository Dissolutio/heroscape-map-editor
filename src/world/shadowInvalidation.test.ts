import { describe, expect, it } from 'vitest'
import {
  invalidateShadowMap,
  shouldInvalidateShadowMap,
  type ShadowRelevantState,
} from './shadowInvalidation'

const state = (): ShadowRelevantState => ({
  boardHexes: {},
  boardPieces: [],
  hexMap: {},
  lightPositions: {},
  viewingLevel: 0,
  isLightsAndShadowsRender: false,
  graphicsTier: 'low',
  effectiveGraphicsTier: 'low',
  isShowStartZones: true,
})

describe('static shadow map invalidation', () => {
  it('invalidates for every state input that can change a shadow', () => {
    const original = state()
    const updates: ShadowRelevantState[] = [
      { ...original, boardHexes: {} },
      { ...original, boardPieces: [] },
      { ...original, hexMap: {} },
      { ...original, lightPositions: {} },
      { ...original, viewingLevel: 1 },
      { ...original, isLightsAndShadowsRender: true },
      { ...original, graphicsTier: 'medium' },
      { ...original, effectiveGraphicsTier: 'medium' },
      { ...original, isShowStartZones: false },
    ]

    for (const updated of updates) {
      expect(shouldInvalidateShadowMap(original, updated)).toBe(true)
    }
  })

  it('does not invalidate for hover, selection, or camera-only changes', () => {
    const original = {
      ...state(),
      hoveredWorldPoint: undefined,
      selectedPieceIDs: [],
      cameraPosition: [0, 0, 0],
    }
    const updated = {
      ...original,
      hoveredWorldPoint: { x: 1, z: 2 },
      selectedPieceIDs: ['piece'],
      cameraPosition: [1, 0, 0],
    }
    expect(shouldInvalidateShadowMap(original, updated)).toBe(false)
  })

  it('sets the renderer shadow map update flag', () => {
    const shadowMap = { needsUpdate: false }
    invalidateShadowMap(shadowMap)
    expect(shadowMap.needsUpdate).toBe(true)
  })
})
