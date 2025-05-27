import { piecesSoFar } from '../data/pieces'
import {
  type BoardHex,
  type DecodedPieceID,
  HexTerrain,
  type Piece,
} from '../types'
import {
  isCastleTerrain,
  isEvergreenTree,
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils'
import { decodePieceID } from '../utils/map-utils'
import {
  hexTerrainColor,
  svgColors,
  virtualscapeTileColors,
} from '../world/maphex/hexColors'

function isBoardHex(hex: BoardHex | DecodedPieceID): hex is BoardHex {
  return (<BoardHex>hex).pieceRotation !== undefined
}

export const getSvgHexBorderColor = (hex: BoardHex | DecodedPieceID) => {
  const isSolidTerrain = isSolidTerrainHex(hex.terrain)
  if (hex.terrain === 'empty') {
    return 'black'
  }
  let inventoryPiece: Piece
  if (isBoardHex(hex)) {
    inventoryPiece = piecesSoFar?.[decodePieceID?.(hex.pieceID)?.inventoryID]
  } else {
    inventoryPiece = piecesSoFar[hex.inventoryID]
  }
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
    hex.terrain === HexTerrain.ice ||
    hex.terrain === HexTerrain.shadow
  ) {
    return svgColors.outlineWater
  }
  if (hex.terrain === HexTerrain.lava) {
    return svgColors.outlineLava
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
  if (hex.terrain === HexTerrain.glacier) {
    return svgColors.outlineWater
  }
  if (hex.terrain === HexTerrain.outcrop) {
    return svgColors.outlineWater
  }
  if (hex.terrain === HexTerrain.lavaRockOutcrop) {
    return svgColors.outlineLava
  }
  return 'black'
}

export const getSvgHexFillColor = (hex: BoardHex | DecodedPieceID) => {
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
  // Renegade shows brush and palm as same color
  if (hex.terrain === HexTerrain.brush) {
    return svgColors.fillJungle
  }
  if (hex.terrain === HexTerrain.palm) {
    return svgColors.palm
  }
  if (isEvergreenTree(hex.terrain)) {
    return svgColors.tree
  }
  if (hex.terrain === HexTerrain.glacier) {
    return svgColors.ice
  }
  if (hex.terrain === HexTerrain.outcrop) {
    return svgColors.outcrop
  }
  if (hex.terrain === HexTerrain.lavaRockOutcrop) {
    return svgColors.lavaField
  }
  if (isCastleTerrain(hex.terrain)) {
    return hexTerrainColor.castle
  }
  return 'transparent'
}
