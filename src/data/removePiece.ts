import { clone } from 'lodash'
import {
  AddRemovePieceError,
  BoardHexes,
  BoardPieces,
  CubeCoordinate,
  HexTerrain,
  Piece,
  PiecePrefixes,
  Pieces,
} from '../types'
import {
  isBridgingObstaclePieceID,
  isFluidTerrainHex,
  isObstaclePieceID,
  isRenderedFromPieceIDPiece,
  isSolidTerrainHex,
} from '../utils/board-utils'
import { decodePieceID, genBoardHexID, genPieceID } from '../utils/map-utils'
import { AddRemovePieceReturn } from './addPiece'
import interlockRotationTemplates from './interlock-rotations'
import interlockTemplates from './interlock-templates'
import { piecesSoFar } from './pieces'
import getPieceTemplateCoords from './rotationTransforms'
import {
  interiorHexTemplates,
  verticalObstructionTemplates,
  verticalSupportTemplates,
} from './ruins-templates'

export type RemovePieceArgs = {
  pieceID: string
  boardHexes: BoardHexes
  boardPieces: BoardPieces
}

export function removePiece({
  // state to mutate and return
  boardHexes,
  boardPieces,
  // input
  pieceID,
}: RemovePieceArgs): AddRemovePieceReturn {
  let error: AddRemovePieceError
  const {
    inventoryID,
    altitude: pieceAltitude,
    rotation,
    boardHexID,
    pieceCoords,
  } = decodePieceID(pieceID)
  const piece = piecesSoFar[inventoryID]
  const newBoardHexes = clone(boardHexes)
  const newBoardPieces = clone(boardPieces)
  // const piecePlaneCoords = getPieceTemplateCoords({
  //   clickedHex: { q: pieceCoords.q, r: pieceCoords.r, s: pieceCoords.s },
  //   rotation,
  //   template: piece.template,
  //   isVsTile: false,
  // })
  const isCastleBase = piece.id.includes(PiecePrefixes.castleBase)
  const isCastleWall = piece.id.includes(PiecePrefixes.castleWall)
  const isLadder = piece.id === Pieces.ladder
  // const isCastleWallPiece = piece.id.includes(PiecePrefixes.castleWall)
  const isCastleArch =
    piece.id === Pieces.castleArch || piece.id === Pieces.castleArchNoDoor
  // Validate
  // const isVerticalClearanceForPiece = newHexIds.every((_, i) => {
  //   const clearanceHexIds = Array(
  //     verticalObstructionTemplates?.[piece.id]?.[i] ?? piece.height,
  //   )
  //     .fill(0)
  //     .map((_, j) => {
  //       const altitude = newPieceAltitude + 1 + j
  //       return genBoardHexID({ ...piecePlaneCoords[i], altitude })
  //     })
  //   return clearanceHexIds.every((clearanceHexId) => {
  //     const hex = newBoardHexes?.[clearanceHexId]
  //     if (!hex) return true // if no boardHex is written, then it is definitely empty
  //     const terrain = hex?.terrain
  //     const isBlocked = isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain)
  //     return !isBlocked
  //   })
  // })
  const isLandTile =
    isFluidTerrainHex(piece.terrain) || isSolidTerrainHex(piece.terrain)
  const isObstacle = isObstaclePieceID(piece.id)

  // PIECEID RENDERED PIECES: laur wall addons, battlements, roadwalls
  if (isRenderedFromPieceIDPiece(inventoryID)) {
    delete newBoardPieces[pieceID]
  }

  // RUINS
  // CASTLE BASE
  // OBSTACLES: trees, bushes, palms, glaciers, outcrops, laurPillar
  if (piece.terrain === HexTerrain.ruin || isObstacle || isCastleBase || isLadder) {
    // remove the hexes
    removePieceIDFromBoardHexes(pieceID, newBoardHexes)
    // remove the piece
    delete newBoardPieces[pieceID]
  }
  //  ARCH (leetle complicated)
  // if(isCastleArch){
  //   error = {
  //     message: "Cannot delete castle "
  //   }
  // }
  // LAND, WALLWALK, CASTLE WALL
  if ((isLandTile || isCastleArch || isCastleWall) && isEachOverheadPieceSupportedByAnotherPiece(newBoardHexes, pieceID)) {
    // restore caps to under hexes
    restoreCapsToEmptyUnderHexes(pieceID, newBoardHexes)
    // remove the hexes
    removePieceIDFromBoardHexes(pieceID, newBoardHexes)
    // remove the piece
    delete newBoardPieces[pieceID]
  }
  return { newBoardHexes, newBoardPieces, error }
}

const removePieceIDFromBoardHexes = (
  pieceID: string,
  boardHexes: BoardHexes,
) => {
  // Remove all hexes from newBoardHexes that have the given pieceID
  Object.keys(boardHexes).forEach((hexID) => {
    if (boardHexes[hexID]?.pieceID === pieceID) {
      delete boardHexes[hexID]
    }
  })
}
const isEachOverheadPieceSupportedByAnotherPiece = (newBoardHexes: BoardHexes, pieceIDRemoving: string) => {
  const pieceBoardHexes = Object.values(newBoardHexes)
    .filter(bh => (bh?.pieceID === pieceIDRemoving))
  const overHexIds = pieceBoardHexes.map((hex) =>
    genBoardHexID({ ...hex, altitude: (hex?.altitude ?? 0) + 1 }),
  )
  const pieceIdsOfOverHexes = Array.from(new Set(overHexIds.map(oh => (
    newBoardHexes?.[oh]?.pieceID
  )).filter(id => id && newBoardHexes?.[id]?.pieceID !== pieceIDRemoving)))
  console.log("🚀 ~ isEachOverheadPieceSupportedByAnotherPiece ~ pieceIdsOfOverHexes:", pieceIdsOfOverHexes)
  return pieceIdsOfOverHexes.every((overPieceID) => {
    // Cannot delete with castle arch over head (unless deleting that arch)
    if (overPieceID.includes(Pieces.castleArch) && overPieceID !== pieceIDRemoving) {
      return false
    }
    const overPieceHexes = Object.values(newBoardHexes).filter(
      (hex) => hex?.pieceID === overPieceID
    )
    const underHexIds = overPieceHexes.map((cubeCoord) =>
      genBoardHexID({ ...cubeCoord, altitude: (cubeCoord.altitude ?? 0) - 1 })
    )
    return underHexIds.some((underHexId) => {
      const underHex = newBoardHexes?.[underHexId]
      return underHex && underHex.pieceID && underHex.pieceID !== pieceIDRemoving && underHex.pieceID !== overPieceID
    })
  })
}
const restoreCapsToEmptyUnderHexes = (pieceIDRemoving: string, newBoardHexes: BoardHexes) => {
  const pieceBoardHexes = Object.values(newBoardHexes)
    .filter(bh => (bh?.pieceID === pieceIDRemoving))
  const underHexIds = pieceBoardHexes.map((cubeCoord) =>
    genBoardHexID({ ...cubeCoord, altitude: (cubeCoord.altitude ?? 0) - 1 })
  )
  underHexIds.forEach((underHexId) => {
    if (newBoardHexes?.[underHexId]?.terrain === 'empty' ||
      isSolidTerrainHex(newBoardHexes?.[underHexId]?.terrain) ||
      isFluidTerrainHex(newBoardHexes?.[underHexId]?.terrain)) {
      newBoardHexes[underHexId].isCap = true
    }
  })
}