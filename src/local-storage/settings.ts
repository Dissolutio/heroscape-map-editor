import { isEqual } from 'lodash'
import { blankPieceInventory } from '../inventory/blankInventory'
import type { PieceInventory, TerrainConstraintSource } from '../types'
import { normalizePieceInventory } from '../utils/piece-inventory'
import { LS_KEYS } from './keys'
import {
  safeGetJSON,
  safeHasItem,
  safeRemove,
  safeSetItem,
} from './safeStorage'

export type LightPosition = [number, number, number]
export type PdfRenderFormat =
  | 'coversheet'
  | 'shortHeader'
  | 'condensedCoversheet'

export type SettingsValues = {
  isOrthoCam: boolean
  isLightsAndShadowsRender: boolean
  isShowLightControls: boolean
  isTopOutlinedInterlockHexes: boolean
  isHighQualityRender: boolean
  isDisplayCapHeights: boolean
  isHideTableTop: boolean
  useLegacyStartZones: boolean
  isShowStartZones: boolean
  pdfRenderFormat: PdfRenderFormat
  isShowPDFInventory: boolean
  isPdfColorBorders: boolean
  isShowPdfOverlayLayer: boolean
  isShowPdfOverlayOnPlacedLevel: boolean
  isShowPdfGridLinesOverSublevels: boolean
  isShowPdfLevelLogo: boolean
  isShowPdfTileLetters: boolean
  isShowPdfBuriedMarks: boolean
  is2DOverlayLevelEnabled: boolean
  isShow2DExportLevelLogo: boolean
  isShow2DExportTileLetters: boolean
  isShow2DExportBuriedMarks: boolean
  lastPenMode: string
  lastPenSize: number
  lightPositions: Record<string, LightPosition>
  terrainConstraintSource: TerrainConstraintSource
  customConstraintInventory: PieceInventory
  customConstraintInventoryFileName: string
  genericSolidCapColor: string
  genericSolidSideColor: string
  genericFluidCapColor: string
  genericFluidSideColor: string
}

export const SETTINGS_DEFAULTS: SettingsValues = {
  isOrthoCam: true,
  isLightsAndShadowsRender: false,
  isShowLightControls: true,
  isTopOutlinedInterlockHexes: true,
  isHighQualityRender: false,
  isDisplayCapHeights: false,
  isHideTableTop: false,
  useLegacyStartZones: false,
  isShowStartZones: true,
  pdfRenderFormat: 'coversheet',
  isShowPDFInventory: true,
  isPdfColorBorders: false,
  isShowPdfOverlayLayer: true,
  isShowPdfOverlayOnPlacedLevel: false,
  isShowPdfGridLinesOverSublevels: true,
  isShowPdfLevelLogo: true,
  isShowPdfTileLetters: false,
  isShowPdfBuriedMarks: false,
  is2DOverlayLevelEnabled: true,
  isShow2DExportLevelLogo: true,
  isShow2DExportTileLetters: true,
  isShow2DExportBuriedMarks: false,
  lastPenMode: 'g',
  lastPenSize: 1,
  lightPositions: {},
  terrainConstraintSource: 'setsUsed',
  customConstraintInventory: blankPieceInventory,
  customConstraintInventoryFileName: '',
  genericSolidCapColor: '#e63cc8',
  genericSolidSideColor: '#a01e8c',
  genericFluidCapColor: '#ff96e6',
  genericFluidSideColor: '#c864b4',
}

export const SETTINGS_KEYS = Object.keys(
  SETTINGS_DEFAULTS,
) as (keyof SettingsValues)[]

export function resetGenericTerrainColorSettings(
  settings: SettingsValues,
): SettingsValues {
  return {
    ...settings,
    genericSolidCapColor: SETTINGS_DEFAULTS.genericSolidCapColor,
    genericSolidSideColor: SETTINGS_DEFAULTS.genericSolidSideColor,
    genericFluidCapColor: SETTINGS_DEFAULTS.genericFluidCapColor,
    genericFluidSideColor: SETTINGS_DEFAULTS.genericFluidSideColor,
  }
}

type SettingsBlob = {
  v: 1
  values: Partial<SettingsValues>
}

type SettingsStorage = {
  setItem: (key: string, value: string) => boolean
  removeItem: (key: string) => boolean
}

