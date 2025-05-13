import { ClipPath, Defs, Polygon } from '@react-pdf/renderer'
import React from 'react'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { get2HexSvgPolygonPoints, get3HexSvgPolygonPoints } from './getHexagonSvgPolygonPoints'

type Props = { points: string }

export const SvgInterlockClipPaths = ({ points }: Props) => {
  return (
    <defs>
      <clipPath id="inner-stroke-clip">
        <polygon points={points} />
      </clipPath>
      <clipPath id="interlock1-clip">
        <polygon points={interlock1Points_0} />
      </clipPath>
      <clipPath id="interlock2-clip">
        <polygon points={interlock2Points_0} />
      </clipPath>
      <clipPath id="interlock3-clip">
        <polygon points={interlock3Points_0} />
      </clipPath>
      <clipPath id="interlock3B-clip">
        <polygon points={interlock3BPoints_0} />
      </clipPath>
      <clipPath id="interlock4-clip">
        <polygon points={interlock4Points_0} />
      </clipPath>
      <clipPath id="interlock4B-clip">
        <polygon points={interlock4BPoints_0} />
      </clipPath>
      <clipPath id="interlock5-clip">
        <polygon points={interlock5Points_0} />
      </clipPath>
      <clipPath id="interlock6-clip">
        <polygon points={interlock6Points_0} />
      </clipPath>
    </defs>
  )
}
export const PdfInterlockClipPaths = ({ points }: Props) => {
  const NUMBA = 60
  return (
    <Defs>
      <ClipPath id="inner-stroke-clip">
        <Polygon points={points} />
      </ClipPath>
      {/* <ClipPath id="inner-stroke-2-clip">
        <Polygon points={get2HexSvgPolygonPoints(SVG_HEX_RADIUS).points} />
      </ClipPath> */}
      <ClipPath id="inner-stroke-2-0-clip">
        <Polygon points={get2HexSvgPolygonPoints(SVG_HEX_RADIUS).points} />
      </ClipPath>
      <ClipPath id="inner-stroke-2-1-clip">
        <Polygon
          transform={`rotate(${NUMBA * 1})`}
          points={get2HexSvgPolygonPoints(SVG_HEX_RADIUS).points} />
      </ClipPath>
      <ClipPath id="inner-stroke-2-2-clip">
        <Polygon
          transform={`rotate(${NUMBA * 2})`}
          points={get2HexSvgPolygonPoints(SVG_HEX_RADIUS).points} />
      </ClipPath>
      <ClipPath id="inner-stroke-2-3-clip">
        <Polygon
          transform={`rotate(${NUMBA * 3})`}
          points={get2HexSvgPolygonPoints(SVG_HEX_RADIUS).points} />
      </ClipPath>
      <ClipPath id="inner-stroke-2-4-clip">
        <Polygon
          transform={`rotate(${NUMBA * 4})`}
          points={get2HexSvgPolygonPoints(SVG_HEX_RADIUS).points} />
      </ClipPath>
      <ClipPath id="inner-stroke-2-5-clip">
        <Polygon
          transform={`rotate(${NUMBA * 5})`}
          points={get2HexSvgPolygonPoints(SVG_HEX_RADIUS).points} />
      </ClipPath>
      <ClipPath id="inner-stroke-3-clip">
        <Polygon points={get3HexSvgPolygonPoints(SVG_HEX_RADIUS).points} />
      </ClipPath>
      <ClipPath id="interlock1-0-clip">
        <Polygon points={interlock1Points_0} />
      </ClipPath>
      <ClipPath id="interlock1-1-clip">
        <Polygon points={interlock1Points_1} />
      </ClipPath>
      <ClipPath id="interlock1-2-clip">
        <Polygon points={interlock1Points_2} />
      </ClipPath>
      <ClipPath id="interlock1-3-clip">
        <Polygon points={interlock1Points_3} />
      </ClipPath>
      <ClipPath id="interlock1-4-clip">
        <Polygon points={interlock1Points_4} />
      </ClipPath>
      <ClipPath id="interlock1-5-clip">
        <Polygon points={interlock1Points_5} />
      </ClipPath>
      <ClipPath id="interlock2-0-clip">
        <Polygon points={interlock2Points_0} />
      </ClipPath>
      <ClipPath id="interlock2-1-clip">
        <Polygon points={interlock2Points_1} />
      </ClipPath>
      <ClipPath id="interlock2-2-clip">
        <Polygon points={interlock2Points_2} />
      </ClipPath>
      <ClipPath id="interlock2-3-clip">
        <Polygon points={interlock2Points_3} />
      </ClipPath>
      <ClipPath id="interlock2-4-clip">
        <Polygon points={interlock2Points_4} />
      </ClipPath>
      <ClipPath id="interlock2-5-clip">
        <Polygon points={interlock2Points_5} />
      </ClipPath>
      <ClipPath id="interlock3-0-clip">
        <Polygon points={interlock3Points_0} />
      </ClipPath>
      <ClipPath id="interlock3-1-clip">
        <Polygon points={interlock3Points_1} />
      </ClipPath>
      <ClipPath id="interlock3-2-clip">
        <Polygon points={interlock3Points_2} />
      </ClipPath>
      <ClipPath id="interlock3-3-clip">
        <Polygon points={interlock3Points_3} />
      </ClipPath>
      <ClipPath id="interlock3-4-clip">
        <Polygon points={interlock3Points_4} />
      </ClipPath>
      <ClipPath id="interlock3-5-clip">
        <Polygon points={interlock3Points_5} />
      </ClipPath>
      <ClipPath id="interlock3B-0-clip">
        <Polygon points={interlock3BPoints_0} />
      </ClipPath>
      <ClipPath id="interlock3B-1-clip">
        <Polygon points={interlock3BPoints_1} />
      </ClipPath>
      <ClipPath id="interlock3B-2-clip">
        <Polygon points={interlock3BPoints_2} />
      </ClipPath>
      <ClipPath id="interlock3B-3-clip">
        <Polygon points={interlock3BPoints_3} />
      </ClipPath>
      <ClipPath id="interlock3B-4-clip">
        <Polygon points={interlock3BPoints_4} />
      </ClipPath>
      <ClipPath id="interlock3B-5-clip">
        <Polygon points={interlock3BPoints_5} />
      </ClipPath>
      <ClipPath id="interlock4-0-clip">
        <Polygon points={interlock4Points_0} />
      </ClipPath>
      <ClipPath id="interlock4-1-clip">
        <Polygon points={interlock4Points_1} />
      </ClipPath>
      <ClipPath id="interlock4-2-clip">
        <Polygon points={interlock4Points_2} />
      </ClipPath>
      <ClipPath id="interlock4-3-clip">
        <Polygon points={interlock4Points_3} />
      </ClipPath>
      <ClipPath id="interlock4-4-clip">
        <Polygon points={interlock4Points_4} />
      </ClipPath>
      <ClipPath id="interlock4-5-clip">
        <Polygon points={interlock4Points_5} />
      </ClipPath>
      <ClipPath id="interlock4B-0-clip">
        <Polygon points={interlock4BPoints_0} />
      </ClipPath>
      <ClipPath id="interlock4B-1-clip">
        <Polygon points={interlock4BPoints_1} />
      </ClipPath>
      <ClipPath id="interlock4B-2-clip">
        <Polygon points={interlock4BPoints_2} />
      </ClipPath>
      <ClipPath id="interlock4B-3-clip">
        <Polygon points={interlock4BPoints_3} />
      </ClipPath>
      <ClipPath id="interlock4B-4-clip">
        <Polygon points={interlock4BPoints_4} />
      </ClipPath>
      <ClipPath id="interlock4B-5-clip">
        <Polygon points={interlock4BPoints_5} />
      </ClipPath>
      <ClipPath id="interlock5-0-clip">
        <Polygon points={interlock5Points_0} />
      </ClipPath>
      <ClipPath id="interlock5-1-clip">
        <Polygon points={interlock5Points_1} />
      </ClipPath>
      <ClipPath id="interlock5-2-clip">
        <Polygon points={interlock5Points_2} />
      </ClipPath>
      <ClipPath id="interlock5-3-clip">
        <Polygon points={interlock5Points_3} />
      </ClipPath>
      <ClipPath id="interlock5-4-clip">
        <Polygon points={interlock5Points_4} />
      </ClipPath>
      <ClipPath id="interlock5-5-clip">
        <Polygon points={interlock5Points_5} />
      </ClipPath>
    </Defs>
  )
}
const bottomRightX = SVG_HEX_APOTHEM * 2
const bottomRightY = 1.5 * SVG_HEX_RADIUS
const bottomX = SVG_HEX_APOTHEM
const bottomY = 2 * SVG_HEX_RADIUS
const bottomLeftX = 0
const bottomLeftY = bottomRightY
const topLeftX = 0
const topLeftY = 0.5 * SVG_HEX_RADIUS
const topX = bottomX
const topY = 0
const topRightX = SVG_HEX_RADIUS * Math.sqrt(3)
const topRightY = topLeftY
const ptBotRight = `${bottomRightX},${bottomRightY}`
const ptBot = `${bottomX},${bottomY}`
const ptBotLeft = `${bottomLeftX},${bottomLeftY}`
const ptTopLeft = `${topLeftX},${topLeftY}`
const ptTop = `${topX},${topY}`
const ptTopRight = `${topRightX},${topRightY}`
const ptCenter = `${SVG_HEX_APOTHEM},${SVG_HEX_RADIUS}`
const interlock1Points_0 = `${ptTopRight} ${ptCenter} ${ptBotRight}`
const interlock1Points_1 = `${ptBotRight} ${ptCenter} ${ptBot}`
const interlock1Points_2 = `${ptBot} ${ptCenter} ${ptBotLeft}`
const interlock1Points_3 = `${ptBotLeft} ${ptCenter} ${ptTopLeft}`
const interlock1Points_4 = `${ptTopLeft} ${ptCenter} ${ptTop}`
const interlock1Points_5 = `${ptTop} ${ptCenter} ${ptTopRight}`

