import { type DecodedPieceID, Pieces } from '../types'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import {
  SvgBattlement,
  SvgBoardPieceLaurWallLong,
  SvgBoardPieceLaurWallRuin,
  SvgBoardPieceLaurWallShort,
  SvgRoadWall,
} from './SvgMapShapes'

export const SvgMapBoardPiece = ({
  piece,
  viewingLevel,
}: { piece: DecodedPieceID; viewingLevel: number }) => {
  const altitudeAdjusted = piece.altitude + 1
  const pixel = hexUtilsHexToPixel(piece.pieceCoords)
  const isSubLevel = altitudeAdjusted < viewingLevel
  const { inventoryID } = piece
  const isVisible = altitudeAdjusted <= viewingLevel
  const pieceRotation = ((piece?.rotation ?? 0) % 6) * 60
  // EARLY RETURN: NOT VISIBLE
  if (!isVisible) {
    return null
  }
  // BATTLEMENTS
  if (inventoryID === Pieces.battlement) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgBattlement piece={piece} isSubLevel={isSubLevel} />
      </g>
    )
  }

  // LADDERS

  // ROADWALLS
  if (inventoryID === Pieces.roadWall) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgRoadWall piece={piece} isSubLevel={isSubLevel} />
      </g>
    )
  }

  // LAUR LONGWALLS
  if (inventoryID === Pieces.laurWallLong) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgBoardPieceLaurWallLong piece={piece} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // LAUR SHORTWALLS
  if (inventoryID === Pieces.laurWallShort) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgBoardPieceLaurWallShort piece={piece} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // LAUR RUINS
  if (inventoryID === Pieces.laurWallRuin1) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgBoardPieceLaurWallRuin piece={piece} isSubLevel={isSubLevel} />
      </g>
    )
  }
  return null
}
