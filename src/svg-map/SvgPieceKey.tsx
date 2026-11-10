import { getLaurAddonExportSymbol } from '../pdf-svg-shared/laurAddonExportSymbol'
import {
  type PieceKeyEntry,
  type PieceKeyModel,
  getPieceKeyModel,
  getPieceKeyRowsForColumns,
  shouldUseTerrainBorderColorForPieceKeyEntry,
} from '../pdf-svg-shared/pieceKey'
import {
  PIECE_KEY_LINE_WIDTH,
  getPieceKeyRowShapeHeight,
  getPieceKeyShapeLayout,
  getPieceKeySpecialEntryRowLayout,
  getPieceKeySpecialEntryRowShapeHeight,
  getPieceKeySpecialEntryRows,
} from '../pdf-svg-shared/pieceKeyShapeLayout'
import type { BoardHex, BoardPiece } from '../types'
import { SVG_HEX_RADIUS } from '../utils/constants'
import { boardPieceToDecodedPieceID } from '../utils/map-utils'
import { SvgMapBoardPiece } from './SvgMapBoardPiece'
import { SvgMapHex } from './SvgMapHex'

const LAND_COLUMNS_PER_TABLE = 6
const LAND_HEADER_HEIGHT = SVG_HEX_RADIUS * 1.3
const LAND_ROW_PADDING = SVG_HEX_RADIUS * 0.25
const SPECIAL_ENTRY_PADDING = SVG_HEX_RADIUS * 0.2
const SPECIAL_CARD_PADDING = SVG_HEX_RADIUS * 0.12
const KEY_FONT_SIZE = SVG_HEX_RADIUS * 0.24
const KEY_HEADING_SIZE = SVG_HEX_RADIUS * 0.4
const HEADER_TEXT_LINE_GAP = KEY_FONT_SIZE * 0.25

const KeyBorderRect = ({
  x,
  y,
  width,
  height,
  hasTopBorder = true,
  hasLeftBorder = true,
}: {
  x: number
  y: number
  width: number
  height: number
  hasTopBorder?: boolean
  hasLeftBorder?: boolean
}) => {
  const lineWidth = PIECE_KEY_LINE_WIDTH
  const leftInset = hasLeftBorder ? lineWidth : 0
  const topInset = hasTopBorder ? lineWidth : 0
  // Draw each border side as its own bar. A black box under a white box
  // leaves an anti-aliased gray hairline on sides that should have no border.
  return (
    <>
      {/* Invisible full-size rect first: it carries the cell's bounds. */}
      <rect x={x} y={y} width={width} height={height} fill="none" />
      <rect
        x={x + leftInset}
        y={y + topInset}
        width={Math.max(0, width - leftInset - lineWidth)}
        height={Math.max(0, height - topInset - lineWidth)}
        fill="white"
      />
      {hasTopBorder && (
        <rect x={x} y={y} width={width} height={lineWidth} fill="black" />
      )}
      {hasLeftBorder && (
        <rect x={x} y={y} width={lineWidth} height={height} fill="black" />
      )}
      <rect
        x={x + width - lineWidth}
        y={y}
        width={lineWidth}
        height={height}
        fill="black"
      />
      <rect
        x={x}
        y={y + height - lineWidth}
        width={width}
        height={lineWidth}
        fill="black"
      />
    </>
  )
}

