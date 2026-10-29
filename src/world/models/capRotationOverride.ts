export type CapRotationOverride =
  | { mode: 'all' }
  | { mode: 'none' }
  | { mode: 'terrains'; terrains: ReadonlySet<string> }
  | null

export function parseCapRotationOverride(
  search: string,
  isDevelopment: boolean,
): CapRotationOverride {
  if (!isDevelopment) return null

  const value = new URLSearchParams(search).get('capRotation')
  if (value === null) return null
  if (value === 'all') return { mode: 'all' }
  if (value === 'none') return { mode: 'none' }

  return {
    mode: 'terrains',
    terrains: new Set(
      value
        .split(',')
        .map((terrain) => terrain.trim())
        .filter(Boolean),
    ),
  }
}

export function allowsCapRotation(
  terrainName: string | null,
  manifestAllowsRotation: boolean,
  override: CapRotationOverride,
) {
  if (override === null) return manifestAllowsRotation
  if (override.mode === 'all') return true
  if (override.mode === 'none') return false
  return terrainName !== null && override.terrains.has(terrainName)
}

function getStartupSearch() {
  try {
    return window.location.search
  } catch {
    return ''
  }
}

export const capRotationOverride = parseCapRotationOverride(
  getStartupSearch(),
  import.meta.env.DEV,
)
