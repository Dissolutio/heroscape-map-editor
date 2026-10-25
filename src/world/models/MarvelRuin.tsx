import { useDisposableGLTF } from './useDisposableGLTF'

import type { ThreeEvent } from '@react-three/fiber'
import { DoubleSide } from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { Pieces } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicDoubleSideModelMaterial } from './materials'

export function MarvelRuin({
  pid,
  inventoryID,
}: {
  pid: string
  inventoryID: string
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/marvel-ruins_v2.glb') as any
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceIDs.includes(pid)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(
      pid,
      event.shiftKey || event.ctrlKey || event.metaKey,
      { x: event.point.x, z: event.point.z },
    )
  }
  const isHighlighted = hoveredPieceID === pid || isSelected
  const yellowColor = 'yellow'
  const color = isHighlighted ? yellowColor : hexTerrainColor.marvelRuin
  const colorUpperFloor = isHighlighted ? yellowColor : hexTerrainColor.ladder
  const isUpperFloor =
    inventoryID === Pieces.marvel || inventoryID === Pieces.marvelBroken
  const isWallIntact =
    inventoryID === Pieces.marvel || inventoryID === Pieces.marvelNoUpper
  return (
    <group
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
      onPointerUp={(e) => onPointerUp(e)}
    >
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.MarvelRuinMain.geometry}
        material={basicDoubleSideModelMaterial(color, isLightsAndShadowsRender)}
      />
      {isUpperFloor && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.MarvelRuinUpperFloor.geometry}
          material={basicDoubleSideModelMaterial(
            colorUpperFloor,
            isLightsAndShadowsRender,
          )}
        />
      )}
      {isWallIntact && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.MarvelRuinRemoveableWall.geometry}
          material={basicDoubleSideModelMaterial(
            color,
            isLightsAndShadowsRender,
          )}
        />
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
  const { nodes } = useDisposableGLTF('/marvel-ruins_v2.glb') as any
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
        material={basicDoubleSideModelMaterial(
          color,
          isLightsAndShadowsRender,
          PIECE_PREVIEW_OPACITY,
        )}
      />
      {isUpperFloor && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.MarvelRuinUpperFloor.geometry}
          material={basicDoubleSideModelMaterial(
            colorUpperFloor,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
        />
      )}
      {isWallIntact && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.MarvelRuinRemoveableWall.geometry}
          material={basicDoubleSideModelMaterial(
            color,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
        />
      )}
    </>
  )
}

// useGltf.preload('/marvel-ruins.glb')
