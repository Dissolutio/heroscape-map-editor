import { type DecodedPieceID, Pieces } from '../types'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import {
  SvgBattlement,
  SvgBoardPieceLaurWallLong,
  SvgBoardPieceLaurWallLongArch,
  SvgBoardPieceLaurWallRuin,
  SvgBoardPieceLaurWallShort,
  SvgLaurWallArchText,
  SvgRoadWall,
  SvgRopeLadder,
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
  // RopeLadders
  if (inventoryID === Pieces.ropeLadder) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgRopeLadder
          piece={piece}
          isSubLevel={isSubLevel}
          pieceRotation={pieceRotation}
        />
      </g>
    )
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
  if (inventoryID === Pieces.laurWallArch) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgBoardPieceLaurWallLongArch piece={piece} isSubLevel={isSubLevel} />
        <g
          // flip upside down text, all other rotations are legible
          transform={
            pieceRotation === 150 || pieceRotation === 210
              ? 'rotate(-180)'
              : 'rotate(0)'
          }
        >
          <SvgLaurWallArchText
            isSubLevel={isSubLevel}
            pieceRotation={pieceRotation}
          />
        </g>
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
