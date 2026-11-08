import { G, Page, Svg, Text, View } from '@react-pdf/renderer'
import { getLadderSvgPolygonPoints } from '../pdf-svg-shared/hexPolygonPoints'
import { getLaurAddonExportSymbol } from '../pdf-svg-shared/laurAddonExportSymbol'
import {
  type PieceKeyEntry,
  getPieceKeyModel,
} from '../pdf-svg-shared/pieceKey'
import {
  getPieceKeyRowShapeHeight,
  getPieceKeyShapeLayout,
  getPieceKeyShapeScale,
  getPieceKeySpecialEntriesPerRow,
} from '../pdf-svg-shared/pieceKeyShapeLayout'
import {
  type GlyphCoordinateLookup,
  type GlyphExportSettings,
  makeGlyphCoordinateLookup,
} from '../pdf-svg-shared/glyphExportOptions'
import useBoundStore from '../store/store'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../types'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { boardPieceToDecodedPieceID } from '../utils/map-utils'
import { PdfMapBoardPiece } from './PdfMapBoardPiece'
import { PdfMapHex } from './PdfMapHex'

const LAND_COLUMNS_PER_TABLE = 6
const LAND_SHAPE_SCALE = 0.075
const SHAPE_PADDING = 24
const PAGE_CONTENT_WIDTH = 564
const PDF_TABLE_HEADER_HEIGHT = 36

const getLandShapeScale = (model: ReturnType<typeof getPieceKeyModel>) =>
  getPieceKeyShapeScale(
    model,
    (PAGE_CONTENT_WIDTH * 0.8) / LAND_COLUMNS_PER_TABLE,
    LAND_SHAPE_SCALE,
  )

const getLandRowHeight = (
  model: ReturnType<typeof getPieceKeyModel>,
  size: number,
  scale: number,
) =>
  Math.max(
    size >= 24 ? 60 : size >= 7 ? 48 : 40,
    getPieceKeyRowShapeHeight(model, size, scale, 16) + 10,
  )

const getPieceKeySymbolViewBox = (
  entry: PieceKeyEntry,
  layout: ReturnType<typeof getPieceKeyShapeLayout>,
) => {
  if (
    entry.inventoryID !== Pieces.ladder &&
    entry.inventoryID !== Pieces.ropeLadder
  ) {
    const width = layout.width + SHAPE_PADDING * 2
    const height = layout.height + SHAPE_PADDING * 2
    return {
      x: layout.origin.x + layout.center.x - width / 2,
      y: layout.origin.y + layout.center.y - height / 2,
      width,
      height,
    }
  }

  const symbolPoints =
    entry.inventoryID === Pieces.ladder
      ? getLadderSvgPolygonPoints(SVG_HEX_RADIUS * 2, 0).corners
      : [
          {
            x: SVG_HEX_APOTHEM * 2 - SVG_HEX_RADIUS * 0.8,
            y: -SVG_HEX_RADIUS * 0.8,
          },
          {
            x: SVG_HEX_APOTHEM * 2 + SVG_HEX_RADIUS * 0.8,
            y: SVG_HEX_RADIUS * 0.8,
          },
        ]
  const radians = (layout.angle * Math.PI) / 180
  const rotatedPoints = symbolPoints.map(({ x, y }) => ({
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians),
  }))
  const minX = Math.min(...rotatedPoints.map(({ x }) => x))
  const maxX = Math.max(...rotatedPoints.map(({ x }) => x))
  const minY = Math.min(...rotatedPoints.map(({ y }) => y))
  const maxY = Math.max(...rotatedPoints.map(({ y }) => y))
  return {
    x: layout.origin.x + minX - SHAPE_PADDING,
    y: layout.origin.y + minY - SHAPE_PADDING,
    width: maxX - minX + SHAPE_PADDING * 2,
    height: maxY - minY + SHAPE_PADDING * 2,
  }
}

