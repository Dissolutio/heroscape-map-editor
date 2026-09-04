import { G, Path, Svg } from '@react-pdf/renderer'
import {
  LEVEL_LOGO_ASPECT_RATIO,
  LEVEL_LOGO_LABEL_STROKE_WIDTH,
  LEVEL_LOGO_NUMBER_BASELINE_Y,
  LEVEL_LOGO_NUMBER_STROKE_WIDTH,
  LEVEL_LOGO_TEXT_BLOCK_HEIGHT,
  LEVEL_LOGO_TEXT_FILL,
  LEVEL_LOGO_TEXT_STROKE,
  LEVEL_LOGO_VIEWBOX,
  getLevelNumberDigits,
} from '../pdf-svg-shared/levelLogoLayout'
import { levelLogoShapes } from '../pdf-svg-shared/levelLogoShapes'
import { LEVEL_LOGO_LABEL_PATH } from '../pdf-svg-shared/levelLogoTextPaths'

export const PdfLevelLogo = ({
  level,
  width = 60,
}: {
  level: number
  width?: number
}) => {
  const digits = getLevelNumberDigits(level)
  return (
    <Svg
      viewBox={LEVEL_LOGO_VIEWBOX}
      width={width}
      height={width / LEVEL_LOGO_ASPECT_RATIO}
    >
      <G transform={`translate(0, ${LEVEL_LOGO_TEXT_BLOCK_HEIGHT})`}>
        {levelLogoShapes.map((shape) => (
          <Path key={shape.d} d={shape.d} fill={shape.fill} />
        ))}
      </G>
      {/* every stroked copy is drawn before any filled copy: emulates paint-order:stroke */}
      <Path
        d={LEVEL_LOGO_LABEL_PATH}
        fill={LEVEL_LOGO_TEXT_STROKE}
        stroke={LEVEL_LOGO_TEXT_STROKE}
        strokeWidth={LEVEL_LOGO_LABEL_STROKE_WIDTH}
        strokeLinejoin="miter"
      />
      <G transform={`translate(0, ${LEVEL_LOGO_NUMBER_BASELINE_Y})`}>
        {digits.map((digit, i) => (
          <Path
            // biome-ignore lint/suspicious/noArrayIndexKey: digits can repeat
            key={i}
            d={digit.d}
            transform={`translate(${digit.x}, 0)`}
            fill={LEVEL_LOGO_TEXT_STROKE}
            stroke={LEVEL_LOGO_TEXT_STROKE}
            strokeWidth={LEVEL_LOGO_NUMBER_STROKE_WIDTH}
            strokeLinejoin="miter"
          />
        ))}
      </G>
      <Path d={LEVEL_LOGO_LABEL_PATH} fill={LEVEL_LOGO_TEXT_FILL} />
      <G transform={`translate(0, ${LEVEL_LOGO_NUMBER_BASELINE_Y})`}>
        {digits.map((digit, i) => (
          <Path
            // biome-ignore lint/suspicious/noArrayIndexKey: digits can repeat
            key={i}
            d={digit.d}
            transform={`translate(${digit.x}, 0)`}
            fill={LEVEL_LOGO_TEXT_FILL}
          />
        ))}
      </G>
    </Svg>
  )
}
