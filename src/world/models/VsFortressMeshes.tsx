import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import {
  type BufferGeometry,
  MeshBasicMaterial,
  type MeshStandardMaterial,
} from 'three'
import useBoundStore from '../../store/store'
import { basicModelMaterial } from './materials'
import { useTexturedModelMaterial } from './texturedModelMaterial'
import { useDisposableGLTF } from './useDisposableGLTF'

// Rendering for the Virtualscape fortress models (see fortressModels.ts). The
// classic components keep their own pointer targets; these only draw.

/** Draws nothing but still takes pointer events: the classic caps in VS mode. */
export const invisibleHitMaterial = new MeshBasicMaterial({
  colorWrite: false,
  depthWrite: false,
})

/** userData for a classic cap kept as an invisible target in VS mode. */
export const fortressCapUserData = (pieceUID: string) => ({
  fortressCapOf: pieceUID,
})

/**
 * The VS models' walkways are level with the classic caps, so a click on the
 * top can hit the model first. When the same pointer ray also goes through
 * this piece's own cap, step aside (no handler, no stopPropagation) and let
 * the cap take the event, as it does in classic mode.
 */
export function deferToOwnCap<E extends ThreeEvent<PointerEvent>>(
  pieceUID: string,
  handler: (e: E) => void,
) {
  return (e: E) => {
    const hitsOwnCap = e.intersections.some(
      (hit) => hit.object.userData?.fortressCapOf === pieceUID,
    )
    if (!hitsOwnCap) handler(e)
  }
}

type VsNode = {
  geometry: BufferGeometry
  material: MeshStandardMaterial
  userData: { walkableTop?: number }
}

export function useVsNodes(url: string) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from the converter>
  const { nodes } = useDisposableGLTF(url) as any
  return nodes as Record<string, VsNode>
}

/** The node's walkable top (converter extras), or `fallback`. */
export function vsWalkableTop(node: VsNode | undefined, fallback: number) {
  const top = node?.userData?.walkableTop
  return typeof top === 'number' && top > 0 ? top : fallback
}

/** Nodes named `name` or `name_<material>`, in file order. */
export function vsNodeParts(nodes: Record<string, VsNode>, name: string) {
  return Object.entries(nodes)
    .filter(([key]) => key === name || key.startsWith(`${name}_`))
    .map(([key, node]) => ({ key, node }))
}

// Materials that keep Virtualscape's own colour instead of the piece's colour:
// the iron straps and bolts on the arch.
const OWN_COLOR_MATERIALS = ['_fer', '_boulon']

type PartProps = {
  node: VsNode
  partKey: string
  color: string
  isHighlighted: boolean
  pid?: string
  opacity?: number
  /** Draw the GLB's own materials (the dev comparison page). */
  sourceMaterials?: boolean
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}

function VsPart({
  node,
  partKey,
  color,
  isHighlighted,
  pid,
  opacity,
  sourceMaterials = false,
  ...handlers
}: PartProps) {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const effectiveGraphicsTier = useBoundStore((s) => s.effectiveGraphicsTier)
  const textureLoadStatus = useBoundStore((s) => s.textureLoadStatus)
  const texturedMaterial = useTexturedModelMaterial({
    sourceMaterial: node.material,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted,
    pid,
    opacity,
    doubleSided: true,
  })
  const ownColor = useMemo(
    () => `#${node.material.color.getHexString()}`,
    [node.material],
  )
  const flatColor = isHighlighted
    ? 'yellow'
    : OWN_COLOR_MATERIALS.some((suffix) => partKey.endsWith(suffix))
      ? ownColor
      : color
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={node.geometry}
      material={
        (sourceMaterials ? node.material : texturedMaterial) ??
        basicModelMaterial(
          flatColor,
          isLightsAndShadowsRender,
          pid === undefined ? opacity : undefined,
        )
      }
      {...handlers}
    />
  )
}

export type VsFit = (walkableTop: number) => {
  scaleY: number
  offsetY?: number
}

type VsModelProps = Omit<PartProps, 'node' | 'partKey'> & {
  url: string
  name: string
  /** Fits the model in Y from its walkable top; none leaves it as drawn. */
  fitY?: VsFit
}

/** Every part of one model node, with one colour and one set of handlers. */
export function VsModel({ url, name, fitY, ...partProps }: VsModelProps) {
  const nodes = useVsNodes(url)
  const parts = vsNodeParts(nodes, name)
  const top = vsWalkableTop(parts[0]?.node, 1)
  const { scaleY, offsetY = 0 } = fitY ? fitY(top) : { scaleY: 1 }
  return (
    <group position={[0, offsetY, 0]} scale={[1, scaleY, 1]}>
      {parts.map(({ key, node }) => (
        <VsPart key={key} partKey={key} node={node} {...partProps} />
      ))}
    </group>
  )
}
