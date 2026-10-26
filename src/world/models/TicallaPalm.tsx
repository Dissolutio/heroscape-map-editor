import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain, PiecePrefixes, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'

export default function TicallaPalm({
  pid,
  inventoryID,
}: { pid: string; inventoryID: string }) {
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
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
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  if (inventoryID.startsWith(PiecePrefixes.laurPalm)) {
    return (
      <>
        <group
          onPointerUp={(e) => onPointerUp(e)}
          onPointerEnter={(e) => onPointerEnterPID(e, pid)}
          onPointerOut={(e) => onPointerOut(e)}
        >
          <LaurPalmPreview isHighlighted={isHighlighted} />
        </group>
      </>
    )
  }
  return (
    <group
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      <TicallaPalmPreview isHighlighted={isHighlighted} />
    </group>
  )
}
export function TicallaPalmPreview({
  opacity = 1,
  isHighlighted,
}: {
  opacity?: number
  isHighlighted?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/laur-jungle.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const colorPalmTrunk = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaPalmTrunk
  const colorPalmCanopy = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaPalmCanopy
  const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.ticallaTriLeaf
  const colorNeedleFern = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaNeedleFern
  const colorPineappleFern = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaPineappleFern
  const colorBase = isHighlighted ? 'yellow' : hexTerrainColor[HexTerrain.swamp]
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Trunk.geometry}
        material={basicModelMaterial(
          colorPalmTrunk,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Canopy.geometry}
        material={basicModelMaterial(
          colorPalmCanopy,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleNeedleFern.geometry}
        material={basicModelMaterial(
          colorNeedleFern,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TicallaPineappleFern.geometry}
        material={basicModelMaterial(
          colorPineappleFern,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TicallaTriLeaf.geometry}
        material={basicModelMaterial(
          colorTriLeaf,
          isLightsAndShadowsRender,
          opacity,
        )}
      />

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleBase.geometry}
        material={basicModelMaterial(
          colorBase,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
    </>
  )
}
export function LaurPalmPreview({
  opacity = 1,
  isHighlighted,
}: {
  opacity?: number
  isHighlighted?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/laur-jungle.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const colorPalmTrunk = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaPalmTrunk
  const colorPalmCanopy = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaPalmCanopy
  const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.laurTriLeaf
  const colorTriCactus = isHighlighted
    ? 'yellow'
    : hexTerrainColor.laurTriCactus
  const colorRoundCactus = isHighlighted
    ? 'yellow'
    : hexTerrainColor.laurRoundCactus
  const colorBase = isHighlighted ? 'yellow' : hexTerrainColor[HexTerrain.swamp]
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Trunk.geometry}
        material={basicModelMaterial(
          colorPalmTrunk,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Canopy.geometry}
        material={basicModelMaterial(
          colorPalmCanopy,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriCactus.geometry}
        material={basicModelMaterial(
          colorTriCactus,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurRoundCactus.geometry}
        material={basicModelMaterial(
          colorRoundCactus,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriLeaf.geometry}
        material={basicModelMaterial(
          colorTriLeaf,
          isLightsAndShadowsRender,
          opacity,
        )}
      />

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleBase.geometry}
        material={basicModelMaterial(
          colorBase,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
    </>
  )
}

// useGltf.preload('/laur-jungle.glb')
