import { describe, expect, it, vi } from 'vitest'
import {
  captureWithOptionalHighQuality,
  type PictureQualitySettings,
} from './pictureQuality'

describe('picture-only High quality', () => {
  it('leaves settings untouched when disabled', async () => {
    const capture = vi.fn(() => 'captured')
    const setGraphicsTier = vi.fn(async () => undefined)

    await expect(
      captureWithOptionalHighQuality({
        enabled: false,
        getSettings: () => ({ graphicsTier: 'medium', lights: false }),
        setGraphicsTier,
        setLights: vi.fn(),
        isHighReady: vi.fn(() => false),
        waitForSettledFrames: vi.fn(async () => undefined),
        capture,
        warn: vi.fn(),
      }),
    ).resolves.toBe('captured')
    expect(setGraphicsTier).not.toHaveBeenCalled()
    expect(capture).toHaveBeenCalledOnce()
  })

  it('captures with High and restores the exact previous settings', async () => {
    const settings: PictureQualitySettings = {
      graphicsTier: 'medium',
      lights: false,
    }
    const setGraphicsTier = vi.fn(async (graphicsTier) => {
      settings.graphicsTier = graphicsTier
      if (graphicsTier === 'high') settings.lights = true
    })
    const setLights = vi.fn((lights) => {
      settings.lights = lights
    })
    const capture = vi.fn(() => ({ ...settings }))
    const waitForSettledFrames = vi.fn(async () => undefined)

    await expect(
      captureWithOptionalHighQuality({
        enabled: true,
        getSettings: () => ({ graphicsTier: 'medium', lights: false }),
        setGraphicsTier,
        setLights,
        isHighReady: () => settings.graphicsTier === 'high',
        waitForSettledFrames,
        capture,
        warn: vi.fn(),
      }),
    ).resolves.toEqual({ graphicsTier: 'high', lights: true })

    expect(waitForSettledFrames).toHaveBeenCalledOnce()
    expect(settings).toEqual({ graphicsTier: 'medium', lights: false })
    expect(setGraphicsTier.mock.calls.map(([tier]) => tier)).toEqual([
      'high',
      'medium',
    ])
    expect(setLights).toHaveBeenCalledWith(false)
  })

  it('warns, restores, and captures in the current mode when High fails', async () => {
    const settings: PictureQualitySettings = {
      graphicsTier: 'low',
      lights: true,
    }
    const setGraphicsTier = vi.fn(async (graphicsTier) => {
      settings.graphicsTier = graphicsTier
      if (graphicsTier === 'high') settings.graphicsTier = 'low'
    })
    const setLights = vi.fn((lights) => {
      settings.lights = lights
    })
    const capture = vi.fn(() => ({ ...settings }))
    const warn = vi.fn()

    await expect(
      captureWithOptionalHighQuality({
        enabled: true,
        getSettings: () => ({ graphicsTier: 'low', lights: true }),
        setGraphicsTier,
        setLights,
        isHighReady: () => false,
        waitForSettledFrames: vi.fn(async () => undefined),
        capture,
        warn,
      }),
    ).resolves.toEqual({ graphicsTier: 'low', lights: true })
    expect(warn).toHaveBeenCalledOnce()
    expect(setGraphicsTier.mock.calls.map(([tier]) => tier)).toEqual([
      'high',
      'low',
    ])
  })
})
