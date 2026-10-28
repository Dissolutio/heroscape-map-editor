import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import {
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  MeshMatcapMaterial,
  MeshStandardMaterial,
  Object3D,
  type BufferGeometry,
  BufferGeometry as ThreeBufferGeometry,
  type InstancedMesh,
} from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import type { BoardHex } from '../../types'
import { HEXGRID_HEX_RADIUS, HEXGRID_HEX_HEIGHT } from '../../utils/constants'
import {
  findPieceHexAt,
  isDragPassThrough,
  isDragging,
  pressPieceForDrag,
  reportDragTargetHex,
} from '../drag/dragController'
import {
  buildLandHexInstanceIndex,
  type LandHexInstanceDatum,
  getLandHexHighlightValue,
  getLandHexHoverTransition,
  type LandHexHoverTarget,
  type LandHexInstanceIndex,
} from './landHexInstances'

const vertices = Array.from({ length: 6 }, (_, index) => {
  const angle = -Math.PI / 2 + (index * Math.PI) / 3
  return {
    x: Math.cos(angle) * HEXGRID_HEX_RADIUS,
    z: Math.sin(angle) * HEXGRID_HEX_RADIUS,
  }
})

export function buildCapGeometry(instanceCount: number) {
  const positions: number[] = []
  const kinds: number[] = []
  const directions: number[] = []
  const indices: number[] = []

  for (let side = 0; side < 6; side += 1) {
    const next = vertices[(side + 1) % 6]
    const current = vertices[side]
    positions.push(
      0,
      HEXGRID_HEX_HEIGHT,
      0,
      next.x,
      HEXGRID_HEX_HEIGHT,
      next.z,
      current.x,
      HEXGRID_HEX_HEIGHT,
      current.z,
    )
    kinds.push(1, 1, 1)
    directions.push(-1, -1, -1)
    const start = side * 3 // first vertex of this triangle (3 vertices per triangle)
    indices.push(start, start + 1, start + 2)
  }

  return buildGeometry(positions, kinds, directions, indices, instanceCount)
}

export function buildSideGeometry(instanceCount: number) {
  const positions: number[] = []
  const kinds: number[] = []
  const directions: number[] = []
  const indices: number[] = []

  for (let side = 0; side < 6; side += 1) {
    const first = vertices[(side + 1) % 6]
    const second = vertices[(side + 2) % 6]
    positions.push(
      first.x,
      0,
      first.z,
      first.x,
      HEXGRID_HEX_HEIGHT,
      first.z,
      second.x,
      HEXGRID_HEX_HEIGHT,
      second.z,
      second.x,
      0,
      second.z,
    )
    kinds.push(0, 0, 0, 0)
    directions.push(side, side, side, side)
    const start = side * 4 // first vertex of this quad (4 vertices per quad; NOT indices.length, which grows by 6)
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3)
  }

  return buildGeometry(positions, kinds, directions, indices, instanceCount)
}

export function buildFluidGeometry(instanceCount: number) {
  const cap = buildCapGeometry(0)
  const sides = buildSideGeometry(0)
  const capPositions = cap.getAttribute('position').array
  const sidePositions = sides.getAttribute('position').array
  const capKinds = cap.getAttribute('landSurfaceKind').array
  const sideKinds = sides.getAttribute('landSurfaceKind').array
  const capDirections = cap.getAttribute('landDirection').array
  const sideDirections = sides.getAttribute('landDirection').array
  const capIndices = cap.getIndex()?.array ?? []
  const sideIndices = sides.getIndex()?.array ?? []
  const capVertexCount = cap.getAttribute('position').count
  const positions = [...capPositions, ...sidePositions]
  const kinds = [...capKinds, ...sideKinds]
  const directions = [...capDirections, ...sideDirections]
  const indices = [
    ...capIndices,
    ...Array.from(sideIndices, (index) => index + capVertexCount),
  ]
  cap.dispose()
  sides.dispose()

  return buildGeometry(positions, kinds, directions, indices, instanceCount)
}

