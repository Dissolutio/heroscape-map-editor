import { describe, expect, it } from 'vitest'
import {
  invalidateShadowMap,
  notifyModelMounted,
  requestShadowUpdate,
  SHADOW_SETTLE_FRAMES,
  shouldInvalidateShadowMap,
  subscribeToModelMounts,
  type ShadowRelevantState,
  updateShadowSettleWindow,
} from './shadowInvalidation'

const state = (): ShadowRelevantState => ({
  boardHexes: {},
  boardPieces: [],
  hexMap: {},
  lightPositions: {},
  lookSettings: {},
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
      { ...original, lookSettings: {} },
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

  it('does not invalidate for marker-only map changes', () => {
    const original = {
      ...state(),
      hexMap: { id: 'map', width: 4, objectiveMarkers: [] },
    }
    const updated = {
      ...original,
      hexMap: {
        ...original.hexMap,
        objectiveMarkers: [{ uid: 'marker' }],
      },
    }

    expect(shouldInvalidateShadowMap(original, updated)).toBe(false)
    expect(
      shouldInvalidateShadowMap(original, {
        ...updated,
        hexMap: { ...updated.hexMap, width: 5 },
      }),
    ).toBe(true)

    const moved = {
      ...updated,
      hexMap: {
        ...updated.hexMap,
        objectiveMarkers: [
          { uid: 'marker', anchor: { q: 1, r: 0, s: -1, altitude: 1 } },
        ],
      },
    }
    expect(shouldInvalidateShadowMap(updated, moved)).toBe(false)
  })

  it('sets the renderer shadow map update flag', () => {
    const shadowMap = { needsUpdate: false }
    invalidateShadowMap(shadowMap)
    expect(shadowMap.needsUpdate).toBe(true)
  })

  it('requests a refresh when a preloaded model mounts after loading is idle', () => {
    const shadowMap = { needsUpdate: false }
    const window = { framesRemaining: 0 }
    const eventTarget = new EventTarget()
    const unsubscribe = subscribeToModelMounts(eventTarget, () =>
      requestShadowUpdate(shadowMap, window),
    )

    notifyModelMounted(eventTarget)

    expect(shadowMap.needsUpdate).toBe(true)
    expect(window.framesRemaining).toBe(SHADOW_SETTLE_FRAMES)
    unsubscribe()
  })

  it('keeps shadows dirty across settling frames and pending model loads', () => {
    const shadowMap = { needsUpdate: false }
    const window = { framesRemaining: 0 }

    requestShadowUpdate(shadowMap, window)
    expect(window.framesRemaining).toBe(SHADOW_SETTLE_FRAMES)
    for (let frame = 0; frame < SHADOW_SETTLE_FRAMES; frame += 1) {
      shadowMap.needsUpdate = false
      updateShadowSettleWindow(shadowMap, window, false)
      expect(shadowMap.needsUpdate).toBe(true)
    }
    expect(window.framesRemaining).toBe(0)

    shadowMap.needsUpdate = false
    updateShadowSettleWindow(shadowMap, window, true)
    expect(shadowMap.needsUpdate).toBe(true)
    expect(window.framesRemaining).toBe(SHADOW_SETTLE_FRAMES - 1)
  })
})
