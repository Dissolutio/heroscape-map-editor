import { Line, Svg } from '@react-pdf/renderer'
import type { BoardHex, DecodedPieceID, PdfMapAltitudeChunk } from '../types'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { PdfMapHex } from './PdfMapHex'
import { PdfMapBoardPiece } from './PdfMapBoardPiece'

type ReactPdfSvgMapDisplayProps = {
  width: number
  length: number
  boardHexesArr: BoardHex[]
  boardPiecesArr: DecodedPieceID[]
  viewingLevel: number
  chunk?: PdfMapAltitudeChunk
}

export const ReactPdfSvgMapDisplay = ({
  width,
  length,
  boardHexesArr,
  boardPiecesArr,
  viewingLevel,
  chunk,
}: ReactPdfSvgMapDisplayProps) => {
  const emptyHexesArr = boardHexesArr.filter((hex) => hex.terrain === 'empty')
  const nonEmptyHexesArr = boardHexesArr.filter(
    (hex) => hex.terrain !== 'empty',
  )
  const adjustXForNew00Centers = 1.5 * SVG_HEX_APOTHEM
  const adjustYForNew00Centers = 1.2 * SVG_HEX_RADIUS
  const subLevelHexes = nonEmptyHexesArr.filter(
    (h) => h.altitude < viewingLevel,
  )
  const viewBoxStr = `${-adjustXForNew00Centers} ${-adjustYForNew00Centers} ${width + adjustXForNew00Centers} ${length + adjustYForNew00Centers}`
  return (
    <Svg viewBox={viewBoxStr}>
      {/* <PdfSvgXYHelperLines length={length} width={width} /> */}
      {emptyHexesArr.map((hex) => (
        <PdfMapHex key={hex.id} hex={hex} viewingLevel={viewingLevel} />
      ))}
      {subLevelHexes
        .sort((a, b) => a.altitude - b.altitude)
        .map((hex) => (
          <PdfMapHex key={hex.id} hex={hex} viewingLevel={viewingLevel} />
        ))}
      {nonEmptyHexesArr
        .filter((h) => h.altitude === viewingLevel)
        .map((hex) => (
          <PdfMapHex key={hex.id} hex={hex} viewingLevel={viewingLevel} />
        ))}
      {boardPiecesArr
        .filter((bp) => bp.altitude <= viewingLevel)
        .sort((a, b) => a.altitude - b.altitude)
        .map((bp) => (
          <PdfMapBoardPiece
            key={bp.boardPieceID}
            piece={bp}
            viewingLevel={viewingLevel}
          />
        ))}
      {boardPiecesArr
        .filter((bp) => bp.altitude === viewingLevel)
        .map((bp) => (
          <PdfMapBoardPiece
            key={bp.boardPieceID}
            piece={bp}
            viewingLevel={viewingLevel}
          />
        ))}
    </Svg>
  )
}
const PdfSvgXYHelperLines = ({
  length,
  width,
}: { length: number; width: number }) => {
  return (
    <>
      <Line x1={0} x2={0} y1={0} y2={length} stroke="red" strokeWidth={0.5} />
      <Line x1={0} x2={width} y1={0} y2={0} stroke="blue" strokeWidth={0.5} />
    </>
  )
}
