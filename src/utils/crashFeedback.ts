import * as Sentry from '@sentry/react'

export const MAX_CRASH_FEEDBACK_LENGTH = 2000

/**
 * Sends the user's description of a crash to Sentry, attached to the crash
 * event. Anonymous on purpose: the app has no accounts, so no name or email is
 * ever collected. Returns true if the report was handed to Sentry.
 *
 * Note Sentry is only enabled in production builds (see `src/sentry.js`), so in
 * dev this returns true but nothing leaves the browser.
 */
export function submitCrashFeedback(
  message: string,
  eventId?: string,
): boolean {
  const trimmed = message.trim().slice(0, MAX_CRASH_FEEDBACK_LENGTH)
  if (!trimmed) {
    return false
  }
  try {
    Sentry.captureFeedback({
      message: trimmed,
      ...(eventId ? { associatedEventId: eventId } : {}),
    })
    return true
  } catch {
    return false
  }
}