export const SvgPieceKeyShape = (
  entry: PieceKeyEntry,
  x: number,
  y: number,
  scale: number,
  key: string,
  useTerrainBorderColor = true,
  renderOptions?: {
    viewingLevel: number
    overlayLevel: number
    isOverlayViewing: boolean
    is2DOverlayLevelEnabled: boolean
    isShow2DExportTileLetters: boolean
    isShow2DExportBuriedMarks: boolean
    glyphCoordinates: ReadonlySet<string>
    glyphExportSettings: {
      isHideHeightsOnGlyphs: boolean
    }
  },
) => {
  const layout = getPieceKeyShapeLayout(entry)
  const decoded = boardPieceToDecodedPieceID(entry.piece)
  const isLaurAddon = Boolean(getLaurAddonExportSymbol(entry.inventoryID))
  const entryUsesTerrainBorderColor =
    shouldUseTerrainBorderColorForPieceKeyEntry(entry, useTerrainBorderColor)
  const keyPiece = decoded
  return (
    <g
      key={key}
      data-testid="svg-piece-key-shape"
      data-inventory-id={entry.inventoryID}
      data-hex-count={entry.hexes.length}
      data-origin-count={
        entry.hexes.filter((hex) => hex.isObstacleOrigin).length
      }
    >
      <g transform={`translate(${x} ${y})`}>
        <g transform={`scale(${scale})`}>
          <g transform={`translate(${-layout.center.x} ${-layout.center.y})`}>
            <g transform={`translate(${-layout.origin.x} ${-layout.origin.y})`}>
              {entry.hexes.length ? (
                entry.hexes.map((sourceHex) => {
                  const hex: BoardHex = {
                    ...sourceHex,
                    altitude: 0,
                    pieceRotation: 0,
                  }
                  return (
                    <SvgMapHex
                      key={sourceHex.id}
                      hex={hex}
                      buriedMarksByUID={new Map()}
                      viewingLevel={renderOptions?.viewingLevel}
                      overlayLevel={renderOptions?.overlayLevel}
                      isVisible
                      isSubLevel={false}
                      isOverlayViewing={renderOptions?.isOverlayViewing}
                      is2DOverlayLevelEnabled={
                        renderOptions?.is2DOverlayLevelEnabled
                      }
                      isShow2DExportTileLetters={
                        renderOptions?.isShow2DExportTileLetters
                      }
                      isShow2DExportBuriedMarks={
                        renderOptions?.isShow2DExportBuriedMarks
                      }
                      glyphCoordinates={renderOptions?.glyphCoordinates}
                      glyphExportSettings={renderOptions?.glyphExportSettings}
                      isPieceKeyPreview={!isLaurAddon}
                      useTerrainBorderColor={entryUsesTerrainBorderColor}
                    />
                  )
                })
              ) : keyPiece ? (
                <SvgMapBoardPiece
                  piece={{ ...keyPiece, altitude: 0, rotation: 0 }}
                  viewingLevel={isLaurAddon ? 1 : 100}
                  overlayLevel={isLaurAddon ? 1 : 100}
                  isPieceKeyPreview={!isLaurAddon}
                  useTerrainBorderColor={entryUsesTerrainBorderColor}
                  archTextOffsetX={
                    getLaurAddonExportSymbol(entry.inventoryID) === 'arch'
                      ? layout.center.x
                      : undefined
                  }
                />
              ) : null}
            </g>
          </g>
        </g>
      </g>
    </g>
  )
}

const landGridDimensions = (
  model: PieceKeyModel,
  width: number,
  columns: PieceKeyModel['landColumns'] = model.landColumns,
) => {
  const rowHeaderWidth = Math.max(190, SVG_HEX_RADIUS * 2.6)
  const maxShapeWidth = Math.max(
    0,
    ...columns.flatMap((column) =>
      column.cells.map(({ entry }) => getPieceKeyShapeLayout(entry).width),
    ),
  )
  const cellWidth = Math.max(maxShapeWidth + SVG_HEX_RADIUS * 0.3, 185)
  const columnsInWidestTable = Math.min(LAND_COLUMNS_PER_TABLE, columns.length)
  const gridWidth = columns.length
    ? rowHeaderWidth + cellWidth * columnsInWidestTable
    : width
  const scale = 1
  return {
    rowHeaderWidth,
    cellWidth,
    gridWidth,
    gridX: (width - gridWidth) / 2,
    scale,
  }
}

export const getSvgPieceKeyWidth = (model: PieceKeyModel, width: number) => {
  const landGridWidth = landGridDimensions(model, width).gridWidth
  const fluidGridWidth = landGridDimensions(
    model,
    width,
    model.fluidColumns,
  ).gridWidth
  const largestSpecialShape = Math.max(
    0,
    ...model.specialGroups.flatMap((group) =>
      group.entries.map((entry) => getPieceKeyShapeLayout(entry).width),
    ),
  )
  return Math.max(
    landGridWidth,
    fluidGridWidth,
    largestSpecialShape * 3 + SVG_HEX_RADIUS,
  )
}

const landRowHeight = (
  model: PieceKeyModel,
  size: number,
  scale: number,
  columns: PieceKeyModel['landColumns'] = model.landColumns,
) => {
  const minimum =
    size >= 24
      ? SVG_HEX_RADIUS * 2.4
      : size >= 7
        ? SVG_HEX_RADIUS * 1.8
        : SVG_HEX_RADIUS * 1.3
  return Math.max(
    minimum,
    getPieceKeyRowShapeHeight(model, size, scale, LAND_ROW_PADDING, columns),
  )
}

