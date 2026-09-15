import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import type { Color, Material } from 'three'
import { Vector3 } from 'three'
import { piecesSoFar } from '../../data/pieces'
import {
  pieceSubterrainRegistryRef,
  useInstanceHighlightRegistry,
  useInstanceHighlightSync,
  useRegisterHighlightInstance,
} from '../../hooks/useInstanceHighlightSync'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardPiece, HexTerrain, Pieces } from '../../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../../utils/board-utils'
import {
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEX_APOTHEM,
  INSTANCE_LIMIT,
} from '../../utils/constants'
import { calculateFocusOpacity } from '../../utils/focus-opacity'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import { hexTerrainColor } from '../maphex/hexColors'
import type { InstanceRefType } from '../maphex/instance-hex'
import { FLUID_CAP_OPACITY } from '../maphex/instance/FluidCap'
import { useDisposableGLTF } from './useDisposableGLTF'

// These pieces render their own colorOverride'd LandSubterrain in MapBoardPiece3D.tsx,
// so they are excluded here to avoid double rendering. Keep in sync with that file.
const NON_INSTANCED_SUBTERRAIN_PIECES = new Set<string>([
  Pieces.glacier1,
  Pieces.outcrop1,
  Pieces.lavaRockOutcrop1,
  Pieces.glacier3,
  Pieces.lavaRockOutcrop3,
  Pieces.outcrop3,
  Pieces.glacier4,
  Pieces.glacier6,
  Pieces.hive,
])

type SubterrainSize =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '6B'
  | '7'
  | '7B'
  | '9'
  | '24'

const GEOMETRY_FILE_BY_SIZE: Record<SubterrainSize, string> = {
  '1': '/subterrain_1.glb',
  '2': '/subterrain_2.glb',
  '3': '/subterrain_3.glb',
  '4': '/subterrain_4.glb',
  '5': '/subterrain_5.glb',
  '6': '/subterrain_6.glb',
  '6B': '/subterrain_6B.glb',
  '7': '/subterrain_7.glb',
  '7B': '/subterrain_7B.glb',
  '9': '/subterrain_9.glb',
  '24': '/subterrain_24.glb',
}

const GEOMETRY_NODE_BY_SIZE: Record<SubterrainSize, string> = {
  '1': 'Subterrain_1',
  '2': 'Subterrain_2',
  '3': 'Subterrain_3',
  '4': 'Subterrain_4',
  '5': 'Subterrain_5',
  '6': 'Subterrain_6',
  '6B': 'Subterrain-6B',
  '7': 'Subterrain_7',
  '7B': 'Subterrain-7B',
  '9': 'Subterrain-9',
  '24': 'Subterrain_24',
}

function getSubterrainSize(inventoryID: string): SubterrainSize {
  const regex = /\d+/g
  let size = inventoryID.match(regex)?.[0] ?? '1'
  if (size === '7' && inventoryID === Pieces.wallWalk7) {
    size = '7B'
  }
  if (size === '6' && inventoryID === Pieces.concrete6) {
    size = '6B'
  }
  return (size as SubterrainSize) ?? '1'
}

export type LandSubterrainInstanceDatum = {
  uid: string
  terrain: string
  size: SubterrainSize
  isFluid: boolean
  x: number
  y: number
  z: number
  pieceRotation: number
}

// Mirrors the position/rotation math MapBoardPiece3D.tsx uses for the generic
// (non colorOverride'd) LandSubterrain rendering path.
export function getLandSubterrainInstanceData(
  boardPieces: BoardPiece[],
  viewingLevel: number,
): LandSubterrainInstanceDatum[] {
  const data: LandSubterrainInstanceDatum[] = []
  for (const bp of boardPieces) {
    if (bp.altitude + 1 > viewingLevel) continue
    if (NON_INSTANCED_SUBTERRAIN_PIECES.has(bp.inventoryID)) continue
    const piece = piecesSoFar[bp.inventoryID]
    if (!piece) continue
    const isFluid = isFluidTerrainHex(piece.terrain)
    const isSolid = isSolidTerrainHex(piece.terrain)
    if (!isFluid && !isSolid) continue
    const { x, z, yBaseCap } = getBoardHex3DCoords({
      ...bp.pieceCoords,
      altitude: bp.altitude + 1,
    })
    data.push({
      uid: bp.uid,
      terrain: piece.terrain,
      size: getSubterrainSize(bp.inventoryID),
      isFluid,
      x,
      y: yBaseCap,
      z,
      pieceRotation: (bp.rotation * -Math.PI) / 3,
    })
  }
  return data
}

