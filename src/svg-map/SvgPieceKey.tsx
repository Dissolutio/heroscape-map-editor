import { Fragment } from 'react'
import {
  getPieceKeyModel,
  type PieceKeyEntry,
  type PieceKeyModel,
} from '../pdf-svg-shared/pieceKey'
import { getPieceKeyShapeLayout } from '../pdf-svg-shared/pieceKeyShapeLayout'
import useBoundStore from '../store/store'
import type { BoardHex, BoardPiece } from '../types'
import { boardPieceToDecodedPieceID } from '../utils/map-utils'
import { SvgMapBoardPiece } from './SvgMapBoardPiece'
import { SvgMapHex } from './SvgMapHex'

const LAND_COLUMNS_PER_TABLE = 6
const LAND_SCALE = 0.16
const SPECIAL_SCALE = 0.09
const LAND_ROW_HEIGHT = 66

export const SvgPieceKeyShape = (
  entry: PieceKeyEntry,
  x: number,
  y: number,
  scale: number,
  key: string,
) => {
  const layout = getPieceKeyShapeLayout(entry)
  const decoded = boardPieceToDecodedPieceID(entry.piece)
  return (
    <g key={key} data-testid="svg-piece-key-shape">
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

const landRowHeight = (size: number) =>
  size >= 24 ? 160 : size >= 7 ? 120 : LAND_ROW_HEIGHT

const getLandTablesHeight = (model: PieceKeyModel) => {
  const tableCount = Math.ceil(
    model.landColumns.length / LAND_COLUMNS_PER_TABLE,
  )
  return model.landColumns.length
    ? tableCount *
        (56 +
          model.landRows.reduce(
            (height, row) => height + landRowHeight(row.size),
            0,
          ) +
          12)
    : 0
}

const groupRowHeights = (model: PieceKeyModel) => {
  const heights: number[] = []
  for (let i = 0; i < model.specialGroups.length; i += 3) {
    heights.push(
      Math.max(
        ...model.specialGroups.slice(i, i + 3).map((group) => {
          const entryRows = Math.ceil(group.entries.length / 4)
          return 72 + entryRows * 64
        }),
      ),
    )
  }
  return heights
}

export const getSvgPieceKeyHeight = (model: PieceKeyModel) => {
  if (!model.landColumns.length && !model.specialGroups.length) return 0
  return (
    64 +
    getLandTablesHeight(model) +
    (model.specialGroups.length
      ? 40 + groupRowHeights(model).reduce((a, b) => a + b + 8, 0)
      : 0)
  )
}

const renderLandTables = (
  model: PieceKeyModel,
  x: number,
  y: number,
  width: number,
) => {
  const tableCount = Math.ceil(
    model.landColumns.length / LAND_COLUMNS_PER_TABLE,
  )
  const rowHeaderWidth = Math.min(150, width / 7)
  const cellWidth = Math.min(
    185,
    (width - rowHeaderWidth) /
      Math.min(LAND_COLUMNS_PER_TABLE, model.landColumns.length),
  )
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
        const headerHeight = 56
        const thisY = tableY
        const rows = model.landRows
        const tableHeight =
          headerHeight +
          rows.reduce((height, row) => height + landRowHeight(row.size), 0)
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
              fontSize={18}
              fontWeight="bold"
              fill="black"
            >
              Notice centers
            </text>
            <text
              x={startX + 5}
              y={thisY + 43}
              fontFamily="Inter, Arial, sans-serif"
              fontSize={18}
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
                    (height, previous) => height + landRowHeight(previous.size),
                    0,
                  )
              const height = landRowHeight(row.size)
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
                            LAND_SCALE,
                            `${column.terrain}-${row.size}`,
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
  x: number,
  y: number,
  width: number,
) => {
  const cardWidth = width / 3
  let rowY = y + 40
  return (
    <g data-testid="svg-piece-key-special-tiles">
      <text
        x={x}
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
            ...groups.map(
              (group) => 72 + Math.ceil(group.entries.length / 4) * 64,
            ),
          )
          const currentY = rowY
          rowY += rowHeight + 8
          return groups.map((group, column) => {
            const cardX = x + column * cardWidth
            const entriesPerRow = 4
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
                {group.entries.map((entry, index) => {
                  const rowIndex = Math.floor(index / entriesPerRow)
                  const columnIndex = index % entriesPerRow
                  const slotWidth = (cardWidth - 24) / entriesPerRow
                  const shapeX = cardX + 12 + slotWidth * (columnIndex + 0.5)
                  const shapeY = currentY + 78 + rowIndex * 64
                  return (
                    <g key={entry.inventoryID}>
                      {SvgPieceKeyShape(
                        entry,
                        shapeX,
                        shapeY,
                        SPECIAL_SCALE,
                        `${group.id}-${entry.inventoryID}`,
                      )}
                      <text
                        x={shapeX}
                        y={shapeY + 27}
                        textAnchor="middle"
                        fontFamily="Inter, Arial, sans-serif"
                        fontSize={14}
                        fill="black"
                      >
                        {entry.title}
                      </text>
                    </g>
                  )
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
  const model = getPieceKeyModel(boardPieces, boardHexes, true)
  if (!model.landColumns.length && !model.specialGroups.length) return null

  const landHeight = getLandTablesHeight(model)
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
      {renderLandTables(model, x, y + 56, width)}
      {model.specialGroups.length > 0 &&
        renderSpecialGroups(model, x, y + 56 + landHeight, width)}
    </g>
  )
}
