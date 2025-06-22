import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, type CubeCoordinate, HexTerrain } from '../../types'
import {
  hexUtilsAdd,
  hexUtilsGetNeighborForRotation,
} from '../../utils/hex-utils'
import { genBoardHexID, getBoardHex3DCoords } from '../../utils/map-utils'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import { hexTerrainColor } from '../maphex/hexColors'

type Props = {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

export function CastleArch({ boardHex, onPointerUp }: Props) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/castle-arch-handmade.glb') as any
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const { x, z, yBase } = getBoardHex3DCoords(boardHex)
  const isSelected = selectedPieceID === boardHex.pieceID
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnter, onPointerOut } =
    usePieceHoverState(isVisible)
  const isHighlighted = isHovered || isSelected
  const yellowColor = 'yellow'
  const castleColor = hexTerrainColor[HexTerrain.castle]
  const material = (color: string) =>
    isHighQualityRender ? (
      <meshStandardMaterial color={color} />
    ) : (
      <meshMatcapMaterial color={color} />
    )
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.castle]
  const rotation = boardHex?.pieceRotation ?? 0
  const isDoor = !boardHex.pieceID.endsWith('b') // hacky but fast, marvel ruin and castle arch no door end with "b"
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
    if (!isVisible) {
      return
    }
    setColorNear(yellowColor)
    e.stopPropagation()
  }
  const onPointerOutNear = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    setColorNear(hexTerrainColor[HexTerrain.castle])
    e.stopPropagation()
  }
  const onPointerEnterMiddle = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    setColorMiddle(yellowColor)
    e.stopPropagation()
  }
  const onPointerOutMiddle = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    setColorMiddle(hexTerrainColor[HexTerrain.castle])
    e.stopPropagation()
  }
  const onPointerEnterFar = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    setColorFar(yellowColor)
    e.stopPropagation()
  }
  const onPointerOutFar = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    setColorFar(hexTerrainColor[HexTerrain.castle])
    e.stopPropagation()
  }
  const isVerticalClearanceHex = !(
    boardHex.isObstacleAuxiliary || boardHex.isObstacleOrigin
  )
  const onPointerUpMiddle = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
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
    onPointerUp(e, middleBaseHex)
  }
  const onPointerUpFar = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
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
    onPointerUp(e, farBaseHex)
  }
  const onPointerUpBody = (event: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
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
      position={[x, yBase, z]}
      rotation={[0, (rotation * -Math.PI) / 3, 0]}
    >
      {selectedPieceID === boardHex.pieceID && (
        <DeletePieceBillboard pieceID={boardHex.pieceID} y={1} />
      )}
      <group
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={nodes.CastleArchBody.geometry}
          onPointerUp={onPointerUpBody}
        >
          {material(color)}
        </mesh>
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={nodes.CastleArchCapNear.geometry}
          onPointerUp={(e) => onPointerUp(e, boardHex)}
          onPointerEnter={onPointerEnterNear}
          onPointerOut={onPointerOutNear}
        >
          {material(colorNear)}
        </mesh>
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={nodes.CastleArchCapMiddle.geometry}
          onPointerEnter={onPointerEnterMiddle}
          onPointerOut={onPointerOutMiddle}
          onPointerUp={onPointerUpMiddle}
        >
          {material(colorMiddle)}
        </mesh>
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={nodes.CastleArchCapFar.geometry}
          onPointerEnter={onPointerEnterFar}
          onPointerOut={onPointerOutFar}
          onPointerUp={onPointerUpFar}
        >
          {material(colorFar)}
        </mesh>
        {isDoor && (
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow
            geometry={nodes.ArchDoor.geometry}
            onPointerUp={(e) => onPointerUp(e, boardHex)}
          >
            {material(isHighlighted ? yellowColor : hexTerrainColor.castleDoor)}
          </mesh>
        )}
      </group>
      {/* <ObstacleBase
        x={x}
        y={yBaseCap}
        z={z}
        color={isHighlighted ? yellowColor : hexTerrainColor[underHexTerrain]}
      /> */}
    </group>
  )
}

useGLTF.preload('/castle-arch-handmade.glb')
