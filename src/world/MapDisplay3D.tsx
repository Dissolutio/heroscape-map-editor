import type { CameraControls } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'

import type { Group, Object3DEventMap } from 'three'
import { piecesSoFar } from '../data/pieces.ts'
import useBoundStore from '../store/store.ts'
import { type AddRemovePieceError, type BoardHex, HexTerrain, PiecePrefixes, Pieces } from '../types.ts'
import {
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils.ts'
import {
  genBoardHexID,
  getBattlementClickedHexCoords,
  getBoardHexesRectangularMapDimensions,
  getBoardPiecesMaxLevel,
  getLadderClickedHex,
} from '../utils/map-utils.ts'
import { MapBoardPiece3D } from './MapBoardPiece3D.tsx'
import { useZoomCameraToMapCenter } from './camera/useZoomeCameraToMapCenter.tsx'
import { MapHex3D } from './maphex/MapHex3D.tsx'
import EmptyHexes from './maphex/instance/EmptyHex.tsx'
import FluidCaps from './maphex/instance/FluidCap.tsx'
import SolidCaps from './maphex/instance/SolidCaps.tsx'
import { enqueueSnackbar } from 'notistack'

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
  const paintPieceIdPiece = useBoundStore((s) => s.paintPieceIdPiece)
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const pieceRotation = useBoundStore((s) => s.pieceRotation)
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

  const onPointerUp = async (
    event: ThreeEvent<PointerEvent>,
    hex: BoardHex,
  ) => {
    let error: AddRemovePieceError
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
      toggleSelectedPieceID(hex.pieceID)
    }
    const pieceMode = pieceSize === 0 ? penMode : `${penMode}${pieceSize}`
    const piece = piecesSoFar[pieceMode]
    const boardHexIdOfCapForWall = genBoardHexID({
      ...hex,
      altitude: hex.altitude + (hex?.obstacleHeight ?? 0),
    })
    const boardHexIdOfLadderAuxiliary = genBoardHexID({
      ...hex,
      altitude: hex.altitude + 1,
    })
    const isCastleWallArchClicked =
      hex.pieceID.includes(PiecePrefixes.castleWall) ||
      hex.pieceID.includes(PiecePrefixes.castleArch)
    // for wall-walk pieces, if we clicked a wall or arch cap, then the clicked hex needs to be computed
    const clickedHex = isCastleWallArchClicked
      ? boardHexes[boardHexIdOfCapForWall]
      : hex.inventoryID === Pieces.ladder && piece.id === Pieces.ladder ?
        boardHexes[boardHexIdOfLadderAuxiliary]
        : hex
    // const piece = isLandHex ? getPieceByTerrainAndSize(penMode, pieceSize) : piecesSoFar[penMode]
    if (piece.id === Pieces.battlement) {
      const clickedHexCoords = getBattlementClickedHexCoords(clickedHex, pieceRotation)
      const mirrorRotation = (pieceRotation + 3) % 6
      error = paintPieceIdPiece({
        piece,
        clickedHexCoords,
        altitude: hex.altitude - 1,
        rotation: mirrorRotation,
      })
    } else if (piece.id === Pieces.ladder && clickedHex.inventoryID === Pieces.ladder) {
      const clickedHex = getLadderClickedHex(hex, boardHexes)
      console.log("🚀 ~ clickedHex:", clickedHex)
      error = paintTile({
        piece,
        clickedHex,
        rotation: clickedHex.pieceRotation,
      })
    } else {
      error = paintTile({
        piece,
        clickedHex,
        rotation: pieceRotation,
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
      if (clickedHex.altitude >= viewingLevel) {
        toggleViewingLevel(
          Math.max(
            getBoardPiecesMaxLevel(boardPieces),
            clickedHex.altitude + 1,
          ),
        )
      }
    }
  }

  const { length, width } = getBoardHexesRectangularMapDimensions(boardHexes)
  // const topLeft = [-HEXGRID_HEX_APOTHEM, -1]
  return (
    <group ref={mapGroupRef}>
      {/* TOP LEFT */}
      {!isTakingPicture && (
        <axesHelper
          // position={[topLeft[0], 0, topLeft[1]]}
          position={[0, 0, 0]}
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
        return <MapHex3D key={bh.id} boardHex={bh} onPointerUp={onPointerUp} />
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
function getInstanceBoardHexes(
  boardHexesArr: BoardHex[],
  isTakingPicture: boolean,
) {
  return boardHexesArr.reduce(
    (result: InstanceBoardHexes, current) => {
      const isCap = current.isCap // land hexes that are covered, obstacle origin/auxiliary hexes, vertical clearance hexes
      const isEmptyCap =
        isCap && !isTakingPicture && current.terrain === HexTerrain.empty
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
