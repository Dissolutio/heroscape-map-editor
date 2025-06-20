import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'

export function Ladder({
  boardHex,
  onPointerUp,
}: {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/handmade-ladder.glb') as any
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const penMode = useBoundStore((s) => s.penMode)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnterPID, onPointerOut } =
    usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const handleOnPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    if (penMode === Pieces.ladder) {
      onPointerUp(event, boardHex)
    } else {
      toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
    }
  }
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = isHovered || isSelected
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.ladder]
  return (
    <mesh
      receiveShadow={isHighQualityRender}
      castShadow={isHighQualityRender}
      geometry={nodes.Ladder.geometry}
      onPointerUp={handleOnPointerUp}
      onPointerEnter={(e) => onPointerEnterPID(e, boardHex.pieceID)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      {isHighQualityRender ? <meshStandardMaterial color={color} />
        : <meshMatcapMaterial color={color} />}
    </mesh>
  )
}

useGLTF.preload('/handmade-battlement.glb')