const getTerrainTablesHeight = (
  model: PieceKeyModel,
  width: number,
  columns: PieceKeyModel['landColumns'],
  rows: PieceKeyModel['landRows'],
) => {
  const { scale } = landGridDimensions(model, width, columns)
  const tableCount = Math.ceil(columns.length / LAND_COLUMNS_PER_TABLE)
  return Array.from({ length: tableCount }, (_, tableIndex) => {
    const tableColumns = columns.slice(
      tableIndex * LAND_COLUMNS_PER_TABLE,
      (tableIndex + 1) * LAND_COLUMNS_PER_TABLE,
    )
    const tableRows = getPieceKeyRowsForColumns(tableColumns, rows)
    return (
      LAND_HEADER_HEIGHT +
      tableRows.reduce(
        (height, row) =>
          height + landRowHeight(model, row.size, scale, tableColumns),
        0,
      ) +
      12
    )
  }).reduce((height, tableHeight) => height + tableHeight, 0)
}

const getHeaderTextBaselines = (
  top: number,
  height: number,
  fontSizes: number[],
) => {
  const blockHeight =
    fontSizes.reduce((sum, size) => sum + size, 0) +
    HEADER_TEXT_LINE_GAP * Math.max(0, fontSizes.length - 1)
  const baselines: number[] = []
  let baseline = top + (height - blockHeight) / 2 + (fontSizes[0] ?? 0)
  for (const [index, fontSize] of fontSizes.entries()) {
    if (index > 0) baseline += HEADER_TEXT_LINE_GAP + fontSize
    baselines.push(baseline)
  }
  return baselines
}

const specialGroupRowHeight = (
  group: PieceKeyModel['specialGroups'][number],
  cardWidth: number,
  scale: number,
) => {
  const innerWidth = cardWidth - 2 * SPECIAL_CARD_PADDING
  const { rows, slotWidth } = getSpecialEntryRows(group, cardWidth, scale)
  let height = specialGroupHeader(group, innerWidth).height
  for (const row of rows) {
    height += getSpecialEntryRowHeight(row, slotWidth, scale)
  }
  return height
}

const groupRowHeights = (
  model: PieceKeyModel,
  gridWidth: number,
  scale: number,
) => {
  const cardWidth = gridWidth / 3
  const heights: number[] = []
  for (let i = 0; i < model.specialGroups.length; i += 3) {
    heights.push(
      Math.max(
        ...model.specialGroups.slice(i, i + 3).map((group) => {
          return specialGroupRowHeight(group, cardWidth, scale)
        }),
      ),
    )
  }
  return heights
}

export const wrapSvgPieceKeyText = (
  text: string,
  width: number,
  fontSize: number,
) => {
  const maxCharacters = Math.max(1, Math.floor(width / (fontSize * 0.6)))
  const lines: string[] = []
  for (const word of text.split(/\s+/)) {
    const currentLine = lines[lines.length - 1]
    if (!currentLine || `${currentLine} ${word}`.length > maxCharacters) {
      lines.push(word)
    } else {
      lines[lines.length - 1] = `${currentLine} ${word}`
    }
  }
  return lines
}

const getSpecialEntryRows = (
  group: PieceKeyModel['specialGroups'][number],
  cardWidth: number,
  scale: number,
) => {
  const innerWidth = cardWidth - 2 * SPECIAL_CARD_PADDING
  return getPieceKeySpecialEntryRows(group, innerWidth, scale)
}

const getSpecialEntryRowHeight = (
  entries: PieceKeyEntry[],
  slotWidth: number,
  scale: number,
) => {
  const shapeHeight = getPieceKeySpecialEntryRowShapeHeight(entries, scale)
  const captionLineCount = Math.max(
    1,
    ...entries.map(
      (entry) =>
        wrapSvgPieceKeyText(
          entry.title,
          slotWidth - SPECIAL_CARD_PADDING / 2,
          KEY_FONT_SIZE,
        ).length,
    ),
  )
  return Math.max(
    SVG_HEX_RADIUS * 0.56,
    shapeHeight +
      SPECIAL_ENTRY_PADDING +
      captionLineCount * KEY_FONT_SIZE * 1.2 +
      SPECIAL_CARD_PADDING,
  )
}

