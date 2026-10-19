import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  safeGetJSON,
  safeHasItem,
  safeRemove,
  safeSetItem,
} from '../local-storage/safeStorage'

describe('safe localStorage access', () => {
  const values = new Map<string, string>()
  const storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key)
    }),
  }

  beforeEach(() => {
    values.clear()
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', storage)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('round-trips JSON and removes keys', () => {
    expect(safeSetItem('test', JSON.stringify({ count: 2 }))).toEqual({
      ok: true,
    })
    expect(safeGetJSON('test')).toEqual({ count: 2 })
    safeRemove('test')
    expect(safeGetJSON('test')).toBeNull()
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('returns the fallback for absent or corrupted JSON', () => {
    expect(safeGetJSON('absent', { count: 0 })).toEqual({ count: 0 })
    values.set('broken', '{')
    expect(safeGetJSON('broken')).toBeNull()
    expect(console.warn).toHaveBeenCalledOnce()
  })

  it('reports whether a storage key exists', () => {
    expect(safeHasItem('absent')).toBe(false)
    values.set('present', 'null')
    expect(safeHasItem('present')).toBe(true)
  })

  it.each(['null', 'false', '0', '""'])(
    'preserves valid falsy JSON %s',
    (raw) => {
      values.set('test', raw)
      expect(safeGetJSON('test')).toEqual(JSON.parse(raw))
    },
  )

  it.each(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'])(
    'reports quota failures (%s) without throwing',
    (name) => {
      storage.setItem.mockImplementationOnce(() => {
        throw new DOMException('Full', name)
      })
      expect(safeSetItem('test', 'value')).toEqual({
        ok: false,
        quota: true,
      })
      expect(console.warn).toHaveBeenCalledOnce()
    },
  )

  it('distinguishes unavailable storage from quota', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new DOMException('Blocked', 'SecurityError')
      },
      setItem() {
        throw new DOMException('Blocked', 'SecurityError')
      },
      removeItem() {
        throw new DOMException('Blocked', 'SecurityError')
      },
    })
    expect(safeGetJSON('test', 'fallback')).toBe('fallback')
    expect(safeSetItem('test', 'value')).toEqual({
      ok: false,
      quota: false,
    })
    expect(() => safeRemove('test')).not.toThrow()
    expect(console.warn).toHaveBeenCalledTimes(3)
  })

  it('guards access to the localStorage property itself', () => {
    vi.stubGlobal('localStorage', undefined)
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Blocked', 'SecurityError')
      },
    })
    expect(safeGetJSON('test')).toBeNull()
    expect(safeSetItem('test', 'value')).toEqual({
      ok: false,
      quota: false,
    })
    expect(() => safeRemove('test')).not.toThrow()
  })
})
