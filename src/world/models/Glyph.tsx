import { Decal, useGLTF, useTexture } from '@react-three/drei'
import useBoundStore from '../../store/store'
import { HexTerrain, Pieces, type BoardHex } from '../../types'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import type { ThreeEvent } from '@react-three/fiber'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { noop } from 'lodash'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export function GlyphModel({
  boardHex,
  terrain,
}: { boardHex: BoardHex; terrain: string }) {
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
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }
  const glyphColor = hexTerrainColor[terrain]
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = hoveredPieceID === boardHex.pieceID || isSelected
  const color = isHighlighted ? yellowColor : glyphColor
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.Glyph.geometry}
      onPointerUp={(e) => (onPointerUp(e))}
      onPointerEnter={(e) => (onPointerEnter(e, boardHex))}
      onPointerOut={(e) => (onPointerOut(e))}
    >
      {basicModelMaterial(color, isLightsAndShadowsRender)}
      <Decal
        depthTest
        polygonOffsetFactor={-1} // The material should take precedence over the original
        map={texture}
      />
    </mesh>
  )
}
export function GlyphModelPreview({ inventoryID }: { inventoryID: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/glyph.glb') as any
  const texture = useTexture('glyph-valkyrie-logo.svg')
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const color = inventoryID === Pieces.glyphPower ? hexTerrainColor[HexTerrain.glyphPower] : hexTerrainColor[HexTerrain.glyphTreasure]
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.Glyph.geometry}
    >

      {basicModelMaterial(
        color,
        isLightsAndShadowsRender,
        // PIECE_PREVIEW_OPACITY,
      )}
      <Decal
        depthTest
        polygonOffsetFactor={-1} // The material should take precedence over the original
        map={texture}
      >
        <meshStandardMaterial
          map={texture}
          polygonOffset
          polygonOffsetFactor={-1} // The material should take precedence over the original
          transparent
          opacity={0.5}
        />
      </Decal>
    </mesh>
  )
}

useGLTF.preload('/glyph.glb')
