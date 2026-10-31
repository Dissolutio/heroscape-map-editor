export type PictureCaptureOptions = {
  transparentBackground: boolean
  highQuality: boolean
}

export function resolvePictureCaptureOptions(
  defaults: PictureCaptureOptions,
  overrides: Partial<PictureCaptureOptions> = {},
): PictureCaptureOptions {
  return { ...defaults, ...overrides }
}
