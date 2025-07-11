import {
  Button,
  Container,
  FormControlLabel,
  FormGroup,
  Switch,
} from '@mui/material'
import { buildupJsonFileMap } from '../data/buildupMap'
import useBoundStore from '../store/store'
import { HexTerrain, type BoardHexes, type BoardPieces } from '../types'
import {
  EVENTS,
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
import type { CameraControls } from '@react-three/drei'
import type { Group, Object3DEventMap } from 'three'
import { useEffect, useRef } from 'react'
import useEvent from '../hooks/useEvent'

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
const Controls = ({
  cameraControlsRef,
  mapGroupRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) => {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  const loadMap = useBoundStore((s) => s.loadMap)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const toggleIsTakingPicture = useBoundStore((s) => s.toggleIsTakingPicture)

  // const inventory = useLocalPieceInventory()

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
  const zoomToMap = () => {
    if (mapGroupRef.current) {
      cameraControlsRef.current?.fitToBox?.(mapGroupRef.current, true)
    }
  }
  const takePictureTimeout = useRef<number>()
  const { publish } = useEvent()
  // effect: clear the timeout after we take a picture
  useEffect(() => {
    if (!isTakingPicture) {
      clearTimeout(takePictureTimeout.current)
    }
  }, [isTakingPicture])
  const handleTakePicturePng = () => {
    toggleIsTakingPicture(true)
    takePictureTimeout.current = window.setTimeout(() => {
      publish(EVENTS.savePng)
    }, 100) // Long enough to make some changes to the map and render
  }
  return (
    <Container sx={{ padding: 1 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}
      >
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
          title={
            hexMap.shape === 'hexagon'
              ? 'Add one outer ring of hexes'
              : 'Add one row of hexes to bottom'
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
          title={
            hexMap.shape === 'hexagon'
              ? 'Remove one outer ring of hexes'
              : 'Remove one row of hexes from bottom'
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
          title="Add one column of hexes to right side"
          onClick={handleClickAddMapWidthY}
        >
          Add width
        </Button>
        <Button
          disabled={
            (hexMap.shape === 'hexagon' && hexMap.width <= 1) ||
            (hexMap.shape === 'rectangle' && hexMap.width <= 1)
          }
          title="Remove one column of hexes from right side"
          onClick={handleClickRemoveMapWidthY}
        >
          Remove width
        </Button>
      </div>

      <div style={{ border: '1px solid var(--transparent-border)' }}>
        <Button
          title="Move all pieces 1 hex left"
          onClick={() => movePieces(3)}
        >
          Left
        </Button>
        <Button
          title="Move all pieces 1 hex up-left"
          onClick={() => movePieces(4)}
        >
          Up Left
        </Button>
        <Button
          title="Move all pieces 1 hex up-right"
          onClick={() => movePieces(5)}
        >
          Up Right
        </Button>
        <Button
          title="Move all pieces 1 hex right"
          onClick={() => movePieces(0)}
        >
          Right
        </Button>
        <Button
          title="Move all pieces 1 hex down-right"
          onClick={() => movePieces(1)}
        >
          Down Right
        </Button>
        <Button
          title="Move all pieces 1 hex down-left"
          onClick={() => movePieces(2)}
        >
          Down Left
        </Button>
      </div>
      <div style={{ border: '1px solid var(--transparent-border)' }}>
        <SwitchIsLightsAndShadows />
        <SwitchIsHideTableTop />
        <SwitchIsDisplayCapHeights />
        <div>
          <Button title="Center the camera on the map" onClick={zoomToMap}>
            Zoom to map
          </Button>
        </div>
        <SwitchIsHighQualityRender />
        <div>
          <Button
            title="Take a map picture .png"
            onClick={handleTakePicturePng}
          >
            Take map picture PNG
          </Button>
        </div>
      </div>

      {import.meta.env.DEV && (
        <Button onClick={handleClickLogState}>Log state</Button>
      )}
    </Container>
  )
}

function SwitchIsLightsAndShadows() {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const toggleIsLightsAndShadowsRender = useBoundStore(
    (s) => s.toggleIsLightsAndShadowsRender,
  )
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleIsLightsAndShadowsRender(event.target.checked)
  }
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch checked={isLightsAndShadowsRender} onChange={handleChange} />
        }
        label="Render Lights and Shadows"
      />
    </FormGroup>
  )
}
function SwitchIsHighQualityRender() {
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const toggleIsHighQualityRender = useBoundStore(
    (s) => s.toggleIsHighQualityRender,
  )
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleIsHighQualityRender(event.target.checked)
  }
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch checked={isHighQualityRender} onChange={handleChange} />
        }
        label="High Quality Render (Significant performance impact)"
      />
    </FormGroup>
  )
}
function SwitchIsDisplayCapHeights() {
  const isDisplayCapHeights = useBoundStore((s) => s.isDisplayCapHeights)
  const toggleIsDisplayCapHeights = useBoundStore(
    (s) => s.toggleIsDisplayCapHeights,
  )
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleIsDisplayCapHeights(event.target.checked)
  }
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch checked={isDisplayCapHeights} onChange={handleChange} />
        }
        label="Display Hex Heights"
      />
    </FormGroup>
  )
}
function SwitchIsHideTableTop() {
  const isHideTableTop = useBoundStore((s) => s.isHideTableTop)
  const toggleIsHideTableTop = useBoundStore((s) => s.toggleIsHideTableTop)
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleIsHideTableTop(event.target.checked)
  }
  return (
    <FormGroup>
      <FormControlLabel
        control={<Switch checked={isHideTableTop} onChange={handleChange} />}
        label="Hide TableTop"
      />
    </FormGroup>
  )
}
export default Controls
