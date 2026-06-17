/**
 * Calculate opacity for a piece based on focus state and elapsed time.
 * Creates a fade effect: pieces fade to 0.22 immediately, then fade back to 1.0 over time.
 */
export function calculateFocusOpacity(
  focusedPieceUID: string | null,
  focusStartTime: number | null,
  targetUID?: string,
): number {
  // Not focused - return full opacity
  if (!focusedPieceUID || !focusStartTime) {
    return 1
  }

  // If checking a specific piece UID, only apply effect if NOT that piece
  if (targetUID && targetUID === focusedPieceUID) {
    return 1
  }

  const FADE_OUT_DURATION = 0 // immediate fade to 0.22
  const HOLD_DURATION = 1200 // hold at 0.22 for 1.2 seconds
  const FADE_IN_DURATION = 2000 // fade back to 1 over 2 seconds
  const TOTAL_DURATION = HOLD_DURATION + FADE_IN_DURATION

  const now = performance.now()
  const elapsed = now - focusStartTime

  // Fade out phase (immediate, < 1ms)
  if (elapsed < FADE_OUT_DURATION) {
    return 0.22
  }

  // Hold at reduced opacity
  if (elapsed < HOLD_DURATION) {
    return 0.22
  }

  // Fade back in phase
  if (elapsed < TOTAL_DURATION) {
    const fadeProgress = (elapsed - HOLD_DURATION) / FADE_IN_DURATION
    // Linear interpolation from 0.22 to 1.0
    return 0.22 + (1 - 0.22) * fadeProgress
  }

  // Animation complete, reset
  return 1
}
