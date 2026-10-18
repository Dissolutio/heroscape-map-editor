import type { ThreeEvent } from '@react-three/fiber'
import { noop } from 'lodash'
import React, { useState } from 'react'
import { piecesSoFar } from '../../data/pieces'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import type { BoardHex, BoardPiece, CubeCoordinate } from '../../types'
import { HexTerrain } from '../../types'
import { isSolidTerrainHex } from '../../utils/board-utils'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexUtilsAdd } from '../../utils/hex-utils'
import { hexUtilsGetShipBuildableCoords } from '../../utils/hex-utils'
import { genBoardHexID } from '../../utils/map-utils'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { shipDeckColor } from './shipDeckColor'
import { useDisposableGLTF } from './useDisposableGLTF'

type ShipWallProps = {
  pid?: string
  bp?: BoardPiece
  onPointerUp?: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

export function ShipWall({ pid, bp, onPointerUp }: ShipWallProps) {
  const [hoveredBuildableSection, setHoveredBuildableSection] = useState<
    'forward' | 'aft' | null
  >(null)
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/ship-wall_v2.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const penMode = useBoundStore((s) => s.penMode)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const pieceSize = useBoundStore((s) => s.pieceSize)
  const toggleHoveredHex = useBoundStore((s) => s.toggleHoveredHex)
  const toggleHoveredPieceID = useBoundStore((s) => s.toggleHoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)

  const pieceKey = pieceSize === 0 ? penMode : `${penMode}${pieceSize}`
  const selectedPiece = piecesSoFar[pieceKey]
  const isSolidLandPenMode =
    selectedPiece && isSolidTerrainHex(selectedPiece.terrain)

  const getForwardBuildableCoords = (): CubeCoordinate | null => {
    if (!bp) return null
    return hexUtilsGetShipBuildableCoords(bp.pieceCoords, bp.rotation).forward
  }

  const getAftBuildableCoords = (): CubeCoordinate | null => {
    if (!bp) return null
    return hexUtilsGetShipBuildableCoords(bp.pieceCoords, bp.rotation).aft
  }

  const getForwardBuildableHex = (): BoardHex => {
    if (!bp) return {} as BoardHex
    const coords = getForwardBuildableCoords()
    if (!coords) return {} as BoardHex
    const hexID = genBoardHexID({
      ...coords,
      altitude: bp.altitude + 6,
    })
    return (
      boardHexes[hexID] ||
      ({
        ...coords,
        altitude: bp.altitude + 6,
        boardPieceUID: '',
        inventoryID: '',
        pieceID: '',
        pieceRotation: 0,
        terrain: HexTerrain.empty,
        isCap: false,
        isObstacleOrigin: false,
        isObstacleAuxiliary: false,
      } as BoardHex)
    )
  }

  const getAftBuildableHex = (): BoardHex => {
    if (!bp) return {} as BoardHex
    const coords = getAftBuildableCoords()
    if (!coords) return {} as BoardHex
    const hexID = genBoardHexID({
      ...coords,
      altitude: bp.altitude + 6,
    })
    return (
      boardHexes[hexID] ||
      ({
        ...coords,
        altitude: bp.altitude + 6,
        boardPieceUID: '',
        inventoryID: '',
        pieceID: '',
        pieceRotation: 0,
        terrain: HexTerrain.empty,
        isCap: false,
        isObstacleOrigin: false,
        isObstacleAuxiliary: false,
      } as BoardHex)
    )
  }

  const onPointerEnterForwardBuildable = (e: ThreeEvent<PointerEvent>) => {
    if (!isSolidLandPenMode) return
    setHoveredBuildableSection('forward')
    toggleHoveredPieceID(pid ?? '')
    toggleHoveredHex(getForwardBuildableHex())
    e.stopPropagation()
  }

  const onPointerEnterAftBuildable = (e: ThreeEvent<PointerEvent>) => {
    if (!isSolidLandPenMode) return
    setHoveredBuildableSection('aft')
    toggleHoveredPieceID(pid ?? '')
    toggleHoveredHex(getAftBuildableHex())
    e.stopPropagation()
  }

  const onPointerOutBuildable = (e: ThreeEvent<PointerEvent>) => {
    setHoveredBuildableSection(null)
    toggleHoveredPieceID('')
    toggleHoveredHex(undefined)
    e.stopPropagation()
  }

  const onPointerEnterNonBuildable = (e: ThreeEvent<PointerEvent>) => {
    if (!pid) return
    if (isSolidLandPenMode) {
      e.stopPropagation()
      toggleHoveredPieceID(pid)
      return
    }
    onPointerEnterPID(e, pid)
  }

  const onPointerOutNonBuildable = (e: ThreeEvent<PointerEvent>) => {
    if (isSolidLandPenMode) {
      e.stopPropagation()
      toggleHoveredPieceID('')
      return
    }
    onPointerOut(e)
  }

  const onPointerUpBody = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (event.button !== 0) return
    if (pid) {
      toggleSelectedPieceID(
        pid,
        event.shiftKey || event.ctrlKey || event.metaKey,
      )
    }
  }

  const onPointerUpForwardBuildable = (e: ThreeEvent<PointerEvent>) => {
    if (isSolidLandPenMode && onPointerUp) {
      onPointerUp(e, getForwardBuildableHex())
      e.stopPropagation()
      return
    }
    // any other pen: a click on the deck is a click on the ship
    onPointerUpBody(e)
  }

  const onPointerUpAftBuildable = (e: ThreeEvent<PointerEvent>) => {
    if (isSolidLandPenMode && onPointerUp) {
      onPointerUp(e, getAftBuildableHex())
      e.stopPropagation()
      return
    }
    // any other pen: a click on the deck is a click on the ship
    onPointerUpBody(e)
  }

  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid ?? '')
  const isHighlighted = hoveredPieceID === pid || isSelected
  const color = isHighlighted ? yellowColor : hexTerrainColor.shipWood
  // Hovering either deck section lights both (one colour for the two decks)
  const buildableColor = shipDeckColor(
    isHighlighted,
    hoveredBuildableSection !== null,
  )

  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipWall.geometry}
        onPointerUp={(e) => (pid ? onPointerUpBody(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterNonBuildable(e) : noop())}
        onPointerOut={(e) => (pid ? onPointerOutNonBuildable(e) : noop())}
        material={
          pid
            ? basicModelMaterial(color, isLightsAndShadowsRender)
            : basicModelMaterial(
                color,
                isLightsAndShadowsRender,
                PIECE_PREVIEW_OPACITY,
              )
        }
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipWallForwardBuildable.geometry}
        onPointerUp={(e) => (pid ? onPointerUpForwardBuildable(e) : noop())}
        onPointerEnter={(e) =>
          pid && isSolidLandPenMode
            ? onPointerEnterForwardBuildable(e)
            : pid
              ? onPointerEnterNonBuildable(e)
              : noop()
        }
        onPointerOut={(e) =>
          pid && isSolidLandPenMode
            ? onPointerOutBuildable(e)
            : pid
              ? onPointerOutNonBuildable(e)
              : noop()
        }
        material={
          pid
            ? basicModelMaterial(buildableColor, isLightsAndShadowsRender)
            : basicModelMaterial(
                buildableColor,
                isLightsAndShadowsRender,
                PIECE_PREVIEW_OPACITY,
              )
        }
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipWallAftBuildable.geometry}
        onPointerUp={(e) => (pid ? onPointerUpAftBuildable(e) : noop())}
        onPointerEnter={(e) =>
          pid && isSolidLandPenMode
            ? onPointerEnterAftBuildable(e)
            : pid
              ? onPointerEnterNonBuildable(e)
              : noop()
        }
        onPointerOut={(e) =>
          pid && isSolidLandPenMode
            ? onPointerOutBuildable(e)
            : pid
              ? onPointerOutNonBuildable(e)
              : noop()
        }
        material={
          pid
            ? basicModelMaterial(buildableColor, isLightsAndShadowsRender)
            : basicModelMaterial(
                buildableColor,
                isLightsAndShadowsRender,
                PIECE_PREVIEW_OPACITY,
              )
        }
      />
    </>
  )
}