const specialGroupHeader = (
  group: PieceKeyModel['specialGroups'][number],
  width: number,
) => {
  const titleLines = wrapSvgPieceKeyText(group.title, width, KEY_HEADING_SIZE)
  const descriptionLines = wrapSvgPieceKeyText(
    group.description,
    width,
    KEY_FONT_SIZE,
  )
  return {
    titleLines,
    descriptionLines,
    height: Math.max(
      SVG_HEX_RADIUS * 1.36,
      SVG_HEX_RADIUS * 0.36 +
        titleLines.length * KEY_HEADING_SIZE * 1.08 +
        descriptionLines.length * KEY_FONT_SIZE * 1.2,
    ),
  }
}

export const getSvgPieceKeyHeight = (model: PieceKeyModel, width: number) => {
  if (
    !model.landColumns.length &&
    !model.fluidColumns.length &&
    !model.specialGroups.length
  ) {
    return 0
  }
  const keyWidth = getSvgPieceKeyWidth(model, width)
  const { scale } = landGridDimensions(model, keyWidth)
  const landHeight = getTerrainTablesHeight(
    model,
    keyWidth,
    model.landColumns,
    model.landRows,
  )
  const fluidHeight = model.fluidColumns.length
    ? KEY_HEADING_SIZE * 1.6 +
      getTerrainTablesHeight(
        model,
        keyWidth,
        model.fluidColumns,
        model.fluidRows,
      )
    : 0
  return (
    KEY_HEADING_SIZE * 2.3 +
    landHeight +
    fluidHeight +
    (model.specialGroups.length
      ? KEY_HEADING_SIZE * 1.6 +
        groupRowHeights(model, keyWidth, scale).reduce((a, b) => a + b + 8, 0)
      : 0)
  )
}

