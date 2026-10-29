import { describe, expect, it } from 'vitest'
import {
  cropRectToNaturalPixels,
  fullImageCrop,
  getCropResultDimensionsText,
} from '../layout/cropMapPortrait'

describe('map picture crop helpers', () => {
  it('maps a scaled-down crop to natural image pixels', () => {
    expect(
      cropRectToNaturalPixels(
        { x: 10, y: 5, width: 40, height: 30 },
        {
          displayWidth: 100,
          displayHeight: 50,
          naturalWidth: 2400,
          naturalHeight: 1200,
        },
      ),
    ).toEqual({ x: 240, y: 120, width: 960, height: 720 })
  })

  it('clamps a crop to the natural image bounds', () => {
    expect(
      cropRectToNaturalPixels(
        { x: 90, y: 40, width: 20, height: 20 },
        {
          displayWidth: 100,
          displayHeight: 50,
          naturalWidth: 1000,
          naturalHeight: 500,
        },
      ),
    ).toEqual({ x: 900, y: 400, width: 100, height: 100 })
  })

  it('resets to a padding-free full-image crop', () => {
    expect(fullImageCrop()).toEqual({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })
    expect(fullImageCrop()).not.toBe(fullImageCrop())
  })

  it('reports the capped output dimensions', () => {
    expect(getCropResultDimensionsText(4000, 2000)).toBe('1920 x 960')
    expect(getCropResultDimensionsText(640, 360)).toBe('640 x 360')
  })
})