export function PieceKeyShape({
  entry,
  useTerrainBorderColor,
  scale,
  glyphCoordinates: glyphCoordinatesProp,
  glyphExportSettings: glyphExportSettingsProp,
}: {
  entry: PieceKeyEntry
  useTerrainBorderColor: boolean
  scale: number
  glyphCoordinates?: GlyphCoordinateLookup
  glyphExportSettings?: GlyphExportSettings
}) {
  const settings = useBoundStore.getState()
  const glyphCoordinates =
    glyphCoordinatesProp ?? makeGlyphCoordinateLookup(settings.boardHexes)
  const glyphExportSettings = glyphExportSettingsProp ?? settings
  const layout = getPieceKeyShapeLayout(entry)
  const viewBox = getPieceKeySymbolViewBox(entry, layout)
  const viewWidth = viewBox.width
  const viewHeight = viewBox.height
  const width = Math.max(8, viewWidth * scale)
  const height = Math.max(8, viewHeight * scale)
  const viewBoxString = `${viewBox.x} ${viewBox.y} ${viewWidth} ${viewHeight}`
  const decoded = boardPieceToDecodedPieceID(entry.piece)
  const keyPiece =
    decoded && getLaurAddonExportSymbol(entry.inventoryID)
      ? { ...decoded, terrain: HexTerrain.laurWall }
      : decoded

  return (
    <Svg width={width} height={height} viewBox={viewBoxString}>
      <G
        transform={`rotate(${layout.angle} ${layout.origin.x} ${layout.origin.y})`}
      >
        {entry.hexes.length ? (
          entry.hexes.map((sourceHex) => {
            const hex: BoardHex = {
              ...sourceHex,
              altitude: 0,
              pieceRotation: 0,
            }
            return (
              <PdfMapHex
                key={sourceHex.id}
                hex={hex}
                viewingLevel={1}
                isOverlayViewing
                isPdfColorBorders={useTerrainBorderColor}
                isShowPdfOverlayOnPlacedLevel
                isShowPdfTileLetters={settings.isShowPdfTileLetters}
                isShowPdfBuriedMarks={false}
                buriedMarksByUID={new Map()}
                useLegacyStartZones={settings.useLegacyStartZones}
                isPieceKeyPreview
                glyphCoordinates={glyphCoordinates}
                glyphExportSettings={glyphExportSettings}
              />
            )
          })
        ) : keyPiece ? (
          <PdfMapBoardPiece
            piece={{ ...keyPiece, altitude: 0, rotation: 0 }}
            viewingLevel={1}
            overlayLevel={1}
            useLegacyStartZones={settings.useLegacyStartZones}
            is2DOverlayLevelEnabled
            isPieceKeyPreview
          />
        ) : null}
      </G>
    </Svg>
  )
}

