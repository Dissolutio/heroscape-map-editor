export type MapShareUrlParams = {
  m: string | null
  v: string | null
}

/**
 * Extracts the "m" (map data) and "v" (view mode) query params from a pasted
 * Hexoscape share URL. Users may paste a link copied from the production
 * site, a local dev/preview server, or the desktop app's `tauri://localhost`
 * origin - or just the raw query string - so we parse defensively instead of
 * assuming a particular origin/protocol.
 */
export function parseMapShareUrlParams(input: string): MapShareUrlParams {
  const trimmed = input.trim()
  if (!trimmed) {
    return { m: null, v: null }
  }

  // Absolute URL: http(s)://, tauri://, or any other scheme
  try {
    const url = new URL(trimmed)
    return { m: url.searchParams.get('m'), v: url.searchParams.get('v') }
  } catch {
    // Not an absolute URL, fall through to other formats
  }

  // Bare domain or relative path, e.g. "hexoscape.com/?m=..." or "/?m=..."
  try {
    const url = new URL(trimmed, 'https://placeholder.invalid')
    if (url.search) {
      return { m: url.searchParams.get('m'), v: url.searchParams.get('v') }
    }
  } catch {
    // Ignore, fall through to raw query string parsing
  }

  // Raw query string, e.g. "m=...&v=a" or "?m=...&v=a"
  const queryPart = trimmed.startsWith('?') ? trimmed.slice(1) : trimmed
  const params = new URLSearchParams(queryPart)
  return { m: params.get('m'), v: params.get('v') }
}

export type MapShareViewMode = 'pdf' | '2d' | 'default'

// Mirrors the "v" query param handling used when auto-loading a map from the URL.
export function getViewModeFromQueryParam(v: string | null): MapShareViewMode {
  if (v === 'a') return 'pdf'
  if (v === 'b') return '2d'
  return 'default'
}
