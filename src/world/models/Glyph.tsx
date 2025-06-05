import { Decal, useGLTF, useTexture } from '@react-three/drei'
import useBoundStore from '../../store/store'
import type { BoardHex } from '../../types'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import type { ThreeEvent } from '@react-three/fiber'
import { hexTerrainColor } from '../maphex/hexColors'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'

export function GlyphModel({ boardHex }: { boardHex: BoardHex }) {
  const { nodes } = useGLTF('/glyph.glb') as any
  const texture = useTexture('glyph-valkyrie-logo.svg')
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnter, onPointerOut } =
    usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const glyphColor = hexTerrainColor[boardHex.terrain]
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
  const color = isHighlighted ? yellowColor : glyphColor
  return (
    <>
      {isSelected && <DeletePieceBillboard pieceID={boardHex.pieceID} y={1} />}
      <mesh
        geometry={nodes.Glyph.geometry}
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <meshMatcapMaterial color={color} />
        <Decal depthTest map={texture} />
      </mesh>
    </>
  )
}

useGLTF.preload('/glyph.glb')
