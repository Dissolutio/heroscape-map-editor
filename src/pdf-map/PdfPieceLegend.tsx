import { G, Page, Svg, Text, View } from '@react-pdf/renderer'
import {
  type GlyphCoordinateLookup,
  type GlyphExportSettings,
  makeGlyphCoordinateLookup,
} from '../pdf-svg-shared/glyphExportOptions'
import { getLaurAddonExportSymbol } from '../pdf-svg-shared/laurAddonExportSymbol'
import {
  type PieceKeyEntry,
  type PieceKeyLandColumn,
  getPieceKeyModel,
} from '../pdf-svg-shared/pieceKey'
import {
  getPieceKeyRowShapeHeight,
  getPieceKeyShapeLayout,
  getPieceKeyShapeScale,
  getPieceKeySpecialEntriesPerRow,
} from '../pdf-svg-shared/pieceKeyShapeLayout'
import useBoundStore from '../store/store'
import { type BoardHex, type BoardPiece, HexTerrain } from '../types'
import { boardPieceToDecodedPieceID } from '../utils/map-utils'
import { PdfMapBoardPiece } from './PdfMapBoardPiece'
import { PdfMapHex } from './PdfMapHex'
import { chunkLandRows, chunkSpecialGroups } from './pieceLegendLayout'

const LAND_COLUMNS_PER_TABLE = 6
const LAND_SHAPE_SCALE = 0.075
const SHAPE_PADDING = 24
const PAGE_CONTENT_WIDTH = 564
const PDF_TABLE_HEADER_HEIGHT = 36
const MAX_LAND_TABLE_CHUNK_HEIGHT = 650

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
  layout: ReturnType<typeof getPieceKeyShapeLayout>,
) => {
  return {
    x: layout.origin.x + layout.minX - SHAPE_PADDING,
    y: layout.origin.y + layout.minY - SHAPE_PADDING,
    width: layout.width + SHAPE_PADDING * 2,
    height: layout.height + SHAPE_PADDING * 2,
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
  const viewBox = getPieceKeySymbolViewBox(layout)
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
      <G>
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
  const tables: PieceKeyLandColumn[][] = []
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
  const landTables = tables.map((columns) => ({
    columns,
    chunks: chunkLandRows(
      model.landRows,
      (row) => getLandRowHeight(model, row.size, scale),
      PDF_TABLE_HEADER_HEIGHT,
      MAX_LAND_TABLE_CHUNK_HEIGHT,
    ),
  }))

  const renderHeaderRow = (columns: PieceKeyLandColumn[], key: string) => (
    <View
      key={key}
      wrap={false}
      style={{ flexDirection: 'row', minHeight: PDF_TABLE_HEADER_HEIGHT }}
    >
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
        <Text style={{ fontSize: 7, fontWeight: 'bold' }}>Notice centers</Text>
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
  )

  const renderLandRow = (
    columns: PieceKeyLandColumn[],
    row: (typeof model.landRows)[number],
  ) => {
    const rowHeight = getLandRowHeight(model, row.size, scale)
    return (
      <View
        key={row.size}
        wrap={false}
        style={{ flexDirection: 'row', minHeight: rowHeight }}
      >
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
          <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{row.title}</Text>
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
  }

  return (
    <>
      {landTables.flatMap(({ columns, chunks }, tableIndex) =>
        chunks.map((chunk, chunkIndex) => {
          const table = (
            <View
              key={`${columns.map((column) => column.terrain).join('|')}-${chunkIndex}`}
              wrap={false}
              style={{
                marginBottom: chunkIndex === chunks.length - 1 ? 8 : 0,
                borderTopWidth: 1,
                borderLeftWidth: 1,
              }}
            >
              {chunk.map((chunkRow) =>
                chunkRow.kind === 'header'
                  ? renderHeaderRow(
                      columns,
                      `${columns.map((column) => column.terrain).join('|')}-header`,
                    )
                  : renderLandRow(columns, chunkRow.row),
              )}
            </View>
          )
          if (tableIndex === 0 && chunkIndex === 0) {
            const firstRow = model.landRows[0]
            const headingAhead = firstRow
              ? PDF_TABLE_HEADER_HEIGHT +
                getLandRowHeight(model, firstRow.size, scale)
              : PDF_TABLE_HEADER_HEIGHT
            return (
              <View
                key="piece-key-first-land-chunk"
                wrap={false}
                minPresenceAhead={headingAhead}
              >
                <Text
                  style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 6 }}
                >
                  Piece Key
                </Text>
                {table}
              </View>
            )
          }
          return table
        }),
      )}
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
  const groupRows = chunkSpecialGroups(model.specialGroups)

  return (
    <>
      {groupRows.map((groups, index) => (
        <View
          key={`special-groups-row-${groups.map((group) => group.id).join('|')}`}
          wrap={false}
          style={{
            marginTop: index === 0 ? 4 : 0,
            flexDirection: 'column',
          }}
        >
          {index === 0 && (
            <>
              {!model.landColumns.length && (
                <Text
                  style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 6 }}
                >
                  Piece Key
                </Text>
              )}
              <Text
                style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}
              >
                Special Tiles
              </Text>
            </>
          )}
          <View
            wrap={false}
            style={{
              flexDirection: 'row',
              alignItems: 'stretch',
            }}
          >
            {groups.map((group) => (
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
      ))}
    </>
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
