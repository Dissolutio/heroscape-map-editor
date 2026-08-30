import { useMediaQuery } from '@mui/material'
import {
  Document,
  Font,
  Image,
  Page,
  PDFDownloadLink,
  PDFViewer,
  Text,
  View,
} from '@react-pdf/renderer'
import useBoundStore from '../store/store'
import { piecesSoFar } from '../data/pieces'
import { PdfMapLevels6PerPage } from './PdfMap6LevelsPerPage'
import {
  type BoardHexes,
  type BoardPieces,
  HexTerrain,
  type BoardPiece,
  type HexMap,
} from '../types'
import { PdfSvgHeroscapeLogo } from './PdfSvgHeroscapeLogo'
import { countTerrainSets, getSetsUsedText } from '../utils/map-utils'
import {
  countPiecesUsedWithLaurStacking,
  getCombinedInventory,
  reconcileLaurLegacyToStackableUsage,
} from '../inventory/laurInventoryReconcile'
import { PDF_RENDER_FORMATS } from '../utils/constants'
import type { PropsWithChildren } from 'react'

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'fonts/Inter_18pt-Bold.ttf',
    },
  ],
})

export function ReactPdfRoot() {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  const isShowPDFInventory = useBoundStore((s) => s.isShowPDFInventory)
  const isPdfColorBorders = useBoundStore((s) => s.isPdfColorBorders)
  const isShowPdfOverlayLayer = useBoundStore((s) => s.isShowPdfOverlayLayer)
  const isShowPdfOverlayOnPlacedLevel = useBoundStore(
    (s) => s.isShowPdfOverlayOnPlacedLevel,
  )
  const useLegacyStartZones = useBoundStore((s) => s.useLegacyStartZones)
  const pdfRenderFormat = useBoundStore((s) => s.pdfRenderFormat)
  const isMobile = useMediaQuery('(max-width:800px)')
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: 0,
        margin: 0,
      }}
    >
      {isMobile ? (
        <ReactPdfDownloadLink>
          Download build instructions .pdf for: {hexMap.name} by {hexMap.author}
        </ReactPdfDownloadLink>
      ) : (
        <PDFViewer width={'100%'} height={'100%'}>
          <PdfDocument
            hexMap={hexMap}
            boardHexes={boardHexes}
            boardPieces={boardPieces}
            isPdfColorBorders={isPdfColorBorders}
            isShowPdfOverlayLayer={isShowPdfOverlayLayer}
            isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
            isShowPDFInventory={isShowPDFInventory}
            useLegacyStartZones={useLegacyStartZones}
            pdfRenderFormat={pdfRenderFormat}
          />
        </PDFViewer>
      )}
    </div>
  )
}

const PdfDocument = ({
  hexMap,
  boardHexes,
  boardPieces,
  isPdfColorBorders,
  isShowPdfOverlayLayer,
  isShowPdfOverlayOnPlacedLevel,
  isShowPDFInventory,
  useLegacyStartZones,
  pdfRenderFormat,
}: {
  hexMap: HexMap
  boardHexes: BoardHexes
  boardPieces: BoardPieces
  isPdfColorBorders: boolean
  isShowPdfOverlayLayer: boolean
  isShowPdfOverlayOnPlacedLevel: boolean
  isShowPDFInventory: boolean
  useLegacyStartZones: boolean
  pdfRenderFormat: 'coversheet' | 'shortHeader'
}) => {
  if (pdfRenderFormat === PDF_RENDER_FORMATS.COVERSHEET) {
    return (
      <PdfDocumentCoverSheet
        hexMap={hexMap}
        boardHexes={boardHexes}
        boardPieces={boardPieces}
        isPdfColorBorders={isPdfColorBorders}
        isShowPdfOverlayLayer={isShowPdfOverlayLayer}
        isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
        isShowPDFInventory={isShowPDFInventory}
        useLegacyStartZones={useLegacyStartZones}
      />
    )
  }

  return (
    <PdfDocumentShortHeader
      hexMap={hexMap}
      boardHexes={boardHexes}
      boardPieces={boardPieces}
      isPdfColorBorders={isPdfColorBorders}
      isShowPdfOverlayLayer={isShowPdfOverlayLayer}
      isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
      isShowPDFInventory={isShowPDFInventory}
      useLegacyStartZones={useLegacyStartZones}
    />
  )
}

/**
 * Coversheet format: First page features centered title, author, and map image.
 * Second page contains instructions, third page contains inventory (if enabled).
 * Layout emphasizes the map as the focal point.
 */
