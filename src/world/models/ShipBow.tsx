import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React, { useState } from 'react'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import type { BoardHex, BoardPiece, CubeCoordinate } from '../../types'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { isSolidTerrainHex } from '../../utils/board-utils'
import { hexUtilsAdd } from '../../utils/hex-utils'
import { hexUtilsGetShipBuildableCoords } from '../../utils/hex-utils'
import { genBoardHexID } from '../../utils/map-utils'
import { piecesSoFar } from '../../data/pieces'
import { noop } from 'lodash'

type ShipBowProps = {
  pid?: string
  bp?: BoardPiece
  onPointerUp?: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

export function ShipBow({ pid, bp, onPointerUp }: ShipBowProps) {
  const [hoveredBuildableSection, setHoveredBuildableSection] = useState<
    'forward' | 'aft' | null
  >(null)
  const { nodes } = useGLTF(
    '/ship-bow_v3.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
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

  // Determine if we're in pen mode with a solid land piece selected
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

  // Get the hexes for buildable sections (at altitude +6)
  const getForwardBuildableHex = (): BoardHex => {
    if (!bp) return {} as BoardHex
    const coords = getForwardBuildableCoords()
    if (!coords) return {} as BoardHex
    const hexID = genBoardHexID({
      ...coords,
      altitude: bp.altitude + 6,
    })
    // Return existing hex or create a minimal one for the buildable section
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
    // Return existing hex or create a minimal one for the buildable section
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

  // Handlers for buildable mesh interactions
  const onPointerEnterForwardBuildable = (e: ThreeEvent<PointerEvent>) => {
    if (isSolidLandPenMode) {
      setHoveredBuildableSection('forward')
      toggleHoveredPieceID(pid ?? '')
      const hex = getForwardBuildableHex()
      toggleHoveredHex(hex)
      e.stopPropagation()
    }
  }

  const onPointerEnterAftBuildable = (e: ThreeEvent<PointerEvent>) => {
    if (isSolidLandPenMode) {
      setHoveredBuildableSection('aft')
      toggleHoveredPieceID(pid ?? '')
      const hex = getAftBuildableHex()
      toggleHoveredHex(hex)
      e.stopPropagation()
    }
  }

  const onPointerOutBuildable = (e: ThreeEvent<PointerEvent>) => {
    setHoveredBuildableSection(null)
    toggleHoveredPieceID('')
    toggleHoveredHex(undefined)
    e.stopPropagation()
  }

  const onPointerEnterNonBuildable = (e: ThreeEvent<PointerEvent>) => {
    if (!pid) {
      return
    }
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

  const onPointerUpForwardBuildable = (e: ThreeEvent<PointerEvent>) => {
    if (isSolidLandPenMode && onPointerUp) {
      const hex = getForwardBuildableHex()
      onPointerUp(e, hex)
    }
    e.stopPropagation()
  }

  const onPointerUpAftBuildable = (e: ThreeEvent<PointerEvent>) => {
    if (isSolidLandPenMode && onPointerUp) {
      const hex = getAftBuildableHex()
      onPointerUp(e, hex)
    }
    e.stopPropagation()
  }

  const onPointerUpBody = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    if (pid) {
      toggleSelectedPieceID(
        pid,
        event.shiftKey || event.ctrlKey || event.metaKey,
      )
    }
  }

  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid ?? '')
  const isHighlighted = hoveredPieceID === pid || isSelected

  // Determine colors for buildable sections
  const forwardBuildableColor =
    hoveredBuildableSection === 'forward'
      ? yellowColor
      : hexTerrainColor.shipWood
  const aftBuildableColor =
    hoveredBuildableSection === 'aft' ? yellowColor : hexTerrainColor.shipWood
  const color = isHighlighted ? yellowColor : hexTerrainColor.shipWood
  const colorShipBowIron = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowIron
  const colorShipBowFigureheadBody = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadBody
  const colorShipBowFigureheadWings = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadWings
  const colorShipBowFigureheadEyes = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadEyes
  const colorShipBowFigureheadTongue = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadTongue
  const colorShipBowFigureheadBeak = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadBeak
  const colorShipBowFigureheadTail = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadTail
  const colorShipBowFigureheadMane = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadMane
  const colorShipBowFigureheadHooves = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadHooves
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBow.geometry}
        onPointerUp={(e) => (pid ? onPointerUpBody(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterNonBuildable(e) : noop())}
        onPointerOut={(e) => (pid ? onPointerOutNonBuildable(e) : noop())}
      >
        {pid
          ? basicModelMaterial(color, isLightsAndShadowsRender)
          : basicModelMaterial(
              color,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowForwardBuildable.geometry}
        onPointerUp={(e) =>
          isSolidLandPenMode && onPointerUp
            ? onPointerUpForwardBuildable(e)
            : onPointerUp
              ? onPointerUp(e, {} as BoardHex)
              : noop()
        }
        onPointerEnter={(e) =>
          isSolidLandPenMode
            ? onPointerEnterForwardBuildable(e)
            : pid
              ? onPointerEnterPID(e, pid ?? '')
              : noop()
        }
        onPointerOut={(e) =>
          isSolidLandPenMode ? onPointerOutBuildable(e) : onPointerOut(e)
        }
      >
        {pid
          ? basicModelMaterial(forwardBuildableColor, isLightsAndShadowsRender)
          : basicModelMaterial(
              forwardBuildableColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowAftBuildable.geometry}
        onPointerUp={(e) =>
          isSolidLandPenMode && onPointerUp
            ? onPointerUpAftBuildable(e)
            : onPointerUp
              ? onPointerUp(e, {} as BoardHex)
              : noop()
        }
        onPointerEnter={(e) =>
          isSolidLandPenMode
            ? onPointerEnterAftBuildable(e)
            : pid
              ? onPointerEnterPID(e, pid ?? '')
              : noop()
        }
        onPointerOut={(e) =>
          isSolidLandPenMode ? onPointerOutBuildable(e) : onPointerOut(e)
        }
      >
        {pid
          ? basicModelMaterial(aftBuildableColor, isLightsAndShadowsRender)
          : basicModelMaterial(
              aftBuildableColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowIron.geometry}
        onPointerUp={(e) => (pid ? onPointerUpBody(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterNonBuildable(e) : noop())}
        onPointerOut={(e) => (pid ? onPointerOutNonBuildable(e) : noop())}
      >
        {pid
          ? basicModelMaterial(colorShipBowIron, isLightsAndShadowsRender)
          : basicModelMaterial(
              colorShipBowIron,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadBody.geometry}
        onPointerUp={(e) => (pid ? onPointerUpBody(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterNonBuildable(e) : noop())}
        onPointerOut={(e) => (pid ? onPointerOutNonBuildable(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadBody,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadBody,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadWings.geometry}
        onPointerUp={(e) => (pid ? onPointerUpBody(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterNonBuildable(e) : noop())}
        onPointerOut={(e) => (pid ? onPointerOutNonBuildable(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadWings,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadWings,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadEyes.geometry}
        onPointerUp={(e) => (pid ? onPointerUpBody(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterNonBuildable(e) : noop())}
        onPointerOut={(e) => (pid ? onPointerOutNonBuildable(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadEyes,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadEyes,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadTongue.geometry}
        onPointerUp={(e) => (pid ? onPointerUpBody(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterNonBuildable(e) : noop())}
        onPointerOut={(e) => (pid ? onPointerOutNonBuildable(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadTongue,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadTongue,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadBeak.geometry}
        onPointerUp={(e) => (pid ? onPointerUpBody(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterNonBuildable(e) : noop())}
        onPointerOut={(e) => (pid ? onPointerOutNonBuildable(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadBeak,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadBeak,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadTail.geometry}
        onPointerUp={(e) => (pid ? onPointerUpBody(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterNonBuildable(e) : noop())}
        onPointerOut={(e) => (pid ? onPointerOutNonBuildable(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadTail,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadTail,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadMane.geometry}
        onPointerUp={(e) => (pid ? onPointerUpBody(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterNonBuildable(e) : noop())}
        onPointerOut={(e) => (pid ? onPointerOutNonBuildable(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadMane,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadMane,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadHooves.geometry}
        onPointerUp={(e) => (pid ? onPointerUpBody(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterNonBuildable(e) : noop())}
        onPointerOut={(e) => (pid ? onPointerOutNonBuildable(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadHooves,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadHooves,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
    </>
  )
}
