import { describe, expect, it } from 'vitest'
import { shouldUseMarroHiveTexture } from './marroHiveMaterial'

describe('Marro Hive textured material selection', () => {
  it('uses the texture only when a non-Low tier and its textures are ready', () => {
    expect(shouldUseMarroHiveTexture('low', 'ready', true)).toBe(false)
    expect(shouldUseMarroHiveTexture('medium', 'ready', true)).toBe(true)
    expect(shouldUseMarroHiveTexture('high', 'ready', true)).toBe(true)
    expect(shouldUseMarroHiveTexture('high', 'fallback', true)).toBe(false)
    expect(shouldUseMarroHiveTexture('medium', 'loading', true)).toBe(false)
    expect(shouldUseMarroHiveTexture('medium', 'error', true)).toBe(false)
    expect(shouldUseMarroHiveTexture('high', 'ready', false)).toBe(false)
  })
})
