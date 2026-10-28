/**
 * Switches for the browser-automation hooks (see e2e/README.md).
 *
 * Both are computed ONCE, when this module is first imported. The router
 * redirects `/` to `/hs` and the share-link loader rewrites the URL, and both
 * drop the query string, so reading `?e2e` later would miss it.
 */
const hasE2EParam = () => {
  try {
    return new URLSearchParams(window.location.search).has('e2e')
  } catch {
    return false
  }
}

const hasWhatsNewOptIn = () => {
  try {
    return new URLSearchParams(window.location.search).get('whats-new') === '1'
  } catch {
    return false
  }
}

const hasPerHexLandParam = () => {
  try {
    return new URLSearchParams(window.location.search).get('perHexLand') === '1'
  } catch {
    return false
  }
}

const isBrowser = typeof window !== 'undefined'

/**
 * True when the test hooks should exist: `window.__TEST__`, the ready signal,
 * and the hidden status element. On in dev builds, and in any build opened
 * with `?e2e=1`. Production without `?e2e` is untouched.
 */
export const isE2E: boolean =
  isBrowser && (import.meta.env.DEV || hasE2EParam())

/**
 * True only with an explicit `?e2e` param. Gates changes that alter what is
 * drawn (such as seeding cosmetic randomness), so plain `npm run dev` looks
 * exactly as it always did.
 */
export const isE2EDeterministic: boolean = isBrowser && hasE2EParam()

/** Explicit, session-only opt-in to the development per-hex land renderer. */
export const isPerHexLandEnabled: boolean =
  isBrowser && import.meta.env.DEV && hasPerHexLandParam()

export const initialE2EGraphicsTier: 'low' | 'medium' | 'high' | null = (() => {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('e2e') !== '1' || params.get('perHexLand') !== '1') {
      return null
    }
    const tier = params.get('graphicsTier')
    return tier === 'low' || tier === 'medium' || tier === 'high' ? tier : null
  } catch {
    return null
  }
})()

/** Explicit opt-in to the automatic What's New dialog in an e2e run. */
export const isWhatsNewE2EOptIn: boolean =
  isBrowser && hasE2EParam() && hasWhatsNewOptIn()
