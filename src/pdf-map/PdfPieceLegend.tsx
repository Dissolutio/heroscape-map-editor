import { G, Page, Polygon, Svg, Text, View } from '@react-pdf/renderer'
import {
  getHexagonPdfPolygonPointsAt00,
  getLaurLongWallPdfPolygonPoints,
  getLaurShortWallPolygonPoints,
  getLaurWallRuinPdfPolygonPoints,
} from '../pdf-svg-shared/hexPolygonPoints'
import {
  type PdfPieceLegendCategory,
  type PdfPieceLegendEntry,
  getPdfPieceLegendEntries,
} from '../pdf-svg-shared/pieceLegend'
import {
  getSvgHexBorderColor,
  getSvgHexFillColor,
} from '../svg-map/getSvgHexColors'
import type { BoardHex, BoardPiece, DecodedPieceID } from '../types'
import { HexTerrain } from '../types'
import { PDF_BORDER_WIDTH, SVG_HEX_RADIUS } from '../utils/constants'
import {
  PdfGlyphPower,
  PdfGlyphTreasure,
  PdfLadder,
  PdfRopeLadder,
  PdfStartZone,
} from './PdfMapShapes'

const CATEGORY_LABELS: Record<PdfPieceLegendCategory, string> = {
  land: 'Land',
  obstacles: 'Obstacles',
  abstract: 'Gameplay pieces',
}

const makeDecodedPiece = (entry: PdfPieceLegendEntry): DecodedPieceID => ({
  boardPieceID: entry.inventoryID,
  inventoryID: entry.inventoryID,
  altitude: 0,
  rotation: 0,
  boardHexID: entry.inventoryID,
  pieceCoords: { q: 0, r: 0, s: 0 },
  terrain: entry.terrain,
})

const makeBoardHex = (entry: PdfPieceLegendEntry): BoardHex => ({
  id: '0~0~0',
  q: 0,
  r: 0,
  s: 0,
  altitude: 0,
  pieceID: `0~0~0~0~${entry.inventoryID}`,
  inventoryID: entry.inventoryID,
  terrain: entry.terrain,
  pieceRotation: 0,
})

function PieceLegendSymbol({ entry }: { entry: PdfPieceLegendEntry }) {
  if (!entry.symbol) return null

  const piece = makeDecodedPiece(entry)
  const fill = getSvgHexFillColor(piece)
  const border = getSvgHexBorderColor(piece, true)
  const hexPoints = getHexagonPdfPolygonPointsAt00(
    SVG_HEX_RADIUS,
    PDF_BORDER_WIDTH,
  ).points

  return (
    <Svg width={34} height={24} viewBox="-32 -32 120 64">
      {entry.symbol === 'glyph' ? (
        <G transform="translate(22 0)">
          {piece.terrain === HexTerrain.glyphTreasure ? (
            <PdfGlyphTreasure />
          ) : (
            <PdfGlyphPower />
          )}
          {entry.glyphLetter && entry.glyphLetter !== '?' && (
            <Text
              x={0}
              y={7}
              fill="#111111"
              style={{ fontSize: 15, fontWeight: 'bold' }}
            >
              {entry.glyphLetter}
            </Text>
          )}
        </G>
      ) : entry.symbol === 'start-zone' ? (
        <G transform="translate(22 0)">
          <PdfStartZone hex={makeBoardHex(entry)} />
        </G>
      ) : entry.symbol === 'rope-ladder' ? (
        <PdfRopeLadder piece={piece} isSubLevel={false} pieceRotation={0} />
      ) : entry.symbol === 'ladder' ? (
        <PdfLadder hex={makeBoardHex(entry)} />
      ) : entry.symbol === 'laur-long' || entry.symbol === 'laur-arch' ? (
        <>
          <Polygon
            points={
              getLaurLongWallPdfPolygonPoints(SVG_HEX_RADIUS, PDF_BORDER_WIDTH)
                .points
            }
            fill={fill}
          />
          {entry.symbol === 'laur-arch' && (
            <Text
              x={20}
              y={4}
              fill="#ffffff"
              style={{ fontSize: 7, fontWeight: 'bold' }}
            >
              ARCH
            </Text>
          )}
        </>
      ) : entry.symbol === 'laur-short' ? (
        <Polygon
          points={getLaurShortWallPolygonPoints(SVG_HEX_RADIUS, 0.2).points}
          fill={fill}
          stroke={border}
          strokeWidth={PDF_BORDER_WIDTH}
          transform="translate(22 0)"
        />
      ) : entry.symbol === 'laur-ruin' ? (
        <Polygon
          points={getLaurWallRuinPdfPolygonPoints(SVG_HEX_RADIUS).points}
          fill={fill}
          stroke={border}
          strokeWidth={PDF_BORDER_WIDTH}
          transform="translate(22 0)"
        />
      ) : (
        <Polygon
          points={hexPoints}
          fill={fill}
          stroke={border}
          strokeWidth={PDF_BORDER_WIDTH}
          transform="translate(22 0)"
        />
      )}
    </Svg>
  )
}

export function PdfPieceLegend({ boardPieces }: { boardPieces: BoardPiece[] }) {
  const entries = getPdfPieceLegendEntries(boardPieces)
  if (!entries.length) return null

  const categories: PdfPieceLegendCategory[] = ['land', 'obstacles', 'abstract']
  return (
    <Page
      size="LETTER"
      style={{ padding: 28, fontFamily: 'Helvetica', flexDirection: 'column' }}
    >
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Pieces used
      </Text>
      {categories.map((category) => {
        const categoryEntries = entries.filter(
          (entry) => entry.category === category,
        )
        if (!categoryEntries.length) return null
        return (
          <View key={category} style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 'bold',
                marginBottom: 3,
              }}
            >
              {CATEGORY_LABELS[category]}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {categoryEntries.map((entry) => (
                <View
                  key={entry.inventoryID}
                  style={{
                    width: '50%',
                    minHeight: 28,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 3,
                    paddingVertical: 2,
                  }}
                >
                  <PieceLegendSymbol entry={entry} />
                  <Text
                    style={{
                      flexGrow: 1,
                      flexShrink: 1,
                      fontSize: 8,
                      lineHeight: 10,
                    }}
                  >
                    {entry.title}
                    {entry.count > 1 ? ` ×${entry.count}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )
      })}
    </Page>
  )
}
