import { describe, expect, it } from 'vitest'
import {
  buildVoidMarkerGeometryArrays,
  buildVoidMatGeometryArrays,
  VOID_MAT_UV_INSET,
} from '../world/models/voidMatGeometry'

describe('Void Mat texture coordinates', () => {
  it.each([
    ['Void Mat', buildVoidMatGeometryArrays],
    ['Void Marker', buildVoidMarkerGeometryArrays],
  ])('keeps %s UVs inset from texture edges', (_name, buildGeometry) => {
    const { uvs } = buildGeometry()
    const uCoordinates = uvs.filter((_, index) => index % 2 === 0)
    const vCoordinates = uvs.filter((_, index) => index % 2 === 1)

    expect(Math.min(...uCoordinates)).toBeGreaterThanOrEqual(VOID_MAT_UV_INSET)
    expect(Math.max(...uCoordinates)).toBeLessThanOrEqual(1 - VOID_MAT_UV_INSET)
    expect(Math.min(...vCoordinates)).toBeGreaterThanOrEqual(VOID_MAT_UV_INSET)
    expect(Math.max(...vCoordinates)).toBeLessThanOrEqual(1 - VOID_MAT_UV_INSET)
  })
})
