import { useGLTF } from '@react-three/drei'
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
import {
  hexUtilsAdd,
  hexUtilsGetNeighborForRotation,
} from '../../utils/hex-utils'
import { genBoardHexID } from '../../utils/map-utils'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { noop } from 'lodash'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

type Props = {
  boardHex?: BoardHex
  onPointerUp?: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

export function CastleArch({ boardHex, onPointerUp }: Props) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/castle-arch-handmade.glb') as any
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceID === boardHex?.pieceID
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const isHighlighted = hoveredPieceID === boardHex?.pieceID || isSelected
  const yellowColor = 'yellow'
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.castle]
  const colorDoor = isHighlighted ? yellowColor : hexTerrainColor.castleDoor
  const isDoor = !(boardHex?.inventoryID === Pieces.castleArchNoDoor)
  const [colorNear, setColorNear] = React.useState(
    hexTerrainColor[HexTerrain.castle],
  )
  const [colorMiddle, setColorMiddle] = React.useState(
    hexTerrainColor[HexTerrain.castle],
  )
  const [colorFar, setColorFar] = React.useState(
    hexTerrainColor[HexTerrain.castle],
  )
  const onPointerEnterNear = (e: ThreeEvent<PointerEvent>) => {
    setColorNear(yellowColor)
    e.stopPropagation()
  }
  const onPointerOutNear = (e: ThreeEvent<PointerEvent>) => {
    setColorNear(hexTerrainColor[HexTerrain.castle])
    e.stopPropagation()
  }
  const onPointerEnterMiddle = (e: ThreeEvent<PointerEvent>) => {
    setColorMiddle(yellowColor)
    e.stopPropagation()
  }
  const onPointerOutMiddle = (e: ThreeEvent<PointerEvent>) => {
    setColorMiddle(hexTerrainColor[HexTerrain.castle])
    e.stopPropagation()
  }
  const onPointerEnterFar = (e: ThreeEvent<PointerEvent>) => {
    setColorFar(yellowColor)
    e.stopPropagation()
  }
  const onPointerOutFar = (e: ThreeEvent<PointerEvent>) => {
    setColorFar(hexTerrainColor[HexTerrain.castle])
    e.stopPropagation()
  }
  const isVerticalClearanceHex = !(
    boardHex?.isObstacleAuxiliary || boardHex?.isObstacleOrigin
  )
  const onPointerUpMiddle = (e: ThreeEvent<PointerEvent>) => {
    if (!boardHex) {
      return
    }
    e.stopPropagation()
    const myCube: CubeCoordinate = {
      q: boardHex.q,
      r: boardHex.r,
      s: boardHex.s,
    }
    const middleCube = hexUtilsAdd(
      myCube,
      hexUtilsGetNeighborForRotation(boardHex.pieceRotation),
    )
    const middleBaseHex =
      boardHexes[genBoardHexID({ ...middleCube, altitude: boardHex.altitude })]
    onPointerUp?.(e, middleBaseHex)
  }
  const onPointerUpFar = (e: ThreeEvent<PointerEvent>) => {
    if (!boardHex) {
      return
    }
    e.stopPropagation()
    const myCube: CubeCoordinate = {
      q: boardHex.q,
      r: boardHex.r,
      s: boardHex.s,
    }
    const farCube = hexUtilsAdd(
      hexUtilsAdd(
        myCube,
        hexUtilsGetNeighborForRotation(boardHex.pieceRotation),
      ),
      hexUtilsGetNeighborForRotation(boardHex.pieceRotation),
    )
    const farBaseHex =
      boardHexes[genBoardHexID({ ...farCube, altitude: boardHex.altitude })]
    onPointerUp?.(e, farBaseHex)
  }
  const onPointerUpBody = (event: ThreeEvent<PointerEvent>) => {
    if (!boardHex) {
      return
    }
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }

  // Early return non-origin hexes
  if (isVerticalClearanceHex) {
    return null
  }
  if (boardHex.isObstacleAuxiliary) {
    return null
  }

  return (
    <group
      onPointerEnter={(e) => (boardHex ? onPointerEnter(e, boardHex) : noop())}
      onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
    >
      {isDoor && (
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={nodes.ArchDoor.geometry}
          onPointerUp={(e) => (boardHex ? onPointerUp?.(e, boardHex) : noop())}
        >
          {boardHex
            ? basicModelMaterial(colorDoor, isHighQualityRender)
            : basicModelMaterial(
                colorDoor,
                isHighQualityRender,
                PIECE_PREVIEW_OPACITY,
              )}
        </mesh>
      )}
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.CastleArchBody.geometry}
        onPointerUp={boardHex ? onPointerUpBody : noop}
      >
        {boardHex
          ? basicModelMaterial(color, isHighQualityRender)
          : basicModelMaterial(
              color,
              isHighQualityRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.CastleArchCapNear.geometry}
        onPointerUp={(e) => (boardHex ? onPointerUp?.(e, boardHex) : noop)}
        onPointerEnter={boardHex ? onPointerEnterNear : noop}
        onPointerOut={boardHex ? onPointerOutNear : noop}
      >
        {boardHex
          ? basicModelMaterial(colorNear, isHighQualityRender)
          : basicModelMaterial(
              colorNear,
              isHighQualityRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.CastleArchCapMiddle.geometry}
        onPointerEnter={boardHex ? onPointerEnterMiddle : noop}
        onPointerOut={boardHex ? onPointerOutMiddle : noop}
        onPointerUp={boardHex ? onPointerUpMiddle : noop}
      >
        {boardHex
          ? basicModelMaterial(colorMiddle, isHighQualityRender)
          : basicModelMaterial(
              colorMiddle,
              isHighQualityRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.CastleArchCapFar.geometry}
        onPointerEnter={boardHex ? onPointerEnterFar : noop}
        onPointerOut={boardHex ? onPointerOutFar : noop}
        onPointerUp={boardHex ? onPointerUpFar : noop}
      >
        {boardHex
          ? basicModelMaterial(colorFar, isHighQualityRender)
          : basicModelMaterial(
              colorFar,
              isHighQualityRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
    </group>
  )
}

useGLTF.preload('/castle-arch-handmade.glb')
