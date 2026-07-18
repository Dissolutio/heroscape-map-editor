import { useDisposableGLTF } from './useDisposableGLTF'
import type { ThreeEvent } from '@react-three/fiber'
import React, { type PropsWithChildren } from 'react'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain, Pieces } from '../../types'
import { isFluidTerrainHex } from '../../utils/board-utils'
import { hexTerrainColor } from '../maphex/hexColors'
import { FLUID_CAP_OPACITY } from '../maphex/instance/FluidCap'
import { HEXGRID_HEX_APOTHEM } from '../../utils/constants'
import { usePiecePointerHandler } from '../../hooks/usePiecePointerHandler'

export default function LandSubterrain({
  inventoryID,
  terrain,
  uid,
  colorOverride,
  isFluidOverride,
  onContextMenu,
}: {
  inventoryID: string
  terrain: string
  uid: string
  colorOverride?: string
  isFluidOverride?: boolean
  onContextMenu?: (e: ThreeEvent<PointerEvent>, pieceID: string) => void
}) {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const isSelected = selectedPieceIDs.includes(uid)
  const isHovered = hoveredPieceID === uid
  const { handlePointerUp } = usePiecePointerHandler({
    pieceID: uid,
    onLeftClick: () => {
      // Land tiles don't have selection like regular pieces
    },
    onRightClick: onContextMenu,
  })
  const isDirtSubterrain =
    terrain === HexTerrain.grass ||
    terrain === HexTerrain.sand ||
    terrain === HexTerrain.rock
  const baseColor =
    colorOverride ??
    (isDirtSubterrain
      ? hexTerrainColor[HexTerrain.dirt]
      : hexTerrainColor[terrain as keyof typeof hexTerrainColor])
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
  const material = () => {
    if (isLightsAndShadowsRender) {
      if (isFluidOverride || isFluidTerrainHex(terrain)) {
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
    if (isFluidOverride || isFluidTerrainHex(terrain)) {
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
    const meshProps = {
      onPointerUp: handlePointerUp,
      onPointerEnter: (e: ThreeEvent<PointerEvent>) => onPointerEnterPID(e, uid),
      onPointerOut: (e: ThreeEvent<PointerEvent>) => onPointerOut(e),
    }
    if (inventoryID === Pieces.tree415) {
      return <Subterrain4 {...meshProps}>{material()}</Subterrain4>
    }
    if (inventoryID === Pieces.hive) {
      return <Subterrain6 {...meshProps}>{material()}</Subterrain6>
    }
    switch (pieceSize) {
      case '1':
        return <Subterrain1 {...meshProps}>{material()}</Subterrain1>
      case '2':
        return <Subterrain2 {...meshProps}>{material()}</Subterrain2>
      case '3':
        return <Subterrain3 {...meshProps}>{material()}</Subterrain3>
      case '4':
        return <Subterrain4 {...meshProps}>{material()}</Subterrain4>
      case '5':
        return <Subterrain5 {...meshProps}>{material()}</Subterrain5>
      case '6':
        return <Subterrain6 {...meshProps}>{material()}</Subterrain6>
      case '6B':
        return <Subterrain6B {...meshProps}>{material()}</Subterrain6B>
      case '7B':
        return <Subterrain7B {...meshProps}>{material()}</Subterrain7B>
      case '7':
        return <Subterrain7 {...meshProps}>{material()}</Subterrain7>
      case '9':
        return <Subterrain9 {...meshProps}>{material()}</Subterrain9>
      case '24':
        return <Subterrain24 {...meshProps}>{material()}</Subterrain24>
      default:
        return null
    }
  }
  return (
    <group>
      {getMesh()}
    </group>
  )
}
export function Subterrain24({
  children,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
}: PropsWithChildren<{
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}>) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/subterrain_24.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_24.geometry}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerOut={onPointerOut}
    >
      {children}
    </mesh>
  )
}
// useGltf.preload('/subterrain_24.glb')

export function Subterrain9({
  children,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
}: PropsWithChildren<{
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}>) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/subterrain_9.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes['Subterrain-9'].geometry}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerOut={onPointerOut}
    >
      {children}
    </mesh>
  )
}
// useGltf.preload('/subterrain_9.glb')

export function Subterrain7B({
  children,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
}: PropsWithChildren<{
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}>) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/subterrain_7B.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes['Subterrain-7B'].geometry}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerOut={onPointerOut}
    >
      {children}
    </mesh>
  )
}
// useGltf.preload('/subterrain_7B.glb')

export function Subterrain7({
  children,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
}: PropsWithChildren<{
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}>) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/subterrain_7.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_7.geometry}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerOut={onPointerOut}
    >
      {children}
    </mesh>
  )
}
// useGltf.preload('/subterrain_7.glb')

export function Subterrain6({
  children,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
}: PropsWithChildren<{
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}>) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/subterrain_6.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_6.geometry}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerOut={onPointerOut}
    >
      {children}
    </mesh>
  )
}
// useGltf.preload('/subterrain_6.glb')

export function Subterrain6B({
  children,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
}: PropsWithChildren<{
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}>) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/subterrain_6B.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  // Have to adjust model left because original tile template was wrong choice, TODO: Blender update model
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      position={[-2 * HEXGRID_HEX_APOTHEM, 0, 0]}
      geometry={nodes['Subterrain-6B'].geometry}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerOut={onPointerOut}
    >
      {children}
    </mesh>
  )
}
// useGltf.preload('/subterrain_6B.glb')

export function Subterrain5({
  children,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
}: PropsWithChildren<{
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}>) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/subterrain_5.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_5.geometry}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerOut={onPointerOut}
    >
      {children}
    </mesh>
  )
}
// useGltf.preload('/subterrain_5.glb')

export function Subterrain4({
  children,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
}: PropsWithChildren<{
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}>) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/subterrain_4.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_4.geometry}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerOut={onPointerOut}
    >
      {children}
    </mesh>
  )
}
// useGltf.preload('/subterrain_4.glb')

export function Subterrain3({
  children,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
}: PropsWithChildren<{
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}>) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/subterrain_3.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_3.geometry}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerOut={onPointerOut}
    >
      {children}
    </mesh>
  )
}
// useGltf.preload('/subterrain_3.glb')

export function Subterrain2({
  children,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
}: PropsWithChildren<{
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}>) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/subterrain_2.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_2.geometry}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerOut={onPointerOut}
    >
      {children}
    </mesh>
  )
}
// useGltf.preload('/subterrain_2.glb')

export function Subterrain1({
  children,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
}: PropsWithChildren<{
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}>) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/subterrain_1.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      castShadow={isLightsAndShadowsRender}
      receiveShadow={isLightsAndShadowsRender}
      geometry={nodes.Subterrain_1.geometry}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerOut={onPointerOut}
    >
      {children}
    </mesh>
  )
}
// useGltf.preload('/subterrain_1.glb')