export default function LandSubterrainInstanced({
  data,
  focusedPieceUID,
  focusStartTime,
}: {
  data: LandSubterrainInstanceDatum[]
  focusedPieceUID: string | null
  focusStartTime: number | null
}) {
  if (data.length === 0) return null

  const groups = new Map<string, LandSubterrainInstanceDatum[]>()
  for (const item of data) {
    const key = `${item.size}_${item.isFluid ? 'fluid' : 'solid'}`
    const group = groups.get(key)
    if (group) {
      group.push(item)
    } else {
      groups.set(key, [item])
    }
  }

  return (
    <>
      {Array.from(groups.entries()).map(([key, items]) => (
        <SubterrainSizeGroup
          key={key}
          size={items[0].size}
          isFluid={items[0].isFluid}
          items={items}
          focusedPieceUID={focusedPieceUID}
          focusStartTime={focusStartTime}
        />
      ))}
    </>
  )
}

function SubterrainSizeGroup({
  size,
  isFluid,
  items,
  focusedPieceUID,
  focusStartTime,
}: {
  size: SubterrainSize
  isFluid: boolean
  items: LandSubterrainInstanceDatum[]
  focusedPieceUID: string | null
  focusStartTime: number | null
}) {
  const ref = React.useRef<InstanceRefType>(null)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const highlightRegistry = useInstanceHighlightRegistry()
  useInstanceHighlightSync(highlightRegistry, true)
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF(GEOMETRY_FILE_BY_SIZE[size]) as any
  const geometry = nodes[GEOMETRY_NODE_BY_SIZE[size]]?.geometry

  // Apply material opacity based on focus state, same convention as SolidCaps/FluidCaps
  useFrame(() => {
    const material = ref.current?.material
    if (!material) return

    const focusOpacity = calculateFocusOpacity(focusedPieceUID, focusStartTime)
    const targetOpacity = isFluid
      ? focusOpacity < 1
        ? focusOpacity
        : FLUID_CAP_OPACITY
      : focusOpacity

    const materials = Array.isArray(material) ? material : [material]
    for (const mat of materials) {
      if (!mat || typeof mat !== 'object') continue
      const m = mat as Material
      if (Math.abs((m.opacity ?? 1) - targetOpacity) > 0.001) {
        m.opacity = targetOpacity
        m.transparent = isFluid || targetOpacity < 1
        m.depthWrite = !isFluid && targetOpacity >= 1
        m.needsUpdate = true
      }
    }
  })

  if (!geometry) return null

  // Single set of handlers shared by every instance in this size/terrain group, registered
  // once on the parent InstancedMesh instead of per-item (drei still resolves the exact
  // instance that was hit via its PositionMesh proxy). We read the hit instance's uid and
  // current display color straight off its userData -- kept in sync by SubterrainInstance's
  // own effects below -- rather than an instance index, so an item that's been re-terrained,
  // rotated, or moved always resolves to its correct, current data.
  const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
    const target = e.object as unknown as SubterrainInstanceObject
    const uid = target.userData.uid
    if (!uid) return
    e.stopPropagation() // prevent this hover from passing through and affecting behind
    onPointerEnterPID(e, uid)
    target.color.set('yellow')
  }
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    const target = e.object as unknown as SubterrainInstanceObject
    if (target.userData.displayColor) {
      target.color.set(target.userData.displayColor)
    }
    onPointerOut(e)
  }
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (e.button !== 0) return
    const target = e.object as unknown as SubterrainInstanceObject
    const uid = target.userData.uid
    if (!uid) return
    toggleSelectedPieceID(uid, e.shiftKey || e.ctrlKey || e.metaKey)
  }

  return (
    <Instances
      limit={INSTANCE_LIMIT}
      range={items.length}
      ref={ref}
      frustumCulled={false}
      geometry={geometry}
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerOut}
      onPointerUp={handlePointerUp}
    >
      {isLightsAndShadowsRender ? (
        <meshStandardMaterial
          transparent={isFluid}
          opacity={isFluid ? FLUID_CAP_OPACITY : 1}
        />
      ) : isFluid ? (
        <meshLambertMaterial transparent opacity={FLUID_CAP_OPACITY} />
      ) : (
        <meshMatcapMaterial />
      )}
      {items.map((item) => (
        <SubterrainInstance
          key={item.uid}
          item={item}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
          highlightRegistry={highlightRegistry}
        />
      ))}
    </Instances>
  )
}

