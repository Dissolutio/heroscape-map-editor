import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import type { BoardHex } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { noop } from 'lodash'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export default function MarroHive6({ boardHex }: { boardHex?: BoardHex }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/uncolored-decimated-marro-hive-6.glb') as any
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnterHex, onPointerOut } = usePieceHoverState()
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
  const color = isHighlighted ? yellowColor : hexTerrainColor.hiveModel1
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Marro_Hive.geometry}
        onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
        onPointerEnter={(e) =>
          boardHex ? onPointerEnterHex(e, boardHex) : noop()
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
    </>
  )
}

useGLTF.preload('/uncolored-decimated-marro-hive-6.glb')