function buildGeometry(
  positions: number[],
  kinds: number[],
  directions: number[],
  indices: number[],
  instanceCount: number,
) {
  const geometry = new ThreeBufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('landSurfaceKind', new Float32BufferAttribute(kinds, 1))
  geometry.setAttribute(
    'landDirection',
    new Float32BufferAttribute(directions, 1),
  )
  geometry.setIndex(indices)
  const attributes: [string, InstancedBufferAttribute][] = [
    [
      'landCapColor',
      new InstancedBufferAttribute(new Float32Array(instanceCount * 3), 3),
    ],
    [
      'landSideColor',
      new InstancedBufferAttribute(new Float32Array(instanceCount * 3), 3),
    ],
    [
      'landSideMask',
      new InstancedBufferAttribute(new Float32Array(instanceCount), 1),
    ],
    [
      'landCapVisible',
      new InstancedBufferAttribute(new Float32Array(instanceCount), 1),
    ],
    [
      'landHighlight',
      new InstancedBufferAttribute(new Float32Array(instanceCount), 1),
    ],
    [
      'capLayer',
      new InstancedBufferAttribute(new Float32Array(instanceCount).fill(-1), 1),
    ],
    [
      'sideLayer',
      new InstancedBufferAttribute(new Float32Array(instanceCount).fill(-1), 1),
    ],
    [
      'levels',
      new InstancedBufferAttribute(new Float32Array(instanceCount), 1),
    ],
  ]
  for (const [name, attribute] of attributes) {
    attribute.setUsage(DynamicDrawUsage)
    geometry.setAttribute(name, attribute)
  }
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

function makeLandMaterial(isLightsAndShadowsRender: boolean, isFluid: boolean) {
  const material = isLightsAndShadowsRender
    ? new MeshStandardMaterial()
    : new MeshMatcapMaterial()
  material.color.set('white')
  if (isFluid) {
    material.transparent = true
    material.opacity = 0.8
  }
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec3 landCapColor;
        attribute vec3 landSideColor;
        attribute float landSideMask;
        attribute float landCapVisible;
        attribute float landHighlight;
        attribute float landSurfaceKind;
        attribute float landDirection;
        varying vec3 vLandSurfaceColor;
        varying float vLandHighlight;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        if (landSurfaceKind < 0.5) {
          float sideVisible = mod(
            floor(landSideMask / exp2(landDirection)),
            2.0
          );
          if (sideVisible < 0.5) transformed = vec3(0.0);
        } else if (landCapVisible < 0.5) {
          transformed = vec3(0.0);
        }
        vLandSurfaceColor =
          landSurfaceKind > 0.5 ? landCapColor : landSideColor;
        vLandHighlight = landSurfaceKind > 0.5
          ? mod(landHighlight, 2.0)
          : step(2.0, landHighlight);`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vLandSurfaceColor;
        varying float vLandHighlight;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        diffuseColor.rgb = mix(
          vLandSurfaceColor,
          vec3(1.0, 1.0, 0.0),
          vLandHighlight
        );`,
      )
  }
  material.customProgramCacheKey = () => 'land-hex-instance-colors-v2'
  return material
}

function updateInstanceMesh(
  mesh: InstancedMesh | null,
  geometry: BufferGeometry,
  items: LandHexInstanceDatum[],
  selectedIDs: Set<string>,
  hovered: LandHexHoverTarget,
  surface: 'cap' | 'side' | 'both',
) {
  if (!mesh) return

  const capColorAttribute = geometry.getAttribute(
    'landCapColor',
  ) as InstancedBufferAttribute
  const sideColorAttribute = geometry.getAttribute(
    'landSideColor',
  ) as InstancedBufferAttribute
  const sideMaskAttribute = geometry.getAttribute(
    'landSideMask',
  ) as InstancedBufferAttribute
  const capVisibleAttribute = geometry.getAttribute(
    'landCapVisible',
  ) as InstancedBufferAttribute
  const highlightAttribute = geometry.getAttribute(
    'landHighlight',
  ) as InstancedBufferAttribute
  const levelsAttribute = geometry.getAttribute(
    'levels',
  ) as InstancedBufferAttribute
  const capLayerAttribute = geometry.getAttribute(
    'capLayer',
  ) as InstancedBufferAttribute
  const sideLayerAttribute = geometry.getAttribute(
    'sideLayer',
  ) as InstancedBufferAttribute
  const transform = new Object3D()
  const color = new Color()

  mesh.count = items.length
  items.forEach((item, index) => {
    color.set(item.capColor).toArray(capColorAttribute.array, index * 3)
    color.set(item.sideColor).toArray(sideColorAttribute.array, index * 3)
    sideMaskAttribute.setX(index, item.sideMask)
    capVisibleAttribute.setX(index, Number(item.capVisible))
    highlightAttribute.setX(
      index,
      getFiniteLandHexHighlightValue(item, hovered, selectedIDs, surface),
    )
    levelsAttribute.setX(index, item.levels)
    capLayerAttribute.setX(index, item.capLayer)
    sideLayerAttribute.setX(index, item.sideLayer)

    transform.position.set(item.x, item.y, item.z)
    transform.scale.set(1, item.isFluid ? 0.5 : 1, 1)
    transform.updateMatrix()
    mesh.setMatrixAt(index, transform.matrix)
  })

  for (const attribute of [
    capColorAttribute,
    sideColorAttribute,
    sideMaskAttribute,
    capVisibleAttribute,
    highlightAttribute,
    levelsAttribute,
    capLayerAttribute,
    sideLayerAttribute,
  ]) {
    attribute.clearUpdateRanges()
    attribute.needsUpdate = true
  }
  mesh.instanceMatrix.clearUpdateRanges()
  mesh.instanceMatrix.needsUpdate = true
}

