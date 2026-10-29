export const MAX_PORTRAIT_SIZE = 1920
export const PORTRAIT_JPEG_QUALITY = 0.92
export const QUOTA_FALLBACK_PORTRAIT_SIZE = 800
export const QUOTA_FALLBACK_JPEG_QUALITY = 0.8

const storageFallbacks = new Map<string, string>()
const MAX_CACHED_STORAGE_FALLBACKS = 8

export function getPortraitDimensions(
  width: number,
  height: number,
  maxSize = MAX_PORTRAIT_SIZE,
) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    !Number.isFinite(maxSize) ||
    maxSize <= 0
  ) {
    throw new Error('Portrait dimensions must be positive finite numbers')
  }
  const scale = Math.min(1, maxSize / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function canvasToMapPortrait(
  source: CanvasImageSource,
  width: number,
  height: number,
): string {
  const portrait = encodeMapPortrait(
    source,
    width,
    height,
    MAX_PORTRAIT_SIZE,
    PORTRAIT_JPEG_QUALITY,
  )
  const fallback = encodeMapPortrait(
    source,
    width,
    height,
    QUOTA_FALLBACK_PORTRAIT_SIZE,
    QUOTA_FALLBACK_JPEG_QUALITY,
  )
  storageFallbacks.delete(portrait)
  storageFallbacks.set(portrait, fallback)
  if (storageFallbacks.size > MAX_CACHED_STORAGE_FALLBACKS) {
    const oldestPortrait = storageFallbacks.keys().next().value
    if (oldestPortrait) storageFallbacks.delete(oldestPortrait)
  }
  return portrait
}

export function getMapPortraitStorageFallback(
  portrait: string,
): string | undefined {
  return storageFallbacks.get(portrait)
}

function encodeMapPortrait(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxSize: number,
  quality: number,
) {
  const dimensions = getPortraitDimensions(width, height, maxSize)
  let drawSource = source
  let drawWidth = width
  let drawHeight = height

  while (
    Math.max(drawWidth / dimensions.width, drawHeight / dimensions.height) > 2
  ) {
    const nextWidth = Math.max(dimensions.width, Math.ceil(drawWidth / 2))
    const nextHeight = Math.max(dimensions.height, Math.ceil(drawHeight / 2))
    const intermediate = document.createElement('canvas')
    intermediate.width = nextWidth
    intermediate.height = nextHeight
    const context = intermediate.getContext('2d')
    if (!context) throw new Error('Could not create a portrait canvas')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(
      drawSource,
      0,
      0,
      drawWidth,
      drawHeight,
      0,
      0,
      nextWidth,
      nextHeight,
    )
    drawSource = intermediate
    drawWidth = nextWidth
    drawHeight = nextHeight
  }

  const canvas = document.createElement('canvas')
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create a portrait canvas')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.fillStyle = 'white'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(
    drawSource,
    0,
    0,
    drawWidth,
    drawHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  return canvas.toDataURL('image/jpeg', quality)
}
