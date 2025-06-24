import { Button, Container, FormControlLabel, FormGroup, Switch } from '@mui/material'
import { buildupJsonFileMap } from '../data/buildupMap'
import { useLocalPieceInventory } from '../hooks/useLocalPieceInventory'
import useBoundStore from '../store/store'
import { HexTerrain, type BoardHexes, type BoardPieces } from '../types'
import {
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from '../utils/constants'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { decodePieceID, genBoardHexID, genPieceID } from '../utils/map-utils'
import PenModeControls from './PenModeControls'
import PieceSizeSelect from './PieceSizeSelect'
import RotationSelect from './RotationSelect'
import UndoRedoButtonGroup from './UndoRedoButtonGroup'
import ViewingLevelInput from './ViewingLevelInput'
import { keyBy } from 'lodash'
// import LocalStorageList from './LocalStorageList'

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
const Controls = () => {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  const loadMap = useBoundStore((s) => s.loadMap)

  const inventory = useLocalPieceInventory()
  const isUseInventory =
    0 <
    Object.keys(inventory.pieceInventory).reduce(
      (sum, key) => sum + inventory.pieceInventory[key],
      0,
    )
  const selectedPiece = useBoundStore((s) => s.penMode + s.pieceSize)
  const totalCount = inventory.pieceInventory[selectedPiece]
  // const remainingCount = Object.values(boardPieces).reduce((count, val) => {
  //   return val === selectedPiece ? count - 1 : count
  // }, totalCount)

  const handleClickLogState = () => {
    console.log('🚀 ~ Controls ~ boardHexes:', boardHexes)
    console.log('🚀 ~ Controls ~ boardPieces:', boardPieces)
    console.log('🚀 ~ Controls ~ hexMap:', hexMap)
  }
  const handleTrimMap = (boardHexesToTrim: BoardHexes): BoardHexes => {
    // const boardHexArr = Object.values(boardHexes)
    const boardHexArr = Object.values(boardHexesToTrim)
    const maxX = Math.max(...boardHexArr.map((bh) => bh.q - bh.s))
    const rightColumn = boardHexArr.filter(
      (bh) => bh.q - bh.s === maxX || bh.q - bh.s === maxX - 1,
    )
    const isRightSideEmpty = rightColumn.every(
      (bh) => bh.terrain === HexTerrain.empty,
    )
    const leftColumn = boardHexArr.filter(
      (bh) => bh.s - bh.q === -1 || bh.s - bh.q === 0,
    )
    const isLeftSideEmpty = leftColumn.every(
      (bh) => bh.terrain === HexTerrain.empty,
    )
    const maxY = Math.max(...boardHexArr.map((bh) => bh.r - bh.s - bh.q))
    const bottomRow = boardHexArr.filter(
      (bh) => bh.r - bh.s - bh.q === maxY || bh.r - bh.s - bh.q === maxY - 2,
    )
    const isBottomRowEmpty = bottomRow.every(
      (bh) => bh.terrain === HexTerrain.empty,
    )
    const top2Rows = boardHexArr.filter(
      (bh) => bh.q + bh.s - bh.r === 0 || bh.q + bh.s - bh.r === -2,
    )
    const isTop2RowsEmpty = top2Rows.every(
      (bh) => bh.terrain === HexTerrain.empty,
    )
    return keyBy(boardHexArr, 'id')
  }
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

  return (
    <Container sx={{ padding: 1 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around'
        }}>

        <PenModeControls />
        <UndoRedoButtonGroup />
      </div>
      {/* <div style={{ padding: '0px 20px' }}>
        {isUseInventory && !Number.isNaN(remainingCount)
          ? `${remainingCount} remaining`
          : ''}
      </div> */}
      <PieceSizeSelect />
      <RotationSelect />
      {/* <MapLensToggles /> */}
      <ViewingLevelInput />
      {/* <LocalStorageList /> */}

      <div style={{ border: '1px solid var(--transparent-border)' }}>
        <Button
          disabled={
            (hexMap.shape === 'hexagon' &&
              hexMap.length >= MAX_HEXAGON_MAP_DIMENSION) ||
            (hexMap.shape === 'rectangle' &&
              hexMap.length >= MAX_RECTANGLE_MAP_DIMENSION)
          }
          onClick={handleClickAddMapLengthX}
        >
          Add length
        </Button>
        <Button
          disabled={
            (hexMap.shape === 'hexagon' && hexMap.length <= 1) ||
            (hexMap.shape === 'rectangle' && hexMap.length <= 1)
          }
          onClick={handleClickRemoveMapLengthX}
        >
          Remove length
        </Button>
        <Button
          disabled={
            (hexMap.shape === 'hexagon' &&
              hexMap.width >= MAX_HEXAGON_MAP_DIMENSION) ||
            (hexMap.shape === 'rectangle' &&
              hexMap.width >= MAX_RECTANGLE_MAP_DIMENSION)
          }
          onClick={handleClickAddMapWidthY}
        >
          Add width
        </Button>
        <Button
          disabled={
            (hexMap.shape === 'hexagon' && hexMap.width <= 1) ||
            (hexMap.shape === 'rectangle' && hexMap.width <= 1)
          }
          onClick={handleClickRemoveMapWidthY}
        >
          Remove width
        </Button>
      </div>

      <div style={{ border: '1px solid var(--transparent-border)' }}>
        <Button
          title="Move all pieces 1 hex right"
          onClick={() => movePieces(0)}
        >
          Right
        </Button>
        <Button
          title="Move all pieces 1 hex down-right"
          onClick={() => movePieces(1)}>
          Down Right
        </Button>
        <Button
          title="Move all pieces 1 hex down-left"
          onClick={() => movePieces(2)}>
          Down Left
        </Button>
        <Button
          title="Move all pieces 1 hex left"
          onClick={() => movePieces(3)}>
          Left
        </Button>
        <Button
          title="Move all pieces 1 hex up-left"
          onClick={() => movePieces(4)}>
          Up Left
        </Button>
        <Button
          title="Move all pieces 1 hex up-right"
          onClick={() => movePieces(5)}>
          Up Right
        </Button>
      </div>

      <SwitchHighQualityRender />

      {import.meta.env.DEV && <Button onClick={handleClickLogState}>Log state</Button>}
    </Container>
  )
}

function SwitchHighQualityRender() {
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const toggleIsHighQualityRender = useBoundStore((s) => s.toggleIsHighQualityRender)
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleIsHighQualityRender(event.target.checked);
  };
  return (
    <FormGroup>
      <FormControlLabel control={
        <Switch
          checked={isHighQualityRender}
          onChange={handleChange}
        />
      } label="High Quality Render" />
    </FormGroup>
  );
}
export default Controls
