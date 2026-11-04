export function blendColorWithWhite(color: string, opacity: number): string {
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    throw new RangeError('Opacity must be between 0 and 1')
  }

  const hexMatch = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color)
  let channels: number[]

  if (hexMatch) {
    const digits =
      hexMatch[1].length === 3
        ? [...hexMatch[1]].map((digit) => `${digit}${digit}`).join('')
        : hexMatch[1]
    channels = [0, 2, 4].map((index) =>
      Number.parseInt(digits.slice(index, index + 2), 16),
    )
  } else {
    const rgbMatch =
      /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(
        color,
      )
    if (!rgbMatch) throw new TypeError(`Invalid color: ${color}`)
    channels = rgbMatch.slice(1).map(Number)
    if (channels.some((channel) => channel > 255)) {
      throw new TypeError(`Invalid color: ${color}`)
    }
  }

  return `#${channels
    .map((channel) =>
      Math.round(channel * opacity + 255 * (1 - opacity))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`
}
