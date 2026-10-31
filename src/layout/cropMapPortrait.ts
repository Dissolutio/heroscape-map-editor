import { getPortraitDimensions } from '../utils/mapPortrait'

export type CropRect = {
  x: number
  y: number
  width: number
  height: number
}

export type ImageSize = {
  displayWidth: number
  displayHeight: number
  naturalWidth: number
  naturalHeight: number
}

export const fullImageCrop = () => ({
  unit: '%' as const,
  x: 0,
  y: 0,
  width: 100,
  height: 100,
})

export function cropRectToNaturalPixels(
  crop: CropRect,
  image: ImageSize,
): CropRect {
  const { displayWidth, displayHeight, naturalWidth, naturalHeight } = image
  if (
    ![displayWidth, displayHeight, naturalWidth, naturalHeight].every(
      (value) => Number.isFinite(value) && value > 0,
    ) ||
    ![crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) ||
    crop.width <= 0 ||
    crop.height <= 0
  ) {
    throw new Error('Crop and image dimensions must be positive finite numbers')
  }

  const scaleX = naturalWidth / displayWidth
  const scaleY = naturalHeight / displayHeight
  const x = Math.max(0, Math.min(naturalWidth - 1, Math.floor(crop.x * scaleX)))
  const y = Math.max(
    0,
    Math.min(naturalHeight - 1, Math.floor(crop.y * scaleY)),
  )
  const right = Math.max(
    x + 1,
    Math.min(naturalWidth, Math.ceil((crop.x + crop.width) * scaleX)),
  )
  const bottom = Math.max(
    y + 1,
    Math.min(naturalHeight, Math.ceil((crop.y + crop.height) * scaleY)),
  )

  return { x, y, width: right - x, height: bottom - y }
}

export function getCropResultDimensionsText(width: number, height: number) {
  const dimensions = getPortraitDimensions(width, height)
  return `${dimensions.width} x ${dimensions.height}`
}
