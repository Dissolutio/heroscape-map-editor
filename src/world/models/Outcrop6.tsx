import { useDisposableGLTF } from './useDisposableGLTF'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { usePiecePointerHandler } from '../../hooks/usePiecePointerHandler'

export default function Outcrop6({
  isGlacier,
  pid,
  onContextMenu,
}: {
  isGlacier: boolean
  pid: string
  onContextMenu?: (e: ThreeEvent<PointerEvent>, pieceID: string) => void
}) {
  const { nodes } = useDisposableGLTF(
    '/uncolored-decimated-glacier-outcrop-6.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const { handlePointerUp } = usePiecePointerHandler({
    pieceID: pid,
    onLeftClick: (_, isMultiSelect) => {
      toggleSelectedPieceID(pid, isMultiSelect)
    },
    onRightClick: onContextMenu,
  })
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  const iceColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.glacier]
  const outcropColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.outcrop]
  const color = isGlacier ? iceColor : outcropColor

  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.glacier_6_with_holes.geometry}
        onPointerUp={handlePointerUp}
        onPointerEnter={(e) => onPointerEnterPID(e, pid)}
        onPointerOut={onPointerOut}
      >
        {basicModelMaterial(color, isLightsAndShadowsRender)}
      </mesh>
    </>
  )
}
export function Outcrop6Preview() {
  const { nodes } = useDisposableGLTF(
    '/uncolored-decimated-glacier-outcrop-6.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const color = hexTerrainColor[HexTerrain.glacier]

  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.glacier_6_with_holes.geometry}
      >
        {basicModelMaterial(
          color,
          isLightsAndShadowsRender,
          PIECE_PREVIEW_OPACITY,
        )}
      </mesh>
    </>
  )
}

// useGltf.preload('/uncolored-decimated-glacier-outcrop-6.glb')
