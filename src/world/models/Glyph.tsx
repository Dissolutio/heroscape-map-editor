import { Decal, useGLTF, useTexture } from '@react-three/drei'
import useBoundStore from '../../store/store'
import type { BoardHex } from '../../types'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import type { ThreeEvent } from '@react-three/fiber'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { noop } from 'lodash'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export function GlyphModel({
  boardHex,
  terrain,
}: { boardHex?: BoardHex; terrain: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/glyph.glb') as any
  const texture = useTexture('glyph-valkyrie-logo.svg')
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    if (boardHex?.pieceID) {
      toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
    }
  }
  const glyphColor = hexTerrainColor[terrain]
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex?.pieceID
  const isHighlighted = hoveredPieceID === boardHex?.pieceID || isSelected
  const color = isHighlighted ? yellowColor : glyphColor
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.Glyph.geometry}
      onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
      onPointerEnter={(e) => (boardHex ? onPointerEnter(e, boardHex) : noop())}
      onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
    >
      {boardHex
        ? basicModelMaterial(color, isLightsAndShadowsRender)
        : basicModelMaterial(
            color,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      {boardHex && <Decal depthTest map={texture} />}
    </mesh>
  )
}

useGLTF.preload('/glyph.glb')
