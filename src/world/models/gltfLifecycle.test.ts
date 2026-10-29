import { afterEach, describe, expect, it, vi } from 'vitest'
import { GLTF_IDLE_TIMEOUT_MS, trackGltfConsumer } from './gltfLifecycle'

afterEach(() => {
  vi.useRealTimers()
})

describe('GLTF consumer lifecycle', () => {
  it('evicts once after the idle timeout', () => {
    vi.useFakeTimers()
    const dispose = vi.fn()

    trackGltfConsumer('/subterrain_1.glb')(dispose)

    vi.advanceTimersByTime(GLTF_IDLE_TIMEOUT_MS - 1)
    expect(dispose).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(dispose).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(GLTF_IDLE_TIMEOUT_MS)
    expect(dispose).toHaveBeenCalledOnce()
  })

  it('cancels pending eviction when a consumer returns', () => {
    vi.useFakeTimers()
    const dispose = vi.fn()

    trackGltfConsumer('/subterrain_1.glb')(dispose)
    const releaseRemount = trackGltfConsumer('/subterrain_1.glb')
    vi.advanceTimersByTime(48)
    expect(dispose).not.toHaveBeenCalled()

    releaseRemount(dispose)
    vi.advanceTimersByTime(GLTF_IDLE_TIMEOUT_MS - 1)
    expect(dispose).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(dispose).toHaveBeenCalledOnce()
  })

  it('waits for the final consumer and preserves rapid remounts', () => {
    vi.useFakeTimers()
    const dispose = vi.fn()
    const releaseFirst = trackGltfConsumer('/subterrain_1.glb')
    const releaseSecond = trackGltfConsumer('/subterrain_1.glb')

    releaseFirst(dispose)
    vi.advanceTimersByTime(48)
    expect(dispose).not.toHaveBeenCalled()

    releaseSecond(dispose)
    const remount = trackGltfConsumer('/subterrain_1.glb')
    vi.advanceTimersByTime(48)
    expect(dispose).not.toHaveBeenCalled()

    remount(dispose)
    vi.advanceTimersByTime(GLTF_IDLE_TIMEOUT_MS)
    expect(dispose).toHaveBeenCalledOnce()
  })
})