const interlock2Points_0 = `${ptTopRight} ${ptBotRight} ${ptBot} ${ptCenter}`
const interlock2Points_1 = `${ptBotRight} ${ptBot} ${ptBotLeft} ${ptCenter}`
const interlock2Points_2 = `${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptCenter}`
const interlock2Points_3 = `${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptCenter}`
const interlock2Points_4 = `${ptTopLeft} ${ptTop} ${ptTopRight} ${ptCenter}`
const interlock2Points_5 = `${ptTop} ${ptTopRight} ${ptBotRight} ${ptCenter}`

const interlock4BPoints_0 = `${ptBotRight} ${ptBot} ${ptBotLeft} ${ptCenter} ${ptTopLeft} ${ptTop} ${ptTopRight} ${ptCenter}`
const interlock4BPoints_1 = `${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptCenter} ${ptTop} ${ptTopRight} ${ptBotRight} ${ptCenter}`
const interlock4BPoints_2 = `${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptCenter} ${ptTopRight} ${ptBotRight} ${ptBot} ${ptCenter}`
const interlock4BPoints_3 = `${ptTopLeft} ${ptTop} ${ptTopRight} ${ptCenter} ${ptBotRight} ${ptBot} ${ptBotLeft} ${ptCenter}`
const interlock4BPoints_4 = `${ptTop} ${ptTopRight} ${ptBotRight} ${ptCenter} ${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptCenter}`
const interlock4BPoints_5 = `${ptTopRight} ${ptBotRight} ${ptBot} ${ptCenter} ${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptCenter}`

