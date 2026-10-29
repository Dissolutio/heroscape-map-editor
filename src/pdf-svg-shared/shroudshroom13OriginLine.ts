export const SHROUDSHROOM13_ORIGIN_LINE_COLOR = '#808080'
export const SHROUDSHROOM13_ORIGIN_LINE_SUBLEVEL_COLOR = '#B3B3B3'
export const SHROUDSHROOM13_ORIGIN_LINE_WIDTH = 1

export function getShroudshroom13OriginLine(rotation: number, radius: number) {
  const angle = (((rotation % 6) + 6) % 6) * (Math.PI / 3)
  const centroidX = (Math.sqrt(3) * radius) / 2
  const centroidY = radius / 2

  return {
    x1: 0,
    y1: 0,
    x2: -(centroidX * Math.cos(angle) - centroidY * Math.sin(angle)),
    y2: -(centroidX * Math.sin(angle) + centroidY * Math.cos(angle)),
  }
}
