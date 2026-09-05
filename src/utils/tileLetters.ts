import { piecesSoFar } from '../data/pieces'
import {
  xTransformForMultiHex3Rotation,
  yTransformForMultiHex3Rotation,
} from '../pdf-svg-shared/textRotations'
import { type BoardHex, HexTerrain } from '../types'

export const terrainTileLetters: Record<
  string,
  { letter: string; isBlack: boolean }
> = {
  [HexTerrain.grass]: { letter: 'G', isBlack: false },
  [HexTerrain.rock]: { letter: 'R', isBlack: false },
  [HexTerrain.swamp]: { letter: 'S', isBlack: false },
  [HexTerrain.lavaField]: { letter: 'F', isBlack: false },
  [HexTerrain.asphalt]: { letter: 'A', isBlack: false },
  [HexTerrain.ancientTerrain]: { letter: 'A', isBlack: false },
  [HexTerrain.lava]: { letter: 'M', isBlack: false },
  [HexTerrain.shadow]: { letter: 'S', isBlack: false },
  [HexTerrain.sand]: { letter: 'S', isBlack: true },
  [HexTerrain.concrete]: { letter: 'C', isBlack: true },
  [HexTerrain.dungeon]: { letter: 'D', isBlack: true },
  [HexTerrain.wellspringWater]: { letter: 'W', isBlack: true },
}

export const isTileLetterTerrain = (terrain: string) => {
  return Boolean(terrainTileLetters[terrain])
}

export const getTerrainTileLetter = (terrain: string) => {
  return terrainTileLetters[terrain] ?? null
}

export const shouldDisplayTerrainTileLetter = (
  hex: BoardHex,
  viewingLevel: number,
) => {
  if (!isTileLetterTerrain(hex.terrain)) {
    return false
  }
  if (hex.altitude !== viewingLevel) {
    return false
  }
  if (hex.isObstacleAuxiliary || hex.isVerticalClearanceHex) {
    return false
  }
  const inventoryPiece = piecesSoFar[hex.inventoryID]
  if (inventoryPiece?.isObstaclePiece && !hex.isObstacleOrigin) {
    return false
  }
  const template = inventoryPiece?.template
  // Multi-hex terrain pieces are rendered as a single piece, with the terrain
  // geometry anchored on the origin hex and the auxiliary hexes only containing
  // decorative/structural details. We still want the letter to appear on the
  // origin hex for these tiles, so this guard is effectively a no-op for the
  // default case but documents the important distinction between the origin and
  // the auxiliary cells.
  if (
    !hex.isObstacleOrigin &&
    template &&
    ['2', '3', '4', '5', '6', '7', '24'].includes(template)
  ) {
    return true
  }
  return true
}

export const getTileLetterPosition = (hex: BoardHex) => {
  const template = piecesSoFar[hex.inventoryID]?.template
  if (template === '3' || template === '6' || template === '24') {
    const rotationIndex = (hex?.pieceRotation ?? 0) % 6
    return {
      x: xTransformForMultiHex3Rotation[rotationIndex],
      y: yTransformForMultiHex3Rotation[rotationIndex],
    }
  }
  return { x: 0, y: 0 }
}