// The PositionMesh proxy for whichever instance the pointer is currently interacting with
type SubterrainInstanceObject = {
  userData: { uid?: string; displayColor?: string }
  color: Color
}

function SubterrainInstance({
  item,
  isLightsAndShadowsRender,
  highlightRegistry,
}: {
  item: LandSubterrainInstanceDatum
  isLightsAndShadowsRender: boolean
  highlightRegistry: ReturnType<typeof useInstanceHighlightRegistry>
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <drei Instance ref type>
  const ref = React.useRef<any>(null)
  useRegisterHighlightInstance(highlightRegistry, item.uid, ref)
  // Also register in the shared cross-batch registry so SolidCaps/FluidCaps can reach in.
  useRegisterHighlightInstance(pieceSubterrainRegistryRef, item.uid, ref)

  // Subterrain-6B model is authored off-center from its hex origin (needs rotating with the piece)
  const xOffset = item.size === '6B' ? -2 * HEXGRID_HEX_APOTHEM : 0

  // Effect: position/rotation/scale, and keep userData.uid current for the parent's pointer handlers
  React.useEffect(() => {
    if (!ref.current) return
    const rotatedOffset = new Vector3(xOffset, 0, 0).applyAxisAngle(
      new Vector3(0, 1, 0),
      item.pieceRotation,
    )
    ref.current.position.set(
      item.x + rotatedOffset.x,
      item.y,
      item.z + rotatedOffset.z,
    )
    ref.current.rotation.set(0, item.pieceRotation, 0)
    ref.current.scale.set(1, item.isFluid ? HEXGRID_HEXCAP_FLUID_SCALE : 1, 1)
    ref.current.userData.uid = item.uid
  }, [
    item.x,
    item.y,
    item.z,
    item.pieceRotation,
    item.isFluid,
    xOffset,
    item.uid,
  ])

  // Effect: base/display color, keyed on terrain (not hover/selection -- those are pushed
  // imperatively to this instance by the parent's useInstanceHighlightSync when they change).
  // Reads current selection/hover once via getState so a remount or terrain change lands on
  // the correct color without subscribing this instance to the store.
  React.useEffect(() => {
    if (!ref.current) return
    const isDirtSubterrain =
      item.terrain === HexTerrain.grass ||
      item.terrain === HexTerrain.sand ||
      item.terrain === HexTerrain.rock
    const baseColor = isDirtSubterrain
      ? hexTerrainColor[HexTerrain.dirt]
      : hexTerrainColor[item.terrain as keyof typeof hexTerrainColor]
    const { hoveredPieceID, selectedPieceIDs } = useBoundStore.getState()
    const isSelected = selectedPieceIDs.includes(item.uid)
    const displayColor = isSelected ? 'yellow' : baseColor
    ref.current.userData.baseColor = baseColor
    ref.current.userData.displayColor = displayColor
    ref.current.color.set(hoveredPieceID === item.uid ? 'yellow' : displayColor)
  }, [item.uid, item.terrain])

  return (
    <Instance
      ref={ref}
      frustumCulled={false}
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
    />
  )
}
