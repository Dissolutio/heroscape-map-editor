import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  MeshBasicMaterial,
  type MeshStandardMaterial,
} from 'three'
import useBoundStore from '../../store/store'
import {
  fitMeshHeights,
  gather,
  type HeightFit,
  type IndexedMesh,
  measureSource,
} from './fortressHeightFit'
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

const geometryPositions = (geometry: BufferGeometry) =>
  geometry.getAttribute('position').array as ArrayLike<number>

const asIndexedMesh = (geometry: BufferGeometry): IndexedMesh => {
  const normal = geometry.getAttribute('normal')
  return {
    positions: geometryPositions(geometry),
    normals: normal ? (normal.array as ArrayLike<number>) : null,
    index: geometry.getIndex()?.array ?? null,
  }
}

/** A model's true bottom and shoulder (see measureSource). */
export function measureVsSource(
  nodes: VsNode[],
  shoulder: 'walkway' | 'top',
): Pick<HeightFit, 'srcBottom' | 'srcShoulder'> {
  const walkway = nodes[0]?.userData?.walkableTop
  return measureSource(
    nodes.map((node) => asIndexedMesh(node.geometry)),
    shoulder === 'walkway' && typeof walkway === 'number' ? walkway : null,
  )
}

// One fitted geometry per source geometry and target, so walls of the same
// height share; dropped when the GLB's own geometry is disposed.
const fittedGeometries = new WeakMap<
  BufferGeometry,
  Map<string, BufferGeometry>
>()

export function getFittedGeometry(
  source: BufferGeometry,
  fit: HeightFit,
  keepReceiver: boolean,
) {
  let byKey = fittedGeometries.get(source)
  if (!byKey) {
    const cache = new Map<string, BufferGeometry>()
    byKey = cache
    fittedGeometries.set(source, cache)
    source.addEventListener('dispose', () => {
      for (const geometry of cache.values()) geometry.dispose()
      cache.clear()
    })
  }
  const key = [
    fit.srcBottom,
    fit.srcShoulder,
    fit.dstBottom,
    fit.dstTop,
    keepReceiver,
  ].join('|')
  const cached = byKey.get(key)
  if (cached) return cached
  const fitted = fitMeshHeights(asIndexedMesh(source), fit, { keepReceiver })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(fitted.positions, 3))
  if (fitted.normals) {
    geometry.setAttribute('normal', new BufferAttribute(fitted.normals, 3))
  }
  for (const [name, attribute] of Object.entries(source.attributes)) {
    if (name !== 'position' && name !== 'normal') {
      geometry.setAttribute(
        name,
        new BufferAttribute(
          gather(
            attribute.array as ArrayLike<number>,
            fitted.keptVertices,
            attribute.itemSize,
          ),
          attribute.itemSize,
        ),
      )
    }
  }
  geometry.setIndex(new BufferAttribute(fitted.index, 1))
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  byKey.set(key, geometry)
  return geometry
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
  /** The geometry to draw; the node's own when not given. */
  geometry?: BufferGeometry
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
  geometry,
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
      geometry={geometry ?? node.geometry}
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

/** Where a fitted model must land, in the classic model's frame. */
export type VsTarget = {
  dstBottom: number
  dstTop: number
  /** What the next piece rests on: the walkway below a receiver, or the top. */
  shoulder: 'walkway' | 'top'
  /** False drops the receiver (a covered top). Default true. */
  keepReceiver?: boolean
  /** Measure the source from these nodes instead (the door uses the arch). */
  source?: Pick<HeightFit, 'srcBottom' | 'srcShoulder'>
}

type VsModelProps = Omit<PartProps, 'node' | 'partKey' | 'geometry'> & {
  url: string
  name: string
  /** Fits the model's heights to the classic ones; none draws it as is. */
  target?: VsTarget
}

/** Every part of one model node, with one colour and one set of handlers. */
export function VsModel({ url, name, target, ...partProps }: VsModelProps) {
  const nodes = useVsNodes(url)
  const parts = vsNodeParts(nodes, name)
  const source =
    target?.source ??
    (target
      ? measureVsSource(
          parts.map(({ node }) => node),
          target.shoulder,
        )
      : null)
  return (
    <group>
      {parts.map(({ key, node }) => (
        <VsPart
          key={key}
          partKey={key}
          node={node}
          geometry={
            target && source
              ? getFittedGeometry(
                  node.geometry,
                  {
                    ...source,
                    dstBottom: target.dstBottom,
                    dstTop: target.dstTop,
                  },
                  target.keepReceiver ?? true,
                )
              : undefined
          }
          {...partProps}
        />
      ))}
    </group>
  )
}
