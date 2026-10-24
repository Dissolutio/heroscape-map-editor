/** A point in CSS pixels, relative to the canvas's top-left corner. */
export type ScreenPoint = { x: number; y: number }

export type E2ESnapshot = {
  ready: boolean
  mapId: string
  mapName: string
  mapWidth: number
  mapLength: number
  pieceCount: number
  hexCount: number
  viewingLevel: number
  penMode: string
  selectedPieceIDs: string[]
  hoveredPieceID: string
  isOrthoCam: boolean
  placementPreview: {
    status: 'ok' | 'conflict' | 'blocked'
    reason: string | null
    footprintCount: number
    unsupported: boolean
    altitude: number | null
    rotation: number | null
  } | null
  /** A piece press or drag in progress (drag-to-move), or null. */
  drag: E2EDragSnapshot | null
}

export type E2EDragSnapshot = {
  /** 'pressed' until the pointer moves past the click tolerance. */
  state: 'pressed' | 'dragging'
  /** The drop's status at the current target, or null with no target. */
  targetStatus: 'ok' | 'conflict' | 'blocked' | null
  reason: string | null
  /** Whether the dragged Laur add-on lacks required support ports. */
  unsupported: boolean
  /** Hexes in the target footprint, off-map ones included (0: no target). */
  footprintCount: number
  /** The hex under the pointer (the dragged piece itself is see-through). */
  targetHex: { q: number; r: number; s: number; altitude: number } | null
}

export type E2ECameraPose = {
  position: [number, number, number]
  target: [number, number, number]
  zoom: number
}

export type E2EPieceSummary = {
  uid: string
  inventoryID: string
  altitude: number
  rotation: number
  pieceCoords: { q: number; r: number; s: number }
}

/**
 * Read-only view of the app for browser automation, installed on
 * `window.__TEST__` (only when `isE2E` is true). Every return value is
 * JSON-serializable so it can cross `page.evaluate`.
 */
export type E2ETestBridge = {
  snapshot: () => E2ESnapshot
  listPieces: () => E2EPieceSummary[]
  /** Where to click the canvas to hit a placed piece, or null. */
  screenPosOfPiece: (uid: string) => ScreenPoint | null
  /** Where to click the canvas to hit a hex's top surface, or null. */
  screenPosOfHex: (hex: {
    q: number
    r: number
    altitude: number
  }) => ScreenPoint | null
  /** A point just inside one of a hex's six edges. */
  screenPosOfHexEdge: (hex: {
    q: number
    r: number
    altitude: number
    edge: number
  }) => ScreenPoint | null
  /**
   * Instantly (no animation) move the camera. Resolves once the move has been
   * rendered, so await it. Needs the tab visible (rAF does not run in hidden
   * tabs).
   */
  setCamera: (
    position: [number, number, number],
    target: [number, number, number],
  ) => Promise<void>
  /** Where the camera is and looks (rounded), to check it did not move. */
  cameraPose: () => E2ECameraPose | null
  /** Set pen controls for test setup only. */
  setPen: (penMode: string, size: number, rotation?: number) => void
  stats: () => { calls: number; triangles: number }
}
