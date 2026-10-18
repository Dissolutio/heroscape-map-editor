import type { ThreeEvent } from '@react-three/fiber'

import { enqueueSnackbar } from 'notistack'
import type React from 'react'
import type { Group, Object3DEventMap } from 'three'
import { piecesSoFar } from '../data/pieces.ts'
import getPieceTemplateCoords from '../data/rotationTransforms.ts'
import { isPlacementBlocked, resolvePlacement } from '../data/placement.ts'
import { useMiddleClickPickPenMode } from '../hooks/useMiddleClickPickPenMode.tsx'
import useBoundStore from '../store/store.ts'
import {
  type BoardHex,
  HexTerrain,
  PICK_PEN_MODE,
  SELECT_PEN_MODE,
} from '../types.ts'
import {
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils.ts'
import { getBoardHexesRectangularMapDimensions } from '../utils/map-utils.ts'
import { getFluidRunLengthAt } from '../utils/fluidStacks.ts'
import { warnIfTallFluidStack } from '../utils/warnAboutLoadedMap.ts'
import { MapBoardPiece3D } from './MapBoardPiece3D.tsx'
import { OperationPiecePreviews } from './OperationPiecePreviews.tsx'
import PiecePreview from './PiecePreview.tsx'
import { TableSurfaceMesh } from './TableSurfaceMesh.tsx'
import { MapHex3D } from './maphex/MapHex3D.tsx'
import EmptyHexes from './maphex/instance/EmptyHex.tsx'
import FluidCaps from './maphex/instance/FluidCap.tsx'
import SolidCaps from './maphex/instance/SolidCaps.tsx'
import LandSubterrainInstanced, {
  getLandSubterrainInstanceData,
} from './models/LandSubterrainInstanced.tsx'

export default function MapDisplay3D({
  mapGroupRef,
}: {
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
  useMiddleClickPickPenMode()

  const instanceBoardHexes = getInstanceBoardHexes(
    boardHexesArr,
    isTakingPicture,
    viewingLevel,
  )
  const landSubterrainData = getLandSubterrainInstanceData(
    boardPieces,
    boardHexes,
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

    // Pick pen mode is handled by useMiddleClickPickPenMode, nothing to paint
    if (penMode === PICK_PEN_MODE) {
      return
    }

    // Select Hex
    if (penMode === SELECT_PEN_MODE) {
      if (hex.boardPieceUID) {
        toggleSelectedPieceID(
          hex.boardPieceUID,
          event.shiftKey || event.ctrlKey || event.metaKey,
        )
      }
      return
    }
    const pieceMode = pieceSize === 0 ? penMode : `${penMode}${pieceSize}`
    const piece = piecesSoFar[pieceMode]
    if (!piece) {
      return
    }
    const placement = resolvePlacement(piece, hex, penModeRotation, {
      boardHexes,
      boardPieces,
    })
    if (isPlacementBlocked(placement)) {
      if (placement.blocked === 'needsLaurPillar') {
        enqueueSnackbar({
          message: 'Must add to Square/Triangle Pillar.',
          variant: 'warning',
          autoHideDuration: 5000,
        })
      }
      return
    }
    const { coords, altitude, rotation } = placement
    const error = paintTile({
      piece,
      clickedHexCoords: coords,
      altitude,
      rotation,
    })
    // A fluid tile stacked on fluid tops out half a level up; warn when that
    // makes a straight run taller than the real tiles line up.
    if (
      !error &&
      placement.rule === 'land' &&
      isFluidTerrainHex(piece.terrain)
    ) {
      const { boardHexes: hexesAfterPaint } = useBoundStore.getState()
      const footprint = getPieceTemplateCoords({
        clickedHex: coords,
        rotation,
        template: piece.template,
        isVsTile: false,
      })
      const runLength = Math.max(
        ...footprint.map((coord) =>
          getFluidRunLengthAt(hexesAfterPaint, coord, altitude + 0.5),
        ),
      )
      warnIfTallFluidStack(enqueueSnackbar, runLength)
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
      toggleSelectedPieceID(
        hex.boardPieceUID ?? '',
        event.shiftKey || event.ctrlKey || event.metaKey,
      )
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
        <OperationPiecePreviews />
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
        <LandSubterrainInstanced data={landSubterrainData} />
        {boardPieces.map((bp) => {
          return (
            <MapBoardPiece3D
              key={bp.uid}
              bp={bp}
              onPointerUpPaintPiece={onPointerUpPaintPiece}
            />
          )
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
