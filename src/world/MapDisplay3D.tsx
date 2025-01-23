import React from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import JSONCrush from 'jsoncrush'
import { useSnackbar } from 'notistack'

import { MapHex3D } from './maphex/MapHex3D.tsx'
import useBoundStore from '../store/store.ts'
import { useZoomCameraToMapCenter } from './camera/useZoomeCameraToMapCenter.tsx'
import { BoardHex, BoardPieces, HexTerrain, PiecePrefixes, Pieces } from '../types.ts'
import {
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils.ts'
import { piecesSoFar } from '../data/pieces.ts'
import SubTerrains from './maphex/instance/SubTerrain.tsx'
import EmptyHexes from './maphex/instance/EmptyHex.tsx'
import FluidCaps from './maphex/instance/FluidCap.tsx'
import SolidCaps from './maphex/instance/SolidCaps.tsx'
import { decodePieceID, genBoardHexID, getBoardHexesRectangularMapDimensions } from '../utils/map-utils.ts'
import buildupVSFileMap, { buildupJsonFileMap } from '../data/buildupMap.ts'
import { genRandomMapName } from '../utils/genRandomMapName.ts'
import { useSearch } from 'wouter'
import { Group, Object3DEventMap } from 'three'
import { HEXGRID_HEX_APOTHEM } from '../utils/constants.ts'
import { processVirtualScapeArrayBuffer } from '../data/readVirtualscapeMapFile.ts'

export default function MapDisplay3D({
  cameraControlsRef,
  mapGroupRef
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const boardHexesArr = Object.values(boardHexes)
  const [visibleBoardHexesArr, setVisibleBoardHexesArr] = React.useState(boardHexesArr)

  React.useEffect(() => {
    const filteredBoardPieces = Object.keys(boardPieces).reduce((prev: BoardPieces, pid: string) => {
      if (decodePieceID(pid).altitude < viewingLevel) {
        return { ...prev, [pid]: decodePieceID(pid).pieceID as Pieces }
      } else {
        return prev
      }
    }, {} as BoardPieces)
    const myLevelMap = buildupJsonFileMap(filteredBoardPieces as BoardPieces, hexMap)
    setVisibleBoardHexesArr(Object.values(myLevelMap.boardHexes))
  }, [boardPieces, hexMap, viewingLevel])

  const penMode = useBoundStore((s) => s.penMode)
  const paintTile = useBoundStore((s) => s.paintTile)
  const loadMap = useBoundStore((s) => s.loadMap)
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const pieceRotation = useBoundStore((s) => s.pieceRotation)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const { clear: clearUndoHistory } = useBoundStore.temporal.getState()
  const isTakingPicture = useBoundStore(s => s.isTakingPicture)
  useZoomCameraToMapCenter({
    cameraControlsRef,
    boardHexes,
    disabled: !boardHexesArr.length || false, // for when working on camera stuff
  })
  const { enqueueSnackbar } = useSnackbar()
  const searchString = useSearch();

  // USE EFFECT: automatically load up map from URL, OR from file
  React.useEffect(() => {
    const queryParams = new URLSearchParams(searchString)
    const urlMapString = queryParams.get('m')
    if (urlMapString) {
      try {
        const data = JSON.parse(JSONCrush.uncrush(urlMapString))
        const [hexMap, ...pieceIds] = data
        const boardPieces: BoardPieces = pieceIds.reduce(
          (prev: BoardPieces, curr: string) => {
            // get inventory id from pieceID (a~q~r~rot~id)
            prev[curr] = decodePieceID(curr).pieceID as Pieces
            return prev
          },
          {},
        )
        const jsonMap = buildupJsonFileMap(boardPieces, hexMap)
        if (!jsonMap.hexMap.name) {
          jsonMap.hexMap.name = genRandomMapName()
        }
        loadMap(jsonMap)
        enqueueSnackbar({
          message: `Loaded map from URL: ${jsonMap.hexMap.name}.`,
          variant: 'success',
          autoHideDuration: 5000,
        })
        // enqueueSnackbar({
        //   message: `Map data has been removed from your URL bar, to return it please press the back button in your browser.`,
        //   variant: 'info',
        //   autoHideDuration: 6000,
        // })
        // navigate(ROUTES.heroscapeHome)
        clearUndoHistory() // clear undo history, initial load should not be undoable
      } catch (error: any) {
        enqueueSnackbar({
          message: `Error loading map from URL: ${error?.message ?? error}`,
          variant: 'error',
          autoHideDuration: 5000,
        })
        console.error('🚀 ~ React.useEffect ~ error:', error)
      }
    } else {
      // AUTO VSCAPE
      const fileName = '/ladders.hsc'
      fetch(fileName)
        .then((response) => {
          return response.arrayBuffer()
        })
        .then((arrayBuffer) => {
          const vsFileData = processVirtualScapeArrayBuffer(arrayBuffer)
          // buildupVSFileMap should return errorArr for enqueueSnackbar
          const vsMap = buildupVSFileMap(
            vsFileData.tiles,
            vsFileData?.name ?? fileName,
          )
          loadMap(vsMap)
          enqueueSnackbar(
            `Automatically loaded Virtualscape map named: "${vsMap.hexMap.name}" from file: "${fileName}"`,
          )
        })
      // AUTO JSON
      // const fileName = '/Welcome.json'
      // fetch(fileName).then(async (response) => {
      //   // const data = response.json()
      //   const data = await response.json()
      //   const jsonMap = buildupJsonFileMap(data.boardPieces, data.hexMap)
      //   if (!jsonMap.hexMap.name) {
      //     jsonMap.hexMap.name = fileName
      //   }
      //   loadMap(jsonMap)
      //   enqueueSnackbar({
      //     // message: `Loaded map "${jsonMap.hexMap.name}" from file: "${fileName}"`,
      //     message: `WELCOME!`,
      //     variant: 'success',
      //     autoHideDuration: 5000,
      //   })
      //   clearUndoHistory() // clear undo history, initial load should not be undoable
      // })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const instanceBoardHexes = getInstanceBoardHexes(visibleBoardHexesArr, isTakingPicture)

  const onPointerUp = async (event: ThreeEvent<PointerEvent>, hex: BoardHex) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      // THIS IS A RIGHT CLICK
      // TODO: Can paste in copied templates! BUT, user must agree to reading text/images from the clipboard
      // const myClipboard = await navigator.clipboard.readText()
      return
    }
    // Early out if camera is active
    if (cameraControlsRef?.current?.active) {
      return
    }

    if (penMode === 'select') {
      // DEV TODO: on vertex pieces: selecting vertex pieces?
      toggleSelectedPieceID(hex?.pieceID ?? '')
    } else {
      const pieceMode = pieceSize === 0 ? penMode : `${penMode}${pieceSize}`
      const piece = piecesSoFar[pieceMode]
      const boardHexOfCapForWall = genBoardHexID({
        ...hex,
        altitude: hex.altitude + (hex?.obstacleHeight ?? 0),
      })
      const isCastleWallArchClicked =
        // DEV on vertex pieces: this won't affect vertex pieces anyway, cannot place castle walls on battlements, ruins, or ladders
        (hex?.pieceID ?? '').includes(PiecePrefixes.castleWall) || (hex?.pieceID ?? '').includes(PiecePrefixes.castleArch)
      // for wall-walk pieces, if we clicked a wall or arch cap, then the clicked hex needs to be computed
      const clickedHex = isCastleWallArchClicked
        ? boardHexes[boardHexOfCapForWall]
        : hex
      // const piece = isLandHex ? getPieceByTerrainAndSize(penMode, pieceSize) : piecesSoFar[penMode]
      paintTile({
        piece,
        clickedHex: clickedHex,
        rotation: pieceRotation,
      })
    }
  }

  const onPointerUpLaurWall = (
    event: ThreeEvent<PointerEvent>,
    hex: BoardHex,
  ) => {
    if (event.button !== 0) return // ignore right clicks(2), middle mouse clicks(1)
    event.stopPropagation() // prevent pass through
    // Early out if camera is active
    if (cameraControlsRef?.current?.active) return
    // DEV on vertex pieces: this won't affect vertex pieces anyway, cannot place laur walls on battlements, ruins, or ladders
    toggleSelectedPieceID(hex?.pieceID ?? '')
    // const baseSideRotation = pillarSideRotations?.[side] ?? 0

  }
  const { length, width } = getBoardHexesRectangularMapDimensions(boardHexes)
  // const topLeft = [-HEXGRID_HEX_APOTHEM, -1]
  return (
    <group ref={mapGroupRef}>
      {/* TOP LEFT */}
      <axesHelper
        // position={[topLeft[0], 0, topLeft[1]]}
        position={[0, 0, 0]}
        scale={[width, 0, length]}
      // rotation={new Euler(0, Math.PI, 0)}
      />

      {/* BOTTOM RIGHT */}
      <axesHelper
        position={[width, 0, length]}
        // position={[height - HEXGRID_HEX_APOTHEM, 0, length - 1]}
        scale={[width, 0, length]}
      // rotation={new Euler(0, Math.PI, 0)}
      />

      <SubTerrains boardHexArr={instanceBoardHexes.subTerrainHexes} />
      <EmptyHexes
        boardHexArr={instanceBoardHexes.emptyHexCaps}
        onPointerUp={onPointerUp}
      />
      <SolidCaps
        boardHexArr={instanceBoardHexes.solidHexCaps}
        onPointerUp={onPointerUp}
      />
      <FluidCaps
        boardHexArr={instanceBoardHexes.fluidHexCaps}
        onPointerUp={onPointerUp}
      />
      {visibleBoardHexesArr.map((bh) => {
        return (
          <MapHex3D
            key={bh.id}
            boardHex={bh}
            onPointerUp={onPointerUp}
            onPointerUpLaurWall={onPointerUpLaurWall}
          />
        )
      })}
    </group>
  )
}

type InstanceBoardHexes = {
  subTerrainHexes: BoardHex[]
  emptyHexCaps: BoardHex[]
  solidHexCaps: BoardHex[]
  fluidHexCaps: BoardHex[]
}
function getInstanceBoardHexes(boardHexesArr: BoardHex[], isTakingPicture: boolean) {
  return boardHexesArr.reduce(
    (result: InstanceBoardHexes, current) => {
      const isCap = current.isCap // land hexes that are covered, obstacle origin/auxiliary hexes, vertical clearance hexes
      const isEmptyCap = isCap && !isTakingPicture && current.terrain === HexTerrain.empty
      const isSolidCap = isCap && isSolidTerrainHex(current.terrain)
      const isFluidCap = isCap && isFluidTerrainHex(current.terrain)
      const isSubTerrain =
        isSolidTerrainHex(current.terrain) ||
        (isJungleTerrainHex(current.terrain) && current.isObstacleOrigin)
      // const isSubTerrain = isSolidTerrainHex(current.terrain) || isFluidTerrainHex(current.terrain)
      if (isEmptyCap) {
        result.emptyHexCaps.push(current)
      }
      if (isSolidCap) {
        result.solidHexCaps.push(current)
      }
      if (isFluidCap) {
        result.fluidHexCaps.push(current)
      }
      if (isSubTerrain) {
        result.subTerrainHexes.push(current)
      }
      return result
    },
    {
      emptyHexCaps: [],
      solidHexCaps: [],
      fluidHexCaps: [],
      subTerrainHexes: [],
    },
  )
}
