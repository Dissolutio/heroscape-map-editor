import type { ObjectiveMarker } from '../data/objectiveMarkers'
import {
  getObjectiveMarkerExportColors,
  getObjectiveMarkerExportGeometry,
} from '../pdf-svg-shared/objectiveMarkerExport'

const getMarkerText = (marker: ObjectiveMarker) =>
  marker.content.kind === 'number'
    ? String(marker.content.value)
    : marker.content.value

const pointsToString = (points: { x: number; y: number }[]) =>
  points.map(({ x, y }) => `${x},${y}`).join(' ')

export function SvgObjectiveMarkerOverlay({
  markers,
}: {
  markers: ObjectiveMarker[]
}) {
  if (!markers.length) return null

  return (
    <g data-testid="objective-marker-overlay">
      {markers.map((marker) => {
        const geometry = getObjectiveMarkerExportGeometry(marker)
        const colors = getObjectiveMarkerExportColors(marker)
        return (
          <g
            key={marker.uid}
            data-objective-marker-uid={marker.uid}
            transform={`translate(${geometry.center.x} ${geometry.center.y}) rotate(${geometry.rotationDegrees})`}
          >
            <polygon
              points={pointsToString(geometry.outerPoints)}
              fill={colors.foreground}
            />
            <polygon
              points={pointsToString(geometry.facePoints)}
              fill={colors.face}
            />
            <text
              x={geometry.textPosition.x}
              y={geometry.textPosition.y + geometry.textFontSize * 0.35}
              fill={colors.foreground}
              fontSize={geometry.textFontSize}
              fontFamily="Inter, Arial, Helvetica, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
            >
              {getMarkerText(marker)}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function SvgObjectiveMarkerLegend({
  markers,
  x,
  y,
  fontSize,
  rowHeight,
}: {
  markers: ObjectiveMarker[]
  x: number
  y: number
  fontSize: number
  rowHeight: number
}) {
  if (!markers.length) return null

  return (
    <g data-testid="objective-marker-legend">
      {markers.map((marker, index) => {
        const geometry = getObjectiveMarkerExportGeometry(marker)
        const colors = getObjectiveMarkerExportColors(marker)
        const rowY = y + index * rowHeight
        return (
          <g key={marker.uid}>
            <g
              transform={`translate(${x + 10} ${rowY + rowHeight / 2}) scale(0.13) rotate(${geometry.rotationDegrees})`}
            >
              <polygon
                points={pointsToString(geometry.outerPoints)}
                fill={colors.foreground}
              />
              <polygon
                points={pointsToString(geometry.facePoints)}
                fill={colors.face}
              />
            </g>
            <text
              x={x + 24}
              y={rowY + fontSize}
              fill="#000000"
              fontSize={fontSize}
              fontFamily="Inter, Arial, Helvetica, sans-serif"
            >
              {marker.name}
            </text>
          </g>
        )
      })}
    </g>
  )
}
