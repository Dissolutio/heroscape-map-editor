import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial, basicModelPreviewMaterial } from './materials'
import { noop } from 'lodash'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export default function BigTree415({ boardHex }: { boardHex?: BoardHex }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/forest-tree15-colored-lowpoly.glb') as any
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)

  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    if (boardHex) {
      toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
    }
  }
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex?.pieceID
  const isHighlighted = (hoveredPieceID === boardHex?.pieceID) || isSelected
  const treeColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.tree]
  const rockColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.ruin]

  return (
    <group
      onPointerUp={(e) => boardHex ? onPointerUp(e) : noop()}
      onPointerEnter={(e) => boardHex ? onPointerEnter(e, boardHex) : noop()}
      onPointerOut={(e) => boardHex ? onPointerOut(e) : noop()}
    >
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.Tree_large_rocks_scanned001_1.geometry}
      >
        {boardHex ? basicModelMaterial(rockColor, isHighQualityRender)
          : basicModelPreviewMaterial(rockColor, isHighQualityRender, PIECE_PREVIEW_OPACITY)}
      </mesh>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.Tree_large_rocks_scanned001_2.geometry}
      >
        {boardHex ? basicModelMaterial(treeColor, isHighQualityRender)
          : basicModelPreviewMaterial(treeColor, isHighQualityRender, PIECE_PREVIEW_OPACITY)}
      </mesh>
    </group>
  )
}

useGLTF.preload('/forest-tree15-colored-lowpoly.glb')
