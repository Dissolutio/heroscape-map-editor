import { useGLTF } from '@react-three/drei'
import { genBoardHexID, getBoardHex3DCoords } from '../../utils/map-utils'
import { BoardHex, CubeCoordinate, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import ObstacleBase from './ObstacleBase'
import React from 'react'
import { ThreeEvent } from '@react-three/fiber'
import {
  hexUtilsAdd,
  hexUtilsGetNeighborForRotation,
} from '../../utils/hex-utils'
import useBoundStore from '../../store/store'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import usePieceHoverState from '../../hooks/usePieceHoverState'

type Props = {
  boardHex: BoardHex
  underHexTerrain: string
  // overHexTerrain: string,
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

export function CastleArch({
  boardHex,
  underHexTerrain,
  // overHexTerrain,
  onPointerUp,
}: Props) {
  const { nodes } = useGLTF('/castle-arch-handmade.glb') as any
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const { x, z, yBase, yBaseCap } = getBoardHex3DCoords(boardHex)
  const isSelected = selectedPieceID === boardHex.pieceID
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const {
    isHovered,
    onPointerEnter,
    onPointerOut,
  } = usePieceHoverState(isVisible)
  const isHighlighted = isHovered || isSelected
  const yellowColor = 'yellow'
  // const castleColor = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.castle]
  const castleColor = hexTerrainColor[HexTerrain.castle]
  const rotation = boardHex?.pieceRotation ?? 0
  const isDoor = !boardHex.pieceID.endsWith('b') // hacky but fast, marvel ruin and castle arch no door end with "b"
  const isCastleUnder = underHexTerrain === HexTerrain.castle
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
  if (isVerticalClearanceHex) {
    return null
  }
  if (boardHex.isObstacleAuxiliary) {
    return !isCastleUnder ? (
      <ObstacleBase
        x={x}
        y={yBaseCap}
        z={z}
        color={hexTerrainColor[underHexTerrain]}
      />
    ) : (
      <></>
    )
  }
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

  return (
    <group
      position={[x, yBase, z]}
      rotation={[0, (rotation * -Math.PI) / 3, 0]}
    >
      {(selectedPieceID === boardHex.pieceID) && (
        <DeletePieceBillboard pieceID={boardHex.pieceID} y={1} />
      )}
      <group
        onPointerEnter={e => onPointerEnter(e, boardHex)}
        onPointerOut={e => onPointerOut(e)}
      >
        <mesh
          geometry={nodes.CastleArchBody.geometry}
          onPointerUp={onPointerUpBody}
        >
          <meshMatcapMaterial color={isHighlighted ? yellowColor : castleColor} />
        </mesh>
        <mesh
          geometry={nodes.CastleArchCapNear.geometry}
          onPointerUp={e => onPointerUp(e, boardHex)}
          onPointerEnter={onPointerEnterNear}
          onPointerOut={onPointerOutNear}
        >
          <meshMatcapMaterial color={isHighlighted ? yellowColor : colorNear} />
        </mesh>
        <mesh
          geometry={nodes.CastleArchCapMiddle.geometry}
          onPointerEnter={onPointerEnterMiddle}
          onPointerOut={onPointerOutMiddle}
          onPointerUp={onPointerUpMiddle}
        >
          <meshMatcapMaterial color={isHighlighted ? yellowColor : colorMiddle} />
        </mesh>
        <mesh
          geometry={nodes.CastleArchCapFar.geometry}
          onPointerEnter={onPointerEnterFar}
          onPointerOut={onPointerOutFar}
          onPointerUp={onPointerUpFar}
        >
          <meshMatcapMaterial color={isHighlighted ? yellowColor : colorFar} />
        </mesh>
        {isDoor && (
          <mesh
            geometry={nodes.ArchDoor.geometry}
            onPointerUp={e => onPointerUp(e, boardHex)}
          >
            <meshMatcapMaterial color={isHighlighted ? yellowColor : hexTerrainColor.castleDoor} />
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

// useGLTF.preload('/castle-arch-handmade.glb')

