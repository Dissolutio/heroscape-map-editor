import { useMemo } from 'react'
import { BufferGeometry, Euler, Quaternion, Vector3 } from 'three'
import {
  type HexEdgeId,
  type HexNodeId,
  edgeToWorldPoint,
  nodeToWorldPoint,
  nodesForEdge,
  nodesForHex,
} from '../../data/hexGrid/edgesAndNodes'
import {
  type FilledCell,
  getPieceFootprintCells,
  hasCellFootprint,
} from '../../data/hexGrid/pieceCells'
import useBoundStore from '../../store/store'
import { HEXGRID_HEX_HEIGHT } from '../../utils/constants'
import { cubeToPixel } from '../../utils/hex-utils'

/*
 * Debug overlay for `?cells=1` (see src/e2e/isE2E.ts): the cells of every
 * wall (Fortified Wall, Ruins 2/3) and ship (Ship Wall, Ship Bow) at their
 * level ranges, as
 * pieceCells.ts sees them. A thin bar per edge and a thin post per node, each
 * with a bright marker at its top level. Drawn through the models and never
 * hit by the pointer. MapDisplay3D only loads this module with the flag on.
 */

const EDGE_COLOR = '#ff9800'
const HEX_COLOR = '#76ff03'
const NODE_COLOR = '#00e5ff'
const TOP_COLOR = '#ffffff'
const BAR_THICKNESS = 0.05
const NODE_RADIUS = 0.05
const TOP_MARKER_HEIGHT = 0.03
const RENDER_ORDER = 1000
const noRaycast = () => null

const yOfLevel = (level: number) => level * HEXGRID_HEX_HEIGHT

function OverlayMaterial({ color }: { color: string }) {
  return (
    <meshBasicMaterial
      color={color}
      transparent
      opacity={0.65}
      depthTest={false}
      depthWrite={false}
    />
  )
}

function EdgeBar({ cell }: { cell: FilledCell }) {
  const { position, rotation, length } = useMemo(() => {
    const [from, to] = nodesForEdge(cell.cell as HexEdgeId).map((node) =>
      nodeToWorldPoint(node),
    )
    const middle = edgeToWorldPoint(cell.cell as HexEdgeId)
    const direction = new Vector3(to.x - from.x, 0, to.z - from.z)
    const quaternion = new Quaternion().setFromUnitVectors(
      new Vector3(1, 0, 0),
      direction.clone().normalize(),
    )
    return {
      position: middle,
      rotation: new Euler().setFromQuaternion(quaternion),
      // leave the ends to the node posts
      length: direction.length() * 0.8,
    }
  }, [cell.cell])
  const height = yOfLevel(cell.top - cell.bottom)
  return (
    <group position={[position.x, 0, position.z]} rotation={rotation}>
      <mesh
        position={[0, yOfLevel(cell.bottom) + height / 2, 0]}
        raycast={noRaycast}
        renderOrder={RENDER_ORDER}
      >
        <boxGeometry args={[length, height, BAR_THICKNESS]} />
        <OverlayMaterial color={EDGE_COLOR} />
      </mesh>
      <mesh
        position={[0, yOfLevel(cell.top), 0]}
        raycast={noRaycast}
        renderOrder={RENDER_ORDER + 1}
      >
        <boxGeometry args={[length, TOP_MARKER_HEIGHT, BAR_THICKNESS * 2]} />
        <OverlayMaterial color={TOP_COLOR} />
      </mesh>
    </group>
  )
}

function NodePost({ cell }: { cell: FilledCell }) {
  const point = useMemo(
    () => nodeToWorldPoint(cell.cell as HexNodeId),
    [cell.cell],
  )
  const height = yOfLevel(cell.top - cell.bottom)
  return (
    <group position={[point.x, 0, point.z]}>
      <mesh
        position={[0, yOfLevel(cell.bottom) + height / 2, 0]}
        raycast={noRaycast}
        renderOrder={RENDER_ORDER}
      >
        <cylinderGeometry args={[NODE_RADIUS, NODE_RADIUS, height, 8]} />
        <OverlayMaterial color={NODE_COLOR} />
      </mesh>
      <mesh
        position={[0, yOfLevel(cell.top), 0]}
        raycast={noRaycast}
        renderOrder={RENDER_ORDER + 1}
      >
        <sphereGeometry args={[NODE_RADIUS * 2, 12, 8]} />
        <OverlayMaterial color={TOP_COLOR} />
      </mesh>
    </group>
  )
}

// A hex cell: a flat hexagon outline at its top level (and a fainter one at
// its bottom), slightly inset from the hex edges.
function HexOutline({ cell }: { cell: FilledCell }) {
  const geometry = useMemo(() => {
    const [hex] = cell.hexes
    const center = cubeToPixel(hex)
    const corners = nodesForHex(hex).map((node) => {
      const point = nodeToWorldPoint(node)
      return new Vector3(
        center.x + (point.x - center.x) * 0.85,
        0,
        center.y + (point.z - center.y) * 0.85,
      )
    })
    return new BufferGeometry().setFromPoints([...corners, corners[0]])
  }, [cell.hexes])
  return (
    <>
      {[cell.top, cell.bottom].map((level, index) => (
        <line
          key={level}
          // @ts-expect-error: R3F's <line> is THREE.Line, not the SVG element
          geometry={geometry}
          position={[0, yOfLevel(level) + 0.01, 0]}
          raycast={noRaycast}
          renderOrder={RENDER_ORDER + 1}
        >
          <lineBasicMaterial
            color={index === 0 ? HEX_COLOR : EDGE_COLOR}
            transparent
            opacity={index === 0 ? 0.95 : 0.5}
            depthTest={false}
            depthWrite={false}
          />
        </line>
      ))}
    </>
  )
}

export default function WallCellsOverlay() {
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const viewingLevel = useBoundStore((state) => state.viewingLevel)
  const walls = useMemo(
    () =>
      boardPieces.filter(
        (piece) =>
          hasCellFootprint(piece.inventoryID) &&
          piece.altitude + 1 <= viewingLevel,
      ),
    [boardPieces, viewingLevel],
  )
  return (
    <group name="wall-cells-overlay">
      {walls.flatMap((wall) =>
        getPieceFootprintCells(wall).map((cell) =>
          cell.cell.startsWith('hex:') ? (
            <HexOutline key={`${wall.uid}-${cell.cell}`} cell={cell} />
          ) : cell.cell.startsWith('edge:') ? (
            <EdgeBar key={`${wall.uid}-${cell.cell}`} cell={cell} />
          ) : (
            <NodePost key={`${wall.uid}-${cell.cell}`} cell={cell} />
          ),
        ),
      )}
    </group>
  )
}
