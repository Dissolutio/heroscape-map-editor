import { useGLTF } from '@react-three/drei'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import useBoundStore from '../../store/store'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import type { ThreeEvent } from '@react-three/fiber'
import { hexTerrainColor } from '../maphex/hexColors'
import { Pieces, type BoardHex } from '../../types'
import { DoubleSide } from 'three'
import { basicDoubleSideModelMaterial } from './materials'

export function MarvelRuin({
  boardHex,
}: {
  boardHex: BoardHex
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/marvel-ruins.glb') as any
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }
  const isHighlighted = (hoveredPieceID === boardHex.pieceID) || isSelected
  const yellowColor = 'yellow'
  const color = isHighlighted ? yellowColor : hexTerrainColor.marvelRuin
  const colorUpperFloor = isHighlighted ? yellowColor : hexTerrainColor.ladder
  const isUpperFloor =
    boardHex.inventoryID === Pieces.marvel ||
    boardHex.inventoryID === Pieces.marvelBroken
  const isWallIntact =
    boardHex.inventoryID === Pieces.marvel ||
    boardHex.inventoryID === Pieces.marvelNoUpper
  return (
    <group
      onPointerEnter={(e) => onPointerEnter(e, boardHex)}
      onPointerOut={(e) => onPointerOut(e)}
      onPointerUp={(e) => onPointerUp(e)}
    >
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.MarvelRuinMain.geometry}
      >
        {basicDoubleSideModelMaterial(color, isHighQualityRender)}
      </mesh>
      {isUpperFloor && (
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={nodes.MarvelRuinUpperFloor.geometry}
        >
          {basicDoubleSideModelMaterial(colorUpperFloor, isHighQualityRender)}
        </mesh>
      )}
      {isWallIntact && (
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={nodes.MarvelRuinRemoveableWall.geometry}
        >
          {basicDoubleSideModelMaterial(color, isHighQualityRender)}
        </mesh>
      )}
    </group>
  )
}

useGLTF.preload('/marvel-ruins.glb')
