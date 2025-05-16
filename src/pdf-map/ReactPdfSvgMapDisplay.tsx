import { G, Line, Svg } from '@react-pdf/renderer'
import type { BoardHex } from '../types'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { PdfMapHex } from './PdfMapHex'

type ReactPdfSvgMapDisplayProps = {
  width: number
  length: number
  // levelHexArr: BoardHex[]
  boardHexesArr: BoardHex[]
  viewingLevel: number
}
const OPACITY_EMPTY = 0.1
const OPACITY_SUBLEVEL = 0.3
export const ReactPdfSvgMapDisplay = ({
  width,
  length,
  boardHexesArr,
  viewingLevel,
}: ReactPdfSvgMapDisplayProps) => {
  const emptyHexesArr = boardHexesArr.filter((hex) => hex.terrain === 'empty')
  const adjustXForNew00Centers = 1.2 * SVG_HEX_APOTHEM
  const adjustYForNew00Centers = 1.2 * SVG_HEX_RADIUS
  const subLevelHexes = boardHexesArr.filter((h) => h.altitude < viewingLevel)
  return (
    <Svg
      viewBox={`${-adjustXForNew00Centers} ${-adjustYForNew00Centers} ${width + adjustXForNew00Centers} ${length + adjustYForNew00Centers}`}
    >
      {/* <PdfSvgXYHelperLines length={length} width={width} /> */}
      <G opacity={OPACITY_EMPTY}>
        {emptyHexesArr.map((hex) => (
          <PdfMapHex key={hex.id} hex={hex} viewingLevel={viewingLevel} />
        ))}
      </G>
      <G opacity={OPACITY_SUBLEVEL}>
        {subLevelHexes
          .filter((h) => h.terrain !== 'empty')
          .sort((a, b) => a.altitude - b.altitude)
          .map((hex) => (
            <PdfMapHex key={hex.id} hex={hex} viewingLevel={viewingLevel} />
          ))}
      </G>
      {boardHexesArr
        .filter((h) => h.terrain !== 'empty')
        .filter((h) => h.altitude === viewingLevel)
        // .sort((a, b) => a.altitude - b.altitude)
        .map((hex) => (
          <PdfMapHex key={hex.id} hex={hex} viewingLevel={viewingLevel} />
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
