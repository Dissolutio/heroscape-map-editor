import type { ThreeEvent } from '@react-three/fiber'
import { getLaurAddonHitHex } from '../../data/laurAddonStacking'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import type { BoardHex, BoardPiece } from '../../types'
import { HexTerrain, SELECT_PEN_MODE } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { PLACEMENT_UNSUPPORTED_COLOR } from '../placementPreviewStyle'
import { basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'

type LaurWallRuinModelProps = {
  pillarColor: string
  interiorPillarColor: string
  isLightsAndShadowsRender: boolean
  opacity?: number
}

export function LaurWallRuinModel({
  pillarColor,
  interiorPillarColor,
  isLightsAndShadowsRender,
  opacity,
}: LaurWallRuinModelProps) {
  const {
    nodes: { LaurWallRuin, LaurWallRuinBustedConcrete },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useDisposableGLTF('/laurwall-ruin-from-hs-models-blendfile.glb') as any

  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={LaurWallRuin.geometry}
        material={basicModelMaterial(
          pillarColor,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={LaurWallRuinBustedConcrete.geometry}
        material={basicModelMaterial(
          interiorPillarColor,
          isLightsAndShadowsRender,
          opacity,
        )}
      />
    </>
  )
}

export function LaurWallRuinAddon({
  bp,
  onPointerUpPaintPiece,
}: {
  bp: BoardPiece
  onPointerUpPaintPiece: (
    event: ThreeEvent<PointerEvent>,
    hex: BoardHex,
  ) => void
}) {
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const penMode = useBoundStore((s) => s.penMode)
  const pid = bp.uid
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
    if (event.button !== 0) {
      event.stopPropagation()
      return
    }
    if (penMode !== SELECT_PEN_MODE) {
      onPointerUpPaintPiece(event, getLaurAddonHitHex(bp))
      return
    }
    event.stopPropagation()
    toggleSelectedPieceID(pid, event.shiftKey || event.ctrlKey || event.metaKey)
  }

  return (
    <group
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnter(e, getLaurAddonHitHex(bp))}
      onPointerOut={(e) => onPointerOut(e)}
    >
      <LaurWallRuinModel
        pillarColor={pillarColor}
        interiorPillarColor={interiorPillarColor}
        isLightsAndShadowsRender={isLightsAndShadowsRender}
      />
    </group>
  )
}

export function LaurWallRuinPreview({
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
    <LaurWallRuinModel
      pillarColor={pillarColor}
      interiorPillarColor={interiorPillarColor}
      isLightsAndShadowsRender={isLightsAndShadowsRender}
      opacity={PIECE_PREVIEW_OPACITY}
    />
  )
}
