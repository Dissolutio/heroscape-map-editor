import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { HexText } from './HexText'

type Props = {
  text: string
  textLine2?: string
}

export const SvgHexIDText = ({ text, textLine2 }: Props) => {
  return (
    <>
      <HexText>{text.toString()}</HexText>
      {textLine2 && <HexText>{textLine2.toString()}</HexText>}
    </>
  )
}
