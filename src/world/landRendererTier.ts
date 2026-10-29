import type { GraphicsTier } from '../local-storage/settings'

export type LandRendererMode = 'legacy' | 'per-hex'

export function getLandRendererMode(
  effectiveGraphicsTier: GraphicsTier,
  forcePerHex = false,
): LandRendererMode {
  return forcePerHex || effectiveGraphicsTier !== 'low' ? 'per-hex' : 'legacy'
}
