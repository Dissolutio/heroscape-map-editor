import { getLaurLongWallSvgPolygonPoints } from '../pdf-svg-shared/hexPolygonPoints'
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
import { SVG_HEX_RADIUS } from '../utils/constants'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import {
  svgColors,
  svgSubLevelColors,
  voidAndPylonsExportColors,
  voidAndPylonsSublevelExportColors,
} from '../world/maphex/hexColors'

export type VoidMatExportPiece = Pick<
  BoardPiece,
  'inventoryID' | 'pieceCoords' | 'rotation'
>

const pylonColor = (name: PylonColor, isSubLevel: boolean) => {
  const colors = isSubLevel
    ? voidAndPylonsSublevelExportColors
    : voidAndPylonsExportColors
  if (name === 'black') return colors.voidPylonBlack
  if (name === 'lightGray') return colors.voidPylonLightGray
  return colors.voidPylonGray
}

export const SvgVoidPylonSymbol = ({
  inventoryID,
  isSubLevel,
}: {
  inventoryID: string
  isSubLevel: boolean
}) => {
  const shapes = getVoidPylonExportShapes(inventoryID)
  if (!shapes) return null

  return (
    <g transform={getVoidPylonExportTransform(SVG_HEX_RADIUS)}>
      {shapes.map((shape, index) =>
        shape.type === 'path' ? (
          <path
            key={index}
            d={shape.d}
            fill={pylonColor(shape.fill, isSubLevel)}
            stroke={
              shape.stroke ? pylonColor(shape.stroke, isSubLevel) : undefined
            }
            strokeWidth={shape.strokeWidth}
          />
        ) : (
          <ellipse
            key={index}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            fill={pylonColor(shape.fill, isSubLevel)}
          />
        ),
      )}
    </g>
  )
}

export const SvgDeflectorShield = ({ isSubLevel }: { isSubLevel: boolean }) => {
  const { points } = getLaurLongWallSvgPolygonPoints(SVG_HEX_RADIUS)
  return (
    <polygon
      points={points}
      fill={
        isSubLevel
          ? svgSubLevelColors.deflectorShield
          : svgColors.deflectorShield
      }
    />
  )
}

export const SvgVoidMatSymbol = ({
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
    <g
      transform={`translate(${pixel.x} ${pixel.y})rotate(${piece.rotation * 60})`}
    >
      <polygon points={pointsToSvgString(outline)} fill={color} />
      {cells.map((corners, index) => (
        <polygon
          key={index}
          points={pointsToSvgString(corners)}
          fill="none"
          stroke={gridColor}
          strokeWidth={VOID_MAT_GRID_LINE_WIDTH}
        />
      ))}
    </g>
  )
}
