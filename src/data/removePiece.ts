import { clone } from 'lodash'
import {
  type AddRemovePieceError,
  type BoardHexes,
  type BoardPieces,
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
import type { AddRemovePieceReturn } from './addPiece'
import interlockRotationTemplates from './interlock-rotations'
import interlockTemplates from './interlock-templates'
import { piecesSoFar } from './pieces'
import getPieceTemplateCoords from './rotationTransforms'
import {
  interiorHexTemplates,
  verticalObstructionTemplates,
  verticalSupportTemplates,
} from './vertical-obstruction-templates'

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
  const { inventoryID } = decodePieceID(pieceID)
  const piece = piecesSoFar[inventoryID]
  const newBoardHexes = clone(boardHexes)
  const newBoardPieces = clone(boardPieces)
  const isCastleBase = piece.id.includes(PiecePrefixes.castleBase)
  const isCastleWall = piece.id.includes(PiecePrefixes.castleWall)
  const isLadder = piece.id === Pieces.ladder
  const isCastleArch =
    piece.id === Pieces.castleArch || piece.id === Pieces.castleArchNoDoor
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
  // LAND, WALLWALK, CASTLE WALL
  // const isPieceRemoveable = isEachOverheadPieceSupportedByAnotherPiece(newBoardHexes, pieceID)
  // if(!isPieceRemoveable){
  //   error = {message: "Cannot remove piece, other pieces are on top of it"}
  // }
  if (
    piece.terrain === HexTerrain.ruin ||
    isObstacle ||
    isLandTile ||
    isCastleArch ||
    isCastleWall ||
    isCastleBase ||
    isLadder
  ) {
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
// const isEachOverheadPieceSupportedByAnotherPiece = (newBoardHexes: BoardHexes, pieceIDRemoving: string) => {
//   const pieceBoardHexes = Object.values(newBoardHexes)
//     .filter(bh => (bh?.pieceID === pieceIDRemoving))
//   const overHexIds = pieceBoardHexes.map((hex) =>
//     genBoardHexID({ ...hex, altitude: (hex?.altitude ?? 0) + 1 }),
//   )
//   const pieceIdsOfOverHexes = Array.from(new Set(overHexIds.map(oh => (
//     newBoardHexes?.[oh]?.pieceID
//   )).filter(id => id && newBoardHexes?.[id]?.pieceID !== pieceIDRemoving)))
//   return pieceIdsOfOverHexes.every((overPieceID) => {
//     // Cannot delete with castle arch over head (unless deleting that arch)
//     if (overPieceID.includes(Pieces.castleArch) && overPieceID !== pieceIDRemoving) {
//       return false
//     }
//     const overPieceHexes = Object.values(newBoardHexes).filter(
//       (hex) => hex?.pieceID === overPieceID
//     )
//     const underHexIds = overPieceHexes.map((cubeCoord) =>
//       genBoardHexID({ ...cubeCoord, altitude: (cubeCoord.altitude ?? 0) - 1 })
//     )
//     return underHexIds.some((underHexId) => {
//       const underHex = newBoardHexes?.[underHexId]
//       return underHex && underHex.pieceID && underHex.pieceID !== pieceIDRemoving && underHex.pieceID !== overPieceID
//     })
//   })
// }
const restoreCapsToEmptyUnderHexes = (
  pieceIDRemoving: string,
  newBoardHexes: BoardHexes,
) => {
  const pieceBoardHexes = Object.values(newBoardHexes).filter(
    (bh) => bh?.pieceID === pieceIDRemoving,
  )
  const underHexIds = pieceBoardHexes.map((cubeCoord) =>
    genBoardHexID({ ...cubeCoord, altitude: (cubeCoord.altitude ?? 0) - 1 }),
  )
  underHexIds.forEach((underHexId) => {
    if (
      newBoardHexes?.[underHexId]?.terrain === 'empty' ||
      isSolidTerrainHex(newBoardHexes?.[underHexId]?.terrain) ||
      isFluidTerrainHex(newBoardHexes?.[underHexId]?.terrain)
    ) {
      newBoardHexes[underHexId].isCap = true
    }
  })
}
