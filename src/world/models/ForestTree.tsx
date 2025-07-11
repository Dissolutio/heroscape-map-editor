import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { noop } from 'lodash'

export default function ForestTree({ boardHex }: { boardHex?: BoardHex }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF(
    '/forgotten-forest-tree-low-poly-colored.glb',
  ) as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
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
  const isHighlighted = hoveredPieceID === boardHex?.pieceID || isSelected
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.tree]
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Tree10_scanned.geometry}
        onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
        onPointerEnter={(e) =>
          boardHex ? onPointerEnter(e, boardHex) : noop()
        }
        onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
      >
        {boardHex
          ? basicModelMaterial(color, isLightsAndShadowsRender)
          : basicModelMaterial(
            color,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      {/* <Billboard
        position={[x, options.y + 1.5, z]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
        scale={[1, 3, 1]}
        onPointerEnter={e => e.stopPropagation()}
      >
        <Image url='tree-img.jpg'></Image>
      </Billboard> */}
    </>
  )
}

useGLTF.preload('/forgotten-forest-tree-low-poly-colored.glb')
