export const ONION_SKIN_MAX_DISTANCE = 2

export function getOnionSkinOpacity(distance: number): number {
  const opacity = 1 - distance * 0.75
  return Math.max(0, Math.min(1, opacity))
}
