import { piecesSoFar } from '../data/pieces'
import { BoardHex, HexTerrain } from '../types'
import {
  isEvergreenTree,
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils'
import { decodePieceID } from '../utils/map-utils'
import { svgColors, virtualscapeTileColors } from '../world/maphex/hexColors'

export const getSvgHexBorderColor = (hex: BoardHex) => {
  const isSolidTerrain = isSolidTerrainHex(hex.terrain)
  const inventoryPiece =
    piecesSoFar?.[decodePieceID?.(hex.pieceID)?.pieceID] ?? ''
  const is1Hex = inventoryPiece.size === 1
  const is2Hex = inventoryPiece.size === 2
  const is3Hex = inventoryPiece.size === 3
  const is7Hex = inventoryPiece.size === 7
  const is24Hex = inventoryPiece.size === 24
  if (isSolidTerrain && is1Hex) {
    return svgColors.outline1
  }
  if (isSolidTerrain && is2Hex) {
    return svgColors.outline2
  }
  if (isSolidTerrain && is3Hex) {
    return svgColors.outline3
  }
  if (isSolidTerrain && is7Hex) {
    return svgColors.outline7
  }
  if (isSolidTerrain && is24Hex) {
    return svgColors.outline24
  }
  if (
    hex.terrain === HexTerrain.water ||
    hex.terrain === HexTerrain.swampWater ||
    hex.terrain === HexTerrain.ice
  ) {
    return svgColors.outlineWater
  }
  if (hex.terrain === HexTerrain.wellspringWater) {
    return svgColors.outlineWellspringWater
  }
  if (isJungleTerrainHex(hex.terrain)) {
    return svgColors.outlineJungle
  }
  if (isEvergreenTree(hex.terrain)) {
    return svgColors.outlineTree
  }
  if (hex.terrain === HexTerrain.laurWall) {
    return svgColors.outlineLaurWall
  }
  return 'black'
}
export const getSvgHexFillColor = (hex: BoardHex) => {
  if (
    isSolidTerrainHex(hex.terrain) ||
    isFluidTerrainHex(hex.terrain) ||
    hex.terrain === HexTerrain.laurWall ||
    hex.terrain === HexTerrain.tree
  ) {
    return (
      svgColors?.[hex.terrain as keyof typeof svgColors] ??
      virtualscapeTileColors[hex.terrain as keyof typeof virtualscapeTileColors]
    )
  }
  if (isJungleTerrainHex(hex.terrain)) {
    return svgColors.fillJungle
  }
  if (isEvergreenTree(hex.terrain)) {
    return svgColors.tree
  }
  if (hex.terrain === HexTerrain.laurWall) {
    return svgColors.outlineLaurWall
  }
  return 'transparent'
}
