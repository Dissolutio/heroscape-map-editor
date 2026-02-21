import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { noop } from 'lodash'

export default function Shroudshroom7({ boardHex }: { boardHex?: BoardHex }) {
  const { nodes } = useGLTF(
    '/shroudshroom7.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
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
  const colorCap = isHighlighted ? yellowColor : hexTerrainColor.shroudshroomDarkPurple
  const colorStipe = isHighlighted ? yellowColor : hexTerrainColor.shroudshroomLightPurple
  const colorGills = isHighlighted ? yellowColor : hexTerrainColor.shroudshroomGray
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Shroudshroom7Cap.geometry}
        onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
        onPointerEnter={(e) =>
          boardHex ? onPointerEnter(e, boardHex) : noop()
        }
        onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
      >
        {boardHex
          ? basicModelMaterial(colorCap, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorCap,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Shroudshroom7Stipe.geometry}
        onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
        onPointerEnter={(e) =>
          boardHex ? onPointerEnter(e, boardHex) : noop()
        }
        onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
      >
        {boardHex
          ? basicModelMaterial(colorStipe, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorStipe,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Shroudshroom7Gills.geometry}
        onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
        onPointerEnter={(e) =>
          boardHex ? onPointerEnter(e, boardHex) : noop()
        }
        onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
      >
        {boardHex
          ? basicModelMaterial(colorStipe, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorStipe,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Shroudshroom7Base.geometry}
        onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
        onPointerEnter={(e) =>
          boardHex ? onPointerEnter(e, boardHex) : noop()
        }
        onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
      >
        {boardHex
          ? basicModelMaterial(colorGills, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorGills,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
    </>
  )
}

// useGltf.preload('/forgotten-forest-tree-low-poly-colored.glb')
