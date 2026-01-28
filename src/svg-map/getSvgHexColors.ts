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
  const isSolidTerrain = isSolidTerrainHex(terrain)
  if (terrain === 'empty') {
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
  if (terrain === HexTerrain.road && inventoryPiece.size === 5) {
    return svgColors.outlineRoad5
  }
  if (terrain === HexTerrain.concrete && inventoryPiece.size === 6) {
    return svgColors.outlineMarvel
  }
  if (terrain === HexTerrain.wallWalk && inventoryPiece.size === 9) {
    return svgColors.outlineMarvel
  }
  if (
    terrain === HexTerrain.hive ||
    terrain === HexTerrain.water ||
    terrain === HexTerrain.wellspringWater ||
    terrain === HexTerrain.swampWater ||
    terrain === HexTerrain.ice ||
    terrain === HexTerrain.lava ||
    terrain === HexTerrain.shadow
  ) {
    return svgColors.outlineWater
  }
  if (isJungleTerrainHex(terrain)) {
    return svgColors.outlineJungle
  }
  if (isEvergreenTree(terrain)) {
    return svgColors.outlineTree
  }
  if (terrain === HexTerrain.laurWall || terrain === HexTerrain.laurWallAddon) {
    return svgColors.outlineLaurWall
  }
  if (terrain === HexTerrain.glacier) {
    return svgColors.outlineWater
  }
  if (terrain === HexTerrain.outcrop) {
    return svgColors.outlineOutcrop
  }
  if (terrain === HexTerrain.lavaRockOutcrop) {
    return svgColors.outlineLavaOutcrop
  }
  if (terrain === HexTerrain.castleWall) {
    return svgColors.castleWall
  }
  if (terrain === HexTerrain.castleBase) {
    return svgColors.castleBase
  }
  return 'black'
}
export const getSvgHexSubLevelBorderColor = (
  hex: BoardHex | BoardPiece,
) => {
  console.log("🚀 ~ getSvgHexSubLevelBorderColor ~ hex:", hex)
  const terrain = piecesSoFar?.[hex?.inventoryID]?.terrain
  // TODO: color: refactor this to be more direct
  const isSolidTerrain = isSolidTerrainHex(terrain)
  if (terrain === 'empty') {
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
  if (terrain === HexTerrain.road && inventoryPiece.size === 5) {
    return svgSubLevelColors.outlineRoad5
  }
  if (terrain === HexTerrain.concrete && inventoryPiece.size === 6) {
    return svgSubLevelColors.outlineMarvel
  }
  if (terrain === HexTerrain.wallWalk && inventoryPiece.size === 9) {
    return svgSubLevelColors.outlineMarvel
  }
  if (
    terrain === HexTerrain.hive ||
    terrain === HexTerrain.water ||
    terrain === HexTerrain.wellspringWater ||
    terrain === HexTerrain.swampWater ||
    terrain === HexTerrain.ice ||
    terrain === HexTerrain.lava ||
    terrain === HexTerrain.shadow
  ) {
    return svgSubLevelColors.outlineWater
  }
  if (isJungleTerrainHex(terrain)) {
    return svgSubLevelColors.outlineJungle
  }
  if (isEvergreenTree(terrain)) {
    return svgSubLevelColors.outlineTree
  }
  if (
    terrain === HexTerrain.laurWall ||
    terrain === HexTerrain.laurWallAddon
  ) {
    return svgSubLevelColors.outlineLaurWall
  }
  if (terrain === HexTerrain.glacier) {
    return svgSubLevelColors.outlineWater
  }
  if (terrain === HexTerrain.outcrop) {
    return svgSubLevelColors.outlineOutcrop
  }
  if (terrain === HexTerrain.lavaRockOutcrop) {
    return svgSubLevelColors.outlineLavaOutcrop
  }
  if (terrain === HexTerrain.castleWall) {
    return svgSubLevelColors.castleWall
  }
  if (terrain === HexTerrain.castleBase) {
    return svgSubLevelColors.castleBase
  }
  return 'black'
}

export const getSvgHexFillColor = (hex: BoardHex | BoardPiece) => {
  const terrain = piecesSoFar[hex.inventoryID].terrain
  if (
    isSolidTerrainHex(terrain) ||
    isFluidTerrainHex(terrain) ||
    terrain === HexTerrain.laurWall ||
    terrain === HexTerrain.laurWallAddon ||
    terrain === HexTerrain.fortifiedWall ||
    terrain === HexTerrain.roadWall ||
    terrain === HexTerrain.glyphPower ||
    terrain === HexTerrain.glyphTreasure ||
    terrain === HexTerrain.tree ||
    terrain === HexTerrain.battlement ||
    terrain === HexTerrain.hive ||
    terrain === HexTerrain.ladder
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
  if (terrain === HexTerrain.brush) {
    return svgColors.fillJungle
  }
  if (terrain === HexTerrain.marvelRuin) {
    return svgColors.castleWall
  }
  if (terrain === HexTerrain.palm) {
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
  if (terrain === HexTerrain.lavaRockOutcrop) {
    return svgColors.lava
  }
  if (terrain === HexTerrain.castleWall) {
    return svgColors.castleWall
  }
  if (terrain === HexTerrain.castleBase) {
    return svgColors.castleBase
  }
  return 'transparent'
}
export const getSvgHexSubLevelFillColor = (hex: BoardHex | BoardPiece) => {
  const terrain = piecesSoFar[hex.inventoryID].terrain
  // TODO: color: refactor this to be more direct
  if (hex.inventoryID === Pieces.laurWallShort) {
    return svgSubLevelColors[HexTerrain.laurWall]
  }
  if (
    isSolidTerrainHex(terrain) ||
    isFluidTerrainHex(terrain) ||
    terrain === HexTerrain.laurWall ||
    terrain === HexTerrain.laurWallAddon ||
    terrain === HexTerrain.fortifiedWall ||
    terrain === HexTerrain.roadWall ||
    terrain === HexTerrain.glyphPower ||
    terrain === HexTerrain.glyphTreasure ||
    terrain === HexTerrain.tree ||
    terrain === HexTerrain.battlement ||
    terrain === HexTerrain.hive ||
    terrain === HexTerrain.ladder
  ) {
    return (
      svgSubLevelColors?.[terrain as keyof typeof svgSubLevelColors] ??
      virtualscapeTileColors[terrain as keyof typeof virtualscapeTileColors]
    )
  }
  // StartZone: virtualscape colors, might be other designs
  if (terrain === HexTerrain.startZone) {
    return hexTerrainColor[hex.inventoryID as keyof typeof hexTerrainColor]
  }
  if (terrain === HexTerrain.brush) {
    return svgSubLevelColors.fillJungle
  }
  if (terrain === HexTerrain.marvelRuin) {
    return svgSubLevelColors.castleWall
  }
  if (terrain === HexTerrain.palm) {
    // Renegade shows brush and palm as same color
    return svgSubLevelColors.fillJungle // renegade-hexoscape
    // return svgSubLevelColors.palm
  }
  if (terrain === HexTerrain.ruin) {
    return svgSubLevelColors.ruin
  }
  if (isEvergreenTree(terrain)) {
    return svgSubLevelColors.tree
  }
  if (terrain === HexTerrain.hive) {
    return svgSubLevelColors.swampWater
  }
  if (terrain === HexTerrain.glacier) {
    return svgSubLevelColors.ice
  }
  if (terrain === HexTerrain.outcrop) {
    return svgSubLevelColors.outcrop
  }
  if (terrain === HexTerrain.lavaRockOutcrop) {
    return svgSubLevelColors.lava
  }
  if (terrain === HexTerrain.castleWall) {
    return svgSubLevelColors.castleWall
  }
  if (terrain === HexTerrain.castleBase) {
    return svgSubLevelColors.castleBase
  }
  return 'transparent'
}
