import { G, Path, Polygon, Svg } from '@react-pdf/renderer'
import { useEffect, useState } from 'react'
import type { ObjectiveMarker } from '../data/objectiveMarkers'
import {
  getObjectiveMarkerExportColors,
  getObjectiveMarkerExportGeometry,
} from '../pdf-svg-shared/objectiveMarkerExport'
import { getInterFont, type OpenTypeFont } from '../svg-map/exportSvg'

const getMarkerText = (marker: ObjectiveMarker) =>
  marker.content.kind === 'number'
    ? String(marker.content.value)
    : marker.content.value

const pointsToString = (points: { x: number; y: number }[]) =>
  points.map(({ x, y }) => `${x},${y}`).join(' ')

function useInterFont(enabled: boolean) {
  const [font, setFont] = useState<OpenTypeFont | null>(null)

  useEffect(() => {
    if (!enabled) return
    let active = true
    void getInterFont().then((loadedFont) => {
      if (active) setFont(loadedFont)
    })
    return () => {
      active = false
    }
  }, [enabled])

  return font
}

export function PdfObjectiveMarkerOverlay({
  markers,
}: {
  markers: ObjectiveMarker[]
}) {
  const font = useInterFont(markers.length > 0)
  if (!markers.length) return null

  return <PdfObjectiveMarkerPaths markers={markers} font={font} />
}

export function PdfObjectiveMarkerPaths({
  markers,
  font,
}: {
  markers: ObjectiveMarker[]
  font: OpenTypeFont | null
}) {
  if (!markers.length) return null

  return (
    <>
      {markers.map((marker) => {
        const geometry = getObjectiveMarkerExportGeometry(marker)
        const colors = getObjectiveMarkerExportColors(marker)
        const text = getMarkerText(marker)
        const textPath = font
          ? font
              .getPath(
                text,
                geometry.textPosition.x -
                  font.getAdvanceWidth(text, geometry.textFontSize, {
                    kerning: true,
                  }) /
                    2,
                geometry.textPosition.y + geometry.textFontSize * 0.35,
                geometry.textFontSize,
                { kerning: true },
              )
              .toPathData(3)
          : null

        return (
          <G
            key={marker.uid}
            transform={`translate(${geometry.center.x} ${geometry.center.y}) rotate(${geometry.rotationDegrees})`}
          >
            <Polygon
              points={pointsToString(geometry.outerPoints)}
              fill={colors.foreground}
            />
            <Polygon
              points={pointsToString(geometry.facePoints)}
              fill={colors.face}
            />
            {textPath && <Path d={textPath} fill={colors.foreground} />}
          </G>
        )
      })}
    </>
  )
}

export function PdfObjectiveMarkerLegend({
  markers,
}: {
  markers: ObjectiveMarker[]
}) {
  const namedMarkers = markers.filter((marker) => marker.name?.trim())
  const font = useInterFont(namedMarkers.length > 0)
  return <PdfObjectiveMarkerLegendPaths markers={namedMarkers} font={font} />
}

export function PdfObjectiveMarkerLegendPaths({
  markers,
  font,
}: {
  markers: ObjectiveMarker[]
  font: OpenTypeFont | null
}) {
  if (!markers.length) return null

  const fontSize = 9
  const rowHeight = 18
  const nameX = 42
  const width = Math.max(
    120,
    ...markers.map((marker) => nameX + (marker.name?.length ?? 0) * fontSize),
  )
  const height = markers.length * rowHeight

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {markers.map((marker, index) => {
        const geometry = getObjectiveMarkerExportGeometry(marker)
        const colors = getObjectiveMarkerExportColors(marker)
        const rowY = index * rowHeight
        const textPath = font
          ? font
              .getPath(marker.name ?? '', nameX, rowY + fontSize, fontSize, {
                kerning: true,
              })
              .toPathData(3)
          : null
        return (
          <G key={marker.uid}>
            <G
              transform={`translate(18 ${rowY + rowHeight / 2}) scale(0.1) rotate(${geometry.rotationDegrees})`}
            >
              <Polygon
                points={pointsToString(geometry.outerPoints)}
                fill={colors.foreground}
              />
              <Polygon
                points={pointsToString(geometry.facePoints)}
                fill={colors.face}
              />
            </G>
            {textPath && <Path d={textPath} fill="#000000" />}
          </G>
        )
      })}
    </Svg>
  )
}
