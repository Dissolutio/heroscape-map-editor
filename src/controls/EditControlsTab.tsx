import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import { buildupJsonFileMap } from '../data/buildupMap'
import useBoundStore from '../store/store'
import type { BoardPieces } from '../types'
import {
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from '../utils/constants'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { decodePieceID, genBoardHexID, genPieceID } from '../utils/map-utils'
import { FcVlc } from 'react-icons/fc'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'

const shiftInDirectionBoardPieces = (
  direction: number,
  boardPieces: BoardPieces,
) => {
  const newBoardPieces = Object.keys(boardPieces).reduce(
    (prev: any, pid: string) => {
      const {
        inventoryID,
        altitude,
        rotation,
        // boardHexID,
        pieceCoords,
      } = decodePieceID(pid)
      const newPieceCoords = hexUtilsAdd(pieceCoords, HEX_DIRECTIONS[direction])
      const newBoardHexID = genBoardHexID({ ...newPieceCoords, altitude })
      const newPieceID = genPieceID(newBoardHexID, inventoryID, rotation)
      return {
        ...prev,
        [newPieceID]: inventoryID,
      }
    },
    {},
  )
  return newBoardPieces
}
export const EditControlsTab = () => {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  const loadMap = useBoundStore((s) => s.loadMap)
  const {
    // isLargeScreenLayout,
    isMobileScreenLayout,
    isMediumScreenLayout,
  } = useMuiMediaQuery()
  // const inventory = useLocalPieceInventory()

  const toggleIsEditMapDialogOpen = useBoundStore(
    (state) => state.toggleIsEditMapDialogOpen,
  )
  const handleClickLogState = () => {
    console.log('🚀 ~ Controls ~ boardHexes:', boardHexes)
    console.log('🚀 ~ Controls ~ boardPieces:', boardPieces)
    console.log('🚀 ~ Controls ~ hexMap:', hexMap)
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
  }
  const handleClickAddMapLengthX = () => {
    const newHexMap = {
      ...hexMap,
      length: hexMap.length + 1,
      width: hexMap.shape === 'hexagon' ? hexMap.width + 1 : hexMap.width,
    }
    if (hexMap.shape !== 'hexagon') {
      const newMap = buildupJsonFileMap(boardPieces, newHexMap)
      loadMap(newMap)
    } else {
      const shiftedEastPieces = shiftInDirectionBoardPieces(0, boardPieces)
      const shiftedSouthEastPieces = shiftInDirectionBoardPieces(
        1,
        shiftedEastPieces,
      )
      const newMap = buildupJsonFileMap(shiftedSouthEastPieces, newHexMap)
      loadMap(newMap)
    }
  }
  const handleClickRemoveMapLengthX = () => {
    const newHexMap = {
      ...hexMap,
      length: hexMap.length - 1,
      width: hexMap.shape !== 'hexagon' ? hexMap.width : hexMap.width - 1,
    }
    if (hexMap.shape !== 'hexagon') {
      const newMap = buildupJsonFileMap(boardPieces, newHexMap)
      loadMap(newMap)
    } else {
      const shiftedWestPieces = shiftInDirectionBoardPieces(3, boardPieces)
      const shiftedNorthWestPieces = shiftInDirectionBoardPieces(
        4,
        shiftedWestPieces,
      )
      const newMap = buildupJsonFileMap(shiftedNorthWestPieces, newHexMap)
      loadMap(newMap)
    }
  }
  const handleClickAddMapWidthY = () => {
    const newHexMap = {
      ...hexMap,
      width: hexMap.width + 1,
      length: hexMap.shape === 'hexagon' ? hexMap.length + 1 : hexMap.length,
    }
    if (hexMap.shape !== 'hexagon') {
      const newMap = buildupJsonFileMap(boardPieces, newHexMap)
      loadMap(newMap)
    } else {
      const shiftedEastPieces = shiftInDirectionBoardPieces(0, boardPieces)
      const shiftedSouthEastPieces = shiftInDirectionBoardPieces(
        1,
        shiftedEastPieces,
      )
      const newMap = buildupJsonFileMap(shiftedSouthEastPieces, newHexMap)
      loadMap(newMap)
    }
  }
  const handleClickRemoveMapWidthY = () => {
    const newHexMap = {
      ...hexMap,
      width: hexMap.width - 1,
      length: hexMap.shape !== 'hexagon' ? hexMap.length : hexMap.length - 1,
    }
    if (hexMap.shape !== 'hexagon') {
      const newMap = buildupJsonFileMap(boardPieces, newHexMap)
      loadMap(newMap)
    } else {
      const shiftedWestPieces = shiftInDirectionBoardPieces(3, boardPieces)
      const shiftedNorthWestPieces = shiftInDirectionBoardPieces(
        4,
        shiftedWestPieces,
      )
      const newMap = buildupJsonFileMap(shiftedNorthWestPieces, newHexMap)
      loadMap(newMap)
    }
  }
  const buttonFontSize = isMobileScreenLayout ? 8 : isMediumScreenLayout ? 12 : 12
  return (
    <Box sx={{ p: 0 }}>
      {/* <div style={{ padding: '0px 20px' }}>
        {isUseInventory && !Number.isNaN(remainingCount)
          ? `${remainingCount} remaining`
          : ''}
      </div> */}
      {/* <MapLensToggles /> */}
      {/* <LocalStorageList /> */}
      {/* OPEN EDIT MAP DETAILS DIALOG */}
      <List>

        <ListItemButton onClick={() => toggleIsEditMapDialogOpen(true)}>
          <ListItemIcon>
            <FcVlc />
          </ListItemIcon>
          <ListItemText primary={'Edit Map Details'} />
        </ListItemButton>
      </List>

      <Card>
        <CardContent>
          <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
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
              onClick={handleClickAddMapLengthX}
              sx={{
                fontSize: buttonFontSize
              }}
            >
              + length
            </Button>
            <Button
              disabled={
                (hexMap.shape === 'hexagon' && hexMap.length <= 1) ||
                (hexMap.shape === 'rectangle' && hexMap.length <= 1)
              }
              title={
                hexMap.shape === 'hexagon'
                  ? 'Remove one outer ring of hexes'
                  : 'Remove one row of hexes from bottom'
              }
              onClick={handleClickRemoveMapLengthX}
              sx={{
                fontSize: buttonFontSize
              }}
            >
              - length
            </Button>
            <Button
              disabled={
                (hexMap.shape === 'hexagon' &&
                  hexMap.width >= MAX_HEXAGON_MAP_DIMENSION) ||
                (hexMap.shape === 'rectangle' &&
                  hexMap.width >= MAX_RECTANGLE_MAP_DIMENSION)
              }
              title="Add one column of hexes to right side"
              onClick={handleClickAddMapWidthY}
              sx={{
                fontSize: buttonFontSize
              }}
            >
              + width
            </Button>
            <Button
              disabled={
                (hexMap.shape === 'hexagon' && hexMap.width <= 1) ||
                (hexMap.shape === 'rectangle' && hexMap.width <= 1)
              }
              title="Remove one column of hexes from right side"
              onClick={handleClickRemoveMapWidthY}
              sx={{
                fontSize: buttonFontSize
              }}
            >
              - width
            </Button>
          </ButtonGroup>
        </CardContent>
      </Card>

      <Card >
        <CardContent>
          <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
            Shift all pieces in 1 direction
          </Typography>
          <ButtonGroup
            aria-label="Shift map button group"
            size="small"
          >

            <Button
              title="Move all pieces 1 hex left"
              onClick={() => movePieces(3)}
              sx={{
                fontSize: buttonFontSize
              }}
            >
              Left
            </Button>
            <Button
              title="Move all pieces 1 hex up-left"
              onClick={() => movePieces(4)}
              sx={{
                fontSize: buttonFontSize
              }}
            >
              Up Left
            </Button>
            <Button
              title="Move all pieces 1 hex up-right"
              onClick={() => movePieces(5)}
              sx={{
                fontSize: buttonFontSize
              }}
            >
              Up Right
            </Button>
            <Button
              title="Move all pieces 1 hex right"
              onClick={() => movePieces(0)}
              sx={{
                fontSize: buttonFontSize
              }}
            >
              Right
            </Button>
            <Button
              title="Move all pieces 1 hex down-right"
              onClick={() => movePieces(1)}
              sx={{
                fontSize: buttonFontSize
              }}
            >
              Down Right
            </Button>
            <Button
              title="Move all pieces 1 hex down-left"
              onClick={() => movePieces(2)}
              sx={{
                fontSize: buttonFontSize
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
