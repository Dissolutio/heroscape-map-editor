import { TransformControls, type CameraControls } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'

import type { Group, Object3DEventMap } from 'three'
import { piecesSoFar } from '../data/pieces.ts'
import useBoundStore from '../store/store.ts'
import {
  type AddRemovePieceError,
  type BoardHex,
  HexTerrain,
  PiecePrefixes,
  Pieces,
} from '../types.ts'
import {
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils.ts'
import {
  decodePieceID,
  genBoardHexID,
  getBattlementClickedHexCoords,
  getBoardHexesRectangularMapDimensions,
  getBoardPiecesMaxLevel,
  getRoadWallClickedHexCoords,
} from '../utils/map-utils.ts'
import { MapBoardPiece3D } from './MapBoardPiece3D.tsx'
import { useZoomCameraToMapCenter } from './camera/useZoomeCameraToMapCenter.tsx'
import { MapHex3D } from './maphex/MapHex3D.tsx'
import EmptyHexes from './maphex/instance/EmptyHex.tsx'
import FluidCaps from './maphex/instance/FluidCap.tsx'
import SolidCaps from './maphex/instance/SolidCaps.tsx'
import { enqueueSnackbar } from 'notistack'
import { HEXGRID_HEX_APOTHEM, HEXGRID_HEX_RADIUS } from '../utils/constants.ts'
import { useRef, useState } from 'react'

export default function MapDisplay3D({
  cameraControlsRef,
  mapGroupRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const hexMap = useBoundStore((s) => s.hexMap)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const maxLevel = getBoardPiecesMaxLevel(boardPieces)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const boardHexesArr = Object.values(boardHexes).sort(
    (a, b) => a.altitude - b.altitude,
  )
  const penMode = useBoundStore((s) => s.penMode)
  const paintTile = useBoundStore((s) => s.paintTile)
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const penModeRotation = useBoundStore((s) => s.penModeRotation)
  // const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  // const decodedHoverPieceID = decodePieceID(hoveredPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  useZoomCameraToMapCenter({
    cameraControlsRef,
    boardHexes,
    disabled: !boardHexesArr.length || false, // for when working on camera stuff
  })

  const instanceBoardHexes = getInstanceBoardHexes(
    boardHexesArr,
    isTakingPicture,
  )

  const onPointerUp = (event: ThreeEvent<PointerEvent>, hex: BoardHex) => {
    let error: AddRemovePieceError
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      // TODO: MultiSelect Copy/Paste: Can paste in copied templates! BUT, user must agree to reading text/images from the clipboard
      // const myClipboard = await navigator.clipboard.readText()
      return
    }
    // Early out if camera is active
    if (cameraControlsRef?.current?.active) {
      return
    }

    if (penMode === 'select') {
      if (hex.pieceID) {
        toggleSelectedPieceID(hex.pieceID)
      }
      return
    }
    const pieceMode = pieceSize === 0 ? penMode : `${penMode}${pieceSize}`
    const piece = piecesSoFar[pieceMode]
    const isCastleWallArchClicked =
      hex.pieceID.includes(PiecePrefixes.castleWall) ||
      hex.pieceID.includes(PiecePrefixes.castleArch)
    const isLaurPillarClicked =
      hex.pieceID === Pieces.laurWallPillar ||
      hex.pieceID === Pieces.laurWallTrianglePillar
    const boardHexIdOfCapForWall = genBoardHexID({
      ...hex,
      altitude: hex.altitude + (hex?.obstacleHeight ?? 0),
    })
    // for wall-walk pieces, if we clicked a wall or arch cap, then the clicked hex needs to be computed
    const clickedHex = hex
    const clickedHexCoords = isCastleWallArchClicked
      ? {
          q: boardHexes[boardHexIdOfCapForWall].q,
          r: boardHexes[boardHexIdOfCapForWall].r,
          s: boardHexes[boardHexIdOfCapForWall].s,
        }
      : {
          q: hex.q,
          r: hex.r,
          s: hex.s,
        }
    let clickedHexAltitude = clickedHex.altitude
    // const piece = isLandHex ? getPieceByTerrainAndSize(penMode, pieceSize) : piecesSoFar[penMode]

    if (isCastleWallArchClicked) {
      const castleWallArchClickedHexCoords = {
        q: boardHexes[boardHexIdOfCapForWall].q,
        r: boardHexes[boardHexIdOfCapForWall].r,
        s: boardHexes[boardHexIdOfCapForWall].s,
      }
      error = paintTile({
        piece,
        clickedHexCoords: castleWallArchClickedHexCoords,
        altitude: clickedHexAltitude,
        rotation: penModeRotation,
      })
    } else if (
      isLaurPillarClicked &&
      (piece?.id === Pieces.laurWallRuin ||
        piece?.id === Pieces.laurWallRuin2 ||
        piece?.id === Pieces.laurWallRuin3)
    ) {
      // const laurWallAddonClickedHexCoords = getBattlementClickedHexCoords(
      //   clickedHex,
      //   penModeRotation,
      // )
      error = paintTile({
        piece,
        clickedHexCoords,
        altitude: clickedHexAltitude,
        rotation: penModeRotation,
      })
      console.log('🚀 ~ error:', error)
    } else if (piece?.id === Pieces.battlement) {
      const battlementClickedHexCoords = getBattlementClickedHexCoords(
        clickedHex,
        penModeRotation,
      )
      clickedHexAltitude -= 1
      const mirrorRotation = (penModeRotation + 3) % 6
      error = paintTile({
        piece,
        clickedHexCoords: battlementClickedHexCoords,
        altitude: clickedHexAltitude,
        rotation: mirrorRotation,
      })
    } else if (piece?.id === Pieces.roadWall) {
      const roadWallClickedHexCoords = getRoadWallClickedHexCoords(
        clickedHex,
        penModeRotation,
      )
      clickedHexAltitude -= 1
      error = paintTile({
        piece,
        clickedHexCoords: roadWallClickedHexCoords,
        altitude: clickedHexAltitude,
        rotation: penModeRotation,
      })
    } else if (
      piece?.id === Pieces.ladder &&
      hex?.inventoryID === Pieces.ladder
    ) {
      clickedHexAltitude += 1
      error = paintTile({
        piece,
        clickedHexCoords: clickedHexCoords,
        altitude: clickedHexAltitude,
        rotation: clickedHex.pieceRotation,
      })
    } else {
      error = paintTile({
        piece,
        clickedHexCoords,
        altitude: clickedHexAltitude,
        rotation: penModeRotation,
      })
    }
    if (error) {
      console.log('🚀 ~ error:', error)
      enqueueSnackbar({
        message: `Add piece error: ${error.message}.`,
        variant: 'error',
        autoHideDuration: 5000,
      })
      // as a hacky thing, if we didn't paint a piece maybe the user was trying to select one
      toggleSelectedPieceID(hex.pieceID)
    } else {
      if (clickedHexAltitude >= viewingLevel) {
        toggleViewingLevel(
          Math.max(getBoardPiecesMaxLevel(boardPieces), clickedHexAltitude + 1),
        )
      }
    }
  }

  const { length, width } = getBoardHexesRectangularMapDimensions(boardHexes)
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const lightRef = useRef(null!)
  const [transformControlsVisible, setTransformControlsVisible] =
    useState(false)
  const [selectedObject, setSelectedObject] = useState(null)
  const [transformMode, setTransformMode] = useState<
    'translate' | 'rotate' | 'scale'
  >('translate') // 'translate', 'rotate', 'scale'
  // const topLeft = [-HEXGRID_HEX_APOTHEM, -1]
  return (
    <>
      {/* Tabletop / Ground */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          width / 2 - HEXGRID_HEX_APOTHEM,
          -0.01,
          length / 2 - HEXGRID_HEX_RADIUS,
        ]}
      >
        <planeGeometry args={[10 * width, 10 * length]} />
        <shadowMaterial color="lightgray" opacity={0.4} />
        {/* <meshPhongMaterial color="lightgray" opacity={0.5} /> */}
      </mesh>
      <group ref={mapGroupRef}>
        {/* TOP LEFT */}
        {!isTakingPicture && (
          <axesHelper
            // position={[topLeft[0], 0, topLeft[1]]}
            position={[0, 0.1, 0]}
            scale={[width, 0, length]}
            // rotation={new Euler(0, Math.PI, 0)}
          />
        )}

        {/* BOTTOM RIGHT */}
        {/* <axesHelper
        position={[width, 0, length]}
        // position={[height - HEXGRID_HEX_APOTHEM, 0, length - 1]}
        scale={[width, 0, length]}
      // rotation={new Euler(0, Math.PI, 0)}
      /> */}

        {/* <SubTerrains boardHexArr={instanceBoardHexes.subTerrainHexes} /> */}
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
        {Object.keys(boardPieces).map((pid) => {
          return <MapBoardPiece3D key={pid} pid={pid} />
        })}
        {boardHexesArr.map((bh) => {
          return (
            <MapHex3D key={bh.id} boardHex={bh} onPointerUp={onPointerUp} />
          )
        })}
      </group>
    </>
  )
}

type InstanceBoardHexes = {
  subTerrainHexes: BoardHex[]
  emptyHexCaps: BoardHex[]
  solidHexCaps: BoardHex[]
  fluidHexCaps: BoardHex[]
}
function getInstanceBoardHexes(
  boardHexesArr: BoardHex[],
  isTakingPicture: boolean,
) {
  return boardHexesArr.reduce(
    (result: InstanceBoardHexes, current) => {
      const isCap = current.isCap // land hexes that are covered, obstacle origin/auxiliary hexes, vertical clearance hexes
      const isEmptyCap =
        !isTakingPicture && current.terrain === HexTerrain.empty
      const isSolidCap = isSolidTerrainHex(current.terrain) // We render solid caps for aesthetics, even if they are not caps for building on click
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
