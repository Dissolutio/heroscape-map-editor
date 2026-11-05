import { describe, expect, it } from 'vitest'
import { shouldUseTieredModelTexture } from './texturedModelMaterial'

describe('tiered model texture selection', () => {
  it('uses base-color textures only when a non-Low tier is ready', () => {
    expect(shouldUseTieredModelTexture('low', 'ready', true)).toBe(false)
    expect(shouldUseTieredModelTexture('medium', 'ready', true)).toBe(true)
    expect(shouldUseTieredModelTexture('high', 'ready', true)).toBe(true)
    expect(shouldUseTieredModelTexture('high', 'fallback', true)).toBe(false)
    expect(shouldUseTieredModelTexture('medium', 'loading', true)).toBe(false)
    expect(shouldUseTieredModelTexture('medium', 'error', true)).toBe(false)
    expect(shouldUseTieredModelTexture('medium', 'ready', false)).toBe(false)
  })
})
