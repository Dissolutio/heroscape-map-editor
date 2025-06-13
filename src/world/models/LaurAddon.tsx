import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain, Pieces } from '../../types'
import { decodePieceID } from '../../utils/map-utils'
import { hexTerrainColor } from '../maphex/hexColors'

// {
//   /* <mesh geometry={LaurWallRuin.geometry}>
// <mesh geometry={LaurWallRuinBustedConcrete.geometry}>
// <mesh geometry={LaurWallLong.geometry}>
// <mesh geometry={LaurWallLongDecorDeep.geometry}> */
// }
export function LaurWallAddon({
  pid,
  isVisible,
}: { pid: string; isVisible: boolean }) {
  const {
    nodes: { LaurWallRuin, LaurWallRuinBustedConcrete },
  } = useGLTF('/laurwall-ruin.glb') as any
  const {
    nodes: { LaurWallShort, LaurWallShortDecorDeep },
  } = useGLTF('/laurwall-short.glb') as any
  const {
    nodes: { LaurWallLong, LaurWallLongDecorDeep },
  } = useGLTF('/laurwall-long.glb') as any
  const {
    inventoryID,
    // altitude,
    // rotation,
    // boardHexID,
    // pieceCoords
  } = decodePieceID(pid)
  const { isHovered, onPointerEnterPID, onPointerOut } =
    usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === pid
  const isHighlighted = isHovered || isSelected
  const pillarColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = isHighlighted
    ? yellowColor
    : hexTerrainColor.laurModelColor2
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
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
          receiveShadow castShadow
          <mesh geometry={LaurWallRuin.geometry}>
            <meshStandardMaterial color={pillarColor} />
          </mesh>
          receiveShadow castShadow
          <mesh geometry={LaurWallRuinBustedConcrete.geometry}>
            <meshStandardMaterial color={interiorPillarColor} />
          </mesh>
        </>
      )}
      {/* LAUR WALL SHORT */}
      {inventoryID === Pieces.laurWallShort && (
        <>
          receiveShadow castShadow
          <mesh geometry={LaurWallShort.geometry}>
            <meshStandardMaterial color={pillarColor} />
          </mesh>
          receiveShadow castShadow
          <mesh geometry={LaurWallShortDecorDeep.geometry}>
            <meshStandardMaterial color={interiorPillarColor} />
          </mesh>
        </>
      )}
      {/* LAUR WALL LONG */}
      {inventoryID === Pieces.laurWallLong && (
        <>
          <mesh
            receiveShadow
            castShadow
            geometry={LaurWallLong.geometry}
            // position={[0.635, 0, 0]} // TODO: Tidy
          >
            <meshStandardMaterial color={pillarColor} />
          </mesh>
          <mesh
            receiveShadow
            castShadow
            geometry={LaurWallLongDecorDeep.geometry}
            // position={[0.635, 0, 0]} // TODO: Tidy
          >
            <meshStandardMaterial color={interiorPillarColor} />
          </mesh>
        </>
      )}
    </group>
  )
}
useGLTF.preload('/laurwall-ruin.glb')
useGLTF.preload('/laurwall-short.glb')
useGLTF.preload('/laurwall-long.glb')
