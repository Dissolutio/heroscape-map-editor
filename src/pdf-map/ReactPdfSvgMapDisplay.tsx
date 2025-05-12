import { Line, Svg } from '@react-pdf/renderer'
import { getHexagonSvgPolygonPoints } from '../svg-map/getHexagonSvgPolygonPoints'
import { PdfInterlockClipPaths } from '../svg-map/svg-hex-interlock-clippath'
import { BoardHex, } from '../types'
import { SVG_HEX_RADIUS } from '../utils/constants'
import { PdfMapHex } from './PdfMapHex'

type ReactPdfSvgMapDisplayProps = {
  width: number
  length: number
  levelHexArr: BoardHex[]
  boardHexesArr: BoardHex[]
  viewingLevel: number
}

export const ReactPdfSvgMapDisplay = ({
  width,
  length,
  levelHexArr,
  boardHexesArr,
  viewingLevel
}: ReactPdfSvgMapDisplayProps) => {
  const { points } = getHexagonSvgPolygonPoints(SVG_HEX_RADIUS)
  const emptyHexesArr = boardHexesArr.filter(
    (hex) => hex.terrain === 'empty',
  )
  return (
    <Svg
      viewBox={`${0} ${0} ${width} ${length}`}
      style={{
        border: '1px solid black',
      }}
    >
      <PdfSvgXYHelperLines length={length} width={width} />
      <PdfInterlockClipPaths points={points} />
      {emptyHexesArr.map((hex) => (
        <PdfMapHex key={hex.id} hex={hex} viewingLevel={viewingLevel} />
      ))}
      {boardHexesArr
        .filter((h) => h.terrain !== 'empty')
        .sort((a, b) => a.altitude - b.altitude)
        .map((hex) => (
          <PdfMapHex key={hex.id} hex={hex} viewingLevel={viewingLevel} />
        ))}
    </Svg>
  )
}
const PdfSvgXYHelperLines = ({ length, width }: { length: number, width: number }) => {
  return (
    <>
      <Line
        x1={0}
        x2={0}
        y1={0}
        y2={length}
        stroke="red"
        strokeWidth={0.5}
      />
      <Line
        x1={0}
        x2={width}
        y1={0}
        y2={0}
        stroke="blue"
        strokeWidth={0.5}
      />
    </>
  )
}