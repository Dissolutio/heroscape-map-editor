export type ToneMapping = 'none' | 'neutral' | 'aces' | 'agx'

export type LookSettings = {
  toneMapping: ToneMapping
  exposure: number
  ambientIntensity: number
  hemisphereIntensity: number
  pointLightIntensity: number
  lightColor: string
  shine: number
  backgroundColor: string
  tableColor: string
}

export const LOOK_SETTINGS_VERSION = 1

export const DEFAULT_LOOK_SETTINGS: LookSettings = {
  toneMapping: 'aces',
  exposure: 1,
  ambientIntensity: 0.5,
  hemisphereIntensity: 0.5,
  pointLightIntensity: 200,
  lightColor: '#ffffff',
  shine: 1,
  backgroundColor: '#ffffff',
  tableColor: '#ffffff',
}

export const LOOK_SETTING_RANGES = {
  exposure: { min: 0.3, max: 3, step: 0.05 },
  ambientIntensity: { min: 0, max: 4, step: 0.05 },
  hemisphereIntensity: { min: 0, max: 2, step: 0.05 },
  pointLightIntensity: { min: 0, max: 400, step: 5 },
  shine: { min: 0.5, max: 2.5, step: 0.05 },
} as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isToneMapping = (value: unknown): value is ToneMapping =>
  value === 'none' || value === 'neutral' || value === 'aces' || value === 'agx'

const sanitizeNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback

const sanitizeColor = (value: unknown, fallback: string) =>
  typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value : fallback

export function sanitizeLookSettings(value: unknown): LookSettings {
  const settings = isRecord(value) ? value : {}
  return {
    toneMapping: isToneMapping(settings.toneMapping)
      ? settings.toneMapping
      : DEFAULT_LOOK_SETTINGS.toneMapping,
    exposure: sanitizeNumber(
      settings.exposure,
      DEFAULT_LOOK_SETTINGS.exposure,
      LOOK_SETTING_RANGES.exposure.min,
      LOOK_SETTING_RANGES.exposure.max,
    ),
    ambientIntensity: sanitizeNumber(
      settings.ambientIntensity,
      DEFAULT_LOOK_SETTINGS.ambientIntensity,
      LOOK_SETTING_RANGES.ambientIntensity.min,
      LOOK_SETTING_RANGES.ambientIntensity.max,
    ),
    hemisphereIntensity: sanitizeNumber(
      settings.hemisphereIntensity,
      DEFAULT_LOOK_SETTINGS.hemisphereIntensity,
      LOOK_SETTING_RANGES.hemisphereIntensity.min,
      LOOK_SETTING_RANGES.hemisphereIntensity.max,
    ),
    pointLightIntensity: sanitizeNumber(
      settings.pointLightIntensity,
      DEFAULT_LOOK_SETTINGS.pointLightIntensity,
      LOOK_SETTING_RANGES.pointLightIntensity.min,
      LOOK_SETTING_RANGES.pointLightIntensity.max,
    ),
    lightColor: sanitizeColor(
      settings.lightColor,
      DEFAULT_LOOK_SETTINGS.lightColor,
    ),
    shine: sanitizeNumber(
      settings.shine,
      DEFAULT_LOOK_SETTINGS.shine,
      LOOK_SETTING_RANGES.shine.min,
      LOOK_SETTING_RANGES.shine.max,
    ),
    backgroundColor: sanitizeColor(
      settings.backgroundColor,
      DEFAULT_LOOK_SETTINGS.backgroundColor,
    ),
    tableColor: sanitizeColor(
      settings.tableColor,
      DEFAULT_LOOK_SETTINGS.tableColor,
    ),
  }
}

export function clampLookRoughness(roughness: number, shine: number) {
  return Math.min(1, Math.max(0.04, roughness * shine))
}

export function getAmbientIntensity(
  settings: LookSettings,
  isLightsAndShadowsRender: boolean,
) {
  return settings.ambientIntensity * (isLightsAndShadowsRender ? 1 : 4)
}
