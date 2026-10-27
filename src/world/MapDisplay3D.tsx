import type { ThreeEvent } from '@react-three/fiber'

import { Button } from '@mui/material'
import { closeSnackbar, enqueueSnackbar } from 'notistack'
import { Suspense, useMemo } from 'react'
import type React from 'react'
import type { Group, Object3DEventMap } from 'three'
import {
  decideLaurVariantPlacement,
  getLaurStackableVariantID,
} from '../data/laurVariantPenModes.ts'
import { piecesSoFar } from '../data/pieces.ts'
import { START_ZONES_HIDDEN_MESSAGE } from '../data/startZoneVisibility.ts'
import {
  LAUR_STACKABLE_VARIANT_UNAVAILABLE_MESSAGE,
  type ResolvedPlacement,
  isPlacementBlocked,
  placementBlockedMessages,
  resolvePlacement,
} from '../data/placement.ts'
import getPieceTemplateCoords from '../data/rotationTransforms.ts'
import { useMiddleClickPickPenMode } from '../hooks/useMiddleClickPickPenMode.tsx'
import {
  RECONCILABLE_LAUR_PIECE_PAIRS,
  countPiecesUsedWithLaurStacking,
  reconcileLaurLegacyToStackableUsage,
} from '../inventory/laurInventoryReconcile.ts'
import useBoundStore from '../store/store.ts'
import {
  type BoardHex,
  HexTerrain,
  PICK_PEN_MODE,
  type Piece,
  type PieceInventory,
  SELECT_PEN_MODE,
} from '../types.ts'
import {
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils.ts'
import { getFluidRunLengthAt } from '../utils/fluidStacks.ts'
import { getBoardHexesRectangularMapDimensions } from '../utils/map-utils.ts'
import {
  getEffectiveTerrainConstraintInventory,
  hasActiveTerrainConstraints,
} from '../utils/terrain-constraints.ts'
import { warnIfTallFluidStack } from '../utils/warnAboutLoadedMap.ts'
import { isPerHexLandEnabled } from '../e2e/isE2E.ts'
import { MapBoardPiece3D } from './MapBoardPiece3D.tsx'
import { OperationPiecePreviews } from './OperationPiecePreviews.tsx'
import PiecePreview from './PiecePreview.tsx'
import { TableSurfaceMesh } from './TableSurfaceMesh.tsx'
import { DragPreview3D } from './drag/DragPreview3D.tsx'
import { MapHex3D } from './maphex/MapHex3D.tsx'
import EmptyHexes from './maphex/instance/EmptyHex.tsx'
import FluidCaps from './maphex/instance/FluidCap.tsx'
import SolidCaps from './maphex/instance/SolidCaps.tsx'
import LandSubterrainInstanced, {
  getLandSubterrainInstanceData,
} from './models/LandSubterrainInstanced.tsx'
import LandHexInstanced from './models/LandHexInstanced.tsx'
import { buildLandHexInstanceData } from './models/landHexInstances.ts'

function getAvailableLaurStackableInventory(): PieceInventory | undefined {
  const state = useBoundStore.getState()
  const hasConstraints = hasActiveTerrainConstraints({
    setsUsed: state.hexMap.setsUsed,
    terrainConstraintSource: state.terrainConstraintSource,
    customConstraintInventoryFileName: state.customConstraintInventoryFileName,
  })
  if (!hasConstraints) return undefined

  const availableInventory = getEffectiveTerrainConstraintInventory({
    setsUsed: state.hexMap.setsUsed,
    terrainConstraintSource: state.terrainConstraintSource,
    customConstraintInventory: state.customConstraintInventory,
    userPieceInventory: state.userPieceInventory,
  })
  const usedInventory = countPiecesUsedWithLaurStacking(state.boardPieces)
  const reconciledUsedInventory = reconcileLaurLegacyToStackableUsage({
    usedInventory,
    availableInventory,
  }).reconciledUsedInventory

  return Object.fromEntries(
    RECONCILABLE_LAUR_PIECE_PAIRS.map(({ stackableID }) => [
      stackableID,
      (availableInventory[stackableID] ?? 0) -
        (reconciledUsedInventory[stackableID] ?? 0),
    ]),
  )
}

function placeStackableLaurVariant(
  piece: Piece,
  placement: Pick<ResolvedPlacement, 'coords' | 'altitude' | 'rotation'>,
) {
  const state = useBoundStore.getState()
  state.togglePenMode(piece.id)
  const error = state.paintTile({
    piece,
    clickedHexCoords: placement.coords,
    altitude: placement.altitude,
    rotation: placement.rotation,
  })
  if (error) {
    enqueueSnackbar({
      message: `Add piece error: ${error.message}.`,
      variant: 'error',
      autoHideDuration: 5000,
    })
    return
  }

  state.toggleSelectedPieceID('')
  enqueueSnackbar({
    message: 'Placed the stackable version',
    variant: 'success',
    action: (snackbarId) => (
      <Button
        color="inherit"
        onClick={() => {
          closeSnackbar(snackbarId)
          useBoundStore.temporal.getState().undo()
        }}
      >
        Undo
      </Button>
    ),
  })
}

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
  const genericSolidCapColor = useBoundStore((s) => s.genericSolidCapColor)
  const genericSolidSideColor = useBoundStore((s) => s.genericSolidSideColor)
  const genericFluidCapColor = useBoundStore((s) => s.genericFluidCapColor)
  const genericFluidSideColor = useBoundStore((s) => s.genericFluidSideColor)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  useMiddleClickPickPenMode()

  const landHexData = useMemo(
    () =>
      isPerHexLandEnabled
        ? buildLandHexInstanceData(boardHexes, boardPieces, viewingLevel, {
            genericSolidCapColor,
            genericSolidSideColor,
            genericFluidCapColor,
            genericFluidSideColor,
          })
        : [],
    [
      boardHexes,
      boardPieces,
      viewingLevel,
      genericSolidCapColor,
      genericSolidSideColor,
      genericFluidCapColor,
      genericFluidSideColor,
    ],
  )
  const perHexLandIDs = useMemo(
    () => new Set(landHexData.map((item) => item.hex.id)),
    [landHexData],
  )
  const instanceBoardHexes = getInstanceBoardHexes(
    boardHexesArr,
    isTakingPicture,
    viewingLevel,
    perHexLandIDs,
  )
  const landSubterrainData = isPerHexLandEnabled
    ? []
    : getLandSubterrainInstanceData(boardPieces, boardHexes, viewingLevel)

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
        const isMultiSelect = event.shiftKey || event.ctrlKey || event.metaKey
        toggleSelectedPieceID(
          hex.boardPieceUID,
          isMultiSelect,
          event.point ? { x: event.point.x, z: event.point.z } : undefined,
          hex,
        )
      }
      return
    }
    const pieceMode = pieceSize === 0 ? penMode : `${penMode}${pieceSize}`
    const piece = piecesSoFar[pieceMode]
    if (!piece) {
      return
    }
    const placement = resolvePlacement(
      piece,
      hex,
      penModeRotation,
      {
        boardHexes,
        boardPieces,
      },
      {
        worldPoint: event.point
          ? { x: event.point.x, z: event.point.z }
          : undefined,
      },
    )
    if (isPlacementBlocked(placement)) {
      const message = placementBlockedMessages[placement.blocked]
      if (message) {
        enqueueSnackbar({ message, variant: 'warning', autoHideDuration: 5000 })
      }
      return
    }

    const stackableID = getLaurStackableVariantID(piece.id)
    const target = boardPieces.find(
      (boardPiece) => boardPiece.uid === hex.boardPieceUID,
    )
    if (stackableID && target) {
      const stackablePiece = piecesSoFar[stackableID]
      if (!stackablePiece) {
        throw new Error(
          `Missing Laur stackable piece definition: ${stackableID}`,
        )
      }
      const stackablePlacement = resolvePlacement(
        stackablePiece,
        hex,
        penModeRotation,
        { boardHexes, boardPieces },
        {
          worldPoint: event.point
            ? { x: event.point.x, z: event.point.z }
            : undefined,
        },
      )
      if (!isPlacementBlocked(stackablePlacement)) {
        const isStackPosition =
          stackablePlacement.rule === 'pillarStack' ||
          (stackablePlacement.rule === 'laurAddon' &&
            stackablePlacement.altitude === target.altitude + 8)
        const decision = decideLaurVariantPlacement({
          penID: piece.id,
          target: {
            inventoryID: target.inventoryID,
            isStackPosition,
          },
          availableInventory: isStackPosition
            ? getAvailableLaurStackableInventory()
            : undefined,
        })
        if (decision.kind === 'ask') {
          enqueueSnackbar({
            message: LAUR_STACKABLE_VARIANT_UNAVAILABLE_MESSAGE,
            variant: 'warning',
            action: (snackbarId) => (
              <Button
                color="inherit"
                onClick={() => {
                  closeSnackbar(snackbarId)
                  placeStackableLaurVariant(stackablePiece, stackablePlacement)
                }}
              >
                Switch anyway
              </Button>
            ),
            autoHideDuration: null,
          })
          return
        }
        if (decision.kind === 'place-as' && decision.pieceID !== piece.id) {
          placeStackableLaurVariant(stackablePiece, stackablePlacement)
          return
        }
      }
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
      if (
        piece.terrain === HexTerrain.startZone &&
        !useBoundStore.getState().isShowStartZones
      ) {
        enqueueSnackbar({
          message: START_ZONES_HIDDEN_MESSAGE,
          variant: 'info',
        })
      }
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
        <Suspense fallback={null}>
          {isPerHexLandEnabled ? (
            <LandHexInstanced
              data={landHexData}
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
  perHexLandIDs: Set<string>,
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
        const isPerHexLand = perHexLandIDs.has(current.id)
        // const isSubTerrain = isSolidTerrainHex(current.terrain) || isFluidTerrainHex(current.terrain)
        if (isEmptyCap) {
          result.emptyHexCaps.push(current)
        }
        if (isSolidCap && !isPerHexLand) {
          result.solidHexCaps.push(current)
        }
        if (isFluidCap && !isPerHexLand) {
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
