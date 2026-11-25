import { Ellipse, G, Path, Polygon } from '@react-pdf/renderer'
import {
  getLaurLongWallPdfPolygonPoints,
  getLaurLongWallSvgPolygonPoints,
} from '../pdf-svg-shared/hexPolygonPoints'
import {
  getVoidMatExportGeometry,
  pointsToSvgString,
  VOID_MAT_GRID_LINE_WIDTH,
} from '../pdf-svg-shared/voidMatExportGeometry'
import {
  getVoidPylonExportShapes,
  getVoidPylonExportTransform,
  type PylonColor,
} from '../pdf-svg-shared/voidPylonExportSymbol'
import type { BoardPiece } from '../types'
import { PDF_BORDER_WIDTH, SVG_HEX_RADIUS } from '../utils/constants'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import {
  svgColors,
  svgSubLevelColors,
  voidAndPylonsExportColors,
  voidAndPylonsSublevelExportColors,
} from '../world/maphex/hexColors'
import type { VoidMatExportPiece } from '../svg-map/SvgVoidAndPylons'

const pylonColor = (name: PylonColor, isSubLevel: boolean) => {
  const colors = isSubLevel
    ? voidAndPylonsSublevelExportColors
    : voidAndPylonsExportColors
  if (name === 'black') return colors.voidPylonBlack
  if (name === 'lightGray') return colors.voidPylonLightGray
  return colors.voidPylonGray
}

export const PdfVoidPylonSymbol = ({
  inventoryID,
  isSubLevel,
}: {
  inventoryID: string
  isSubLevel: boolean
}) => {
  const shapes = getVoidPylonExportShapes(inventoryID)
  if (!shapes) return null

  return (
    <G transform={getVoidPylonExportTransform(SVG_HEX_RADIUS)}>
      {shapes.map((shape, index) =>
        shape.type === 'path' ? (
          <Path
            key={index}
            d={shape.d}
            fill={pylonColor(shape.fill, isSubLevel)}
            stroke={
              shape.stroke ? pylonColor(shape.stroke, isSubLevel) : undefined
            }
            strokeWidth={shape.strokeWidth}
          />
        ) : (
          <Ellipse
            key={index}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            fill={pylonColor(shape.fill, isSubLevel)}
          />
        ),
      )}
    </G>
  )
}

export const PdfDeflectorShield = ({
  isSubLevel,
  isPieceKeyPreview,
}: {
  isSubLevel: boolean
  isPieceKeyPreview: boolean
}) => {
  const { points } = isPieceKeyPreview
    ? getLaurLongWallSvgPolygonPoints(SVG_HEX_RADIUS)
    : getLaurLongWallPdfPolygonPoints(SVG_HEX_RADIUS, PDF_BORDER_WIDTH)
  return (
    <Polygon
      points={points}
      fill={
        isSubLevel
          ? svgSubLevelColors.deflectorShield
          : svgColors.deflectorShield
      }
    />
  )
}

export const PdfVoidMatSymbol = ({
  piece,
  isSubLevel,
}: {
  piece: VoidMatExportPiece
  isSubLevel: boolean
}) => {
  const { outline, cells } = getVoidMatExportGeometry(piece)
  const color = isSubLevel
    ? voidAndPylonsSublevelExportColors.voidMat
    : voidAndPylonsExportColors.voidMat
  const gridColor = isSubLevel
    ? voidAndPylonsSublevelExportColors.voidMatGrid
    : voidAndPylonsExportColors.voidMatGrid
  const pixel = hexUtilsHexToPixel(piece.pieceCoords)

  return (
    <G
      transform={`translate(${pixel.x} ${pixel.y})rotate(${piece.rotation * 60})`}
    >
      <Polygon points={pointsToSvgString(outline)} fill={color} />
      {cells.map((corners, index) => (
        <Polygon
          key={index}
          points={pointsToSvgString(corners)}
          fill="none"
          stroke={gridColor}
          strokeWidth={VOID_MAT_GRID_LINE_WIDTH}
        />
      ))}
    </G>
  )
}
