import { piecesSoFar } from '../data/pieces'
import {
  type BoardHex,
  type BoardPiece,
  HexTerrain,
  type Piece,
  Pieces,
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
  svgSubLevelColors,
  virtualscapeTileColors,
} from '../world/maphex/hexColors'

function isBoardHex(hex: BoardHex | BoardPiece): hex is BoardHex {
  return (<BoardHex>hex).pieceRotation !== undefined
}

export const getSvgHexBorderColor = (hex: BoardHex | BoardPiece) => {
  const terrain = piecesSoFar[hex.inventoryID].terrain
  // TODO: color: refactor this to be more direct
  const isSolidTerrain = isSolidTerrainHex(hex.terrain)
  if (hex.terrain === 'empty') {
    return '#CECECE'
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
  if (hex.terrain === HexTerrain.road && inventoryPiece.size === 5) {
    return svgColors.outlineRoad5
  }
  if (hex.terrain === HexTerrain.concrete && inventoryPiece.size === 6) {
    return svgColors.outlineMarvel
  }
  if (hex.terrain === HexTerrain.wallWalk && inventoryPiece.size === 9) {
    return svgColors.outlineMarvel
  }
  if (
    hex.terrain === HexTerrain.hive ||
    hex.terrain === HexTerrain.water ||
    hex.terrain === HexTerrain.wellspringWater ||
    hex.terrain === HexTerrain.swampWater ||
    hex.terrain === HexTerrain.ice ||
    hex.terrain === HexTerrain.lava ||
    hex.terrain === HexTerrain.shadow
  ) {
    return svgColors.outlineWater
  }
  if (isJungleTerrainHex(hex.terrain)) {
    return svgColors.outlineJungle
  }
  if (isEvergreenTree(terrain)) {
    return svgColors.outlineTree
  }
  if (
    terrain === HexTerrain.laurWall ||
    terrain === HexTerrain.laurWallAddon
  ) {
    return svgColors.outlineLaurWall
  }
  if (terrain === HexTerrain.glacier) {
    return svgColors.outlineWater
  }
  if (hex.terrain === HexTerrain.outcrop) {
    return svgColors.outlineOutcrop
  }
  if (hex.terrain === HexTerrain.lavaRockOutcrop) {
    return svgColors.outlineLavaOutcrop
  }
  if (hex.terrain === HexTerrain.castleWall) {
    return svgColors.castleWall
  }
  if (hex.terrain === HexTerrain.castleBase) {
    return svgColors.castleBase
  }
  return 'black'
}
export const getSvgHexSubLevelBorderColor = (
  hex: BoardHex | DecodedPieceID,
) => {
  // TODO: color: refactor this to be more direct
  const isSolidTerrain = isSolidTerrainHex(hex.terrain)
  if (hex.terrain === 'empty') {
    return '#CECECE'
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
    return svgSubLevelColors.outline1
  }
  if (isSolidTerrain && is2Hex) {
    return svgSubLevelColors.outline2
  }
  if (isSolidTerrain && is3Hex) {
    return svgSubLevelColors.outline3
  }
  if (isSolidTerrain && is7Hex) {
    return svgSubLevelColors.outline7
  }
  if (isSolidTerrain && is24Hex) {
    return svgSubLevelColors.outline24
  }
  if (hex.terrain === HexTerrain.road && inventoryPiece.size === 5) {
    return svgSubLevelColors.outlineRoad5
  }
  if (hex.terrain === HexTerrain.concrete && inventoryPiece.size === 6) {
    return svgSubLevelColors.outlineMarvel
  }
  if (hex.terrain === HexTerrain.wallWalk && inventoryPiece.size === 9) {
    return svgSubLevelColors.outlineMarvel
  }
  if (
    hex.terrain === HexTerrain.hive ||
    hex.terrain === HexTerrain.water ||
    hex.terrain === HexTerrain.wellspringWater ||
    hex.terrain === HexTerrain.swampWater ||
    hex.terrain === HexTerrain.ice ||
    hex.terrain === HexTerrain.lava ||
    hex.terrain === HexTerrain.shadow
  ) {
    return svgSubLevelColors.outlineWater
  }
  if (isJungleTerrainHex(hex.terrain)) {
    return svgSubLevelColors.outlineJungle
  }
  if (isEvergreenTree(hex.terrain)) {
    return svgSubLevelColors.outlineTree
  }
  if (
    hex.terrain === HexTerrain.laurWall ||
    hex.terrain === HexTerrain.laurWallAddon
  ) {
    return svgSubLevelColors.outlineLaurWall
  }
  if (hex.terrain === HexTerrain.glacier) {
    return svgSubLevelColors.outlineWater
  }
  if (hex.terrain === HexTerrain.outcrop) {
    return svgSubLevelColors.outlineOutcrop
  }
  if (hex.terrain === HexTerrain.lavaRockOutcrop) {
    return svgSubLevelColors.outlineLavaOutcrop
  }
  if (hex.terrain === HexTerrain.castleWall) {
    return svgSubLevelColors.castleWall
  }
  if (hex.terrain === HexTerrain.castleBase) {
    return svgSubLevelColors.castleBase
  }
  return 'black'
}

export const getSvgHexFillColor = (hex: BoardHex | DecodedPieceID) => {
  if (
    isSolidTerrainHex(hex.terrain) ||
    isFluidTerrainHex(hex.terrain) ||
    hex.terrain === HexTerrain.laurWall ||
    hex.terrain === HexTerrain.laurWallAddon ||
    hex.terrain === HexTerrain.fortifiedWall ||
    hex.terrain === HexTerrain.roadWall ||
    hex.terrain === HexTerrain.glyphPower ||
    hex.terrain === HexTerrain.glyphTreasure ||
    hex.terrain === HexTerrain.tree ||
    hex.terrain === HexTerrain.battlement ||
    hex.terrain === HexTerrain.hive ||
    hex.terrain === HexTerrain.ladder
  ) {
    return (
      svgColors?.[terrain as keyof typeof svgColors] ??
      virtualscapeTileColors[terrain as keyof typeof virtualscapeTileColors]
    )
  }
  // StartZone: virtualscape colors, might be other designs
  if (terrain === HexTerrain.startZone) {
    return hexTerrainColor[hex.inventoryID as keyof typeof hexTerrainColor]
  }
  if (hex.terrain === HexTerrain.brush) {
    return svgColors.fillJungle
  }
  if (hex.terrain === HexTerrain.marvelRuin) {
    return svgColors.castleWall
  }
  if (hex.terrain === HexTerrain.palm) {
    // Renegade shows brush and palm as same color
    return svgColors.fillJungle // renegade-hexoscape
  }
  if (terrain === HexTerrain.ruin) {
    return svgColors.ruin
  }
  if (isEvergreenTree(terrain)) {
    return svgColors.tree
  }
  if (terrain === HexTerrain.hive) {
    return svgColors.swampWater
  }
  if (terrain === HexTerrain.glacier) {
    return svgColors.ice
  }
  if (terrain === HexTerrain.outcrop) {
    return svgColors.outcrop
  }
  if (hex.terrain === HexTerrain.lavaRockOutcrop) {
    return svgColors.lava
  }
  if (hex.terrain === HexTerrain.castleWall) {
    return svgColors.castleWall
  }
  if (hex.terrain === HexTerrain.castleBase) {
    return svgColors.castleBase
  }
  return 'transparent'
}
export const getSvgHexSubLevelFillColor = (hex: BoardHex | DecodedPieceID) => {
  // TODO: color: refactor this to be more direct
  if (hex.inventoryID === Pieces.laurWallShort) {
    return svgSubLevelColors[HexTerrain.laurWall]
  }
  if (
    isSolidTerrainHex(hex.terrain) ||
    isFluidTerrainHex(hex.terrain) ||
    hex.terrain === HexTerrain.laurWall ||
    hex.terrain === HexTerrain.laurWallAddon ||
    hex.terrain === HexTerrain.fortifiedWall ||
    hex.terrain === HexTerrain.roadWall ||
    hex.terrain === HexTerrain.glyphPower ||
    hex.terrain === HexTerrain.glyphTreasure ||
    hex.terrain === HexTerrain.tree ||
    hex.terrain === HexTerrain.battlement ||
    hex.terrain === HexTerrain.hive ||
    hex.terrain === HexTerrain.ladder
  ) {
    return (
      svgSubLevelColors?.[hex.terrain as keyof typeof svgSubLevelColors] ??
      virtualscapeTileColors[hex.terrain as keyof typeof virtualscapeTileColors]
    )
  }
  // StartZone: virtualscape colors, might be other designs
  if (hex.terrain === HexTerrain.startZone) {
    return hexTerrainColor[hex.inventoryID as keyof typeof hexTerrainColor]
  }
  if (hex.terrain === HexTerrain.brush) {
    return svgSubLevelColors.fillJungle
  }
  if (hex.terrain === HexTerrain.marvelRuin) {
    return svgSubLevelColors.castleWall
  }
  if (hex.terrain === HexTerrain.palm) {
    // Renegade shows brush and palm as same color
    return svgSubLevelColors.fillJungle // renegade-hexoscape
    // return svgSubLevelColors.palm
  }
  if (hex.terrain === HexTerrain.ruin) {
    return svgSubLevelColors.ruin
  }
  if (isEvergreenTree(hex.terrain)) {
    return svgSubLevelColors.tree
  }
  if (hex.terrain === HexTerrain.hive) {
    return svgSubLevelColors.swampWater
  }
  if (hex.terrain === HexTerrain.glacier) {
    return svgSubLevelColors.ice
  }
  if (hex.terrain === HexTerrain.outcrop) {
    return svgSubLevelColors.outcrop
  }
  if (hex.terrain === HexTerrain.lavaRockOutcrop) {
    return svgSubLevelColors.lava
  }
  if (hex.terrain === HexTerrain.castleWall) {
    return svgSubLevelColors.castleWall
  }
  if (hex.terrain === HexTerrain.castleBase) {
    return svgSubLevelColors.castleBase
  }
  return 'transparent'
}
