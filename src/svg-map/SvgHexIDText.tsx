import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { HexText } from './HexText'

type Props = {
  text: string
  textLine2?: string
}

export const SvgHexIDText = ({ text, textLine2 }: Props) => {
  return (
    <>
      <HexText y={1.6 * SVG_HEX_RADIUS} x={SVG_HEX_APOTHEM}>
        {text.toString()}
      </HexText>
      {textLine2 && (
        <HexText y={1.8 * SVG_HEX_RADIUS} x={SVG_HEX_APOTHEM}>
          {textLine2.toString()}
        </HexText>
      )}
    </>
  )
}
