import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { noop } from 'lodash'

export function ForestTree({
  pid,
  opacity,
}: { pid?: string; opacity?: number }) {
  const { nodes } = useGLTF(
    '/forgotten-forest-tree-low-poly-colored.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterBoardPiece, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === pid
  const isHighlighted = hoveredPieceID === pid || isSelected
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.tree]
  const opacityLevel = opacity ?? (pid ? 1 : PIECE_PREVIEW_OPACITY)
  const pointerHandlers = pid
    ? {
      onPointerUp: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        if (e.button !== 0) return
        toggleSelectedPieceID(isSelected ? '' : pid)
      },
      onPointerEnter: (e: ThreeEvent<PointerEvent>) =>
        onPointerEnterBoardPiece(e, pid),
      onPointerOut: (e: ThreeEvent<PointerEvent>) => onPointerOut(e),
    }
    : {}
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Tree10_scanned.geometry}
        {...pointerHandlers}
      >
        {basicModelMaterial(color, isLightsAndShadowsRender, opacityLevel)}
      </mesh>
    </>
  )
}

useGLTF.preload('/forgotten-forest-tree-low-poly-colored.glb')
