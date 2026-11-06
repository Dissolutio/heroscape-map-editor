import { G, Page, Svg, Text, View } from '@react-pdf/renderer'
import {
  getPieceKeyModel,
  type PieceKeyEntry,
} from '../pdf-svg-shared/pieceKey'
import { getPieceKeyShapeLayout } from '../pdf-svg-shared/pieceKeyShapeLayout'
import useBoundStore from '../store/store'
import type { BoardHex, BoardPiece } from '../types'
import { boardPieceToDecodedPieceID } from '../utils/map-utils'
import { PdfMapBoardPiece } from './PdfMapBoardPiece'
import { PdfMapHex } from './PdfMapHex'

const LAND_COLUMNS_PER_TABLE = 6
const LAND_SHAPE_SCALE = 0.075
const SPECIAL_SHAPE_SCALE = 0.055

export function PieceKeyShape({
  entry,
  useTerrainBorderColor,
  scale,
}: {
  entry: PieceKeyEntry
  useTerrainBorderColor: boolean
  scale: number
}) {
  const settings = useBoundStore.getState()
  const layout = getPieceKeyShapeLayout(entry)
  const boxSize = Math.max(layout.width, layout.height, 200) + 24
  const width = Math.max(16, boxSize * scale)
  const viewBox = `${layout.origin.x + layout.center.x - boxSize / 2} ${layout.origin.y + layout.center.y - boxSize / 2} ${boxSize} ${boxSize}`
  const decoded = boardPieceToDecodedPieceID(entry.piece)

  return (
    <Svg width={width} height={width} viewBox={viewBox}>
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
              />
            )
          })
        ) : decoded ? (
          <PdfMapBoardPiece
            piece={{ ...decoded, altitude: 0, rotation: 0 }}
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
}: {
  model: ReturnType<typeof getPieceKeyModel>
  useTerrainBorderColor: boolean
}) {
  const tables = []
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
                width: '16%',
                minHeight: 34,
                padding: 3,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 6, fontWeight: 'bold' }}>
                Notice centers and border colors
              </Text>
            </View>
            {columns.map((column) => (
              <View
                key={column.terrain}
                style={{
                  width: `${84 / Math.max(columns.length, 1)}%`,
                  minHeight: 34,
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
          {model.landRows.map((row) => (
            <View key={row.size} style={{ flexDirection: 'row' }}>
              <View
                style={{
                  width: '16%',
                  minHeight: row.size >= 24 ? 60 : row.size >= 7 ? 48 : 40,
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
                      width: `${84 / Math.max(columns.length, 1)}%`,
                      minHeight: row.size >= 24 ? 60 : row.size >= 7 ? 48 : 40,
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
                          scale={LAND_SHAPE_SCALE}
                        />
                        <Text style={{ fontSize: 6 }}>x{entry.count}</Text>
                      </>
                    )}
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      ))}
    </>
  )
}

function SpecialTiles({
  model,
  useTerrainBorderColor,
}: {
  model: ReturnType<typeof getPieceKeyModel>
  useTerrainBorderColor: boolean
}) {
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
              width: '50%',
              minHeight: 52,
              padding: 4,
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
              {group.entries.map((entry) => (
                <View
                  key={entry.inventoryID}
                  style={{
                    width: '25%',
                    minHeight: 50,
                    padding: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PieceKeyShape
                    entry={entry}
                    useTerrainBorderColor={useTerrainBorderColor}
                    scale={SPECIAL_SHAPE_SCALE}
                  />
                  <Text style={{ fontSize: 5, textAlign: 'center' }}>
                    {entry.title}
                  </Text>
                  <Text style={{ fontSize: 5 }}>x{entry.count}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

export function PdfPieceLegend({ boardPieces }: { boardPieces: BoardPiece[] }) {
  const settings = useBoundStore.getState()
  const model = getPieceKeyModel(
    boardPieces,
    settings.boardHexes,
    settings.isPdfColorBorders,
  )
  if (!model.landColumns.length && !model.specialGroups.length) return null

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
        />
      )}
      {model.specialGroups.length > 0 && (
        <SpecialTiles
          model={model}
          useTerrainBorderColor={settings.isPdfColorBorders}
        />
      )}
    </Page>
  )
}
