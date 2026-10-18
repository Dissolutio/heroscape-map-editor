/** A point in CSS pixels, relative to the canvas's top-left corner. */
export type ScreenPoint = { x: number; y: number }

export type E2ESnapshot = {
  ready: boolean
  mapId: string
  mapName: string
  pieceCount: number
  hexCount: number
  viewingLevel: number
  penMode: string
  selectedPieceIDs: string[]
  hoveredPieceID: string
  isOrthoCam: boolean
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
  /**
   * Instantly (no animation) move the camera. Resolves once the move has been
   * rendered, so await it. Needs the tab visible (rAF does not run in hidden
   * tabs).
   */
  setCamera: (
    position: [number, number, number],
    target: [number, number, number],
  ) => Promise<void>
  stats: () => { calls: number; triangles: number }
}
