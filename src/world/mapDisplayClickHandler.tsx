import { Button } from '@mui/material'
import type { ThreeEvent } from '@react-three/fiber'
import { closeSnackbar, enqueueSnackbar } from 'notistack'
import { LAUR_ADDON_STACK_INCREMENT } from '../data/laurAddonStacking.ts'
import {
  decideLaurVariantPlacement,
  getLaurStackableVariantID,
} from '../data/laurVariantPenModes.ts'
import { getObjectiveMarkerPlacementStatus } from '../data/objectiveMarkerPlacement.ts'
import {
  OBJECTIVE_MARKER_PEN_MODE,
  type ObjectiveMarker,
  getEffectiveObjectiveMarkerNumber,
} from '../data/objectiveMarkers.ts'
import { piecesSoFar } from '../data/pieces.ts'
import {
  LAUR_STACKABLE_VARIANT_UNAVAILABLE_MESSAGE,
  type ResolvedPlacement,
  isPlacementBlocked,
  placementBlockedMessages,
  resolvePlacement,
} from '../data/placement.ts'
import getPieceTemplateCoords from '../data/rotationTransforms.ts'
import { START_ZONES_HIDDEN_MESSAGE } from '../data/startZoneVisibility.ts'
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
import { isFluidTerrainHex } from '../utils/board-utils.ts'
import { getFluidRunLengthAt } from '../utils/fluidStacks.ts'
import {
  getEffectiveTerrainConstraintInventory,
  hasActiveTerrainConstraints,
} from '../utils/terrain-constraints.ts'
import { warnIfTallFluidStack } from '../utils/warnAboutLoadedMap.ts'

type ClickHandlerDependencies = Pick<
  ReturnType<typeof useBoundStore.getState>,
  | 'addObjectiveMarker'
  | 'boardHexes'
  | 'boardPieces'
  | 'paintTile'
  | 'penMode'
  | 'penModeRotation'
  | 'pieceSize'
  | 'setSelectedObjectiveMarkerUID'
  | 'toggleSelectedPieceID'
> & {
  objectiveMarkerMapHexIDs: Set<string>
}

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

export function createMapClickHandler({
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
}: ClickHandlerDependencies) {
  return (event: ThreeEvent<PointerEvent>, hex: BoardHex) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      // TODO: MultiSelect Copy/Paste: Can paste in copied templates! BUT, user must agree to reading text/images from the clipboard
      // const myClipboard = await navigator.clipboard.readText()
      return
    }
    setSelectedObjectiveMarkerUID(null)

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
    if (penMode === OBJECTIVE_MARKER_PEN_MODE) {
      const state = useBoundStore.getState()
      const draft = state.objectiveMarkerDraft
      const content =
        draft.content.kind === 'number' && !draft.pinNumber
          ? {
              kind: 'number' as const,
              value: getEffectiveObjectiveMarkerNumber(
                state.hexMap.objectiveMarkers ?? [],
                draft.style,
                draft.content.value,
              ),
            }
          : draft.content
      const marker: ObjectiveMarker = {
        uid: '',
        anchor: {
          q: hex.q,
          r: hex.r,
          s: hex.s,
          altitude: hex.altitude,
        },
        size: draft.size,
        style: draft.style,
        content,
        name: draft.name,
        rotation: (penModeRotation % 6) as 0 | 1 | 2 | 3 | 4 | 5,
      }
      const placement = getObjectiveMarkerPlacementStatus({
        marker,
        boardHexes: state.boardHexes,
        mapHexIDs: objectiveMarkerMapHexIDs,
        markers: state.hexMap.objectiveMarkers ?? [],
      })
      if (placement.status !== 'ok') {
        enqueueSnackbar({
          message:
            placement.reason === 'overlap'
              ? 'Objective markers cannot overlap.'
              : 'Markers must fit on supported map caps.',
          variant: 'warning',
          autoHideDuration: 2500,
        })
        return
      }
      const uid = addObjectiveMarker(marker)
      if (!uid) {
        enqueueSnackbar({
          message: 'Objective marker could not be placed.',
          variant: 'warning',
          autoHideDuration: 2500,
        })
      } else {
        toggleSelectedPieceID('')
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
            stackablePlacement.altitude ===
              target.altitude + LAUR_ADDON_STACK_INCREMENT)
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
            autoHideDuration: 10000,
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
}