const PdfDocumentCoverSheet = ({
  hexMap,
  boardHexes,
  boardPieces,
  isPdfColorBorders,
  isShowPdfOverlayLayer,
  isShowPdfOverlayOnPlacedLevel,
  isShowPDFInventory,
  useLegacyStartZones,
}: {
  hexMap: HexMap
  boardHexes: BoardHexes
  boardPieces: BoardPieces
  isPdfColorBorders: boolean
  isShowPdfOverlayLayer: boolean
  isShowPdfOverlayOnPlacedLevel: boolean
  isShowPDFInventory: boolean
  useLegacyStartZones: boolean
}) => {
  return (
    <Document title={hexMap.name}>
      {/* Coversheet page */}
      <Page
        size="LETTER"
        style={{
          flexDirection: 'column',
          padding: 30,
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        {/* Title and Author */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              marginBottom: 10,
            }}
          >
            {hexMap.name}
          </Text>
          {hexMap.author && (
            <Text
              style={{
                fontSize: 16,
              }}
            >
              by {hexMap.author}
            </Text>
          )}
        </View>

        {/* Map Image - centered and takes majority of space */}
        {hexMap.mapPortraitBase64 && (
          <View
            style={{
              flexGrow: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src={hexMap.mapPortraitBase64}
              style={{
                maxHeight: '400px',
                maxWidth: '100%',
                width: 'auto',
                height: 'auto',
              }}
            />
          </View>
        )}

        {/* Sets Used */}
        {hexMap.setsUsed && hexMap.setsUsed.length > 0 && (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text
              style={{
                fontSize: 12,
                marginBottom: 5,
              }}
            >
              Requires:
            </Text>
            <Text
              style={{
                fontSize: 11,
              }}
            >
              {getSetsUsedText(hexMap.setsUsed)}
            </Text>
          </View>
        )}
      </Page>

      {/* Map Levels Page(s) */}
      <PdfMapLevels6PerPage
        boardHexes={boardHexes}
        boardPieces={boardPieces}
        isPdfColorBorders={isPdfColorBorders}
        isShowPdfOverlayLayer={isShowPdfOverlayLayer}
        isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
        useLegacyStartZones={useLegacyStartZones}
      />

      {/* Inventory Page(s) */}
      <PdfPieceInventory
        isShowPDFInventory={isShowPDFInventory}
        boardPieces={boardPieces}
        setsUsed={hexMap.setsUsed ?? []}
      />
    </Document>
  )
}

/**
 * Short Header format: Traditional layout with header info, instructions, and inventory.
 * Similar to the legacy format but with room for future customization.
 */
const PdfDocumentShortHeader = ({
  hexMap,
  boardHexes,
  boardPieces,
  isPdfColorBorders,
  isShowPdfOverlayLayer,
  isShowPdfOverlayOnPlacedLevel,
  useLegacyStartZones,
  isShowPDFInventory,
}: {
  hexMap: HexMap
  boardHexes: BoardHexes
  boardPieces: BoardPieces
  isPdfColorBorders: boolean
  isShowPdfOverlayLayer: boolean
  isShowPdfOverlayOnPlacedLevel: boolean
  useLegacyStartZones: boolean
  isShowPDFInventory: boolean
}) => {
  return (
    <Document title={hexMap.name}>
      <PdfMapLevels6PerPage
        boardHexes={boardHexes}
        boardPieces={boardPieces}
        isPdfColorBorders={isPdfColorBorders}
        isShowPdfOverlayLayer={isShowPdfOverlayLayer}
        isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
        useLegacyStartZones={useLegacyStartZones}
      >
        <MapPortraitHeader
          hexMap={hexMap}
          mapPortraitBase64={hexMap?.mapPortraitBase64 ?? ''}
          mapNotes={hexMap?.mapNotes ?? ''}
        />
      </PdfMapLevels6PerPage>
      <PdfPieceInventory
        isShowPDFInventory={isShowPDFInventory}
        boardPieces={boardPieces}
        setsUsed={hexMap.setsUsed ?? []}
      />
    </Document>
  )
}
export const ReactPdfDownloadLink = (props: PropsWithChildren) => {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  const isPdfColorBorders = useBoundStore((s) => s.isPdfColorBorders)
  const isShowPdfOverlayLayer = useBoundStore((s) => s.isShowPdfOverlayLayer)
  const isShowPDFInventory = useBoundStore((s) => s.isShowPDFInventory)
  const isShowPdfOverlayOnPlacedLevel = useBoundStore(
    (s) => s.isShowPdfOverlayOnPlacedLevel,
  )
  const useLegacyStartZones = useBoundStore((s) => s.useLegacyStartZones)
  const pdfRenderFormat = useBoundStore((s) => s.pdfRenderFormat)
  return (
    <PDFDownloadLink
      document={
        <PdfDocument
          hexMap={hexMap}
          boardHexes={boardHexes}
          boardPieces={boardPieces}
          isPdfColorBorders={isPdfColorBorders}
          isShowPdfOverlayLayer={isShowPdfOverlayLayer}
          isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
          isShowPDFInventory={isShowPDFInventory}
          useLegacyStartZones={useLegacyStartZones}
          pdfRenderFormat={pdfRenderFormat}
        />
      }
      fileName={`${hexMap.name}.pdf`}
    >
      {props.children}
    </PDFDownloadLink>
  )
}

const MapPortraitHeader = ({
  hexMap,
  mapPortraitBase64,
  mapNotes,
}: {
  hexMap: HexMap
  mapPortraitBase64: string
  mapNotes: string
}) => {
  const notesHeight = 20 * Math.ceil(mapNotes.length / 134)
  const terrainSetCounts = countTerrainSets(hexMap.setsUsed ?? [])
  return (
    <View
      style={{
        flexDirection: 'column',
        flexGrow: 0,
        padding: 0,
        alignContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          flexGrow: 0,
          padding: 0,
          alignContent: 'center',
          alignItems: 'center',
          flexBasis: 50,
        }}
      >
        <View
          style={{
            flexBasis: 110,
          }}
        >
          <PdfSvgHeroscapeLogo
            svgProps={{
              height: '70%',
            }}
            fillColor="black"
          />
        </View>
        <Text style={{ fontSize: '20px' }}>{hexMap.name}</Text>
        {hexMap.author && (
          <Text style={{ fontSize: '12px', paddingLeft: 5 }}>
            by: {hexMap.author}
          </Text>
        )}
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexGrow: 0,
          padding: 0,
          paddingBottom: 5,
          alignContent: 'center',
          alignItems: 'flex-start',
          // flexBasis: 30,
        }}
      >
        {Object.entries(terrainSetCounts).length > 0 && (
          <Text style={{ fontSize: '10px' }}>
            Requires: {getSetsUsedText(hexMap?.setsUsed ?? [])}
          </Text>
        )}
      </View>

      <View
        style={{
          flexBasis: notesHeight,
        }}
      >
        <Text style={{ fontSize: '10px' }}>
          {/* STRIP OUT LINE BREAKS */}
          {/* {mapNotes.replace(/(\r\n|\n|\r)/gm, "")} */}
          {mapNotes}
        </Text>
      </View>
      <View
        style={{
          flexBasis: mapPortraitBase64 ? 200 : 0,
        }}
      >
        {mapPortraitBase64 && (
          <Image
            src={mapPortraitBase64}
            style={{
              height: '200px',
              width: 'auto',
              // border: '1px solid red',
            }}
          />
        )}
      </View>
    </View>
  )
}

const PdfPieceInventory = ({
  isShowPDFInventory,
  boardPieces,
  setsUsed,
}: {
  isShowPDFInventory: boolean
  boardPieces: BoardPiece[]
  setsUsed: string[]
}) => {
  if (!isShowPDFInventory || !boardPieces.length) {
    return null
  }

  const countsBeforeReconcile = countPiecesUsedWithLaurStacking(boardPieces)
  const hasConstraints = Array.isArray(setsUsed) && setsUsed.length > 0
  const combinedInventory = getCombinedInventory(setsUsed)

  const counts = hasConstraints
    ? reconcileLaurLegacyToStackableUsage({
        usedInventory: countsBeforeReconcile,
        availableInventory: combinedInventory,
      }).reconciledUsedInventory
    : countsBeforeReconcile

  const getInventoryCategoryRank = (piece: {
    terrain?: string
    isHexTerrainPiece?: boolean
    isObstaclePiece?: boolean
  }) => {
    if (
      piece.terrain === HexTerrain.glyphPower ||
      piece.terrain === HexTerrain.glyphTreasure
    ) {
      return 2
    }
    if (piece.terrain === HexTerrain.startZone) {
      return 3
    }
    if (piece.isHexTerrainPiece) {
      return 0
    }
    if (piece.isObstaclePiece) {
      return 1
    }
    return 1
  }

  const entries = Object.entries(counts)
    .map(([id, count]) => {
      const piece = piecesSoFar[id]
      return {
        id,
        count,
        title: piece?.title ?? id,
        terrain: piece?.terrain ?? '',
        size: piece?.size ?? 0,
        isHexTerrainPiece: piece?.isHexTerrainPiece ?? false,
        isObstaclePiece: piece?.isObstaclePiece ?? false,
      }
    })
    .sort((a, b) => {
      const categoryRankA = getInventoryCategoryRank(a)
      const categoryRankB = getInventoryCategoryRank(b)
      if (categoryRankA !== categoryRankB) {
        return categoryRankA - categoryRankB
      }

      const terrainOrder = a.terrain.localeCompare(b.terrain)
      if (terrainOrder !== 0) {
        return terrainOrder
      }

      if (a.isHexTerrainPiece && b.isHexTerrainPiece && a.size !== b.size) {
        return a.size - b.size
      }

      const titleOrder = a.title.localeCompare(b.title)
      if (titleOrder !== 0) {
        return titleOrder
      }

      return a.id.localeCompare(b.id)
    })

  type InventoryRow =
    | {
        kind: 'header'
        id: string
        title: string
      }
    | {
        kind: 'piece'
        id: string
        title: string
        count: number
      }

  const getSectionKey = (entry: {
    terrain?: string
    isHexTerrainPiece?: boolean
    isObstaclePiece?: boolean
  }) => {
    const categoryRank = getInventoryCategoryRank(entry)
    if (categoryRank === 0) return 'land'
    if (categoryRank === 1) return 'obstacles'
    return 'glyphsStartzones'
  }

  const sectionLabelByKey: Record<string, string> = {
    land: 'Land',
    obstacles: 'Obstacles',
    glyphsStartzones: 'Glyphs/StartZones',
  }

  const entriesWithHeaders: InventoryRow[] = []
  let currentSectionKey = ''
  for (const entry of entries) {
    const sectionKey = getSectionKey(entry)
    if (sectionKey !== currentSectionKey) {
      entriesWithHeaders.push({
        kind: 'header',
        id: `header-${sectionKey}`,
        title: sectionLabelByKey[sectionKey],
      })
      currentSectionKey = sectionKey
    }

    entriesWithHeaders.push({
      kind: 'piece',
      id: entry.id,
      title: entry.title,
      count: entry.count,
    })
  }

  const columnCount = 3
  const rowsPerColumn = Math.ceil(entriesWithHeaders.length / columnCount)
  const remaining = [...entriesWithHeaders]
  const entryColumns = Array.from(
    { length: columnCount },
    (_, colIndex): InventoryRow[] => {
      const isLastColumn = colIndex === columnCount - 1
      const column: InventoryRow[] = []
      for (let row = 0; row < rowsPerColumn; row++) {
        if (remaining.length === 0) break
        // Don't place a header as the last row of a non-last column — it would
        // be orphaned from its items which continue in the next column.
        if (
          !isLastColumn &&
          row === rowsPerColumn - 1 &&
          remaining[0].kind === 'header'
        ) {
          break
        }
        const item = remaining.shift()
        if (item) column.push(item)
      }
      return column
    },
  )
  // Flush any overflow (e.g. caused by skipped header slots) into the last column
  if (remaining.length > 0) {
    entryColumns[columnCount - 1].push(...remaining)
  }

  return (
    <Page
      size="LETTER"
      style={{
        flexDirection: 'column',
        maxHeight: '100vh',
        padding: 5,
      }}
    >
      <View
        style={{
          marginBottom: 8,
          padding: 4,
          flexDirection: 'column',
        }}
      >
        <Text style={{ fontSize: '16px', marginBottom: 2 }}>Inventory</Text>

        <View style={{ flexDirection: 'row' }}>
          {entryColumns.map((column, columnIndex) => (
            <View
              key={`inventory-column-${columnIndex + 1}`}
              style={{
                width: '33.33%',
                flexDirection: 'column',
              }}
            >
              {column.map((e) =>
                e.kind === 'header' ? (
                  <Text
                    key={e.id}
                    style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      marginTop: 2,
                      marginBottom: 2,
                    }}
                  >
                    {e.title}
                  </Text>
                ) : (
                  <View
                    key={e.id}
                    style={{
                      flexDirection: 'row',
                    }}
                  >
                    <Text style={{ fontSize: '8px' }}>{e.title} </Text>
                    <Text style={{ fontSize: '8px' }}>x{e.count}</Text>
                  </View>
                ),
              )}
            </View>
          ))}
        </View>
      </View>
    </Page>
  )
}
