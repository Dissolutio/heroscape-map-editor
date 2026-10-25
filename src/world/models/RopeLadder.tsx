import type { ThreeEvent } from '@react-three/fiber'
import { noop } from 'lodash'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'

export function RopeLadder({ pid }: { pid?: string }) {
  const { nodes } = useDisposableGLTF(
    '/rope-ladder_v2.glb',
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
        { x: event.point.x, z: event.point.z },
      )
    }
  }
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid ?? '')
  const isHighlighted = hoveredPieceID === pid || isSelected
  const woodColor = isHighlighted ? yellowColor : hexTerrainColor.shipWood
  const ropeColor = isHighlighted ? yellowColor : hexTerrainColor.shipRope
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.RopeLadderWood.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid) : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
        material={
          pid
            ? basicModelMaterial(woodColor, isLightsAndShadowsRender)
            : basicModelMaterial(
                woodColor,
                isLightsAndShadowsRender,
                PIECE_PREVIEW_OPACITY,
              )
        }
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.RopeLadderRope.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid) : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
        material={
          pid
            ? basicModelMaterial(ropeColor, isLightsAndShadowsRender)
            : basicModelMaterial(
                ropeColor,
                isLightsAndShadowsRender,
                PIECE_PREVIEW_OPACITY,
              )
        }
      />
    </>
  )
}