function getFiniteLandHexHighlightValue(
  item: LandHexInstanceDatum,
  hovered: LandHexHoverTarget,
  selectedIDs: Set<string>,
  surface: 'cap' | 'side' | 'both',
) {
  const value = getLandHexHighlightValue(item, hovered, selectedIDs, surface)
  return Number.isFinite(value) ? value : 0
}

function writeLandHighlightValues(
  geometry: BufferGeometry,
  items: LandHexInstanceDatum[],
  indices: Iterable<number>,
  selectedIDs: Set<string>,
  hovered: LandHexHoverTarget,
  surface: 'cap' | 'side' | 'both',
) {
  const attribute = geometry.getAttribute(
    'landHighlight',
  ) as InstancedBufferAttribute
  const updatedIndices = [...indices]
  if (updatedIndices.length === 0) return
  for (const index of updatedIndices) {
    const item = items[index]
    if (!item) continue
    attribute.setX(
      index,
      getFiniteLandHexHighlightValue(item, hovered, selectedIDs, surface),
    )
    attribute.addUpdateRange(index, 1)
  }
  attribute.needsUpdate = true
}

function getHoverAffectedIndices(
  transition: ReturnType<typeof getLandHexHoverTransition>,
  surface: 'cap' | 'side' | 'both',
) {
  const updates =
    surface === 'cap'
      ? transition.capUpdates
      : surface === 'side'
        ? transition.sideUpdates
        : [...transition.sideUpdates, ...transition.capUpdates]
  return new Set(updates.map(({ index }) => index))
}

function handleSideSelection(
  event: ThreeEvent<PointerEvent>,
  uid: string,
  toggleSelectedPieceID: (
    uid: string,
    multiSelect?: boolean,
    point?: { x: number; z: number },
  ) => void,
) {
  event.stopPropagation()
  if (event.button !== 0) return
  toggleSelectedPieceID(uid, event.shiftKey || event.ctrlKey || event.metaKey, {
    x: event.point.x,
    z: event.point.z,
  })
}

