import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { noop } from 'lodash'

export default function Cannon({ pid }: { pid?: string }) {
  const { nodes } = useGLTF(
    '/cannon.glb',
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
  const colorBarrel = isHighlighted ? yellowColor : hexTerrainColor.cannonBarrel
  const colorCarriage = isHighlighted
    ? yellowColor
    : hexTerrainColor.cannonCarriage
  const colorWheels = isHighlighted ? yellowColor : hexTerrainColor.cannonWheels
  const colorBase = isHighlighted ? yellowColor : hexTerrainColor.cannonBase
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Barrel_V2.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(colorBarrel, isLightsAndShadowsRender)
          : basicModelMaterial(
              colorBarrel,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Carriage_V2.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(colorCarriage, isLightsAndShadowsRender)
          : basicModelMaterial(
              colorCarriage,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Wheels_V2.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(colorWheels, isLightsAndShadowsRender)
          : basicModelMaterial(
              colorWheels,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.CircleBase_V2.geometry}
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
