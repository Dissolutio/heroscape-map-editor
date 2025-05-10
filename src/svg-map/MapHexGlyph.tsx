import useBoundStore from '../store/store'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { decodePieceID } from '../utils/map-utils'
import { HexText } from './HexText'
import { getHexagonSvgPolygonPoints } from './getHexagonSvgPolygonPoints'

type Props = {
  glyphPieceID: string
}
export function MapHexGlyph({ glyphPieceID }: Props) {
  const { pieceID, altitude, rotation, boardHexID, pieceCoords } =
    decodePieceID(glyphPieceID)
  const hexMap = useBoundStore((s) => s.hexMap)
  console.log(
    '🚀 ~ MapHexGlyph ~ hexMap:',
    hexMap,
    pieceID,
    altitude,
    rotation,
    boardHexID,
    pieceCoords,
  )
  // const glyphOnHex = selectGlyphForHex({ hexID: hex.id, glyphs })

  // EARLY RETURN: NO GLYPH
  // if (!glyphOnHex) {
  //   return null
  // }

  // const angle = layout.flat ? 0 : Math.PI / 6
  const { points } = getHexagonSvgPolygonPoints(SVG_HEX_RADIUS)
  // const isGlyphRevealed = glyphOnHex.isRevealed
  // const canonicalGlyph = powerGlyphs[glyphOnHex.glyphID]
  // const glyphShortName = canonicalGlyph?.shortName || ''
  // const glyphText = isGlyphRevealed ? glyphShortName : '?'
  return (
    <g>
      <polygon
        transform={`translate(2.5, 0) scale(0.7)`}
        className={'hex-glyph'}
        points={points}
      />
      <HexText
        // style={{
        //   fontSize: isGlyphRevealed ? `${hexSize / 80}em` : `${hexSize / 50}em`,
        //   transform: isGlyphRevealed
        //     ? `translate(0, -${hexSize / 5}em)`
        //     : 'translate(0, 0)',
        // }}
        x={SVG_HEX_APOTHEM}
        y={SVG_HEX_RADIUS}
      >
        GLYPH_TEXT
        {/* {glyphText} */}
      </HexText>
    </g>
  )
}