export default function LandHexInstanced({
  data,
  onPointerUpPaintPiece,
}: {
  data: LandHexInstanceDatum[]
  onPointerUpPaintPiece: (
    event: ThreeEvent<PointerEvent>,
    hex: BoardHex,
  ) => void
}) {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const { onPointerEnter, onPointerEnterPID, onPointerOut, onPointerMove } =
    usePieceHoverState({ trackIsHovered: false })
  const solidData = React.useMemo(
    () => data.filter((item) => !item.isFluid),
    [data],
  )
  const fluidData = React.useMemo(
    () => data.filter((item) => item.isFluid),
    [data],
  )
  const solidIndex = React.useMemo(
    () => buildLandHexInstanceIndex(solidData),
    [solidData],
  )
  const fluidIndex = React.useMemo(
    () => buildLandHexInstanceIndex(fluidData),
    [fluidData],
  )
  const capGeometry = React.useMemo(
    () => buildCapGeometry(solidData.length),
    [solidData.length],
  )
  const sideGeometry = React.useMemo(
    () => buildSideGeometry(solidData.length),
    [solidData.length],
  )
  const fluidGeometry = React.useMemo(
    () => buildFluidGeometry(fluidData.length),
    [fluidData.length],
  )
  const capMaterial = React.useMemo(
    () => makeLandMaterial(isLightsAndShadowsRender, false),
    [isLightsAndShadowsRender],
  )
  const sideMaterial = React.useMemo(
    () => makeLandMaterial(isLightsAndShadowsRender, false),
    [isLightsAndShadowsRender],
  )
  const fluidMaterial = React.useMemo(
    () => makeLandMaterial(isLightsAndShadowsRender, true),
    [isLightsAndShadowsRender],
  )
  React.useEffect(() => () => capGeometry.dispose(), [capGeometry])
  React.useEffect(() => () => sideGeometry.dispose(), [sideGeometry])
  React.useEffect(() => () => fluidGeometry.dispose(), [fluidGeometry])
  React.useEffect(() => () => capMaterial.dispose(), [capMaterial])
  React.useEffect(() => () => sideMaterial.dispose(), [sideMaterial])
  React.useEffect(() => () => fluidMaterial.dispose(), [fluidMaterial])
  const capRef = React.useRef<InstancedMesh>(null)
  const sideRef = React.useRef<InstancedMesh>(null)
  const fluidRef = React.useRef<InstancedMesh>(null)
  const selectedIDs = React.useMemo(
    () => new Set(selectedPieceIDs),
    [selectedPieceIDs],
  )
  const hoverTargetRef = React.useRef<LandHexHoverTarget>(null)
  const hoverLeaveFrameRef = React.useRef<number | null>(null)
  const previousSelectedIDsRef = React.useRef(selectedIDs)
  const shadowProps = {
    receiveShadow: isLightsAndShadowsRender,
    castShadow: isLightsAndShadowsRender,
    frustumCulled: false,
  }

  React.useEffect(() => {
    const currentSelectedIDs = new Set(
      useBoundStore.getState().selectedPieceIDs,
    )
    updateInstanceMesh(
      capRef.current,
      capGeometry,
      solidData,
      currentSelectedIDs,
      hoverTargetRef.current,
      'cap',
    )
    updateInstanceMesh(
      sideRef.current,
      sideGeometry,
      solidData,
      currentSelectedIDs,
      hoverTargetRef.current,
      'side',
    )
    updateInstanceMesh(
      fluidRef.current,
      fluidGeometry,
      fluidData,
      currentSelectedIDs,
      hoverTargetRef.current,
      'both',
    )
  }, [capGeometry, fluidData, fluidGeometry, sideGeometry, solidData])

  React.useEffect(() => {
    const previousSelectedIDs = previousSelectedIDsRef.current
    const changedUIDs = new Set([...previousSelectedIDs, ...selectedIDs])
    for (const uid of [...changedUIDs]) {
      if (previousSelectedIDs.has(uid) === selectedIDs.has(uid)) {
        changedUIDs.delete(uid)
      }
    }

    if (changedUIDs.size > 0) {
      const updateSelection = (
        mesh: InstancedMesh | null,
        geometry: BufferGeometry,
        items: LandHexInstanceDatum[],
        index: LandHexInstanceIndex,
        surface: 'side' | 'both',
      ) => {
        if (!mesh) return
        const indices = new Set<number>()
        for (const uid of changedUIDs) {
          for (const instanceIndex of index.indicesByUID.get(uid) ?? []) {
            indices.add(instanceIndex)
          }
        }
        writeLandHighlightValues(
          geometry,
          items,
          indices,
          selectedIDs,
          hoverTargetRef.current,
          surface,
        )
      }
      updateSelection(
        sideRef.current,
        sideGeometry,
        solidData,
        solidIndex,
        'side',
      )
      updateSelection(
        fluidRef.current,
        fluidGeometry,
        fluidData,
        fluidIndex,
        'both',
      )
    }
    previousSelectedIDsRef.current = selectedIDs
  }, [
    fluidData,
    fluidGeometry,
    fluidIndex,
    selectedIDs,
    sideGeometry,
    solidData,
    solidIndex,
  ])

  React.useEffect(
    () => () => {
      if (hoverLeaveFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverLeaveFrameRef.current)
      }
    },
    [],
  )

  const updateHoverTarget = (next: LandHexHoverTarget) => {
    const previous = hoverTargetRef.current
    if (
      previous?.uid === next?.uid &&
      previous?.hexID === next?.hexID &&
      previous?.isCap === next?.isCap
    ) {
      return
    }
    const selected = new Set(useBoundStore.getState().selectedPieceIDs)
    const updateHover = (
      mesh: InstancedMesh | null,
      geometry: BufferGeometry,
      items: LandHexInstanceDatum[],
      index: LandHexInstanceIndex,
      surface: 'cap' | 'side' | 'both',
    ) => {
      if (!mesh) return
      const transition = getLandHexHoverTransition(previous, next, index)
      const indices = getHoverAffectedIndices(transition, surface)
      if (indices.size > 0) {
        writeLandHighlightValues(
          geometry,
          items,
          indices,
          selected,
          next,
          surface,
        )
      }
    }
    updateHover(capRef.current, capGeometry, solidData, solidIndex, 'cap')
    updateHover(sideRef.current, sideGeometry, solidData, solidIndex, 'side')
    updateHover(fluidRef.current, fluidGeometry, fluidData, fluidIndex, 'both')
    hoverTargetRef.current = next
  }

  const handlePointerEnter = (
    event: ThreeEvent<PointerEvent>,
    item: LandHexInstanceDatum,
    isCap: boolean,
  ) => {
    if (isDragPassThrough(item.uid)) return
    event.stopPropagation()
    if (hoverLeaveFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverLeaveFrameRef.current)
      hoverLeaveFrameRef.current = null
    }
    updateHoverTarget({
      uid: item.uid,
      hexID: item.hex.id,
      isCap,
    })
    if (isCap) {
      onPointerEnter(event, item.hex)
    } else {
      onPointerEnterPID(event, item.uid)
    }
  }
  const handlePointerLeave = (
    event: ThreeEvent<PointerEvent>,
    item: LandHexInstanceDatum,
  ) => {
    const target = hoverTargetRef.current
    if (target?.uid === item.uid && target.hexID === item.hex.id) {
      if (hoverLeaveFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverLeaveFrameRef.current)
      }
      hoverLeaveFrameRef.current = window.requestAnimationFrame(() => {
        hoverLeaveFrameRef.current = null
        if (hoverTargetRef.current === target) updateHoverTarget(null)
      })
    }
    onPointerOut(event)
  }
  const handlePointerMove = (
    event: ThreeEvent<PointerEvent>,
    item: LandHexInstanceDatum,
  ) => {
    onPointerMove(event)
    if (
      isDragging() &&
      reportDragTargetHex(findPieceHexAt(item.uid, event.point), item.uid, {
        x: event.point.x,
        z: event.point.z,
      })
    ) {
      event.stopPropagation()
    }
  }
  const getItem = (
    event: ThreeEvent<PointerEvent>,
    items: LandHexInstanceDatum[],
  ) => (event.instanceId === undefined ? undefined : items[event.instanceId])
  const capEvents = {
    onPointerEnter: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handlePointerEnter(event, item, true)
    },
    onPointerLeave: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handlePointerLeave(event, item)
    },
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) onPointerUpPaintPiece(event, item.hex)
    },
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) pressPieceForDrag(event, item.uid)
    },
    onPointerMove: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handlePointerMove(event, item)
    },
  }
  const sideEvents = {
    ...capEvents,
    onPointerEnter: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handlePointerEnter(event, item, false)
    },
    onPointerLeave: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handlePointerLeave(event, item)
    },
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, solidData)
      if (item) handleSideSelection(event, item.uid, toggleSelectedPieceID)
    },
  }
  const fluidEvents = {
    onPointerEnter: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, fluidData)
      if (item) {
        handlePointerEnter(event, item, (event.faceIndex ?? 0) < 6)
      }
    },
    onPointerLeave: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, fluidData)
      if (item) handlePointerLeave(event, item)
    },
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, fluidData)
      if (!item) return
      if ((event.faceIndex ?? 0) < 6) {
        onPointerUpPaintPiece(event, item.hex)
      } else {
        handleSideSelection(event, item.uid, toggleSelectedPieceID)
      }
    },
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, fluidData)
      if (item) pressPieceForDrag(event, item.uid)
    },
    onPointerMove: (event: ThreeEvent<PointerEvent>) => {
      const item = getItem(event, fluidData)
      if (item) {
        if (!isDragPassThrough(item.uid)) {
          const nextTarget = {
            uid: item.uid,
            hexID: item.hex.id,
            isCap: (event.faceIndex ?? 0) < 6,
          }
          const previous = hoverTargetRef.current
          if (
            previous?.uid !== nextTarget.uid ||
            previous?.hexID !== nextTarget.hexID ||
            previous?.isCap !== nextTarget.isCap
          ) {
            onPointerOut(event)
            if (nextTarget.isCap) {
              onPointerEnter(event, item.hex)
            } else {
              onPointerEnterPID(event, item.uid)
            }
            updateHoverTarget(nextTarget)
          }
        }
        handlePointerMove(event, item)
      }
    },
  }

  return (
    <>
      {solidData.length > 0 && (
        <>
          <instancedMesh
            ref={capRef}
            args={[undefined, undefined, solidData.length]}
            geometry={capGeometry}
            material={capMaterial}
            {...shadowProps}
            {...capEvents}
          />
          <instancedMesh
            ref={sideRef}
            args={[undefined, undefined, solidData.length]}
            geometry={sideGeometry}
            material={sideMaterial}
            {...shadowProps}
            {...sideEvents}
          />
        </>
      )}
      {fluidData.length > 0 && (
        <instancedMesh
          ref={fluidRef}
          args={[undefined, undefined, fluidData.length]}
          geometry={fluidGeometry}
          material={fluidMaterial}
          {...shadowProps}
          {...fluidEvents}
        />
      )}
    </>
  )
}
