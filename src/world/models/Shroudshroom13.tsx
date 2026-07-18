import { useDisposableGLTF } from './useDisposableGLTF'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { noop } from 'lodash'
import { usePiecePointerHandler } from '../../hooks/usePiecePointerHandler'

export default function Shroudshroom13({ pid, onContextMenu }: { pid?: string; onContextMenu?: (e: ThreeEvent<PointerEvent>, pieceID: string) => void }) {
  const { nodes } = useDisposableGLTF(
    '/shroudshroom13_2.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const { handlePointerUp } = usePiecePointerHandler({
    pieceID: pid ?? '',
    onLeftClick: (_, isMultiSelect) => {
      if (pid) {
        toggleSelectedPieceID(pid, isMultiSelect)
      }
    },
    onRightClick: onContextMenu,
  })
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
        geometry={nodes.Shroudshroom13Cap.geometry}
        onPointerUp={handlePointerUp}
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
        geometry={nodes.Shroudshroom13Stipe.geometry}
        onPointerUp={handlePointerUp}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(colorStipe, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorStipe,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Shroudshroom13Gills.geometry}
        onPointerUp={handlePointerUp}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(colorGills, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorGills,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Shroudshroom13Base.geometry}
        onPointerUp={handlePointerUp}
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
