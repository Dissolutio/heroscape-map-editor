import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React, { type PropsWithChildren } from 'react'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { isFluidTerrainHex } from '../../utils/board-utils'
import { hexTerrainColor } from '../maphex/hexColors'
import { FLUID_CAP_OPACITY } from '../maphex/instance/FluidCap'
import { HEXGRID_HEX_APOTHEM } from '../../utils/constants'

export default function LandSubterrain({ boardHex }: { boardHex: BoardHex }) {
  const { inventoryID, pieceID } = boardHex
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isSelected = selectedPieceID === pieceID
  const isHovered = hoveredPieceID === pieceID
  const pieceTerrain = boardHex.terrain
  const isDirtSubterrain =
    pieceTerrain === HexTerrain.grass ||
    pieceTerrain === HexTerrain.sand ||
    pieceTerrain === HexTerrain.rock
  const baseColor = isDirtSubterrain
    ? hexTerrainColor[HexTerrain.dirt]
    : hexTerrainColor[pieceTerrain as keyof typeof hexTerrainColor]
  const [color, setColor] = React.useState('red')
  const regex = /\d+/g

  let pieceSize = inventoryID.match(regex)?.[0] ?? ''
  const isHighlighted = isHovered || isSelected
  if (pieceSize === '7' && inventoryID === Pieces.wallWalk7) {
    pieceSize = '7B'
  }
  // TODO: Data: just add a subterrain property to Pieces, this is a hack
  if (pieceSize === '6' && inventoryID === Pieces.concrete6) {
    pieceSize = '6B'
  }
  // update color when piece is hovered/selected
  React.useEffect(() => {
    if (isHighlighted) {
      setColor('yellow')
    } else {
      setColor(baseColor)
    }
  }, [baseColor, isHighlighted])
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : pieceID)
  }
  const material = () => {
    if (isLightsAndShadowsRender) {
      if (isFluidTerrainHex(pieceTerrain)) {
        return (
          <meshStandardMaterial
            color={color}
            transparent
            opacity={FLUID_CAP_OPACITY}
          />
        )
      }
      return <meshStandardMaterial color={color} />
    }
    // not high quality render below
    if (isFluidTerrainHex(pieceTerrain)) {
      return (
        <meshLambertMaterial
          color={color}
          transparent
          opacity={FLUID_CAP_OPACITY}
        />
      )
    }
    return <meshMatcapMaterial color={color} />
  }
  const getMesh = () => {
    switch (pieceSize) {
      case '1':
        return <Subterrain1>{material()}</Subterrain1>
      case '2':
        return <Subterrain2>{material()}</Subterrain2>
      case '3':
        return <Subterrain3>{material()}</Subterrain3>
      case '4':
        return <Subterrain4>{material()}</Subterrain4>
      case '5':
        return <Subterrain5>{material()}</Subterrain5>
      case '6':
        return <Subterrain6>{material()}</Subterrain6>
      case '6B':
        return <Subterrain6B>{material()}</Subterrain6B>
      case '7B':
        return <Subterrain7B>{material()}</Subterrain7B>
      case '7':
        return <Subterrain7>{material()}</Subterrain7>
      case '9':
        return <Subterrain9>{material()}</Subterrain9>
      case '24':
        return <Subterrain24>{material()}</Subterrain24>
      default:
        return null
    }
  }
  return (
    <group
      onPointerUp={onPointerUp}
      onPointerEnter={(e) => onPointerEnterPID(e, pieceID)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      {getMesh()}
    </group>
  )
}
export function Subterrain24({ children }: PropsWithChildren) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/subterrain_24.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_24.geometry}
    >
      {children}
    </mesh>
  )
}
useGLTF.preload('/subterrain_24.glb')

export function Subterrain9({ children }: PropsWithChildren) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/subterrain_9.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes['Subterrain-9'].geometry}
    >
      {children}
    </mesh>
  )
}
useGLTF.preload('/subterrain_9.glb')

export function Subterrain7B({ children }: PropsWithChildren) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/subterrain_7B.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes['Subterrain-7B'].geometry}
    >
      {children}
    </mesh>
  )
}
useGLTF.preload('/subterrain_7B.glb')

export function Subterrain7({ children }: PropsWithChildren) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/subterrain_7.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_7.geometry}
    >
      {children}
    </mesh>
  )
}
useGLTF.preload('/subterrain_7.glb')

export function Subterrain6({ children }: PropsWithChildren) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/subterrain_6.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_6.geometry}
    >
      {children}
    </mesh>
  )
}
useGLTF.preload('/subterrain_6.glb')

export function Subterrain6B({ children }: PropsWithChildren) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/subterrain_6B.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  // Have to adjust model left because original tile template was wrong choice, TODO: Blender update model
  return (
    <mesh
      position={[-2 * HEXGRID_HEX_APOTHEM, 0, 0]}
      geometry={nodes['Subterrain-6B'].geometry}
    >
      {children}
    </mesh>
  )
}
useGLTF.preload('/subterrain_6B.glb')

export function Subterrain5({ children }: PropsWithChildren) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/subterrain_5.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_5.geometry}
    >
      {children}
    </mesh>
  )
}
useGLTF.preload('/subterrain_5.glb')

export function Subterrain4({ children }: PropsWithChildren) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/subterrain_4.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_4.geometry}
    >
      {children}
    </mesh>
  )
}
useGLTF.preload('/subterrain_4.glb')

export function Subterrain3({ children }: PropsWithChildren) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/subterrain_3.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_3.geometry}
    >
      {children}
    </mesh>
  )
}
useGLTF.preload('/subterrain_3.glb')

export function Subterrain2({ children }: PropsWithChildren) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/subterrain_2.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_2.geometry}
    >
      {children}
    </mesh>
  )
}
useGLTF.preload('/subterrain_2.glb')

export function Subterrain1({ children }: PropsWithChildren) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/subterrain_1.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_1.geometry}
    >
      {children}
    </mesh>
  )
}
useGLTF.preload('/subterrain_1.glb')
