import type { PlacementStatus } from '../data/placement'

export type PlacementPreviewPattern = 'solid' | 'dashed' | 'cross'

export type PlacementPreviewStyle = {
  color: string
  pattern: PlacementPreviewPattern
  secondaryPattern?: 'cross'
}

export const PLACEMENT_UNSUPPORTED_COLOR = '#d97706'

const styles: Record<PlacementStatus, PlacementPreviewStyle> = {
  ok: { color: '#16a34a', pattern: 'solid' },
  conflict: { color: '#ea580c', pattern: 'dashed' },
  blocked: { color: '#dc2626', pattern: 'cross' },
}

export const getPlacementPreviewStyle = (
  status: PlacementStatus,
  unsupported = false,
): PlacementPreviewStyle => ({
  ...styles[status],
  ...(unsupported
    ? {
        color:
          status === 'ok' ? PLACEMENT_UNSUPPORTED_COLOR : styles[status].color,
        secondaryPattern: 'cross' as const,
      }
    : {}),
})
