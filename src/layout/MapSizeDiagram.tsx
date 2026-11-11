import { useTheme } from '@mui/material'
import type { MapPhysicalSize } from '../utils/mapPhysicalSize'
import { formatMapPhysicalDimension } from '../utils/mapPhysicalSize'

const VIEWBOX_WIDTH = 220
const VIEWBOX_HEIGHT = 160
const DIAGRAM_WIDTH = 270
const DIAGRAM_HEIGHT = 195
const TABLE_AREA = {
  x: 20,
  y: 14,
  width: 146,
  height: 88,
}

export function MapSizeDiagram({
  isHexagon,
  size,
  ariaLabel,
}: {
  isHexagon: boolean
  size: MapPhysicalSize
  ariaLabel: string
}) {
  const theme = useTheme()
  const scale = Math.min(
    TABLE_AREA.width / size.widthIn,
    TABLE_AREA.height / size.lengthIn,
  )
  const width = size.widthIn * scale
  const height = size.lengthIn * scale
  const x = TABLE_AREA.x + (TABLE_AREA.width - width) / 2
  const y = TABLE_AREA.y + (TABLE_AREA.height - height) / 2
  const right = x + width
  const bottom = y + height
  const widthDimensionY = bottom + 13
  const lengthDimensionX = right + 14
  const diagonalCenterX = (x + right) / 2
  const diagonalCenterY = (y + bottom) / 2
  const diagonalAngle = (Math.atan2(y - bottom, right - x) * 180) / Math.PI
  const hexagonPointCoords: [number, number][] = [
    [x, y + height / 2],
    [x + width * 0.25, y],
    [x + width * 0.75, y],
    [right, y + height / 2],
    [x + width * 0.75, bottom],
    [x + width * 0.25, bottom],
  ]
  const hexagonPoints = hexagonPointCoords
    .map(([pointX, pointY]) => `${pointX},${pointY}`)
    .join(' ')
  const widthLabel = formatMapPhysicalDimension(size.widthIn, size.widthCm)
  const lengthLabel = formatMapPhysicalDimension(size.lengthIn, size.lengthCm)
  const diagonalLabel = formatMapPhysicalDimension(
    size.diagonalIn,
    size.diagonalCm,
  )
  const primary = theme.palette.text.primary
  const secondary = theme.palette.text.secondary
  const background = theme.palette.background.paper

  return (
    <svg
      aria-label={ariaLabel}
      data-testid="map-size-diagram"
      height={DIAGRAM_HEIGHT}
      role="img"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      width={DIAGRAM_WIDTH}
      xmlns="http://www.w3.org/2000/svg"
      style={{ maxWidth: '100%', overflow: 'visible' }}
    >
      {isHexagon ? (
        <polygon
          points={hexagonPoints}
          fill="none"
          stroke={primary}
          strokeWidth="1.5"
        />
      ) : (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke={primary}
          strokeWidth="1.5"
        />
      )}
      <line
        x1={x}
        y1={bottom}
        x2={right}
        y2={y}
        stroke={secondary}
        strokeDasharray="4 3"
      />
      <text
        transform={`translate(${diagonalCenterX} ${diagonalCenterY}) rotate(${diagonalAngle}) translate(0 -14)`}
        x="0"
        y="0"
        fill={secondary}
        fontFamily={theme.typography.fontFamily}
        fontSize="11"
        paintOrder="stroke"
        stroke={background}
        strokeWidth="3"
        textAnchor="middle"
      >
        {diagonalLabel}
      </text>
      <line
        x1={x}
        y1={widthDimensionY}
        x2={right}
        y2={widthDimensionY}
        stroke={secondary}
      />
      <line
        x1={x}
        y1={widthDimensionY - 3}
        x2={x}
        y2={widthDimensionY + 3}
        stroke={secondary}
      />
      <line
        x1={right}
        y1={widthDimensionY - 3}
        x2={right}
        y2={widthDimensionY + 3}
        stroke={secondary}
      />
      <text
        x={(x + right) / 2}
        y={widthDimensionY + 11}
        fill={secondary}
        fontFamily={theme.typography.fontFamily}
        fontSize="11"
        textAnchor="middle"
      >
        {widthLabel}
      </text>
      <line
        x1={lengthDimensionX}
        y1={y}
        x2={lengthDimensionX}
        y2={bottom}
        stroke={secondary}
      />
      <line
        x1={lengthDimensionX - 3}
        y1={y}
        x2={lengthDimensionX + 3}
        y2={y}
        stroke={secondary}
      />
      <line
        x1={lengthDimensionX - 3}
        y1={bottom}
        x2={lengthDimensionX + 3}
        y2={bottom}
        stroke={secondary}
      />
      <text
        transform={`rotate(-90 ${lengthDimensionX + 10} ${(y + bottom) / 2})`}
        x={lengthDimensionX + 10}
        y={(y + bottom) / 2}
        fill={secondary}
        fontFamily={theme.typography.fontFamily}
        fontSize="11"
        textAnchor="middle"
      >
        {lengthLabel}
      </text>
    </svg>
  )
}
