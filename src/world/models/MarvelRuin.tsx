import { useGLTF } from '@react-three/drei'
import { decodePieceID, getBoardHex3DCoords } from '../../utils/map-utils'
import useBoundStore from '../../store/store'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import type { ThreeEvent } from '@react-three/fiber'
import { hexTerrainColor } from '../maphex/hexColors'
import { Pieces, type BoardHex } from '../../types'
import { DoubleSide } from 'three'
import { basicDoubleSideModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export function MarvelRuin({ pid }: { pid: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/marvel-ruins.glb') as any
  const { inventoryID } = decodePieceID(pid)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isSelected = selectedPieceID === pid
  const isHighlighted = hoveredPieceID === pid || isSelected
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnterPiece, onPointerOut } = usePieceHoverState()
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : pid)
  }
  const yellowColor = 'yellow'
  const color = isHighlighted ? yellowColor : hexTerrainColor.marvelRuin
  const colorUpperFloor = isHighlighted ? yellowColor : hexTerrainColor.ladder
  const isUpperFloor =
    inventoryID === Pieces.marvel || inventoryID === Pieces.marvelBroken
  const isWallIntact =
    inventoryID === Pieces.marvel || inventoryID === Pieces.marvelNoUpper
  return (
    <group
      onPointerEnter={(e) => onPointerEnterPiece(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
      onPointerUp={(e) => onPointerUp(e)}
    >
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.MarvelRuinMain.geometry}
      >
        {basicDoubleSideModelMaterial(color, isLightsAndShadowsRender)}
      </mesh>
      {isUpperFloor && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.MarvelRuinUpperFloor.geometry}
        >
          {basicDoubleSideModelMaterial(
            colorUpperFloor,
            isLightsAndShadowsRender,
          )}
        </mesh>
      )}
      {isWallIntact && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.MarvelRuinRemoveableWall.geometry}
        >
          {basicDoubleSideModelMaterial(color, isLightsAndShadowsRender)}
        </mesh>
      )}
    </group>
  )
}
export function MarvelRuinPreview({
  isUpperFloor,
  isWallIntact,
}: {
  isUpperFloor: boolean
  isWallIntact: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/marvel-ruins.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const color = hexTerrainColor.marvelRuin
  const colorUpperFloor = hexTerrainColor.ladder
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.MarvelRuinMain.geometry}
      >
        {basicDoubleSideModelMaterial(
          color,
          isLightsAndShadowsRender,
          PIECE_PREVIEW_OPACITY,
        )}
      </mesh>
      {isUpperFloor && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.MarvelRuinUpperFloor.geometry}
        >
          {basicDoubleSideModelMaterial(
            colorUpperFloor,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
        </mesh>
      )}
      {isWallIntact && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.MarvelRuinRemoveableWall.geometry}
        >
          {basicDoubleSideModelMaterial(
            color,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
        </mesh>
      )}
    </>
  )
}

useGLTF.preload('/marvel-ruins.glb')
