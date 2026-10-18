import type { PlacementStatus } from '../data/placement'

export type PlacementPreviewPattern = 'solid' | 'dashed' | 'cross'

export type PlacementPreviewStyle = {
  color: string
  pattern: PlacementPreviewPattern
}

const styles: Record<PlacementStatus, PlacementPreviewStyle> = {
  ok: { color: '#16a34a', pattern: 'solid' },
  conflict: { color: '#ea580c', pattern: 'dashed' },
  blocked: { color: '#dc2626', pattern: 'cross' },
}

export const getPlacementPreviewStyle = (
  status: PlacementStatus,
): PlacementPreviewStyle => ({ ...styles[status] })
