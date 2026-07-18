import { useDisposableGLTF } from './useDisposableGLTF'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { usePiecePointerHandler } from '../../hooks/usePiecePointerHandler'

type LaurWallArchModelProps = {
  pillarColor: string
  isLightsAndShadowsRender: boolean
  opacity?: number
}

export function LaurWallArchModel({
  pillarColor,
  isLightsAndShadowsRender,
  opacity,
}: LaurWallArchModelProps) {
  const {
    nodes: { LaurWallLongArch },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useDisposableGLTF('/laurwall-long-arch_v2.glb') as any

  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={LaurWallLongArch.geometry}
    >
      {basicModelMaterial(pillarColor, isLightsAndShadowsRender, opacity)}
    </mesh>
  )
}

export function LaurWallArchAddon({ pid, onContextMenu }: { pid: string; onContextMenu?: (e: ThreeEvent<PointerEvent>, pieceID: string) => void }) {
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { handlePointerUp } = usePiecePointerHandler({
    pieceID: pid,
    onLeftClick: (_, isMultiSelect) => {
      toggleSelectedPieceID(pid, isMultiSelect)
    },
    onRightClick: onContextMenu,
  })
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  const pillarColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.laurWall]

  return (
    <group
      onPointerUp={handlePointerUp}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      <LaurWallArchModel
        pillarColor={pillarColor}
        isLightsAndShadowsRender={isLightsAndShadowsRender}
      />
    </group>
  )
}

export function LaurWallArchPreview() {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const pillarColor = hexTerrainColor[HexTerrain.laurWall]

  return (
    <LaurWallArchModel
      pillarColor={pillarColor}
      isLightsAndShadowsRender={isLightsAndShadowsRender}
      opacity={PIECE_PREVIEW_OPACITY}
    />
  )
}