const interlock3Points_0 = `${ptTopRight} ${ptBotRight} ${ptBot} ${ptBotLeft} ${ptCenter}`
const interlock3Points_1 = `${ptBotRight} ${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptCenter}`
const interlock3Points_2 = `${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptCenter}`
const interlock3Points_3 = `${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptTopRight} ${ptCenter}`
const interlock3Points_4 = `${ptTopLeft} ${ptTop} ${ptTopRight} ${ptBotRight} ${ptCenter}`
const interlock3Points_5 = `${ptTop} ${ptTopRight} ${ptBotRight} ${ptBot} ${ptCenter}`

const interlock3BPoints_0 = `${ptTop} ${ptTopRight} ${ptCenter} ${ptBotRight} ${ptBot} ${ptBotLeft} ${ptCenter}`
const interlock3BPoints_1 = `${ptTopRight} ${ptBotRight} ${ptCenter} ${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptCenter}`
const interlock3BPoints_2 = `${ptBotRight} ${ptBot} ${ptCenter} ${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptCenter}`
const interlock3BPoints_3 = `${ptBot} ${ptBotLeft} ${ptCenter} ${ptTopLeft} ${ptTop} ${ptTopRight} ${ptCenter}`
const interlock3BPoints_4 = `${ptBotLeft} ${ptTopLeft} ${ptCenter} ${ptTop} ${ptTopRight} ${ptBotRight} ${ptCenter}`
const interlock3BPoints_5 = `${ptTopLeft} ${ptTop} ${ptCenter} ${ptTopRight} ${ptBotRight} ${ptBot} ${ptCenter}`

const interlock4Points_0 = `${ptTopRight} ${ptBotRight} ${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptCenter}`
const interlock4Points_1 = `${ptBotRight} ${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptCenter}`
const interlock4Points_2 = `${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptTopRight} ${ptCenter}`
const interlock4Points_3 = `${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptTopRight} ${ptBotRight} ${ptCenter}`
const interlock4Points_4 = `${ptTopLeft} ${ptTop} ${ptTopRight} ${ptBotRight} ${ptBot} ${ptCenter}`
const interlock4Points_5 = `${ptTop} ${ptTopRight} ${ptBotRight} ${ptBot} ${ptBotLeft} ${ptCenter}`

const interlock5Points_0 = `${ptTopRight} ${ptBotRight} ${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptCenter}`
const interlock5Points_1 = `${ptBotRight} ${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptTopRight} ${ptCenter}`
const interlock5Points_2 = `${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptTopRight} ${ptBotRight} ${ptCenter}`
const interlock5Points_3 = `${ptBotLeft} ${ptTopLeft} ${ptTop} ${ptTopRight} ${ptBotRight} ${ptBot} ${ptCenter}`
const interlock5Points_4 = `${ptTopLeft} ${ptTop} ${ptTopRight} ${ptBotRight} ${ptBot} ${ptBotLeft} ${ptCenter}`
const interlock5Points_5 = `${ptTop} ${ptTopRight} ${ptBotRight} ${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptCenter}`

const interlock6Points_0 = `${ptTopRight} ${ptBotRight} ${ptBot} ${ptBotLeft} ${ptTopLeft} ${ptTop}`
