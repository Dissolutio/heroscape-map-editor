import { Decal, useGLTF, useTexture } from '@react-three/drei'
import useBoundStore from '../../store/store'
import type { BoardHex } from '../../types'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import type { ThreeEvent } from '@react-three/fiber'
import { hexTerrainColor } from '../maphex/hexColors'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import { basicModelMaterial } from './materials'

export function GlyphModel({ boardHex }: { boardHex: BoardHex }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/glyph.glb') as any
  const texture = useTexture('glyph-valkyrie-logo.svg')
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }
  const glyphColor = hexTerrainColor[boardHex.terrain]
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = (hoveredPieceID === boardHex.pieceID) || isSelected
  const color = isHighlighted ? yellowColor : glyphColor
  return (
    <>
      {isSelected && <DeletePieceBillboard pieceID={boardHex.pieceID} y={1} />}
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.Glyph.geometry}
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        {basicModelMaterial(color, isHighQualityRender)}
        <Decal depthTest map={texture} />
      </mesh>
    </>
  )
}

useGLTF.preload('/glyph.glb')
