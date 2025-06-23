import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain, Pieces } from '../../types'
import { decodePieceID } from '../../utils/map-utils'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'

export function LaurWallAddon({ pid }: { pid: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const {
    nodes: { LaurWallRuin, LaurWallRuinBustedConcrete },
  } = useGLTF('/laurwall-ruin.glb') as any
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const {
    nodes: { LaurWallShort, LaurWallShortDecorDeep },
  } = useGLTF('/laurwall-short.glb') as any
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const {
    nodes: { LaurWallLong, LaurWallLongDecorDeep },
  } = useGLTF('/laurwall-long.glb') as any
  const { inventoryID } = decodePieceID(pid)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === pid
  const isHighlighted = hoveredPieceID === pid || isSelected
  const pillarColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = isHighlighted
    ? yellowColor
    : hexTerrainColor.laurModelColor2
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : pid)
  }

  return (
    <group
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      {/* LAUR WALL RUIN */}
      {inventoryID === Pieces.laurWallRuin && (
        <>
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={LaurWallRuin.geometry}
          >
            {basicModelMaterial(pillarColor, isHighQualityRender)}
          </mesh>
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={LaurWallRuinBustedConcrete.geometry}
          >
            {basicModelMaterial(interiorPillarColor, isHighQualityRender)}
          </mesh>
        </>
      )}
      {/* LAUR WALL SHORT */}
      {inventoryID === Pieces.laurWallShort && (
        <>
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={LaurWallShort.geometry}
          >
            {basicModelMaterial(pillarColor, isHighQualityRender)}
          </mesh>
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={LaurWallShortDecorDeep.geometry}
          >
            {basicModelMaterial(interiorPillarColor, isHighQualityRender)}
          </mesh>
        </>
      )}
      {/* LAUR WALL LONG */}
      {inventoryID === Pieces.laurWallLong && (
        <>
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={LaurWallLong.geometry}
          >
            {basicModelMaterial(pillarColor, isHighQualityRender)}
          </mesh>
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={LaurWallLongDecorDeep.geometry}
          >
            {basicModelMaterial(interiorPillarColor, isHighQualityRender)}
          </mesh>
        </>
      )}
    </group>
  )
}
useGLTF.preload('/laurwall-ruin.glb')
useGLTF.preload('/laurwall-short.glb')
useGLTF.preload('/laurwall-long.glb')
