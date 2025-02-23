import { useGLTF } from '@react-three/drei'
import { HexTerrain, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { decodePieceID } from '../../utils/map-utils'

{/* <mesh geometry={LaurWallRuin.geometry}>
<mesh geometry={LaurWallRuinBustedConcrete.geometry}>
<mesh geometry={LaurWallLong.geometry}>
<mesh geometry={LaurWallLongDecorDeep.geometry}> */}
export function LaurWallAddon({ pid, isVisible }: { pid: string, isVisible: boolean }) {
  const { nodes: { LaurWallRuin, LaurWallRuinBustedConcrete } } = useGLTF('/laurwall-ruin.glb') as any
  const { nodes: { LaurWallShort, LaurWallShortDecorDeep } } = useGLTF('/laurwall-short.glb') as any
  const { nodes: { LaurWallLong, LaurWallLongDecorDeep } } = useGLTF('/laurwall-long.glb') as any
  const {
    pieceID,
    // altitude,
    // rotation,
    // boardHexID,
    // pieceCoords
  } = decodePieceID(pid)
  const {
    isHovered,
    onPointerEnterPID,
    onPointerOut,
  } = usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore(s => s.toggleSelectedPieceID)
  const selectedPieceID = useBoundStore(s => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === pid
  const isHighlighted = isHovered || isSelected
  const pillarColor = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = isHighlighted ? yellowColor : hexTerrainColor.laurModelColor2
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
      onPointerUp={e => onPointerUp(e)}
      onPointerEnter={e => onPointerEnterPID(e, pid)}
      onPointerOut={e => onPointerOut(e)}
    >
      {/* LAUR WALL RUIN */}
      {(pieceID === Pieces.laurWallRuin) && (<>
        <mesh
          geometry={LaurWallRuin.geometry}
        >
          <meshMatcapMaterial
            color={pillarColor}
          />
        </mesh>
        <mesh
          geometry={LaurWallRuinBustedConcrete.geometry}
        >
          <meshMatcapMaterial
            color={interiorPillarColor}
          />
        </mesh>
      </>)}
      {/* LAUR WALL SHORT */}
      {(pieceID === Pieces.laurWallShort) && (<>
        <mesh
          geometry={LaurWallShort.geometry}
        >
          <meshMatcapMaterial
            color={pillarColor}
          />
        </mesh>
        <mesh
          geometry={LaurWallShortDecorDeep.geometry}
        >
          <meshMatcapMaterial
            color={interiorPillarColor}
          />
        </mesh>
      </>)}
      {/* LAUR WALL LONG */}
      {(pieceID === Pieces.laurWallLong) && (<>
        <mesh
          geometry={LaurWallLong.geometry}
          position={[0.635, 0, 0]} // TODO: Rexport or extract adjustment fn
        >
          <meshMatcapMaterial
            color={pillarColor}
          />
        </mesh>
        <mesh
          geometry={LaurWallLongDecorDeep.geometry}
          position={[0.635, 0, 0]} // TODO: Rexport or extract adjustment fn
        >
          <meshMatcapMaterial
            color={interiorPillarColor}
          />
        </mesh>
      </>)}

    </group>
  )
}
// useGLTF.preload('/laurwall-ruin.glb')
// useGLTF.preload('/laurwall-short.glb')
// useGLTF.preload('/laurwall-long.glb')
