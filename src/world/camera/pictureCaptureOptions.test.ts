import { describe, expect, it } from 'vitest'
import { resolvePictureCaptureOptions } from './pictureCaptureOptions'

describe('picture capture options', () => {
  it('uses the saved options unless a capture explicitly overrides them', () => {
    expect(
      resolvePictureCaptureOptions(
        { transparentBackground: true, highQuality: false },
        { highQuality: true },
      ),
    ).toEqual({ transparentBackground: true, highQuality: true })
  })
})
