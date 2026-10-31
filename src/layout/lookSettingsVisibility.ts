import type { GraphicsTier } from '../local-storage/settings'

export function isLookSettingsAvailable(
  selectedTier: GraphicsTier,
  effectiveTier: GraphicsTier,
): boolean {
  return selectedTier !== 'low' || effectiveTier !== 'low'
}
