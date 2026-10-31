import { useEffect, useMemo } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  LineBasicMaterial,
  LineDashedMaterial,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
} from 'three'
import type { PlacementStatus } from '../data/placement'
import type { CubeCoordinate } from '../types'
import { HEXGRID_HEX_RADIUS } from '../utils/constants'
import { getBoardHex3DCoords } from '../utils/map-utils'
import {
  PLACEMENT_UNSUPPORTED_COLOR,
  getPlacementPreviewStyle,
} from './placementPreviewStyle'

type Props = {
  status: PlacementStatus
  unsupported?: boolean
  footprintHexes: (CubeCoordinate & { altitude: number })[]
  hoveredHex: CubeCoordinate & { altitude: number }
  edgeRotation?: number
}

const FOOTPRINT_RADIUS = HEXGRID_HEX_RADIUS * 0.94
const ignoreRaycast = () => undefined

function makeHexShape() {
  const shape = new Shape()
  for (let i = 0; i < 6; i++) {
    const angle = ((i * 60 + 30) * Math.PI) / 180
    const x = Math.cos(angle) * FOOTPRINT_RADIUS
    const y = Math.sin(angle) * FOOTPRINT_RADIUS
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return new ShapeGeometry(shape)
}

function makeHexOutline() {
  const positions: number[] = []
  const distances: number[] = []
  let distance = 0
  let previous: [number, number, number] | undefined

  for (let i = 0; i <= 6; i++) {
    const angle = ((i * 60 + 30) * Math.PI) / 180
    const point: [number, number, number] = [
      Math.cos(angle) * FOOTPRINT_RADIUS,
      0,
      Math.sin(angle) * FOOTPRINT_RADIUS,
    ]
    if (previous) {
      positions.push(...previous, ...point)
      const segmentDistance = Math.hypot(
        point[0] - previous[0],
        point[2] - previous[2],
      )
      distances.push(distance, distance + segmentDistance)
      distance += segmentDistance
    }
    previous = point
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  )
  geometry.setAttribute(
    'lineDistance',
    new BufferAttribute(new Float32Array(distances), 1),
  )
  return geometry
}

function makeHexEdge(rotation: number) {
  const centerAngle = (rotation * Math.PI) / 3
  const edgeHalfAngle = Math.PI / 6
  const startAngle = centerAngle - edgeHalfAngle
  const endAngle = centerAngle + edgeHalfAngle
  const start: [number, number, number] = [
    Math.cos(startAngle) * FOOTPRINT_RADIUS,
    0,
    Math.sin(startAngle) * FOOTPRINT_RADIUS,
  ]
  const end: [number, number, number] = [
    Math.cos(endAngle) * FOOTPRINT_RADIUS,
    0,
    Math.sin(endAngle) * FOOTPRINT_RADIUS,
  ]
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array([...start, ...end]), 3),
  )
  geometry.setAttribute(
    'lineDistance',
    new BufferAttribute(
      new Float32Array([0, Math.hypot(end[0] - start[0], end[2] - start[2])]),
      1,
    ),
  )
  return geometry
}

function makeCross() {
  const radius = FOOTPRINT_RADIUS * 0.42
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(
      new Float32Array([
        -radius,
        0,
        -radius,
        radius,
        0,
        radius,
        -radius,
        0,
        radius,
        radius,
        0,
        -radius,
      ]),
      3,
    ),
  )
  return geometry
}

export function PlacementFootprint({
  status,
  unsupported = false,
  footprintHexes,
  hoveredHex,
  edgeRotation,
}: Props) {
  const style = getPlacementPreviewStyle(status, unsupported)
  const hexes = footprintHexes.length ? footprintHexes : [hoveredHex]
  const fillGeometry = useMemo(makeHexShape, [])
  const outlineGeometry = useMemo(makeHexOutline, [])
  const edgeGeometry = useMemo(
    () => (edgeRotation === undefined ? null : makeHexEdge(edgeRotation)),
    [edgeRotation],
  )
  const crossGeometry = useMemo(makeCross, [])
  const materials = useMemo(
    () => ({
      fill: new MeshBasicMaterial({
        color: style.color,
        transparent: true,
        opacity: 0.14,
        side: DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }),
      outlineHalo: new LineBasicMaterial({
        color: '#111827',
        transparent: true,
        opacity: 1,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
      outline:
        style.pattern === 'dashed'
          ? new LineDashedMaterial({
              color: style.color,
              dashSize: 0.2,
              gapSize: 0.11,
              transparent: true,
              opacity: 1,
              depthTest: false,
              depthWrite: false,
              toneMapped: false,
            })
          : new LineBasicMaterial({
              color: style.color,
              transparent: true,
              opacity: 1,
              depthTest: false,
              depthWrite: false,
              toneMapped: false,
            }),
      cross: new LineBasicMaterial({
        color: style.color,
        transparent: true,
        opacity: 1,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
      secondaryCross: new LineBasicMaterial({
        color: PLACEMENT_UNSUPPORTED_COLOR,
        transparent: true,
        opacity: 1,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    }),
    [style.color, style.pattern],
  )

  useEffect(
    () => () => {
      materials.fill.dispose()
      materials.outlineHalo.dispose()
      materials.outline.dispose()
      materials.cross.dispose()
      materials.secondaryCross.dispose()
    },
    [materials],
  )
  useEffect(
    () => () => {
      fillGeometry.dispose()
      outlineGeometry.dispose()
      edgeGeometry?.dispose()
      crossGeometry.dispose()
    },
    [fillGeometry, outlineGeometry, edgeGeometry, crossGeometry],
  )

  return (
    <>
      {hexes.map((hex, i) => {
        const { x, y, z } = getBoardHex3DCoords(hex)
        return (
          <group key={`${hex.q}~${hex.r}~${hex.s}~${hex.altitude}~${i}`}>
            <mesh
              geometry={fillGeometry}
              material={materials.fill}
              position={[x, y + 0.006, z]}
              raycast={ignoreRaycast}
              rotation={[-Math.PI / 2, 0, 0]}
              renderOrder={20}
            />
            <lineSegments
              geometry={outlineGeometry}
              material={materials.outlineHalo}
              position={[x, y + 0.012, z]}
              raycast={ignoreRaycast}
              renderOrder={21}
            />
            <lineSegments
              geometry={outlineGeometry}
              material={materials.outline}
              position={[x, y + 0.014, z]}
              raycast={ignoreRaycast}
              renderOrder={22}
            />
            {edgeGeometry && (
              <lineSegments
                geometry={edgeGeometry}
                material={materials.outline}
                position={[x, y + 0.017, z]}
                raycast={ignoreRaycast}
                renderOrder={23}
              />
            )}
            {style.pattern === 'cross' && (
              <lineSegments
                geometry={crossGeometry}
                material={materials.cross}
                position={[x, y + 0.016, z]}
                raycast={ignoreRaycast}
                renderOrder={24}
              />
            )}
            {style.secondaryPattern === 'cross' && (
              <lineSegments
                geometry={crossGeometry}
                material={materials.secondaryCross}
                position={[x, y + 0.018, z]}
                raycast={ignoreRaycast}
                renderOrder={25}
              />
            )}
          </group>
        )
      })}
    </>
  )
}