const defaultSettings = (): SettingsValues => ({
  ...SETTINGS_DEFAULTS,
  lightPositions: {},
  customConstraintInventory: { ...blankPieceInventory },
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isPdfRenderFormat = (value: unknown): value is PdfRenderFormat =>
  value === 'coversheet' ||
  value === 'shortHeader' ||
  value === 'condensedCoversheet'

const isTerrainConstraintSource = (
  value: unknown,
): value is TerrainConstraintSource =>
  value === 'none' ||
  value === 'setsUsed' ||
  value === 'personalInventory' ||
  value === 'inventoryFile'

const isLightPositions = (
  value: unknown,
): value is Record<string, LightPosition> =>
  isRecord(value) &&
  Object.values(value).every(
    (position) =>
      Array.isArray(position) &&
      position.length === 3 &&
      position.every((coordinate) => Number.isFinite(coordinate)),
  )

const validSettingValue = (
  key: keyof SettingsValues,
  value: unknown,
): unknown => {
  if (
    [
      'isOrthoCam',
      'isLightsAndShadowsRender',
      'isShowLightControls',
      'isTopOutlinedInterlockHexes',
      'isHighQualityRender',
      'isDisplayCapHeights',
      'isHideTableTop',
      'useLegacyStartZones',
      'isShowStartZones',
      'isShowPDFInventory',
      'isPdfColorBorders',
      'isShowPdfOverlayLayer',
      'isShowPdfOverlayOnPlacedLevel',
      'isShowPdfGridLinesOverSublevels',
      'isShowPdfLevelLogo',
      'isShowPdfTileLetters',
      'isShowPdfBuriedMarks',
      'is2DOverlayLevelEnabled',
      'isShow2DExportLevelLogo',
      'isShow2DExportTileLetters',
      'isShow2DExportBuriedMarks',
    ].includes(key)
  ) {
    return typeof value === 'boolean' ? value : undefined
  }

  switch (key) {
    case 'pdfRenderFormat':
      return isPdfRenderFormat(value) ? value : undefined
    case 'terrainConstraintSource':
      return isTerrainConstraintSource(value) ? value : undefined
    case 'customConstraintInventory':
      return isRecord(value) ? normalizePieceInventory(value) : undefined
    case 'customConstraintInventoryFileName':
    case 'lastPenMode':
      return typeof value === 'string' ? value : undefined
    case 'genericSolidCapColor':
    case 'genericSolidSideColor':
    case 'genericFluidCapColor':
    case 'genericFluidSideColor':
      return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
        ? value
        : undefined
    case 'lastPenSize':
      return typeof value === 'number' && Number.isFinite(value) && value > 0
        ? value
        : undefined
    case 'lightPositions':
      return isLightPositions(value) ? value : undefined
    default:
      return undefined
  }
}

export function migrateSettings(blob: unknown): unknown {
  return blob
}

function validatedSettings(
  values: unknown,
  base: SettingsValues = defaultSettings(),
): SettingsValues {
  if (!isRecord(values)) return base
  const result = { ...base }
  for (const key of SETTINGS_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(values, key)) continue
    const value = validSettingValue(key, values[key])
    if (value !== undefined) {
      Object.assign(result, { [key]: value })
    }
  }
  return result
}

function getOldMapConstraintSettings(): Partial<SettingsValues> | null {
  const savedMap = safeGetJSON(LS_KEYS.lastMap)
  const state =
    isRecord(savedMap) && isRecord(savedMap.state) ? savedMap.state : savedMap
  if (!isRecord(state)) return null

  const legacyKeys = [
    'terrainConstraintSource',
    'customConstraintInventory',
    'customConstraintInventoryFileName',
  ] as const
  const legacyValues: Record<string, unknown> = {}
  for (const key of legacyKeys) {
    if (Object.prototype.hasOwnProperty.call(state, key)) {
      legacyValues[key] = state[key]
    }
  }
  return Object.keys(legacyValues).length
    ? (validatedSettings(legacyValues) as Partial<SettingsValues>)
    : null
}

export function serializeSettings(values: SettingsValues): SettingsBlob | null {
  const differences: Partial<SettingsValues> = {}
  for (const key of SETTINGS_KEYS) {
    if (!isEqual(values[key], SETTINGS_DEFAULTS[key])) {
      Object.assign(differences, { [key]: values[key] })
    }
  }
  return Object.keys(differences).length ? { v: 1, values: differences } : null
}

export function loadSettings(): SettingsValues {
  const hasStoredSettings = safeHasItem(LS_KEYS.settings)
  if (hasStoredSettings === false) {
    const legacySettings = getOldMapConstraintSettings()
    if (legacySettings) {
      const migrated = validatedSettings(legacySettings)
      const serialized = serializeSettings(migrated)
      if (serialized) {
        safeSetItem(LS_KEYS.settings, JSON.stringify(serialized))
      }
      return migrated
    }
    return defaultSettings()
  }
  if (hasStoredSettings === null) return defaultSettings()

  const stored = safeGetJSON(LS_KEYS.settings)
  if (stored === null) return defaultSettings()

  const migrated = migrateSettings(stored)
  if (!isRecord(migrated) || migrated.v !== 1 || !isRecord(migrated.values)) {
    return defaultSettings()
  }
  return validatedSettings(migrated.values)
}

export function resetSettings(): boolean {
  return safeRemove(LS_KEYS.settings)
}

export function createSettingsWriter(storage: SettingsStorage, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: SettingsValues | undefined

  const flush = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    if (pending === undefined) return
    const values = pending
    pending = undefined
    const blob = serializeSettings(values)
    if (blob === null) {
      storage.removeItem(LS_KEYS.settings)
    } else {
      storage.setItem(LS_KEYS.settings, JSON.stringify(blob))
    }
  }

  return {
    schedule(values: SettingsValues) {
      pending = values
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(flush, delay)
    },
    flush,
  }
}

export function settingsChanged(
  previous: SettingsValues,
  current: SettingsValues,
): boolean {
  return SETTINGS_KEYS.some((key) => previous[key] !== current[key])
}

export function pickSettings(state: SettingsValues): SettingsValues {
  return Object.fromEntries(
    SETTINGS_KEYS.map((key) => [key, state[key]]),
  ) as SettingsValues
}
