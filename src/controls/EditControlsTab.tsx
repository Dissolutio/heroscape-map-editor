import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  List,
  Tooltip,
  Typography,
} from '@mui/material'
import { FcVlc } from 'react-icons/fc'
import { FcRules } from 'react-icons/fc'
import { buildupJsonFileMap } from '../data/buildupMap'
import { canShrinkMapWithoutDroppingPieces, resizeMap } from '../data/resizeMap'
import { DIALOGS } from '../layout/dialogNames'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'
import useBoundStore from '../store/store'
import type { BoardPiece, MapFileState } from '../types'
import {
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from '../utils/constants'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { ControlTabsListItemButton } from './ControlTabsListItemButton'

const shiftInDirectionBoardPieces = (
  direction: number,
  boardPieces: BoardPiece[],
) => {
  const newBoardPieces = boardPieces.map((boardPiece) => {
    const { pieceCoords } = boardPiece
    const newPieceCoords = hexUtilsAdd(pieceCoords, HEX_DIRECTIONS[direction])
    return {
      ...boardPiece,
      pieceCoords: newPieceCoords,
    }
  })
  return newBoardPieces
}
export const EditControlsTab = () => {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  // const conflictedPieceUIDs = useBoundStore((s) => s.conflictedPieceUIDs)
  const loadMap = useBoundStore((s) => s.loadMap)
  const setPiecePreviews = useBoundStore((s) => s.setPiecePreviews)
  const {
    // isLargeScreenWidth,
    isSmallScreenWidth,
    isMediumScreenWidth,
  } = useMuiMediaQuery()

  const clearPreview = () => setPiecePreviews(null)

  const previewAllPiecesMove = (direction: number) => {
    setPiecePreviews(
      boardPieces.map((bp) => ({
        ...bp,
        pieceCoords: hexUtilsAdd(bp.pieceCoords, HEX_DIRECTIONS[direction]),
      })),
    )
  }

  const toggleIsEditMapDialogOpen = useBoundStore(
    (state) => state.toggleIsEditMapDialogOpen,
  )
  const isPieceInventoryDialogOpen =
    useBoundStore((state) => state.currentDialog) ===
    DIALOGS.editPersonalInventory
  const toggleIsPieceInventoryDialogOpen = useBoundStore(
    (state) => state.toggleIsPieceInventoryDialogOpen,
  )
  const handleClickLogState = () => {
    console.log('🚀 ~ Controls ~ boardHexes:', boardHexes)
    console.log({ boardPieces, hexMap } as MapFileState)
    // console.log('🚀 ~ Controls ~ boardPieces:', boardPieces)
    // console.log('🚀 ~ Controls ~ hexMap:', hexMap)
    // console.log('🚀 ~ Controls ~ conflictedPieceUIDs:', conflictedPieceUIDs)
  }
  // const handleTrimMap = (boardHexesToTrim: BoardHexes): BoardHexes => {
  //   // const boardHexArr = Object.values(boardHexes)
  //   const boardHexArr = Object.values(boardHexesToTrim)
  //   const maxX = Math.max(...boardHexArr.map((bh) => bh.q - bh.s))
  //   const rightColumn = boardHexArr.filter(
  //     (bh) => bh.q - bh.s === maxX || bh.q - bh.s === maxX - 1,
  //   )
  //   const isRightSideEmpty = rightColumn.every(
  //     (bh) => bh.terrain === HexTerrain.empty,
  //   )
  //   const leftColumn = boardHexArr.filter(
  //     (bh) => bh.s - bh.q === -1 || bh.s - bh.q === 0,
  //   )
  //   const isLeftSideEmpty = leftColumn.every(
  //     (bh) => bh.terrain === HexTerrain.empty,
  //   )
  //   const maxY = Math.max(...boardHexArr.map((bh) => bh.r - bh.s - bh.q))
  //   const bottomRow = boardHexArr.filter(
  //     (bh) => bh.r - bh.s - bh.q === maxY || bh.r - bh.s - bh.q === maxY - 2,
  //   )
  //   const isBottomRowEmpty = bottomRow.every(
  //     (bh) => bh.terrain === HexTerrain.empty,
  //   )
  //   const top2Rows = boardHexArr.filter(
  //     (bh) => bh.q + bh.s - bh.r === 0 || bh.q + bh.s - bh.r === -2,
  //   )
  //   const isTop2RowsEmpty = top2Rows.every(
  //     (bh) => bh.terrain === HexTerrain.empty,
  //   )
  //   return keyBy(boardHexArr, 'id')
  // }
  const movePieces = (direction: number) => {
    const newBoardPieces = shiftInDirectionBoardPieces(direction, boardPieces)
    const newMap = buildupJsonFileMap(newBoardPieces, hexMap)
    loadMap(newMap)
    // Refresh the preview from the new positions so hovering while clicking
    // always shows the correct next-step arrow (not a zero-length one).
    setPiecePreviews(
      newBoardPieces.map((bp) => ({
        ...bp,
        pieceCoords: hexUtilsAdd(bp.pieceCoords, HEX_DIRECTIONS[direction]),
      })),
    )
  }
  const resizeAndLoad = (dimension: 'length' | 'width', delta: 1 | -1) => {
    const resized = resizeMap(hexMap, boardPieces, dimension, delta)
    loadMap(buildupJsonFileMap(resized.boardPieces, resized.hexMap))
  }
  const lengthShrinkBlockedByPieces =
    hexMap.length > 1 &&
    !canShrinkMapWithoutDroppingPieces(hexMap, boardPieces, 'length')
  const widthShrinkBlockedByPieces =
    hexMap.width > 1 &&
    !canShrinkMapWithoutDroppingPieces(hexMap, boardPieces, 'width')
  const lengthShrinkTitle = lengthShrinkBlockedByPieces
    ? hexMap.shape === 'hexagon'
      ? 'Cannot remove the outer ring because pieces occupy hexes that would be removed'
      : 'Cannot remove the bottom row because pieces occupy hexes in it'
    : hexMap.shape === 'hexagon'
      ? 'Remove one outer ring of hexes'
      : 'Remove one row of hexes from bottom'
  const widthShrinkTitle = widthShrinkBlockedByPieces
    ? hexMap.shape === 'hexagon'
      ? 'Cannot remove the outer ring because pieces occupy hexes that would be removed'
      : 'Cannot remove the right column because pieces occupy hexes in it'
    : hexMap.shape === 'hexagon'
      ? 'Remove one outer ring of hexes'
      : 'Remove one column of hexes from right side'
  const buttonFontSize = isSmallScreenWidth ? 8 : isMediumScreenWidth ? 8 : 8
  return (
    <Box sx={{ p: 0 }}>
      {/* <div style={{ padding: '0px 20px' }}>
        {isUseInventory && !Number.isNaN(remainingCount)
          ? `${remainingCount} remaining`
          : ''}
      </div> */}
      {/* <LocalStorageList /> */}
      <List>
        {/* OPEN EDIT MAP DETAILS DIALOG */}
        <ControlTabsListItemButton
          title={
            'Edit map details (i.e. name, author, sets used, map pictures, notes)'
          }
          primary={'Edit Map Details'}
          onClick={() => toggleIsEditMapDialogOpen(true)}
          icon={<FcVlc />}
        />
        <ControlTabsListItemButton
          title={'Edit and save your personal terrain inventory'}
          primary={'Edit Personal Inventory'}
          onClick={() =>
            toggleIsPieceInventoryDialogOpen(!isPieceInventoryDialogOpen)
          }
          icon={<FcRules />}
        />
      </List>

      <Card>
        <CardContent>
          <Typography
            gutterBottom
            sx={{ color: 'text.secondary', fontSize: 14 }}
          >
            Adjust map dimensions
          </Typography>
          <ButtonGroup
            // variant="contained"
            aria-label="Adjust map dimensions button group"
            size="small"
          >
            <Button
              size="small"
              disabled={
                (hexMap.shape === 'hexagon' &&
                  hexMap.length >= MAX_HEXAGON_MAP_DIMENSION) ||
                (hexMap.shape === 'rectangle' &&
                  hexMap.length >= MAX_RECTANGLE_MAP_DIMENSION)
              }
              title={
                hexMap.shape === 'hexagon'
                  ? 'Add one outer ring of hexes'
                  : 'Add one row of hexes to bottom'
              }
              onClick={() => resizeAndLoad('length', 1)}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              + length
            </Button>
            <Tooltip
              title={lengthShrinkBlockedByPieces ? lengthShrinkTitle : ''}
              disableHoverListener={!lengthShrinkBlockedByPieces}
            >
              <span>
                <Button
                  disabled={hexMap.length <= 1 || lengthShrinkBlockedByPieces}
                  title={lengthShrinkTitle}
                  onClick={() => resizeAndLoad('length', -1)}
                  sx={{
                    fontSize: buttonFontSize,
                  }}
                >
                  - length
                </Button>
              </span>
            </Tooltip>
            <Button
              disabled={
                (hexMap.shape === 'hexagon' &&
                  hexMap.width >= MAX_HEXAGON_MAP_DIMENSION) ||
                (hexMap.shape === 'rectangle' &&
                  hexMap.width >= MAX_RECTANGLE_MAP_DIMENSION)
              }
              title="Add one column of hexes to right side"
              onClick={() => resizeAndLoad('width', 1)}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              + width
            </Button>
            <Tooltip
              title={widthShrinkBlockedByPieces ? widthShrinkTitle : ''}
              disableHoverListener={!widthShrinkBlockedByPieces}
            >
              <span>
                <Button
                  disabled={hexMap.width <= 1 || widthShrinkBlockedByPieces}
                  title={widthShrinkTitle}
                  onClick={() => resizeAndLoad('width', -1)}
                  sx={{
                    fontSize: buttonFontSize,
                  }}
                >
                  - width
                </Button>
              </span>
            </Tooltip>
          </ButtonGroup>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography
            gutterBottom
            sx={{ color: 'text.secondary', fontSize: 14 }}
          >
            Shift all pieces in 1 direction
          </Typography>
          <ButtonGroup aria-label="Shift map button group" size="small">
            <Button
              title="Move all pieces 1 hex left"
              onClick={() => movePieces(3)}
              onMouseEnter={() => previewAllPiecesMove(3)}
              onMouseLeave={clearPreview}
              onFocus={() => previewAllPiecesMove(3)}
              onBlur={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Left
            </Button>
            <Button
              title="Move all pieces 1 hex up-left"
              onClick={() => movePieces(4)}
              onMouseEnter={() => previewAllPiecesMove(4)}
              onMouseLeave={clearPreview}
              onFocus={() => previewAllPiecesMove(4)}
              onBlur={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Up Left
            </Button>
            <Button
              title="Move all pieces 1 hex up-right"
              onClick={() => movePieces(5)}
              onMouseEnter={() => previewAllPiecesMove(5)}
              onMouseLeave={clearPreview}
              onFocus={() => previewAllPiecesMove(5)}
              onBlur={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Up Right
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button
              title="Move all pieces 1 hex right"
              onClick={() => movePieces(0)}
              onMouseEnter={() => previewAllPiecesMove(0)}
              onMouseLeave={clearPreview}
              onFocus={() => previewAllPiecesMove(0)}
              onBlur={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Right
            </Button>
            <Button
              title="Move all pieces 1 hex down-right"
              onClick={() => movePieces(1)}
              onMouseEnter={() => previewAllPiecesMove(1)}
              onMouseLeave={clearPreview}
              onFocus={() => previewAllPiecesMove(1)}
              onBlur={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Down Right
            </Button>
            <Button
              title="Move all pieces 1 hex down-left"
              onClick={() => movePieces(2)}
              onMouseEnter={() => previewAllPiecesMove(2)}
              onMouseLeave={clearPreview}
              onFocus={() => previewAllPiecesMove(2)}
              onBlur={clearPreview}
              sx={{
                fontSize: buttonFontSize,
              }}
            >
              Down Left
            </Button>
          </ButtonGroup>
        </CardContent>
      </Card>

      {import.meta.env.DEV && (
        <Button onClick={handleClickLogState}>Log state</Button>
      )}
    </Box>
  )
}