function LandGrid({
  model,
  useTerrainBorderColor,
  glyphCoordinates,
  glyphExportSettings,
}: {
  model: ReturnType<typeof getPieceKeyModel>
  useTerrainBorderColor: boolean
  glyphCoordinates: GlyphCoordinateLookup
  glyphExportSettings: GlyphExportSettings
}) {
  const tables = []
  const scale = getLandShapeScale(model)
  for (
    let offset = 0;
    offset < model.landColumns.length;
    offset += LAND_COLUMNS_PER_TABLE
  ) {
    tables.push(
      model.landColumns.slice(offset, offset + LAND_COLUMNS_PER_TABLE),
    )
  }
  return (
    <>
      {tables.map((columns) => (
        <View
          key={columns.map((column) => column.terrain).join('|')}
          style={{ marginBottom: 8, borderTopWidth: 1, borderLeftWidth: 1 }}
        >
          <View style={{ flexDirection: 'row' }}>
            <View
              style={{
                width: '20%',
                minHeight: PDF_TABLE_HEADER_HEIGHT,
                padding: 3,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 7, fontWeight: 'bold' }}>
                Notice centers
              </Text>
              <Text style={{ fontSize: 7, fontWeight: 'bold' }}>
                and border colors
              </Text>
            </View>
            {columns.map((column) => (
              <View
                key={column.terrain}
                style={{
                  width: `${80 / Math.max(columns.length, 1)}%`,
                  minHeight: PDF_TABLE_HEADER_HEIGHT,
                  padding: 2,
                  borderRightWidth: 1,
                  borderBottomWidth: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>
                  {column.title}
                </Text>
                <Text style={{ fontSize: 6 }}>{column.description}</Text>
              </View>
            ))}
          </View>
          {model.landRows.map((row) => {
            const rowHeight = getLandRowHeight(model, row.size, scale)
            return (
              <View key={row.size} style={{ flexDirection: 'row' }}>
                <View
                  style={{
                    width: '20%',
                    minHeight: rowHeight,
                    padding: 2,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 8, fontWeight: 'bold' }}>
                    {row.title}
                  </Text>
                  <Text style={{ fontSize: 6 }}>{row.description}</Text>
                </View>
                {columns.map((column) => {
                  const entry = column.cells.find(
                    (cell) => cell.size === row.size,
                  )?.entry
                  return (
                    <View
                      key={`${column.terrain}-${row.size}`}
                      style={{
                        width: `${80 / Math.max(columns.length, 1)}%`,
                        minHeight: rowHeight,
                        padding: 1,
                        borderRightWidth: 1,
                        borderBottomWidth: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {entry && (
                        <>
                          <PieceKeyShape
                            entry={entry}
                            useTerrainBorderColor={useTerrainBorderColor}
                            scale={scale}
                            glyphCoordinates={glyphCoordinates}
                            glyphExportSettings={glyphExportSettings}
                          />
                          <Text style={{ fontSize: 6 }}>x{entry.count}</Text>
                        </>
                      )}
                    </View>
                  )
                })}
              </View>
            )
          })}
        </View>
      ))}
    </>
  )
}

function SpecialTiles({
  model,
  useTerrainBorderColor,
  scale,
  glyphCoordinates,
  glyphExportSettings,
}: {
  model: ReturnType<typeof getPieceKeyModel>
  useTerrainBorderColor: boolean
  scale: number
  glyphCoordinates: GlyphCoordinateLookup
  glyphExportSettings: GlyphExportSettings
}) {
  const entriesPerRowFor = (group: (typeof model.specialGroups)[number]) =>
    getPieceKeySpecialEntriesPerRow(group, PAGE_CONTENT_WIDTH / 3 - 12, scale)

  return (
    <View style={{ marginTop: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
        Special Tiles
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {model.specialGroups.map((group) => (
          <View
            key={group.id}
            style={{
              width: '33.333%',
              padding: 3,
              borderWidth: 1,
              flexDirection: 'column',
            }}
          >
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>
              {group.title}
            </Text>
            <Text style={{ fontSize: 6, marginBottom: 2 }}>
              {group.description}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {group.entries.map((entry) => {
                const entriesPerRow = entriesPerRowFor(group)
                return (
                  <View
                    key={entry.inventoryID}
                    style={{
                      width: `${100 / entriesPerRow}%`,
                      padding: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PieceKeyShape
                      entry={entry}
                      useTerrainBorderColor={useTerrainBorderColor}
                      scale={scale}
                      glyphCoordinates={glyphCoordinates}
                      glyphExportSettings={glyphExportSettings}
                    />
                    <Text style={{ fontSize: 5, textAlign: 'center' }}>
                      {entry.title}
                    </Text>
                    <Text style={{ fontSize: 5 }}>x{entry.count}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

export function PdfPieceLegend({ boardPieces }: { boardPieces: BoardPiece[] }) {
  const settings = useBoundStore.getState()
  const glyphCoordinates = makeGlyphCoordinateLookup(settings.boardHexes)
  const glyphExportSettings: GlyphExportSettings = {
    isTransparentGlyphSpaces: settings.isTransparentGlyphSpaces,
    isHideHeightsOnGlyphs: settings.isHideHeightsOnGlyphs,
  }
  const model = getPieceKeyModel(
    boardPieces,
    settings.boardHexes,
    settings.isPdfColorBorders,
  )
  if (!model.landColumns.length && !model.specialGroups.length) return null
  const scale = getLandShapeScale(model)

  return (
    <Page
      size="LETTER"
      style={{ padding: 24, fontFamily: 'Helvetica', flexDirection: 'column' }}
    >
      <Text style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 6 }}>
        Piece Key
      </Text>
      {model.landColumns.length > 0 && (
        <LandGrid
          model={model}
          useTerrainBorderColor={settings.isPdfColorBorders}
          glyphCoordinates={glyphCoordinates}
          glyphExportSettings={glyphExportSettings}
        />
      )}
      {model.specialGroups.length > 0 && (
        <SpecialTiles
          model={model}
          useTerrainBorderColor={settings.isPdfColorBorders}
          scale={scale}
          glyphCoordinates={glyphCoordinates}
          glyphExportSettings={glyphExportSettings}
        />
      )}
    </Page>
  )
}
