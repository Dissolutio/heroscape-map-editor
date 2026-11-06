import { G, Text } from '@react-pdf/renderer'
import type { LadderStack } from '../pdf-svg-shared/ladderStack'
import { pdfHexTextStyle } from '../svg-map/pdfText'
import { type BoardHex, HexTerrain, Pieces } from '../types'
import { PDF_BORDER_WIDTH } from '../utils/constants'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import { PdfLadder, PdfMultiHex1 } from './PdfMapShapes'

// The ladder overlay hex is white with a thin black border. The border width
// is PDF_BORDER_WIDTH, the one PdfMultiHex1, PdfGlyph* and PdfSvgTree415 use
// for 1-hex pieces (the PDF equivalent of SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH).
// It is what PdfMultiHex1 draws, so the overlay hex has the same shape.
export const LADDER_OVERLAY_HEX_FILL = 'white'
export const LADDER_OVERLAY_HEX_BORDER = 'black'
export const LADDER_OVERLAY_BORDER_WIDTH = PDF_BORDER_WIDTH

// One ladder stack on a PDF ladder overlay level: a white 1-hex under the
// normal ladder shape, with the number of ladders in the stack on top. It sits
// on the hex of the stack's bottom ladder, in that ladder's rotation.
export const PdfLadderOverlayStack = ({ stack }: { stack: LadderStack }) => {
  const { bottom } = stack
  const pixel = hexUtilsHexToPixel(bottom.pieceCoords)
  const pieceRotation = ((bottom.rotation ?? 0) % 6) * 60
  const ladderHex: BoardHex = {
    id: `${bottom.altitude + 1}~${bottom.pieceCoords.q}~${bottom.pieceCoords.r}`,
    ...bottom.pieceCoords,
    altitude: bottom.altitude + 1,
    pieceID: bottom.uid,
    boardPieceUID: bottom.uid,
    inventoryID: Pieces.ladder,
    terrain: HexTerrain.ladder,
    pieceRotation: bottom.rotation,
    isObstacleOrigin: true,
  }
  return (
    <G transform={`translate(${pixel.x}, ${pixel.y})`}>
      <PdfMultiHex1
        hex={ladderHex}
        fillOverride={LADDER_OVERLAY_HEX_FILL}
        borderOverride={LADDER_OVERLAY_HEX_BORDER}
      />
      <G transform={`rotate(${pieceRotation})`}>
        <PdfLadder hex={ladderHex} />
      </G>
      <Text
        fill="black"
        style={pdfHexTextStyle}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {stack.count}
      </Text>
    </G>
  )
}
