import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

type LaurWallLongModelProps = {
  pillarColor: string
  interiorPillarColor: string
  isLightsAndShadowsRender: boolean
  opacity?: number
}

export function LaurWallLongModel({
  pillarColor,
  interiorPillarColor,
  isLightsAndShadowsRender,
  opacity,
}: LaurWallLongModelProps) {
  const {
    nodes: { LaurWallLong, LaurWallLongDecorDeep },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-long-from-hs-models-blendfile.glb') as any

  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={LaurWallLong.geometry}
      >
        {basicModelMaterial(pillarColor, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={LaurWallLongDecorDeep.geometry}
      >
        {basicModelMaterial(
          interiorPillarColor,
          isLightsAndShadowsRender,
          opacity,
        )}
      </mesh>
    </>
  )
}

export function LaurWallLongAddon({ pid }: { pid: string }) {
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
      <LaurWallLongModel
        pillarColor={pillarColor}
        interiorPillarColor={interiorPillarColor}
        isLightsAndShadowsRender={isLightsAndShadowsRender}
      />
    </group>
  )
}

export function LaurWallLongPreview() {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const pillarColor = hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = hexTerrainColor.laurModelColor2

  return (
    <LaurWallLongModel
      pillarColor={pillarColor}
      interiorPillarColor={interiorPillarColor}
      isLightsAndShadowsRender={isLightsAndShadowsRender}
      opacity={PIECE_PREVIEW_OPACITY}
    />
  )
}
