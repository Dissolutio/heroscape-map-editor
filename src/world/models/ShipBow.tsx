import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { noop } from 'lodash'

export function ShipBow({ pid }: { pid?: string }) {
  const { nodes } = useGLTF(
    '/ship-bow_v2.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    if (pid) {
      toggleSelectedPieceID(
        pid,
        event.shiftKey || event.ctrlKey || event.metaKey,
      )
    }
  }
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid ?? '')
  const isHighlighted = hoveredPieceID === pid || isSelected
  const color = isHighlighted ? yellowColor : hexTerrainColor.shipWood
  const colorShipBowIron = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowIron
  const colorShipBowFigureheadBody = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadBody
  const colorShipBowFigureheadWings = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadWings
  const colorShipBowFigureheadEyes = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadEyes
  const colorShipBowFigureheadTongue = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadTongue
  const colorShipBowFigureheadBeak = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadBeak
  const colorShipBowFigureheadTail = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadTail
  const colorShipBowFigureheadMane = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadMane
  const colorShipBowFigureheadHooves = isHighlighted
    ? yellowColor
    : hexTerrainColor.shipBowFigureheadHooves
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBow.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(color, isLightsAndShadowsRender)
          : basicModelMaterial(
              color,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowIron.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(colorShipBowIron, isLightsAndShadowsRender)
          : basicModelMaterial(
              colorShipBowIron,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadBody.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadBody,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadBody,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadWings.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadWings,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadWings,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadEyes.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadEyes,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadEyes,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadTongue.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadTongue,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadTongue,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadBeak.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadBeak,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadBeak,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadTail.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadTail,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadTail,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadMane.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadMane,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadMane,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.ShipBowFigureheadHooves.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(
              colorShipBowFigureheadHooves,
              isLightsAndShadowsRender,
            )
          : basicModelMaterial(
              colorShipBowFigureheadHooves,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
    </>
  )
}
