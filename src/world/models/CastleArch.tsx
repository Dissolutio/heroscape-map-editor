import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import {
  type BoardHex,
  type CubeCoordinate,
  HexTerrain,
  Pieces,
} from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import {
  hexUtilsAdd,
  hexUtilsGetNeighborForRotation,
} from '../../utils/hex-utils'
import { genBoardHexID } from '../../utils/map-utils'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'

type Props = {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

export function CastleArchPreview({ isDoor }: { isDoor: boolean }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/castle-arch-handmade.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const color = hexTerrainColor[HexTerrain.castleWall]
  const colorDoor = hexTerrainColor.castleDoor

  return (
    <>
      {isDoor && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow
          geometry={nodes.ArchDoor.geometry}
          material={basicModelMaterial(
            colorDoor,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
        />
      )}
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.CastleArchBody.geometry}
        material={basicModelMaterial(
          color,
          isLightsAndShadowsRender,
          PIECE_PREVIEW_OPACITY,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.CastleArchCapNear.geometry}
        material={basicModelMaterial(
          color,
          isLightsAndShadowsRender,
          PIECE_PREVIEW_OPACITY,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.CastleArchCapMiddle.geometry}
        material={basicModelMaterial(
          color,
          isLightsAndShadowsRender,
          PIECE_PREVIEW_OPACITY,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.CastleArchCapFar.geometry}
        material={basicModelMaterial(
          color,
          isLightsAndShadowsRender,
          PIECE_PREVIEW_OPACITY,
        )}
      />
    </>
  )
}
export function CastleArch({ boardHex, onPointerUp }: Props) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/castle-arch-handmade.glb') as any
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceIDs.includes(boardHex?.boardPieceUID ?? '')
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const isHighlighted = hoveredPieceID === boardHex?.boardPieceUID || isSelected
  const yellowColor = 'yellow'
  const color = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.castleWall]
  const colorDoor = isHighlighted ? yellowColor : hexTerrainColor.castleDoor
  const isDoor = !(boardHex.inventoryID === Pieces.castleArchNoDoor)
  const [colorNear, setColorNear] = React.useState(
    hexTerrainColor[HexTerrain.castleWall],
  )
  const [colorMiddle, setColorMiddle] = React.useState(
    hexTerrainColor[HexTerrain.castleWall],
  )
  const [colorFar, setColorFar] = React.useState(
    hexTerrainColor[HexTerrain.castleWall],
  )
  const middleBaseHex = () => {
    const middleCube = hexUtilsAdd(
      boardHex,
      hexUtilsGetNeighborForRotation(boardHex.pieceRotation),
    )
    return boardHexes[
      genBoardHexID({ ...middleCube, altitude: boardHex.altitude })
    ]
  }
  const farBaseHex = () => {
    const direction = hexUtilsGetNeighborForRotation(boardHex.pieceRotation)
    const farCube: CubeCoordinate = hexUtilsAdd(
      hexUtilsAdd({ q: boardHex.q, r: boardHex.r, s: boardHex.s }, direction),
      direction,
    )
    return boardHexes[
      genBoardHexID({ ...farCube, altitude: boardHex.altitude })
    ]
  }
  const onPointerEnterNear = (e: ThreeEvent<PointerEvent>) => {
    setColorNear(yellowColor)
    onPointerEnter(e, boardHex)
  }
  const onPointerOutNear = (e: ThreeEvent<PointerEvent>) => {
    setColorNear(hexTerrainColor[HexTerrain.castleWall])
    onPointerOut(e)
  }
  const onPointerEnterMiddle = (e: ThreeEvent<PointerEvent>) => {
    setColorMiddle(yellowColor)
    const hex = middleBaseHex()
    if (hex) onPointerEnter(e, hex)
    else e.stopPropagation()
  }
  const onPointerOutMiddle = (e: ThreeEvent<PointerEvent>) => {
    setColorMiddle(hexTerrainColor[HexTerrain.castleWall])
    onPointerOut(e)
  }
  const onPointerEnterFar = (e: ThreeEvent<PointerEvent>) => {
    setColorFar(yellowColor)
    const hex = farBaseHex()
    if (hex) onPointerEnter(e, hex)
    else e.stopPropagation()
  }
  const onPointerOutFar = (e: ThreeEvent<PointerEvent>) => {
    setColorFar(hexTerrainColor[HexTerrain.castleWall])
    onPointerOut(e)
  }
  const isVerticalClearanceHex = !(
    boardHex.isObstacleAuxiliary || boardHex.isObstacleOrigin
  )
  const onPointerUpMiddle = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const hex = middleBaseHex()
    if (hex) onPointerUp(e, hex)
  }
  const onPointerUpFar = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const hex = farBaseHex()
    if (hex) onPointerUp(e, hex)
  }
  const onPointerUpBody = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(
      boardHex.boardPieceUID ?? '',
      event.shiftKey || event.ctrlKey || event.metaKey,
    )
  }

  // Early return non-origin hexes
  if (isVerticalClearanceHex) {
    return null
  }
  if (boardHex.isObstacleAuxiliary) {
    return null
  }

  return (
    <>
      <group
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        {isDoor && (
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow
            geometry={nodes.ArchDoor.geometry}
            onPointerUp={(e) => onPointerUp(e, boardHex)}
            material={basicModelMaterial(colorDoor, isLightsAndShadowsRender)}
          />
        )}
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.CastleArchBody.geometry}
          onPointerUp={onPointerUpBody}
          material={basicModelMaterial(color, isLightsAndShadowsRender)}
        />
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.CastleArchCapNear.geometry}
          onPointerUp={(e) => onPointerUp(e, boardHex)}
          onPointerEnter={onPointerEnterNear}
          onPointerOut={onPointerOutNear}
          material={basicModelMaterial(colorNear, isLightsAndShadowsRender)}
        />
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.CastleArchCapMiddle.geometry}
          onPointerEnter={onPointerEnterMiddle}
          onPointerOut={onPointerOutMiddle}
          onPointerUp={onPointerUpMiddle}
          material={basicModelMaterial(colorMiddle, isLightsAndShadowsRender)}
        />
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.CastleArchCapFar.geometry}
          onPointerEnter={onPointerEnterFar}
          onPointerOut={onPointerOutFar}
          onPointerUp={onPointerUpFar}
          material={basicModelMaterial(colorFar, isLightsAndShadowsRender)}
        />
      </group>
    </>
  )
}

// useGltf.preload('/castle-arch-handmade.glb')
