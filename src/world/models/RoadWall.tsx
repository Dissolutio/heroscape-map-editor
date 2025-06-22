import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'

export function RoadWall({
  pid,
  isVisible,
}: { pid: string; isVisible: boolean }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/handmade-roadwall.glb') as any
  const { isHovered, onPointerEnterPID, onPointerOut } =
    usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === pid
  const isHighlighted = isHovered || isSelected
  const color = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.roadWall]
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
    <>
      {isSelected && <DeletePieceBillboard pieceID={pid} y={1} />}
      <mesh
        receiveShadow
        castShadow
        geometry={nodes.RoadWall.geometry}
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnterPID(e, pid)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        {basicModelMaterial(color, isHighQualityRender)}
      </mesh>
    </>
  )
}

useGLTF.preload('/handmade-roadwall.glb')
