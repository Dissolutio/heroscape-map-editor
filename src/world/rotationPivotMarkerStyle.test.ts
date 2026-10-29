import { describe, expect, it } from 'vitest'
import {
  ROTATION_PIVOT_MARKER_MATERIAL,
  ROTATION_PIVOT_MARKER_RENDER_ORDER,
} from './rotationPivotMarkerStyle'

describe('rotation pivot marker rendering', () => {
  it('draws after default-order fluid meshes without depth testing', () => {
    expect(ROTATION_PIVOT_MARKER_RENDER_ORDER).toBeGreaterThan(0)
    expect(ROTATION_PIVOT_MARKER_MATERIAL).toMatchObject({
      transparent: true,
      opacity: 1,
      depthTest: false,
    })
  })
})
