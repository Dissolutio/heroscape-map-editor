import { cloneElement } from 'react'
import { getPieceExportSymbol } from '../pdf-svg-shared/pieceLegend'
import {
  type BoardHex,
  type DecodedPieceID,
  HexTerrain,
  Pieces,
} from '../types'
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
  SvgStartZone,
} from './SvgMapShapes'

export const SvgMapBoardPiece = ({
  piece,
  viewingLevel,
  overlayLevel,
  is2DOverlayLevelEnabled = false,
  isPieceKeyPreview = false,
  archTextOffsetX,
}: {
  piece: DecodedPieceID
  viewingLevel: number
  overlayLevel: number
  is2DOverlayLevelEnabled?: boolean
  isPieceKeyPreview?: boolean
  archTextOffsetX?: number
}) => {
  const altitudeAdjusted = piece.altitude + 1
  const pixel = hexUtilsHexToPixel(piece.pieceCoords)
  const isSubLevel = !isPieceKeyPreview && altitudeAdjusted < viewingLevel
  const { inventoryID } = piece
  const exportSymbol = getPieceExportSymbol(inventoryID)
  const isVisible = isPieceKeyPreview || altitudeAdjusted <= viewingLevel
  const pieceRotation = ((piece?.rotation ?? 0) % 6) * 60
  const boardPieceAsHex: BoardHex = {
    id: piece.boardHexID,
    q: piece.pieceCoords.q,
    r: piece.pieceCoords.r,
    s: piece.pieceCoords.s,
    altitude: altitudeAdjusted,
    pieceID: piece.boardPieceID,
    boardPieceUID: piece.boardPieceID,
    inventoryID: piece.inventoryID,
    terrain: piece.terrain,
    pieceRotation: piece.rotation,
  }
  // EARLY RETURN: NOT VISIBLE
  if (!isVisible) {
    return null
  }
  // Start Zones
  if (exportSymbol === 'start-zone') {
    const isOverlayViewing =
      is2DOverlayLevelEnabled && viewingLevel === overlayLevel
    const specialIsSubLevel =
      isPieceKeyPreview || isOverlayViewing ? false : isSubLevel
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgStartZone hex={boardPieceAsHex} isSubLevel={specialIsSubLevel} />
      </g>
    )
  }
  // RopeLadders
  if (exportSymbol === 'rope-ladder') {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgRopeLadder
          piece={piece}
          isSubLevel={isSubLevel}
          pieceRotation={pieceRotation}
          isPieceKeyPreview={isPieceKeyPreview}
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
  if (exportSymbol === 'laur-long') {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgBoardPieceLaurWallLong
          piece={piece}
          isSubLevel={isSubLevel}
          isPieceKeyPreview={isPieceKeyPreview}
        />
      </g>
    )
  }
  if (exportSymbol === 'laur-arch') {
    const archText =
      archTextOffsetX === undefined ? (
        <SvgLaurWallArchText
          isSubLevel={isSubLevel}
          pieceRotation={pieceRotation}
        />
      ) : (
        cloneElement(
          SvgLaurWallArchText({
            isSubLevel,
            pieceRotation,
          }),
          {
            x: archTextOffsetX,
            textAnchor: 'middle',
          },
        )
      )
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgBoardPieceLaurWallLongArch
          piece={piece}
          isSubLevel={isSubLevel}
          isPieceKeyPreview={isPieceKeyPreview}
        />
        <g
          // flip upside down text, all other rotations are legible
          transform={
            pieceRotation === 150 || pieceRotation === 210
              ? 'rotate(-180)'
              : 'rotate(0)'
          }
        >
          {archText}
        </g>
      </g>
    )
  }
  // LAUR SHORTWALLS
  if (exportSymbol === 'laur-short') {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgBoardPieceLaurWallShort
          piece={piece}
          isSubLevel={isSubLevel}
          isPieceKeyPreview={isPieceKeyPreview}
        />
      </g>
    )
  }
  // LAUR RUINS
  if (exportSymbol === 'laur-ruin') {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgBoardPieceLaurWallRuin
          piece={piece}
          isSubLevel={isSubLevel}
          isPieceKeyPreview={isPieceKeyPreview}
        />
      </g>
    )
  }
  return null
}
