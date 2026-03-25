import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { noop } from 'lodash'

export default function Cannon({ boardHex }: { boardHex?: BoardHex }) {
  const { nodes } = useGLTF(
    '/cannon_v2.glb',
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
  const colorBarrel = isHighlighted
    ? yellowColor
    : hexTerrainColor.cannonBarrel
  const colorCarriage = isHighlighted
    ? yellowColor
    : hexTerrainColor.cannonCarriage
  const colorWheels = isHighlighted
    ? yellowColor
    : hexTerrainColor.cannonWheels
  const colorBase = isHighlighted
    ? yellowColor
    : hexTerrainColor.cannonBase
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Barrel_V2.geometry}
        onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
        onPointerEnter={(e) =>
          boardHex ? onPointerEnter(e, boardHex) : noop()
        }
        onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
      >
        {boardHex
          ? basicModelMaterial(colorBarrel, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorBarrel,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Carriage_V2.geometry}
        onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
        onPointerEnter={(e) =>
          boardHex ? onPointerEnter(e, boardHex) : noop()
        }
        onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
      >
        {boardHex
          ? basicModelMaterial(colorCarriage, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorCarriage,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Wheels_V2.geometry}
        onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
        onPointerEnter={(e) =>
          boardHex ? onPointerEnter(e, boardHex) : noop()
        }
        onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
      >
        {boardHex
          ? basicModelMaterial(colorWheels, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorWheels,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.CircleBase_V2.geometry}
        onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
        onPointerEnter={(e) =>
          boardHex ? onPointerEnter(e, boardHex) : noop()
        }
        onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
      >
        {boardHex
          ? basicModelMaterial(colorBase, isLightsAndShadowsRender)
          : basicModelMaterial(
            colorBase,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
    </>
  )
}
