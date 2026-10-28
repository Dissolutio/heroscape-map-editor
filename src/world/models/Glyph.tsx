import { Decal, useTexture } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { piecesSoFar } from '../../data/pieces'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'

export function GlyphModel({
  pid,
  terrain,
  isNamedGlyph,
}: {
  pid: string
  terrain: string
  isNamedGlyph: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/glyph-with-logo.glb') as any
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(
      pid,
      event.shiftKey || event.ctrlKey || event.metaKey,
      { x: event.point.x, z: event.point.z },
    )
  }
  const glyphColor = hexTerrainColor[terrain as keyof typeof hexTerrainColor]
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  const color = isHighlighted ? yellowColor : glyphColor
  return (
    <group
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Glyph.geometry}
        material={basicModelMaterial(color, isLightsAndShadowsRender)}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.GlyphValkyrieLogo.geometry}
        material={basicModelMaterial(
          isNamedGlyph ? color : 'white',
          isLightsAndShadowsRender,
        )}
      />
    </group>
  )
}
export function GlyphModelPreview({ inventoryID }: { inventoryID: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/glyph-with-logo.glb') as any
  // const texture = useTexture('glyph-valkyrie-logo.svg')
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  // Use the piece's terrain (if present) so named glyphs (inventory IDs like
  // `y<id>`) are colored correctly based on whether they're power or
  // treasure glyphs.
  const previewTerrain = piecesSoFar[inventoryID]?.terrain
  const color =
    previewTerrain === HexTerrain.glyphPower
      ? hexTerrainColor[HexTerrain.glyphPower]
      : hexTerrainColor[HexTerrain.glyphTreasure]
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Glyph.geometry}
        material={basicModelMaterial(color, isLightsAndShadowsRender)}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.GlyphValkyrieLogo.geometry}
        material={basicModelMaterial('white', isLightsAndShadowsRender)}
      />
    </>
  )
}

// useGltf.preload('/glyph-with-logo.glb')
