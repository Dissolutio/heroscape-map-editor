import { Fragment } from 'react'
import {
  type PieceKeyEntry,
  type PieceKeyModel,
  getPieceKeyModel,
} from '../pdf-svg-shared/pieceKey'
import {
  getPieceKeyRowShapeHeight,
  getPieceKeyShapeLayout,
  getPieceKeyShapeScale,
  getPieceKeySpecialEntriesPerRow,
} from '../pdf-svg-shared/pieceKeyShapeLayout'
import useBoundStore from '../store/store'
import type { BoardHex, BoardPiece } from '../types'
import { boardPieceToDecodedPieceID } from '../utils/map-utils'
import { SvgMapBoardPiece } from './SvgMapBoardPiece'
import { SvgMapHex } from './SvgMapHex'

const LAND_COLUMNS_PER_TABLE = 6
const LAND_SCALE = 0.16
const LAND_HEADER_HEIGHT = 64
const LAND_ROW_PADDING = 20
const SPECIAL_ENTRY_PADDING = 16

export const SvgPieceKeyShape = (
  entry: PieceKeyEntry,
  x: number,
  y: number,
  scale: number,
  key: string,
  useTerrainBorderColor = true,
) => {
  const layout = getPieceKeyShapeLayout(entry)
  const decoded = boardPieceToDecodedPieceID(entry.piece)
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
            <g transform={`rotate(${layout.angle})`}>
              <g
                transform={`translate(${-layout.origin.x} ${-layout.origin.y})`}
              >
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
                        isPieceKeyPreview
                        useTerrainBorderColor={useTerrainBorderColor}
                      />
                    )
                  })
                ) : decoded ? (
                  <SvgMapBoardPiece
                    piece={{ ...decoded, altitude: 0, rotation: 0 }}
                    viewingLevel={100}
                    overlayLevel={100}
                    isPieceKeyPreview
                  />
                ) : null}
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  )
}

const landGridDimensions = (model: PieceKeyModel, width: number) => {
  const rowHeaderWidth = Math.min(190, width / 4)
  const cellWidth = Math.min(
    185,
    (width - rowHeaderWidth) /
      Math.min(LAND_COLUMNS_PER_TABLE, Math.max(model.landColumns.length, 1)),
  )
  const columnsInWidestTable = Math.min(
    LAND_COLUMNS_PER_TABLE,
    model.landColumns.length,
  )
  const gridWidth = model.landColumns.length
    ? rowHeaderWidth + cellWidth * columnsInWidestTable
    : width
  const scale = getPieceKeyShapeScale(model, cellWidth, LAND_SCALE)
  return {
    rowHeaderWidth,
    cellWidth,
    gridWidth,
    gridX: (width - gridWidth) / 2,
    scale,
  }
}

const landRowHeight = (model: PieceKeyModel, size: number, scale: number) => {
  const minimum = size >= 24 ? 120 : size >= 7 ? 90 : 66
  return Math.max(
    minimum,
    getPieceKeyRowShapeHeight(model, size, scale, LAND_ROW_PADDING),
  )
}

const getLandTablesHeight = (model: PieceKeyModel, width: number) => {
  const { scale } = landGridDimensions(model, width)
  const tableCount = Math.ceil(
    model.landColumns.length / LAND_COLUMNS_PER_TABLE,
  )
  return model.landColumns.length
    ? tableCount *
        (LAND_HEADER_HEIGHT +
          model.landRows.reduce(
            (height, row) => height + landRowHeight(model, row.size, scale),
            0,
          ) +
          12)
    : 0
}

const specialGroupRowHeight = (
  group: PieceKeyModel['specialGroups'][number],
  innerWidth: number,
  scale: number,
) => {
  const entriesPerRow = getPieceKeySpecialEntriesPerRow(
    group,
    innerWidth,
    scale,
  )
  let height = 68
  for (let offset = 0; offset < group.entries.length; offset += entriesPerRow) {
    const rowEntries = group.entries.slice(offset, offset + entriesPerRow)
    const shapeHeight = Math.max(
      0,
      ...rowEntries.map(
        (entry) => getPieceKeyShapeLayout(entry).height * scale,
      ),
    )
    height += Math.max(56, shapeHeight + SPECIAL_ENTRY_PADDING + 24)
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
          return specialGroupRowHeight(group, cardWidth - 24, scale)
        }),
      ),
    )
  }
  return heights
}

