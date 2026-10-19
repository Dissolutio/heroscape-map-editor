const MAX_PORTRAIT_SIZE = 800

export function getPortraitDimensions(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error('Portrait dimensions must be positive finite numbers')
  }
  const scale = Math.min(1, MAX_PORTRAIT_SIZE / Math.max(width, height))
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
  const dimensions = getPortraitDimensions(width, height)
  const canvas = document.createElement('canvas')
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create a portrait canvas')
  context.fillStyle = 'white'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

export async function downscaleMapPortrait(source: string): Promise<string> {
  const image = new Image()
  image.src = source
  await image.decode()
  return canvasToMapPortrait(image, image.naturalWidth, image.naturalHeight)
}
