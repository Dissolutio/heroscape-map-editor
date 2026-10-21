import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { PLACEMENT_UNSUPPORTED_COLOR } from '../placementPreviewStyle'
import { basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'

type LaurWallShortModelProps = {
  pillarColor: string
  interiorPillarColor: string
  isLightsAndShadowsRender: boolean
  opacity?: number
}

export function LaurWallShortModel({
  pillarColor,
  interiorPillarColor,
  isLightsAndShadowsRender,
  opacity,
}: LaurWallShortModelProps) {
  const {
    nodes: { LaurWallShort, LaurWallShortDecorDeep },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useDisposableGLTF('/laurwall-short-from-hs-models-blendfile.glb') as any

  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={LaurWallShort.geometry}
        material={basicModelMaterial(
          pillarColor,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={LaurWallShortDecorDeep.geometry}
        material={basicModelMaterial(
          interiorPillarColor,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
    </>
  )
}

export function LaurWallShortAddon({ pid }: { pid: string }) {
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  const pillarColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = isHighlighted
    ? yellowColor
    : hexTerrainColor.laurModelColor2
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(pid, event.shiftKey || event.ctrlKey || event.metaKey)
  }

  return (
    <group
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      <LaurWallShortModel
        pillarColor={pillarColor}
        interiorPillarColor={interiorPillarColor}
        isLightsAndShadowsRender={isLightsAndShadowsRender}
      />
    </group>
  )
}

export function LaurWallShortPreview({
  unsupported = false,
}: {
  unsupported?: boolean
}) {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const pillarColor = unsupported
    ? PLACEMENT_UNSUPPORTED_COLOR
    : hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = unsupported
    ? PLACEMENT_UNSUPPORTED_COLOR
    : hexTerrainColor.laurModelColor2

  return (
    <LaurWallShortModel
      pillarColor={pillarColor}
      interiorPillarColor={interiorPillarColor}
      isLightsAndShadowsRender={isLightsAndShadowsRender}
      opacity={PIECE_PREVIEW_OPACITY}
    />
  )
}
