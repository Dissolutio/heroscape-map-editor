export const SHROUDSHROOM13_ORIGIN_LINE_COLOR = '#808080'
export const SHROUDSHROOM13_ORIGIN_LINE_SUBLEVEL_COLOR = '#B3B3B3'
export const SHROUDSHROOM13_ORIGIN_LINE_WIDTH = 5

/**
 * The line runs from the origin hex center toward the hex vertex pointing away
 * from the three-hex centroid. With a `borderWidth`, it stops at the inner
 * edge of the piece's border band (the border's inner corner at that vertex is
 * `borderWidth / cos(30deg)` from the vertex), less half the stroke width so
 * the round cap does not poke into the border.
 */
export function getShroudshroom13OriginLine(
  rotation: number,
  radius: number,
  borderWidth = 0,
  lineWidth = SHROUDSHROOM13_ORIGIN_LINE_WIDTH,
) {
  const angle = (((rotation % 6) + 6) % 6) * (Math.PI / 3)
  const capAllowance = borderWidth ? lineWidth / 2 : 0
  const length = Math.max(
    0,
    radius - (borderWidth * 2) / Math.sqrt(3) - capAllowance,
  )
  const centroidX = (Math.sqrt(3) * length) / 2
  const centroidY = length / 2

  return {
    x1: 0,
    y1: 0,
    x2: -(centroidX * Math.cos(angle) - centroidY * Math.sin(angle)),
    y2: -(centroidX * Math.sin(angle) + centroidY * Math.cos(angle)),
  }
}