const renderTerrainTables = (
  model: PieceKeyModel,
  columns: PieceKeyModel['landColumns'],
  rows: PieceKeyModel['landRows'],
  x: number,
  y: number,
  width: number,
  useTerrainBorderColor: boolean,
  renderOptions: NonNullable<Parameters<typeof SvgPieceKeyShape>[6]>,
  gridTestID = 'svg-piece-key-land-grid',
) => {
  const tableCount = Math.ceil(columns.length / LAND_COLUMNS_PER_TABLE)
  const { rowHeaderWidth, cellWidth, scale } = landGridDimensions(
    model,
    width,
    columns,
  )
  let tableY = y
  return (
    <g data-testid={gridTestID}>
      {Array.from({ length: tableCount }, (_, tableIndex) => {
        const tableColumns = columns.slice(
          tableIndex * LAND_COLUMNS_PER_TABLE,
          (tableIndex + 1) * LAND_COLUMNS_PER_TABLE,
        )
        const activeWidth = rowHeaderWidth + cellWidth * tableColumns.length
        const startX = x + (width - activeWidth) / 2
        const headerHeight = LAND_HEADER_HEIGHT
        const thisY = tableY
        const [noticeFirstBaseline, noticeSecondBaseline] =
          getHeaderTextBaselines(thisY, headerHeight, [
            KEY_FONT_SIZE,
            KEY_FONT_SIZE,
          ])
        const tableHeight =
          headerHeight +
          rows.reduce(
            (height, row) =>
              height + landRowHeight(model, row.size, scale, columns),
            0,
          )
        tableY += tableHeight + 12
        return (
          <g
            key={tableColumns.map((column) => column.terrain).join('|')}
            data-testid="svg-piece-key-land-table"
          >
            <KeyBorderRect
              x={startX}
              y={thisY}
              width={rowHeaderWidth}
              height={headerHeight}
              hasTopBorder={false}
              hasLeftBorder={false}
            />
            <text
              x={startX + rowHeaderWidth / 2}
              y={noticeFirstBaseline}
              textAnchor="middle"
              fontFamily="Inter, Arial, sans-serif"
              fontSize={KEY_FONT_SIZE}
              fontWeight="bold"
              fill="black"
            >
              Notice centers
            </text>
            <text
              x={startX + rowHeaderWidth / 2}
              y={noticeSecondBaseline}
              textAnchor="middle"
              fontFamily="Inter, Arial, sans-serif"
              fontSize={KEY_FONT_SIZE}
              fontWeight="bold"
              fill="black"
            >
              and border colors
            </text>
            {tableColumns.map((column, columnIndex) => {
              const cellX = startX + rowHeaderWidth + columnIndex * cellWidth
              const centerX = cellX + cellWidth / 2
              const titleLines = wrapSvgPieceKeyText(
                column.title,
                cellWidth - 8,
                KEY_HEADING_SIZE,
              )
              const columnBaselines = getHeaderTextBaselines(
                thisY,
                headerHeight,
                [...titleLines.map(() => KEY_HEADING_SIZE), KEY_FONT_SIZE],
              )
              return (
                <g key={column.terrain} data-testid="svg-piece-key-land-column">
                  <KeyBorderRect
                    x={cellX}
                    y={thisY}
                    width={cellWidth}
                    height={headerHeight}
                  />
                  <text
                    x={centerX}
                    y={columnBaselines[0]}
                    textAnchor="middle"
                    fontFamily="Inter, Arial, sans-serif"
                    fontSize={KEY_HEADING_SIZE}
                    fontWeight="bold"
                    fill="black"
                  >
                    {titleLines.length === 1
                      ? titleLines[0]
                      : titleLines.map((line, index) => (
                          <tspan
                            key={`${column.terrain}-title-${index}`}
                            x={centerX}
                            dy={
                              index === 0
                                ? 0
                                : columnBaselines[index] -
                                  columnBaselines[index - 1]
                            }
                          >
                            {line}
                          </tspan>
                        ))}
                  </text>
                  <text
                    x={centerX}
                    y={columnBaselines[titleLines.length]}
                    textAnchor="middle"
                    fontFamily="Inter, Arial, sans-serif"
                    fontSize={KEY_FONT_SIZE}
                    fill="black"
                  >
                    {column.description}
                  </text>
                </g>
              )
            })}
            {getPieceKeyRowsForColumns(tableColumns, rows).map(
              (row, rowIndex, tableRows) => {
                const rowY =
                  thisY +
                  headerHeight +
                  tableRows
                    .slice(0, rowIndex)
                    .reduce(
                      (height, previous) =>
                        height +
                        landRowHeight(
                          model,
                          previous.size,
                          scale,
                          tableColumns,
                        ),
                      0,
                    )
                const height = landRowHeight(
                  model,
                  row.size,
                  scale,
                  tableColumns,
                )
                return (
                  <g
                    key={row.size}
                    data-testid="svg-piece-key-table-row"
                    data-size={row.size}
                  >
                    <KeyBorderRect
                      x={startX}
                      y={rowY}
                      width={rowHeaderWidth}
                      height={height}
                    />
                    <text
                      x={startX + rowHeaderWidth / 2}
                      y={rowY + height / 2 - 4}
                      textAnchor="middle"
                      fontFamily="Inter, Arial, sans-serif"
                      fontSize={KEY_HEADING_SIZE}
                      fontWeight="bold"
                      fill="black"
                    >
                      {row.title}
                    </text>
                    <text
                      x={startX + rowHeaderWidth / 2}
                      y={rowY + height / 2 + 20}
                      textAnchor="middle"
                      fontFamily="Inter, Arial, sans-serif"
                      fontSize={KEY_FONT_SIZE}
                      fill="black"
                    >
                      {row.description}
                    </text>
                    {tableColumns.map((column, columnIndex) => {
                      const cellX =
                        startX + rowHeaderWidth + columnIndex * cellWidth
                      const entry = column.cells.find(
                        (cell) => cell.size === row.size,
                      )?.entry
                      return (
                        <g
                          key={`${column.terrain}-${row.size}`}
                          data-testid="svg-piece-key-land-cell"
                          data-terrain={column.terrain}
                          data-size={row.size}
                          data-has-entry={Boolean(entry)}
                        >
                          <KeyBorderRect
                            x={cellX}
                            y={rowY}
                            width={cellWidth}
                            height={height}
                          />
                          {entry &&
                            SvgPieceKeyShape(
                              entry,
                              cellX + cellWidth / 2,
                              rowY + height / 2,
                              scale,
                              `${column.terrain}-${row.size}`,
                              useTerrainBorderColor,
                              renderOptions,
                            )}
                        </g>
                      )
                    })}
                  </g>
                )
              },
            )}
          </g>
        )
      })}
    </g>
  )
}

