import type { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Box3, Vector3 } from 'three'
import { getLaurAddonFeaturePoint } from '../data/laurAddonPlacement'
import useBoundStore from '../store/store'
import { type BoardHex, type BoardPiece, Pieces } from '../types'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import { HEXGRID_HEXCAP_HEIGHT, HEXGRID_HEX_HEIGHT } from '../utils/constants'
import { cubeToPixel, hexUtilsGetNeighborForRotation } from '../utils/hex-utils'
import { getBoardHex3DCoords } from '../utils/map-utils'
import { getDragState } from '../world/drag/dragController'
import {
  getLadderBattlementOptions,
  getRoadWallOptions,
} from '../world/models/piece-adjustments'
import { isE2E } from './isE2E'
import { getPlacementPreview } from './placementPreviewStore'
import { getReady } from './readyStore'
import type { E2EDragSnapshot, E2ETestBridge, ScreenPoint } from './types'

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

    const bridge: E2ETestBridge = {
      snapshot: () => {
        const s = useBoundStore.getState()
        return {
          ready: getReady(),
          mapId: s.hexMap.id,
          mapName: s.hexMap.name,
          mapWidth: s.hexMap.width,
          mapLength: s.hexMap.length,
          pieceCount: s.boardPieces.length,
          hexCount: Object.keys(s.boardHexes).length,
          viewingLevel: s.viewingLevel,
          penMode: s.penMode,
          selectedPieceIDs: [...s.selectedPieceIDs],
          hoveredPieceID: s.hoveredPieceID,
          isOrthoCam: s.isOrthoCam,
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
        const hex = getPieceTopHex(bp, boardHexes)
        // Pieces with no grid expansion (e.g. Laur wall add-ons) render
        // straight from boardPieces: fall back to the placement hex.
        const { x, y, z } = getBoardHex3DCoords(
          hex ?? { ...bp.pieceCoords, altitude: bp.altitude + 1 },
        )
        return project(x, y, z)
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
      stats: () => {
        const { calls, triangles } = get().gl.info.render
        return { calls, triangles }
      },
    }
    window.__TEST__ = bridge
    return () => {
      window.__TEST__ = undefined
    }
  }, [get])

  return null
}
