import type { GraphicsTier } from '../../local-storage/settings'

export type PictureQualitySettings = {
  graphicsTier: GraphicsTier
  lights: boolean
}

export type PictureQualityOptions<T> = {
  enabled: boolean
  getSettings: () => PictureQualitySettings
  setGraphicsTier: (tier: GraphicsTier) => Promise<void>
  setLights: (enabled: boolean) => void
  isHighReady: () => boolean
  waitForSettledFrames: () => Promise<void>
  capture: () => T
  warn: () => void
}

export async function captureWithOptionalHighQuality<T>({
  enabled,
  getSettings,
  setGraphicsTier,
  setLights,
  isHighReady,
  waitForSettledFrames,
  capture,
  warn,
}: PictureQualityOptions<T>): Promise<T> {
  if (!enabled) return capture()

  const previous = getSettings()
  let restored = false
  const restore = async () => {
    await setGraphicsTier(previous.graphicsTier)
    setLights(previous.lights)
    restored = true
  }

  let ready = false
  try {
    await setGraphicsTier('high')
    ready = isHighReady()
    if (ready) await waitForSettledFrames()
  } catch {
    ready = false
  }

  if (!ready) {
    await restore()
    warn()
    return capture()
  }

  try {
    return capture()
  } finally {
    if (!restored) await restore()
  }
}