export const getSvgPieceKeyHeight = (model: PieceKeyModel, width: number) => {
  if (!model.landColumns.length && !model.specialGroups.length) return 0
  const { gridWidth, scale } = landGridDimensions(model, width)
  return (
    64 +
    getLandTablesHeight(model, width) +
    (model.specialGroups.length
      ? 40 +
        groupRowHeights(model, gridWidth, scale).reduce((a, b) => a + b + 8, 0)
      : 0)
  )
}

const renderLandTables = (
  model: PieceKeyModel,
  x: number,
  y: number,
  width: number,
  useTerrainBorderColor: boolean,
) => {
  const tableCount = Math.ceil(
    model.landColumns.length / LAND_COLUMNS_PER_TABLE,
  )
  const { rowHeaderWidth, cellWidth, scale } = landGridDimensions(model, width)
  let tableY = y
  return (
    <g data-testid="svg-piece-key-land-grid">
      {Array.from({ length: tableCount }, (_, tableIndex) => {
        const columns = model.landColumns.slice(
          tableIndex * LAND_COLUMNS_PER_TABLE,
          (tableIndex + 1) * LAND_COLUMNS_PER_TABLE,
        )
        const activeWidth = rowHeaderWidth + cellWidth * columns.length
        const startX = x + (width - activeWidth) / 2
        const headerHeight = LAND_HEADER_HEIGHT
        const thisY = tableY
        const rows = model.landRows
        const tableHeight =
          headerHeight +
          rows.reduce(
            (height, row) => height + landRowHeight(model, row.size, scale),
            0,
          )
        tableY += tableHeight + 12
        return (
          <g
            key={columns.map((column) => column.terrain).join('|')}
            data-testid="svg-piece-key-land-table"
          >
            <rect
              x={startX}
              y={thisY}
              width={rowHeaderWidth}
              height={headerHeight}
              fill="white"
              stroke="black"
              strokeWidth={1}
            />
            <text
              x={startX + 5}
              y={thisY + 21}
              fontFamily="Inter, Arial, sans-serif"
              fontSize={17}
              fontWeight="bold"
              fill="black"
            >
              Notice centers
            </text>
            <text
              x={startX + 5}
              y={thisY + 43}
              fontFamily="Inter, Arial, sans-serif"
              fontSize={17}
              fontWeight="bold"
              fill="black"
            >
              and border colors
            </text>
            {columns.map((column, columnIndex) => {
              const cellX = startX + rowHeaderWidth + columnIndex * cellWidth
              return (
                <g key={column.terrain} data-testid="svg-piece-key-land-column">
                  <rect
                    x={cellX}
                    y={thisY}
                    width={cellWidth}
                    height={headerHeight}
                    fill="white"
                    stroke="black"
                    strokeWidth={1}
                  />
                  <text
                    x={cellX + cellWidth / 2}
                    y={thisY + 24}
                    textAnchor="middle"
                    fontFamily="Inter, Arial, sans-serif"
                    fontSize={23}
                    fontWeight="bold"
                    fill="black"
                  >
                    {column.title}
                  </text>
                  <text
                    x={cellX + cellWidth / 2}
                    y={thisY + 46}
                    textAnchor="middle"
                    fontFamily="Inter, Arial, sans-serif"
                    fontSize={16}
                    fill="black"
                  >
                    {column.description}
                  </text>
                </g>
              )
            })}
            {rows.map((row, rowIndex) => {
              const rowY =
                thisY +
                headerHeight +
                rows
                  .slice(0, rowIndex)
                  .reduce(
                    (height, previous) =>
                      height + landRowHeight(model, previous.size, scale),
                    0,
                  )
              const height = landRowHeight(model, row.size, scale)
              return (
                <Fragment key={row.size}>
                  <rect
                    x={startX}
                    y={rowY}
                    width={rowHeaderWidth}
                    height={height}
                    fill="white"
                    stroke="black"
                    strokeWidth={1}
                  />
                  <text
                    x={startX + rowHeaderWidth / 2}
                    y={rowY + height / 2 - 4}
                    textAnchor="middle"
                    fontFamily="Inter, Arial, sans-serif"
                    fontSize={24}
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
                    fontSize={16}
                    fill="black"
                  >
                    {row.description}
                  </text>
                  {columns.map((column, columnIndex) => {
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
                        <rect
                          x={cellX}
                          y={rowY}
                          width={cellWidth}
                          height={height}
                          fill="white"
                          stroke="black"
                          strokeWidth={1}
                        />
                        {entry &&
                          SvgPieceKeyShape(
                            entry,
                            cellX + cellWidth / 2,
                            rowY + height / 2,
                            scale,
                            `${column.terrain}-${row.size}`,
                            useTerrainBorderColor,
                          )}
                      </g>
                    )
                  })}
                </Fragment>
              )
            })}
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
) => {
  const cardWidth = gridWidth / 3
  let rowY = y + 40
  return (
    <g data-testid="svg-piece-key-special-tiles">
      <text
        x={gridX}
        y={y + 30}
        fontFamily="Inter, Arial, sans-serif"
        fontSize={32}
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
              specialGroupRowHeight(group, cardWidth - 24, scale),
            ),
          )
          const currentY = rowY
          rowY += rowHeight + 8
          return groups.map((group, column) => {
            const cardX = gridX + column * cardWidth
            const entriesPerRow = getPieceKeySpecialEntriesPerRow(
              group,
              cardWidth - 24,
              scale,
            )
            const entryRows: PieceKeyEntry[][] = []
            for (
              let offset = 0;
              offset < group.entries.length;
              offset += entriesPerRow
            ) {
              entryRows.push(
                group.entries.slice(offset, offset + entriesPerRow),
              )
            }
            return (
              <g key={group.id} data-testid="svg-piece-key-special-group">
                <rect
                  x={cardX}
                  y={currentY}
                  width={cardWidth}
                  height={rowHeight}
                  fill="white"
                  stroke="black"
                  strokeWidth={1}
                />
                <text
                  x={cardX + 12}
                  y={currentY + 26}
                  fontFamily="Inter, Arial, sans-serif"
                  fontSize={24}
                  fontWeight="bold"
                  fill="black"
                >
                  {group.title}
                </text>
                <text
                  x={cardX + 12}
                  y={currentY + 47}
                  fontFamily="Inter, Arial, sans-serif"
                  fontSize={15}
                  fill="black"
                >
                  {group.description}
                </text>
                {entryRows.map((entries, rowIndex) => {
                  const shapeHeight = Math.max(
                    0,
                    ...entries.map(
                      (entry) => getPieceKeyShapeLayout(entry).height * scale,
                    ),
                  )
                  const entryRowHeight = Math.max(
                    56,
                    shapeHeight + SPECIAL_ENTRY_PADDING + 24,
                  )
                  const slotWidth = (cardWidth - 24) / entriesPerRow
                  const entryY =
                    currentY +
                    68 +
                    entryRows
                      .slice(0, rowIndex)
                      .reduce((height, previousEntries) => {
                        const previousShapeHeight = Math.max(
                          0,
                          ...previousEntries.map(
                            (entry) =>
                              getPieceKeyShapeLayout(entry).height * scale,
                          ),
                        )
                        return (
                          height +
                          Math.max(
                            56,
                            previousShapeHeight + SPECIAL_ENTRY_PADDING + 24,
                          )
                        )
                      }, 0)
                  return entries.map((entry, columnIndex) => {
                    const shapeX = cardX + 12 + slotWidth * (columnIndex + 0.5)
                    const shapeY = entryY + entryRowHeight / 2
                    return (
                      <g key={entry.inventoryID}>
                        {SvgPieceKeyShape(
                          entry,
                          shapeX,
                          shapeY,
                          scale,
                          `${group.id}-${entry.inventoryID}`,
                          useTerrainBorderColor,
                        )}
                        <text
                          x={shapeX}
                          y={entryY + entryRowHeight - 4}
                          textAnchor="middle"
                          fontFamily="Inter, Arial, sans-serif"
                          fontSize={14}
                          fill="black"
                        >
                          {entry.title}
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

export const SvgPieceKey = ({
  boardPieces,
  boardHexes,
  x,
  y,
  width,
}: {
  boardPieces: BoardPiece[]
  boardHexes: Record<string, BoardHex>
  x: number
  y: number
  width: number
}) => {
  const useTerrainBorderColor = useBoundStore(
    (state) => state.isPdfColorBorders,
  )
  const model = getPieceKeyModel(boardPieces, boardHexes, useTerrainBorderColor)
  if (!model.landColumns.length && !model.specialGroups.length) return null

  const { gridWidth, gridX, scale } = landGridDimensions(model, width)
  const landHeight = getLandTablesHeight(model, width)
  return (
    <g data-testid="svg-piece-key">
      <text
        x={x}
        y={y + 34}
        fontFamily="Inter, Arial, sans-serif"
        fontSize={34}
        fontWeight="bold"
        fill="black"
      >
        Piece Key
      </text>
      {renderLandTables(model, x, y + 56, width, useTerrainBorderColor)}
      {model.specialGroups.length > 0 &&
        renderSpecialGroups(
          model,
          y + 56 + landHeight,
          x + gridX,
          gridWidth,
          scale,
          useTerrainBorderColor,
        )}
    </g>
  )
}