const renderSpecialGroups = (
  model: PieceKeyModel,
  y: number,
  gridX: number,
  gridWidth: number,
  scale: number,
  useTerrainBorderColor: boolean,
  renderOptions: NonNullable<Parameters<typeof SvgPieceKeyShape>[6]>,
) => {
  const cardWidth = gridWidth / 3
  let rowY = y + KEY_HEADING_SIZE * 1.6
  return (
    <g data-testid="svg-piece-key-special-tiles">
      <text
        x={gridX}
        y={y + KEY_HEADING_SIZE * 1.2}
        fontFamily="Inter, Arial, sans-serif"
        fontSize={KEY_HEADING_SIZE}
        fontWeight="bold"
        fill="black"
      >
        Special Tiles
      </text>
      {Array.from(
        { length: Math.ceil(model.specialGroups.length / 3) },
        (_, row) => {
          const groups = model.specialGroups.slice(row * 3, row * 3 + 3)
          const rowHeight = Math.max(
            ...groups.map((group) =>
              specialGroupRowHeight(group, cardWidth, scale),
            ),
          )
          const currentY = rowY
          rowY += rowHeight + 8
          return groups.map((group, column) => {
            const cardX = gridX + column * cardWidth
            const { rows: entryRows, slotWidth } = getSpecialEntryRows(
              group,
              cardWidth,
              scale,
            )
            return (
              <g
                key={group.id}
                data-testid="svg-piece-key-special-group"
                data-group-id={group.id}
              >
                <KeyBorderRect
                  x={cardX}
                  y={currentY}
                  width={cardWidth}
                  height={rowHeight}
                />
                {(() => {
                  const header = specialGroupHeader(group, cardWidth - 24)
                  const titleY = currentY + KEY_HEADING_SIZE
                  const descriptionY =
                    titleY +
                    (header.titleLines.length - 1) * KEY_HEADING_SIZE +
                    KEY_HEADING_SIZE * 0.8
                  return (
                    <>
                      <text
                        x={cardX + SVG_HEX_RADIUS * 0.24}
                        y={titleY}
                        fontFamily="Inter, Arial, sans-serif"
                        fontSize={KEY_HEADING_SIZE}
                        fontWeight="bold"
                        fill="black"
                      >
                        {header.titleLines.map((line, index) => (
                          <tspan
                            key={`${group.id}-title-${index}`}
                            x={cardX + SVG_HEX_RADIUS * 0.24}
                            dy={index === 0 ? 0 : KEY_HEADING_SIZE}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                      <text
                        x={cardX + 12}
                        y={descriptionY}
                        fontFamily="Inter, Arial, sans-serif"
                        fontSize={KEY_FONT_SIZE}
                        fill="black"
                      >
                        {header.descriptionLines.map((line, index) => (
                          <tspan
                            key={`${group.id}-description-${index}`}
                            x={cardX + 12}
                            dy={index === 0 ? 0 : KEY_FONT_SIZE}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </>
                  )
                })()}
                {entryRows.map((entries, rowIndex) => {
                  const rowLayout = getPieceKeySpecialEntryRowLayout(
                    entries,
                    scale,
                    'svg',
                    group.id,
                  )
                  const entryY =
                    currentY +
                    specialGroupHeader(group, cardWidth - 24).height +
                    entryRows
                      .slice(0, rowIndex)
                      .reduce(
                        (height, previousEntries) =>
                          height +
                          getSpecialEntryRowHeight(
                            previousEntries,
                            slotWidth,
                            scale,
                          ),
                        0,
                      )
                  return entries.map((entry, columnIndex) => {
                    const entryLayout = rowLayout.entries[columnIndex]
                    const shapeHeight = entryLayout.shapeHeight
                    const shapeX =
                      cardX +
                      SPECIAL_CARD_PADDING +
                      slotWidth * (columnIndex + 0.5)
                    const shapeY =
                      entryY +
                      SPECIAL_ENTRY_PADDING / 2 +
                      entryLayout.shapeTopOffset +
                      shapeHeight / 2
                    const captionLines = wrapSvgPieceKeyText(
                      entry.title,
                      slotWidth - SPECIAL_CARD_PADDING / 2,
                      KEY_FONT_SIZE,
                    )
                    return (
                      <g
                        key={entry.inventoryID}
                        data-testid="svg-piece-key-special-entry"
                        data-row-index={rowIndex}
                        data-slot-x={
                          cardX + SPECIAL_CARD_PADDING + columnIndex * slotWidth
                        }
                        data-slot-width={slotWidth}
                      >
                        {SvgPieceKeyShape(
                          entry,
                          shapeX,
                          shapeY,
                          scale,
                          `${group.id}-${entry.inventoryID}`,
                          useTerrainBorderColor,
                          renderOptions,
                        )}
                        <text
                          x={shapeX}
                          y={
                            entryY +
                            rowLayout.shapeHeight +
                            SPECIAL_ENTRY_PADDING +
                            KEY_FONT_SIZE
                          }
                          textAnchor="middle"
                          fontFamily="Inter, Arial, sans-serif"
                          fontSize={KEY_FONT_SIZE}
                          fill="black"
                        >
                          {captionLines.map((line, index) => (
                            <tspan
                              key={`${entry.inventoryID}-caption-${index}`}
                              x={shapeX}
                              dy={index === 0 ? 0 : KEY_FONT_SIZE * 1.2}
                            >
                              {line}
                            </tspan>
                          ))}
                        </text>
                      </g>
                    )
                  })
                })}
              </g>
            )
          })
        },
      )}
    </g>
  )
}

const renderFluidTable = (
  model: PieceKeyModel,
  x: number,
  y: number,
  width: number,
  useTerrainBorderColor: boolean,
  renderOptions: NonNullable<Parameters<typeof SvgPieceKeyShape>[6]>,
) => {
  const { gridX } = landGridDimensions(model, width, model.fluidColumns)
  return (
    <g data-testid="svg-piece-key-fluid-table">
      <text
        x={x + gridX}
        y={y + KEY_HEADING_SIZE}
        fontFamily="Inter, Arial, sans-serif"
        fontSize={KEY_HEADING_SIZE}
        fontWeight="bold"
        fill="black"
      >
        Liquid and Base Terrain
      </text>
      {renderTerrainTables(
        model,
        model.fluidColumns,
        model.fluidRows,
        x,
        y + KEY_HEADING_SIZE * 1.6,
        width,
        useTerrainBorderColor,
        renderOptions,
        'svg-piece-key-fluid-grid',
      )}
    </g>
  )
}

export const SvgPieceKey = ({
  model,
  renderOptions,
  useTerrainBorderColor,
  x,
  y,
  width,
}: {
  model: PieceKeyModel | null
  renderOptions: NonNullable<Parameters<typeof SvgPieceKeyShape>[6]>
  useTerrainBorderColor: boolean
  x: number
  y: number
  width: number
}) => {
  if (
    !model ||
    (!model.landColumns.length &&
      !model.fluidColumns.length &&
      !model.specialGroups.length)
  ) {
    return null
  }

  const keyWidth = getSvgPieceKeyWidth(model, width)
  const { gridX, scale } = landGridDimensions(model, keyWidth)
  const landHeight = getTerrainTablesHeight(
    model,
    keyWidth,
    model.landColumns,
    model.landRows,
  )
  const fluidHeight = model.fluidColumns.length
    ? KEY_HEADING_SIZE * 1.6 +
      getTerrainTablesHeight(
        model,
        keyWidth,
        model.fluidColumns,
        model.fluidRows,
      )
    : 0
  const contentX = x + (width - keyWidth) / 2
  const landX = contentX + gridX
  const contentWidth = keyWidth
  return (
    <g data-testid="svg-piece-key">
      <text
        x={landX}
        y={y + KEY_HEADING_SIZE * 1.4}
        fontFamily="Inter, Arial, sans-serif"
        fontSize={KEY_HEADING_SIZE * 1.4}
        fontWeight="bold"
        fill="black"
      >
        Piece Key
      </text>
      {renderTerrainTables(
        model,
        model.landColumns,
        model.landRows,
        contentX,
        y + KEY_HEADING_SIZE * 2.3,
        contentWidth,
        useTerrainBorderColor,
        renderOptions,
      )}
      {model.fluidColumns.length > 0 &&
        renderFluidTable(
          model,
          contentX,
          y + KEY_HEADING_SIZE * 2.3 + landHeight,
          contentWidth,
          useTerrainBorderColor,
          renderOptions,
        )}
      {model.specialGroups.length > 0 &&
        renderSpecialGroups(
          model,
          y + KEY_HEADING_SIZE * 2.3 + landHeight + fluidHeight,
          contentX,
          contentWidth,
          scale,
          useTerrainBorderColor,
          renderOptions,
        )}
    </g>
  )
}
