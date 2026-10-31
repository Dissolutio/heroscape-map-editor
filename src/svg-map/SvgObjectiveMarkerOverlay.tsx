import type { ObjectiveMarker } from '../data/objectiveMarkers'
import {
  getObjectiveMarkerExportColors,
  getObjectiveMarkerExportGeometry,
  getObjectiveMarkerLegendLayout,
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
              fill={colors.face}
            />
            <polygon
              points={pointsToString(geometry.svgBorderPoints)}
              fill={colors.foreground}
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

  const layout = getObjectiveMarkerLegendLayout(markers, fontSize)
  const labelX = x + layout.padding + layout.swatchWidth + fontSize * 0.75

  return (
    <g data-testid="objective-marker-legend">
      {markers.map((marker, index) => {
        const geometry = layout.geometries[index]
        const colors = getObjectiveMarkerExportColors(marker)
        const rowY = y + index * rowHeight
        return (
          <g key={marker.uid}>
            <g
              transform={`translate(${x + layout.padding + layout.swatchWidth / 2} ${rowY + rowHeight / 2}) scale(${layout.scales[index]})`}
            >
              <polygon
                points={pointsToString(geometry.outerPoints)}
                fill={colors.face}
              />
              <polygon
                points={pointsToString(geometry.svgBorderPoints)}
                fill={colors.foreground}
              />
              <polygon
                points={pointsToString(geometry.outerPoints)}
                fill="none"
                stroke="#888888"
                strokeWidth={3}
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
            <text
              x={labelX}
              y={rowY + rowHeight / 2 + fontSize * 0.35}
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
