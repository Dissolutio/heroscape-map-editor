import { useGLTF } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { BoardHex, HexTerrain } from '../../types'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import { hexTerrainColor } from '../maphex/hexColors'

export function Outcrop1({
  boardHex,
  isGlacier,
  isLavaRock,
}: {
  boardHex: BoardHex
  isGlacier?: boolean
  isLavaRock?: boolean
}) {
  const {
    nodes,
    //  materials
  } = useGLTF('/uncolored-decimated-glacier-outcrop-1.glb') as any

  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnter, onPointerOut } =
    usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = isHovered || isSelected
  const iceColor = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.ice]
  const lavaColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.lavaField]
  const outcropColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.outcrop]
  return (
    <>
      {isSelected && <DeletePieceBillboard pieceID={boardHex.pieceID} y={1} />}
      <mesh
        geometry={nodes.glacier_1_with_holes.geometry}
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={onPointerOut}
      >
        <meshMatcapMaterial
          color={isGlacier ? iceColor : isLavaRock ? lavaColor : outcropColor}
          transparent={isGlacier}
          opacity={0.99}
        />
      </mesh>
    </>
  )
}

useGLTF.preload('/uncolored-decimated-glacier-outcrop-1.glb')
