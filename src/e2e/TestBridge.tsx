import type { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import {
  Box3,
  Mesh,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
} from 'three'
import { getLaurAddonFeaturePoint } from '../data/laurAddonPlacement'
import { getPieceIDForPenMode } from '../data/flatPieceSizes'
import { resolveRotationPivot } from '../data/rotationPivot'
import useBoundStore from '../store/store'
import { type BoardHex, type BoardPiece, Pieces } from '../types'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import { HEXGRID_HEXCAP_HEIGHT, HEXGRID_HEX_HEIGHT } from '../utils/constants'
import { cubeToPixel, hexUtilsGetNeighborForRotation } from '../utils/hex-utils'
import { getBoardHex3DCoords } from '../utils/map-utils'
import { getDragState } from '../world/drag/dragController'
import { getLandRendererMode } from '../world/landRendererTier'
import { getLandSubterrainInstanceData } from '../world/models/LandSubterrainInstanced'
import { buildLandHexInstanceData } from '../world/models/landHexInstances'
import {
  getObjectiveMarker3DPosition,
  isObjectiveMarkerVisibleAtLevel,
} from '../world/models/objectiveMarker3D'
import {
  getLadderBattlementOptions,
  getRoadWallOptions,
} from '../world/models/piece-adjustments'
import { isE2E, isPerHexLandOverride } from './isE2E'
import { getPlacementPreview } from './placementPreviewStore'
import { getReady } from './readyStore'
import type {
  E2EDragSnapshot,
  E2ESnapshot,
  E2ETestBridge,
  ScreenPoint,
} from './types'

const round1 = (n: number) => Math.round(n * 10) / 10
const round4 = (n: number) => Math.round(n * 1e4) / 1e4
const round4Vector = (v: Vector3): [number, number, number] => [
  round4(v.x),
  round4(v.y),
  round4(v.z),
]

const getDragSnapshot = (): E2EDragSnapshot | null => {
  const dragState = getDragState()
  if (dragState.phase === 'idle') return null
  const preview = useBoundStore.getState().dragPreview
  const draggedMember = preview?.members?.find(
    (member) => member.uid === dragState.uid,
  )
  return {
    state: dragState.phase,
    targetStatus: preview?.status ?? null,
    reason: preview?.reason ?? null,
    unsupported: draggedMember?.unsupported ?? false,
    footprintCount: preview?.footprintHexes.length ?? 0,
    targetHex: preview?.pointerHex ? { ...preview.pointerHex } : null,
  }
}

/**
 * Installs `window.__TEST__`, a read-only view of the app (plus camera
 * control) for browser automation. Reads the store with getState() so it
 * never causes a re-render. See e2e/README.md.
 */
export function TestBridge() {
  if (!isE2E) return null
  return <TestBridgeInner />
}

/** The hex whose top surface best represents a piece, or null. */
const getPieceTopHex = (
  bp: BoardPiece,
  boardHexes: Record<string, BoardHex>,
): BoardHex | null => {
  const hexes = Object.values(boardHexes).filter(
    (hex) => hex.boardPieceUID === bp.uid,
  )
  if (!hexes.length) return null
  const solid = hexes.filter((hex) => !hex.isVerticalClearanceHex)
  const candidates = solid.length ? solid : hexes
  const atOrigin = (hex: BoardHex) =>
    hex.q === bp.pieceCoords.q && hex.r === bp.pieceCoords.r
  return [...candidates].sort(
    (a, b) =>
      Number(atOrigin(b)) - Number(atOrigin(a)) || b.altitude - a.altitude,
  )[0]
}

function TestBridgeInner() {
  const get = useThree((s) => s.get)

  useEffect(() => {
    const project = (x: number, y: number, z: number): ScreenPoint | null => {
      const { camera, size } = get()
      camera.updateMatrixWorld()
      const v = new Vector3(x, y, z).project(camera)
      // z outside [-1, 1] means behind the camera or past the far plane
      if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) return null
      if (v.z < -1 || v.z > 1) return null
      const point = {
        x: round1((v.x * 0.5 + 0.5) * size.width),
        y: round1((-v.y * 0.5 + 0.5) * size.height),
      }
      const isOnCanvas =
        point.x >= 0 &&
        point.x <= size.width &&
        point.y >= 0 &&
        point.y <= size.height
      return isOnCanvas ? point : null
    }

    // Ruin origin hexes can be offset from the wall meshes, so target a
    // projected model triangle instead of the usual top-surface hex.
    const screenPosOfRuins = (uid: string): ScreenPoint | null => {
      const { camera, scene, size } = get()
      camera.updateMatrixWorld()
      scene.updateMatrixWorld(true)
      const raycaster = new Raycaster()
      let point: ScreenPoint | null = null
      let firstProjectedPoint: ScreenPoint | null = null

      scene.traverse((object) => {
        if (
          point ||
          !(object instanceof Mesh) ||
          object.userData.ruinsUID !== uid
        ) {
          return
        }
        const positions = object.geometry.getAttribute('position')
        if (!positions) return
        const index = object.geometry.index
        const vertexCount = index?.count ?? positions.count
        for (let triangle = 0; triangle + 2 < vertexCount; triangle += 3) {
          const worldPoint = new Vector3()
          for (let corner = 0; corner < 3; corner += 1) {
            const vertex = index?.getX(triangle + corner) ?? triangle + corner
            worldPoint.add(new Vector3().fromBufferAttribute(positions, vertex))
          }
          worldPoint.multiplyScalar(1 / 3)
          object.localToWorld(worldPoint)
          const ndc = worldPoint.clone().project(camera)
          if (
            !Number.isFinite(ndc.x) ||
            !Number.isFinite(ndc.y) ||
            ndc.x < -1 ||
            ndc.x > 1 ||
            ndc.y < -1 ||
            ndc.y > 1 ||
            ndc.z < -1 ||
            ndc.z > 1
          ) {
            continue
          }
          firstProjectedPoint ??= {
            x: round1((ndc.x * 0.5 + 0.5) * size.width),
            y: round1((-ndc.y * 0.5 + 0.5) * size.height),
          }
          raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), camera)
          const firstHit = raycaster.intersectObject(scene, true)[0]
          if (firstHit?.object.userData.ruinsUID !== uid) continue
          const screenX = (ndc.x * 0.5 + 0.5) * size.width
          const screenY = (-ndc.y * 0.5 + 0.5) * size.height
          point = { x: round1(screenX), y: round1(screenY) }
          return
        }
      })
      return point ?? firstProjectedPoint
    }

    const bridge: E2ETestBridge = {
      snapshot: () => {
        const s = useBoundStore.getState()
        const camera = get().camera
        const landRendererMode = getLandRendererMode(
          s.effectiveGraphicsTier,
          isPerHexLandOverride,
        )
        const landInstances =
          landRendererMode === 'per-hex'
            ? buildLandHexInstanceData(
                s.boardHexes,
                s.boardPieces,
                s.viewingLevel,
                {
                  genericSolidCapColor: s.genericSolidCapColor,
                  genericSolidSideColor: s.genericSolidSideColor,
                  genericFluidCapColor: s.genericFluidCapColor,
                  genericFluidSideColor: s.genericFluidSideColor,
                },
              )
            : getLandSubterrainInstanceData(
                s.boardPieces,
                s.boardHexes,
                s.viewingLevel,
              )
        let hasPerHexLandRenderer = false
        get().scene.traverse((object) => {
          if (object.userData.landHexRenderer === true) {
            hasPerHexLandRenderer = true
          }
        })
        const marroHiveMaterials: Array<{
          uid: string
          hasMap: boolean
          materialTypes: string[]
        }> = []
        const evergreenTreeMaterials: Array<{
          uid: string
          part: 'tree' | 'boulders' | 'base'
          hasMap: boolean
          materialTypes: string[]
        }> = []
        const previewMeshes: E2ESnapshot['previewMeshes'] = []
        const ruinsMaterials: Array<{
          uid: string
          part: 'face' | 'columns'
          hasMap: boolean
          materialTypes: string[]
        }> = []
        const roadWallMaterials: Array<{
          uid: string
          part: 'wall' | 'road'
          hasMap: boolean
          materialTypes: string[]
        }> = []
        const marvelRuinMaterials: E2ESnapshot['marvelRuinMaterials'] = []
        get().scene.traverse((object) => {
          if (!(object instanceof Mesh)) return
          const materials = (
            Array.isArray(object.material) ? object.material : [object.material]
          ) as Array<{
            map?: unknown
            type?: string
            transparent?: boolean
            opacity?: number
          }>
          const hiveUID = object.userData.marroHiveUID
          if (typeof hiveUID === 'string') {
            marroHiveMaterials.push({
              uid: hiveUID,
              hasMap: materials.some((material) => Boolean(material?.map)),
              materialTypes: materials.map((material) => material?.type ?? ''),
            })
          }
          const firstMaterial = materials[0]
          const previewMaterial = {
            hasMap: materials.some((material) => Boolean(material?.map)),
            transparent: materials.some((material) => material?.transparent),
            opacity: firstMaterial?.opacity ?? 1,
          }
          if (hiveUID === null) {
            previewMeshes.push({
              family: 'marroHive',
              part: 'model',
              ...previewMaterial,
            })
          }
          const evergreenTreeUID = object.userData.evergreenTreeUID
          const part = object.userData.evergreenTreePart
          if (
            typeof evergreenTreeUID === 'string' &&
            (part === 'tree' || part === 'boulders' || part === 'base')
          ) {
            evergreenTreeMaterials.push({
              uid: evergreenTreeUID,
              part,
              hasMap: materials.some((material) => Boolean(material?.map)),
              materialTypes: materials.map((material) => material?.type ?? ''),
            })
          }
          if (
            evergreenTreeUID === null &&
            (part === 'tree' || part === 'boulders' || part === 'base')
          ) {
            previewMeshes.push({
              family: 'evergreenTree',
              part,
              ...previewMaterial,
            })
          }
          if (object.userData.snowEvergreenTreeUID === null) {
            previewMeshes.push({
              family: 'snowEvergreenTree',
              part: 'tree',
              ...previewMaterial,
            })
          }
          const ruinsUID = object.userData.ruinsUID
          const ruinsPart = object.userData.ruinsPart
          if (
            typeof ruinsUID === 'string' &&
            (ruinsPart === 'face' || ruinsPart === 'columns')
          ) {
            ruinsMaterials.push({
              uid: ruinsUID,
              part: ruinsPart,
              hasMap: materials.some((material) => Boolean(material?.map)),
              materialTypes: materials.map((material) => material?.type ?? ''),
            })
          }
          const roadWallUID = object.userData.roadWallUID
          const roadWallPart = object.userData.roadWallPart
          if (
            typeof roadWallUID === 'string' &&
            (roadWallPart === 'wall' || roadWallPart === 'road')
          ) {
            roadWallMaterials.push({
              uid: roadWallUID,
              part: roadWallPart,
              hasMap: materials.some((material) => Boolean(material?.map)),
              materialTypes: materials.map((material) => material?.type ?? ''),
            })
          }
          const marvelRuinUID = object.userData.marvelRuinUID
          const marvelRuinPart = object.userData.marvelRuinPart
          if (
            typeof marvelRuinUID === 'string' &&
            (marvelRuinPart === 'MarvelRuinLeft' ||
              marvelRuinPart === 'MarvelRuinFront' ||
              marvelRuinPart === 'MarvelRuinBack' ||
              marvelRuinPart === 'MarvelRuinFrontBroken' ||
              marvelRuinPart === 'MarvelRuinBackBroken' ||
              marvelRuinPart === 'MarvelRuinUpperFloor')
          ) {
            marvelRuinMaterials.push({
              uid: marvelRuinUID,
              part: marvelRuinPart,
              hasMap: materials.some((material) => Boolean(material?.map)),
              materialTypes: materials.map((material) => material?.type ?? ''),
            })
          }
          if (
            marvelRuinUID === null &&
            (marvelRuinPart === 'MarvelRuinLeft' ||
              marvelRuinPart === 'MarvelRuinFront' ||
              marvelRuinPart === 'MarvelRuinBack' ||
              marvelRuinPart === 'MarvelRuinFrontBroken' ||
              marvelRuinPart === 'MarvelRuinBackBroken' ||
              marvelRuinPart === 'MarvelRuinUpperFloor')
          ) {
            previewMeshes.push({
              family: 'marvelRuin',
              part: marvelRuinPart,
              ...previewMaterial,
            })
          }
        })
        return {
          ready: getReady(),
          mapId: s.hexMap.id,
          mapName: s.hexMap.name,
          mapWidth: s.hexMap.width,
          mapLength: s.hexMap.length,
          pieceCount: s.boardPieces.length,
          objectiveMarkerCount: s.hexMap.objectiveMarkers?.length ?? 0,
          objectiveMarkerDraft: {
            size: s.objectiveMarkerDraft.size,
            style: s.objectiveMarkerDraft.style,
          },
          objectiveMarkerAnchors: (s.hexMap.objectiveMarkers ?? []).map(
            ({ uid, anchor }) => ({ uid, anchor: { ...anchor } }),
          ),
          selectedObjectiveMarkerUID: s.selectedObjectiveMarkerUID,
          hexCount: Object.keys(s.boardHexes).length,
          landInstanceCounts: landInstances.reduce(
            (counts, item) => {
              counts[item.isFluid ? 'fluid' : 'solid'] += 1
              return counts
            },
            { solid: 0, fluid: 0 },
          ),
          landRenderer: hasPerHexLandRenderer ? 'per-hex' : 'legacy',
          marroHiveMaterials,
          evergreenTreeMaterials,
          previewMeshes,
          ruinsMaterials,
          roadWallMaterials,
          marvelRuinMaterials,
          viewingLevel: s.viewingLevel,
          penMode: s.penMode,
          penPieceID: getPieceIDForPenMode(s.penMode, s.pieceSize),
          selectedPieceIDs: [...s.selectedPieceIDs],
          rotationPivot:
            resolveRotationPivot(
              s.selectedPieceIDs,
              s.boardPieces,
              s.boardHexes,
              s.rotationPivot,
            ) ?? null,
          hoveredPieceID: s.hoveredPieceID,
          isOrthoCam: s.isOrthoCam,
          cameraFov: camera instanceof PerspectiveCamera ? camera.fov : null,
          placementPreview: getPlacementPreview(),
          drag: getDragSnapshot(),
        }
      },
      listPieces: () =>
        useBoundStore.getState().boardPieces.map((bp) => ({
          uid: bp.uid,
          inventoryID: bp.inventoryID,
          altitude: bp.altitude,
          rotation: bp.rotation,
          pieceCoords: { ...bp.pieceCoords },
        })),
      listRenderedObjectiveMarkerUIDs: () => {
        const uids: string[] = []
        get().scene.traverse((object) => {
          const uid = object.userData.objectiveMarkerUID
          if (typeof uid === 'string') uids.push(uid)
        })
        return uids
      },
      getRenderedObjectiveMarkerTextQuaternion: (uid) => {
        let quaternion: [number, number, number, number] | null = null
        get().scene.traverse((object) => {
          if (object.userData.objectiveMarkerTextUID === uid) {
            object.updateWorldMatrix(true, false)
            const worldQuaternion = object.getWorldQuaternion(new Quaternion())
            quaternion = [
              round4(worldQuaternion.x),
              round4(worldQuaternion.y),
              round4(worldQuaternion.z),
              round4(worldQuaternion.w),
            ]
          }
        })
        return quaternion
      },
      cameraQuaternion: () => {
        const camera = get().camera
        camera.updateMatrixWorld()
        const quaternion = camera.getWorldQuaternion(new Quaternion())
        return [
          round4(quaternion.x),
          round4(quaternion.y),
          round4(quaternion.z),
          round4(quaternion.w),
        ]
      },
      screenPosOfHex: ({ q, r, altitude }) => {
        const { x, y, z } = getBoardHex3DCoords({ q, r, s: -q - r, altitude })
        return project(x, y, z)
      },
      screenPosOfHexEdge: ({ q, r, altitude, edge }) => {
        const center = getBoardHex3DCoords({ q, r, s: -q - r, altitude })
        const neighbor = hexUtilsGetNeighborForRotation(edge)
        const offset = cubeToPixel(neighbor)
        return project(
          center.x + offset.x * 0.35,
          center.y,
          center.z + offset.y * 0.35,
        )
      },
      screenPosOfPiece: (uid) => {
        const { boardPieces, boardHexes } = useBoundStore.getState()
        const bp = boardPieces.find((piece) => piece.uid === uid)
        if (!bp) return null
        if (isLaurWallAddonPieceID(bp.inventoryID)) {
          const feature = getLaurAddonFeaturePoint(bp.pieceCoords, bp.rotation)
          if (feature) {
            const { yWithBase } = getBoardHex3DCoords({
              ...bp.pieceCoords,
              altitude: bp.altitude + 1,
            })
            return project(feature.x, yWithBase, feature.z)
          }
        }
        const anchor = getBoardHex3DCoords({
          ...bp.pieceCoords,
          altitude: bp.altitude + 1,
        })
        if (bp.inventoryID === Pieces.battlement) {
          const offset = getLadderBattlementOptions(bp.rotation)
          return project(
            anchor.x + offset.xAdd,
            anchor.y - HEXGRID_HEX_HEIGHT + HEXGRID_HEXCAP_HEIGHT / 2,
            anchor.z + offset.zAdd,
          )
        }
        if (bp.inventoryID === Pieces.roadWall) {
          const bounds = new Box3()
          get().scene.traverse((object) => {
            if (object instanceof Mesh && object.userData.roadWallUID === uid) {
              bounds.union(new Box3().setFromObject(object))
            }
          })
          if (!bounds.isEmpty()) {
            const center = bounds.getCenter(new Vector3())
            // Inset from the bounds edge so the projected point hits the wall.
            center.z = bounds.min.z + 0.01
            return project(center.x, center.y, center.z)
          }
          const offset = getRoadWallOptions(bp.rotation)
          return project(
            anchor.x + offset.xAdd,
            anchor.y - HEXGRID_HEX_HEIGHT,
            anchor.z + offset.zAdd,
          )
        }
        if (
          bp.inventoryID === Pieces.ladder ||
          bp.inventoryID === Pieces.ropeLadder
        ) {
          const bounds = new Box3()
          get().scene.traverse((object) => {
            if (object.userData.boardPieceUID === uid) {
              bounds.union(new Box3().setFromObject(object))
            }
          })
          if (!bounds.isEmpty()) {
            const center = bounds.getCenter(new Vector3())
            return project(center.x, center.y, center.z)
          }
        }
        if (
          bp.inventoryID === Pieces.ruins2 ||
          bp.inventoryID === Pieces.ruins3
        ) {
          return screenPosOfRuins(uid)
        }
        const hex = getPieceTopHex(bp, boardHexes)
        // Pieces with no grid expansion (e.g. Laur wall add-ons) render
        // straight from boardPieces: fall back to the placement hex.
        const { x, y, z } = getBoardHex3DCoords(
          hex ?? { ...bp.pieceCoords, altitude: bp.altitude + 1 },
        )
        return project(x, y, z)
      },
      screenPosOfObjectiveMarker: (uid) => {
        const state = useBoundStore.getState()
        const marker = state.hexMap.objectiveMarkers?.find(
          (item) => item.uid === uid,
        )
        if (
          !marker ||
          !isObjectiveMarkerVisibleAtLevel(marker, state.viewingLevel)
        ) {
          return null
        }
        const position = getObjectiveMarker3DPosition(marker, state.boardHexes)
        return position ? project(position.x, position.y, position.z) : null
      },
      setCamera: async (position, target) => {
        const { controls, invalidate } = get()
        ;(controls as CameraControls | null)?.setLookAt(
          ...position,
          ...target,
          false, // no transition: land exactly where asked
        )
        invalidate()
        // The camera object only picks the move up on the next rendered frame.
        // Wait two, so the next screenPos call (and the ready signal) see it.
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })
      },
      cameraPose: () => {
        const { controls, camera } = get()
        const cameraControls = controls as CameraControls | null
        if (!cameraControls) return null
        return {
          position: round4Vector(cameraControls.getPosition(new Vector3())),
          target: round4Vector(cameraControls.getTarget(new Vector3())),
          zoom: round4(camera.zoom),
        }
      },
      setPen: (penMode, size, rotation) => {
        const store = useBoundStore.getState()
        store.togglePenMode(penMode)
        store.togglePieceSize(size)
        if (rotation !== undefined) {
          store.togglePenModeRotation(rotation)
        }
      },
      setLookBackgroundColor: (color) =>
        useBoundStore.getState().setLookSettings({ backgroundColor: color }),
      seedActionLog: (count) => {
        const state = useBoundStore.getState()
        for (
          let index = 0;
          index < Math.min(200, Math.max(0, count));
          index++
        ) {
          state.recordActionLog({
            type: 'place',
            pieceName: '1-hex Grass',
          })
        }
      },
      stats: () => {
        const { calls, triangles, frame: frames } = get().gl.info.render
        return { calls, triangles, frames }
      },
    }
    window.__TEST__ = bridge
    return () => {
      window.__TEST__ = undefined
    }
  }, [get])

  return null
}
