import { useDisposableGLTF } from './useDisposableGLTF'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'

import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { noop } from 'lodash'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { usePiecePointerHandler } from '../../hooks/usePiecePointerHandler'

export default function MarroHive6({ pid }: { pid?: string }) {
  const { nodes } = useDisposableGLTF(
    '/uncolored-decimated-marro-hive-6.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
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
  const color = isHighlighted ? yellowColor : hexTerrainColor.hiveModel1
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Marro_Hive.geometry}
        onPointerUp={(e) => (pid ? handlePointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(color, isLightsAndShadowsRender)
          : basicModelMaterial(
            color,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
    </>
  )
}

// useGltf.preload('/uncolored-decimated-marro-hive-6.glb')
