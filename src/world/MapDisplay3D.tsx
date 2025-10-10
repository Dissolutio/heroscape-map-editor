import type { CameraControls } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { Group, Object3DEventMap } from 'three'
import { piecesSoFar } from '../data/pieces.ts'
import useBoundStore from '../store/store.ts'
import {
  type BoardHex,
  type BoardPiece,
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
  genPieceObjectUid,
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
    const pieceData = piecesSoFar[pieceMode]
    const clickedHexCoords = {
      q: hex.q,
      r: hex.r,
      s: hex.s,
    }
    const pieceObject: BoardPiece = {
      uid: genPieceObjectUid(), // new unique instance id (e.g., 'bp_abc123' or uuid/v4/nanoid)
      inventoryID: pieceData.id,
      altitude: hex.altitude,
      rotation: penModeRotation,
      pieceCoords: clickedHexCoords
    }
    const isCastleWallArchClicked =
      hex.pieceID.includes(PiecePrefixes.castleWall) ||
      hex.pieceID.includes(PiecePrefixes.castleArch)
    const isSolidLandCapClicked =
      isSolidTerrainHex(piecesSoFar[hex.inventoryID].terrain)
    const isLaurPillarClicked =
      hex.inventoryID === Pieces.laurWallSquarePillar ||
      hex.inventoryID === Pieces.laurWallTrianglePillar
    const boardHexIdOfCapForWall = genBoardHexID({
      ...hex,
      altitude: hex.altitude + (hex?.obstacleHeight ?? 0),
    })

    // CASTLE WALL/ARCH: use cap coords and altitude
    if (isCastleWallArchClicked) {
      paintTile({
        ...pieceObject,
        altitude: hex.altitude + (hex?.obstacleHeight ?? 0),
        pieceCoords: {
          q: boardHexes[boardHexIdOfCapForWall].q,
          r: boardHexes[boardHexIdOfCapForWall].r,
          s: boardHexes[boardHexIdOfCapForWall].s,
        },
      })
      // Placed new piece, deselect piece
      toggleSelectedPieceID('')
    }
    // Adding laur addon, put it at same level
    else if (isLaurWallAddonPieceID(pieceData?.id ?? '')) {
      if (!isLaurPillarClicked) {
        enqueueSnackbar({
          message: 'Must add to Square/Triangle Pillar.',
          variant: 'warning',
          autoHideDuration: 5000,
        })
        return
      }
      paintTile({
        ...pieceObject,
        altitude: hex.altitude - 1,
      })
    }

    // BATTLEMENT
    else if (pieceData?.id === Pieces.battlement) {
      const battlementClickedHexCoords = getBattlementClickedHexCoords(
        hex,
        penModeRotation,
      )
      const mirrorRotation = (penModeRotation + 3) % 6
      paintTile({
        ...pieceObject,
        altitude: hex.altitude - 1,
        pieceCoords: battlementClickedHexCoords,
        rotation: mirrorRotation,
      })
      // Placed new piece, deselect piece
      toggleSelectedPieceID('')
    }

    // ROADWALL
    else if (pieceData?.id === Pieces.roadWall) {
      const roadWallClickedHexCoords = getRoadWallClickedHexCoords(
        hex,
        penModeRotation,
      )
      paintTile({
        ...pieceObject,
        altitude: hex.altitude - 1,
        pieceCoords: roadWallClickedHexCoords,
      })
      // Placed new piece, deselect piece
      toggleSelectedPieceID('')
    }

    // LADDER ONTO LADDER
    else if (
      pieceData?.id === Pieces.ladder &&
      hex?.inventoryID === Pieces.ladder
    ) {
      paintTile({
        ...pieceObject,
        altitude: hex.altitude + 1,
        // placing ladder on ladder, just used rotation of existing ladder
        rotation: hex.pieceRotation,
      })
      // Placed new piece, deselect piece
      toggleSelectedPieceID('')
    }
    // Clicked a regular land cap
    else {
      paintTile(pieceObject)
    }

    // No piece placed: if we didn't paint a piece maybe the user was trying to select one
    else {
      toggleSelectedPieceID(hex.pieceID)
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
        {boardPieces.map((bp) => {
          return <MapBoardPiece3D key={bp.uid} boardPiece={bp} />
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
