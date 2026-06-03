import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicDoubleSideModelMaterial, basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { noop } from 'lodash'

export default function Shroudshroom10({ pid }: { pid?: string }) {
  const { nodes } = useGLTF(
    '/shroudshroom10.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
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
  const colorCap = isHighlighted
    ? yellowColor
    : hexTerrainColor.shroudshroomDarkPurple
  const colorStipe = isHighlighted
    ? yellowColor
    : hexTerrainColor.shroudshroomLightPurple
  const colorGills = isHighlighted
    ? yellowColor
    : hexTerrainColor.shroudshroomMediumPurple
  const colorBase = isHighlighted
    ? yellowColor
    : hexTerrainColor.shroudshroomGray
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Shroudshroom10Cap.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(colorCap, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorCap,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Shroudshroom10Stipe.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicDoubleSideModelMaterial(colorStipe, isLightsAndShadowsRender)
          : basicDoubleSideModelMaterial(
            colorStipe,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Shroudshroom10Gills.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicDoubleSideModelMaterial(colorGills, isLightsAndShadowsRender)
          : basicDoubleSideModelMaterial(
            colorGills,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Shroudshroom10Base.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(colorBase, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorBase,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
    </>
  )
}

// useGltf.preload('/forgotten-forest-tree-low-poly-colored.glb')
