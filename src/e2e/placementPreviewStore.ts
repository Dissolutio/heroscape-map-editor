import type { PlacementStatus } from '../data/placement'

export type E2EPlacementPreview = {
  status: PlacementStatus
  reason: string | null
  footprintCount: number
  unsupported: boolean
}

let placementPreview: E2EPlacementPreview | null = null

export const getPlacementPreview = () => placementPreview

export const setPlacementPreview = (next: E2EPlacementPreview | null) => {
  placementPreview = next
}
