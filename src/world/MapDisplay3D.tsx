import { Suspense, useEffect, useMemo, useRef } from 'react'
import type React from 'react'
import type { Group, Object3DEventMap } from 'three'
import { mapTableHexes } from '../data/fitMapToPieces.ts'
import { isPerHexLandOverride } from '../e2e/isE2E.ts'
import { useMiddleClickPickPenMode } from '../hooks/useMiddleClickPickPenMode.tsx'
import useBoundStore from '../store/store.ts'
import {
  type BoardHex,
  HexTerrain,
  PICK_PEN_MODE,
  type Piece,
  type PieceInventory,
  SELECT_PEN_MODE,
} from '../types.ts'
import { isFluidTerrainHex } from '../utils/board-utils.ts'
import { getFluidRunLengthAt } from '../utils/fluidStacks.ts'
import { type BoardHex, HexTerrain } from '../types.ts'
import {
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils.ts'
import { getBoardHexesRectangularMapDimensions } from '../utils/map-utils.ts'
import { MapBoardPiece3D } from './MapBoardPiece3D.tsx'
import ObjectiveMarkerPlacementPreview from './ObjectiveMarkerPlacementPreview.tsx'
import { OperationPiecePreviews } from './OperationPiecePreviews.tsx'
import PiecePreview from './PiecePreview.tsx'
import { TableSurfaceMesh } from './TableSurfaceMesh.tsx'
import { DragPreview3D } from './drag/DragPreview3D.tsx'
import { clearLastPointerWorldPoint } from './hoverWorldPoint.ts'
import { getInstanceBoardHexes } from './instanceBoardHexes.ts'
import { getLandRendererMode } from './landRendererTier.ts'
import { createMapClickHandler } from './mapDisplayClickHandler.tsx'
import { MapHex3D } from './maphex/MapHex3D.tsx'
import EmptyHexes from './maphex/instance/EmptyHex.tsx'
import FluidCaps from './maphex/instance/FluidCap.tsx'
import SolidCaps from './maphex/instance/SolidCaps.tsx'
import LandHexInstanced from './models/LandHexInstanced.tsx'
import LandSubterrainInstanced, {
  getLandSubterrainInstanceData,
} from './models/LandSubterrainInstanced.tsx'
import ObjectiveMarkers3D from './models/ObjectiveMarkers3D.tsx'
import { getLandHexInstanceIDs } from './models/landHexInstances.ts'

export default function MapDisplay3D({
  mapGroupRef,
}: {
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  const boardHexesArr = Object.values(boardHexes).sort(
    (a, b) => a.altitude - b.altitude,
  )
  const penMode = useBoundStore((s) => s.penMode)
  const paintTile = useBoundStore((s) => s.paintTile)
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const penModeRotation = useBoundStore((s) => s.penModeRotation)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const effectiveGraphicsTier = useBoundStore((s) => s.effectiveGraphicsTier)
  const genericSolidCapColor = useBoundStore((s) => s.genericSolidCapColor)
  const genericSolidSideColor = useBoundStore((s) => s.genericSolidSideColor)
  const genericFluidCapColor = useBoundStore((s) => s.genericFluidCapColor)
  const genericFluidSideColor = useBoundStore((s) => s.genericFluidSideColor)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const toggleHoveredPieceID = useBoundStore((s) => s.toggleHoveredPieceID)
  const toggleHoveredHex = useBoundStore((s) => s.toggleHoveredHex)
  const setSelectedObjectiveMarkerUID = useBoundStore(
    (s) => s.setSelectedObjectiveMarkerUID,
  )
  const addObjectiveMarker = useBoundStore((s) => s.addObjectiveMarker)
  const objectiveMarkerMapHexIDs = useMemo(
    () => mapTableHexes(hexMap),
    [hexMap],
  )
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const landRendererMode = getLandRendererMode(
    effectiveGraphicsTier,
    isPerHexLandOverride,
  )
  const isPerHexLand = landRendererMode === 'per-hex'
  const previousLandRendererMode = useRef(landRendererMode)
  useMiddleClickPickPenMode()

  useEffect(() => {
    if (previousLandRendererMode.current === landRendererMode) return
    previousLandRendererMode.current = landRendererMode
    toggleHoveredPieceID('')
    toggleHoveredHex(undefined)
    clearLastPointerWorldPoint()
  }, [landRendererMode, toggleHoveredHex, toggleHoveredPieceID])

  const genericColors = useMemo(
    () => ({
      genericSolidCapColor,
      genericSolidSideColor,
      genericFluidCapColor,
      genericFluidSideColor,
    }),
    [
      genericFluidCapColor,
      genericFluidSideColor,
      genericSolidCapColor,
      genericSolidSideColor,
    ],
  )
  const perHexLandIDs = useMemo(
    () =>
      new Set(
        isPerHexLand
          ? getLandHexInstanceIDs(boardHexes, boardPieces, viewingLevel)
          : [],
      ),
    [boardHexes, boardPieces, viewingLevel, isPerHexLand],
  )
  const instanceBoardHexes = getInstanceBoardHexes(
    boardHexes,
    boardHexesArr,
    isTakingPicture,
    viewingLevel,
    perHexLandIDs,
  )
  const landSubterrainData = isPerHexLand
    ? []
    : getLandSubterrainInstanceData(boardPieces, boardHexes, viewingLevel)

  const onPointerUpPaintPiece = createMapClickHandler({
    addObjectiveMarker,
    boardHexes,
    boardPieces,
    objectiveMarkerMapHexIDs,
    paintTile,
    penMode,
    penModeRotation,
    pieceSize,
    setSelectedObjectiveMarkerUID,
    toggleSelectedPieceID,
  })

  const { length, width } = getBoardHexesRectangularMapDimensions(boardHexes)
  return (
    <>
      <TableSurfaceMesh width={width} length={length} />
      <group ref={mapGroupRef}>
        <PiecePreview />
        <ObjectiveMarkerPlacementPreview />
        <OperationPiecePreviews />
        <DragPreview3D />
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
        <ObjectiveMarkers3D />
        <Suspense fallback={null}>
          {isPerHexLand ? (
            <LandHexInstanced
              boardHexes={boardHexes}
              boardPieces={boardPieces}
              viewingLevel={viewingLevel}
              genericColors={genericColors}
              onPointerUpPaintPiece={onPointerUpPaintPiece}
            />
          ) : (
            <LandSubterrainInstanced data={landSubterrainData} />
          )}
        </Suspense>
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
