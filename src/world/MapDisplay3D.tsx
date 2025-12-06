import type { CameraControls } from '@react-three/drei'
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
  isLaurWallAddonPieceID,
  isSolidTerrainHex,
} from '../utils/board-utils.ts'
import {
  genBoardHexID,
  getBattlementClickedHexCoords,
  getBoardHexesRectangularMapDimensions,
  getRoadWallClickedHexCoords,
} from '../utils/map-utils.ts'
import { MapBoardPiece3D } from './MapBoardPiece3D.tsx'
import { MapHex3D } from './maphex/MapHex3D.tsx'
import EmptyHexes from './maphex/instance/EmptyHex.tsx'
import FluidCaps from './maphex/instance/FluidCap.tsx'
import SolidCaps from './maphex/instance/SolidCaps.tsx'
import { enqueueSnackbar } from 'notistack'
import { TableSurfaceMesh } from './TableSurfaceMesh.tsx'
import PiecePreview from './PiecePreview.tsx'
import { useHotkeyConfig } from '../controls/useHotkeyConfig'
import { useApplyHotkeys } from '../controls/useApplyHotkeys.tsx'
import type React from 'react'

export default function MapDisplay3D({
  cameraControlsRef,
  mapGroupRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexesArr = Object.values(boardHexes).sort(
    (a, b) => a.altitude - b.altitude,
  )
  const penMode = useBoundStore((s) => s.penMode)
  const paintTile = useBoundStore((s) => s.paintTile)
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const penModeRotation = useBoundStore((s) => s.penModeRotation)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const { hotkeyConfig } = useHotkeyConfig()
  useApplyHotkeys({ hotkeyConfig, cameraControlsRef, mapGroupRef })

  const instanceBoardHexes = getInstanceBoardHexes(
    boardHexesArr,
    isTakingPicture,
    viewingLevel,
  )

  const onPointerUpPaintPiece = (
    event: ThreeEvent<PointerEvent>,
    hex: BoardHex,
  ) => {
    let error: AddRemovePieceError
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      // TODO: MultiSelect Copy/Paste: Can paste in copied templates! BUT, user must agree to reading text/images from the clipboard
      // const myClipboard = await navigator.clipboard.readText()
      return
    }

    // Select Hex
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
      hex.inventoryID === Pieces.laurWallSquarePillar ||
      hex.inventoryID === Pieces.laurWallTrianglePillar
    const boardHexIdOfCapForWall = genBoardHexID({
      ...hex,
      altitude: hex.altitude + (hex?.obstacleHeight ?? 0),
    })
    // for wall-walk pieces, if we clicked a wall or arch cap, then the clicked hex needs to be computed
    const clickedHex = isCastleWallArchClicked
      ? boardHexes[boardHexIdOfCapForWall]
      : hex
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
    const clickedHexAltitude = clickedHex.altitude

    // Castle W/A: use cap coords and altitude
    if (isCastleWallArchClicked) {
      const castleWallArchClickedHexCoords = {
        q: boardHexes[boardHexIdOfCapForWall].q,
        r: boardHexes[boardHexIdOfCapForWall].r,
        s: boardHexes[boardHexIdOfCapForWall].s,
      }
      error = paintTile({
        piece,
        clickedHexCoords: castleWallArchClickedHexCoords,
        altitude: boardHexes[boardHexIdOfCapForWall].altitude,
        rotation: penModeRotation,
      })
    }
    // Adding laur addon, put it at same level
    else if (isLaurWallAddonPieceID(piece?.id ?? '')) {
      if (!isLaurPillarClicked) {
        enqueueSnackbar({
          message: 'Must add to Square/Triangle Pillar.',
          variant: 'warning',
          autoHideDuration: 5000,
        })
        return
      }
      error = paintTile({
        piece,
        clickedHexCoords,
        altitude: clickedHexAltitude - 1,
        rotation: penModeRotation,
      })
      console.log('🚀 ~ error:', error)
    }
    // BATTLEMENT
    else if (piece?.id === Pieces.battlement) {
      const battlementClickedHexCoords = getBattlementClickedHexCoords(
        clickedHex,
        penModeRotation,
      )
      const mirrorRotation = (penModeRotation + 3) % 6
      error = paintTile({
        piece,
        clickedHexCoords: battlementClickedHexCoords,
        altitude: clickedHexAltitude - 1,
        rotation: mirrorRotation,
      })
    }
    // ROADWALL
    else if (piece?.id === Pieces.roadWall) {
      const roadWallClickedHexCoords = getRoadWallClickedHexCoords(
        clickedHex,
        penModeRotation,
      )
      error = paintTile({
        piece,
        clickedHexCoords: roadWallClickedHexCoords,
        altitude: clickedHexAltitude - 1,
        rotation: penModeRotation,
      })
    }
    // LADDER ONTO LADDER
    else if (
      piece?.id === Pieces.ladder &&
      hex?.inventoryID === Pieces.ladder
    ) {
      error = paintTile({
        piece,
        clickedHexCoords: clickedHexCoords,
        altitude: clickedHexAltitude + 1,
        rotation: clickedHex.pieceRotation,
      })
    }
    // Clicked a regular land cap
    else {
      error = paintTile({
        piece,
        clickedHexCoords,
        altitude: clickedHexAltitude,
        rotation: penModeRotation,
      })
    }
    // Error from add/remove piece, report error and select piece
    if (error) {
      console.log('🚀 ~ error:', error)
      enqueueSnackbar({
        message: `Add piece error: ${error.message}.`,
        variant: 'error',
        autoHideDuration: 5000,
      })
      // as a hacky thing, if we didn't paint a piece maybe the user was trying to select one
      toggleSelectedPieceID(hex.pieceID)
    }
    // Placed new piece, deselect piece
    else {
      toggleSelectedPieceID('')
    }
  }

  const { length, width } = getBoardHexesRectangularMapDimensions(boardHexes)
  return (
    <>
      <TableSurfaceMesh width={width} length={length} />
      <group ref={mapGroupRef}>
        <PiecePreview />
        <EmptyHexes
          boardHexArr={instanceBoardHexes.emptyHexCaps}
          onPointerUp={onPointerUpPaintPiece}
        />
        <SolidCaps
          boardHexArr={instanceBoardHexes.solidHexCaps}
          onPointerUp={onPointerUpPaintPiece}
        />
        <FluidCaps
          boardHexArr={instanceBoardHexes.fluidHexCaps}
          onPointerUp={onPointerUpPaintPiece}
        />
        {boardPieces.map((pid) => {
          return <MapBoardPiece3D key={pid} pid={pid} />
        })}
        {boardHexesArr.map((bh) => {
          return (
            <MapHex3D
              key={bh.id}
              boardHex={bh}
              onPointerUpPaintPiece={onPointerUpPaintPiece}
            />
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
  viewingLevel: number,
) {
  return boardHexesArr
    .filter((bh) => bh.altitude <= viewingLevel)
    .reduce(
      (result: InstanceBoardHexes, current) => {
        const isCap = current.isCap // land hexes that are covered, obstacle origin/auxiliary hexes, vertical clearance hexes
        const isEmptyCap =
          !isTakingPicture && current?.terrain === HexTerrain.empty
        const isSolidCap = isSolidTerrainHex(current?.terrain) // We render solid caps for aesthetics, even if they are not caps for building on click
        const isFluidCap = isCap && isFluidTerrainHex(current?.terrain)
        const isSubTerrain =
          isSolidTerrainHex(current?.terrain) ||
          (isJungleTerrainHex(current?.terrain) && current.isObstacleOrigin)
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
