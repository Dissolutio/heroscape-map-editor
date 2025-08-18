import { clone, cloneDeep } from 'lodash'
import {
  type AddRemovePieceError,
  type AddRemovePieceReturn,
  type BoardHexes,
  type BoardPieces,
  HexTerrain,
  PiecePrefixes,
  Pieces,
} from '../types'
import {
  isFluidTerrainHex,
  isRenderedFromPieceIDPiece,
  isSolidTerrainHex,
} from '../utils/board-utils'
import { decodePieceID, genBoardHexID } from '../utils/map-utils'
import { piecesSoFar } from './pieces'

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
  const newBoardHexes = cloneDeep(boardHexes)
  const newBoardPieces = cloneDeep(boardPieces)
  const isCastleBase = piece.id.includes(PiecePrefixes.castleBase)
  const isCastleWall = piece.id.includes(PiecePrefixes.castleWall)
  const isLadder = piece.id === Pieces.ladder
  const isCastleArch =
    piece.id === Pieces.castleArch || piece.id === Pieces.castleArchNoDoor
  const isLandTile =
    isFluidTerrainHex(piece.terrain) || isSolidTerrainHex(piece.terrain)
  const isObstacle = piece.isObstaclePiece

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
    const pieceBoardHexes = Object.values(newBoardHexes).filter(
      (bh) => bh?.pieceID === pieceID,
    )
    const underHexIds = pieceBoardHexes.map((cubeCoord) =>
      genBoardHexID({ ...cubeCoord, altitude: (cubeCoord.altitude ?? 0) - 1 }),
    )
    for (const underHexId of underHexIds) {
      if (
        newBoardHexes?.[underHexId]?.terrain === HexTerrain.empty ||
        isSolidTerrainHex(newBoardHexes?.[underHexId]?.terrain) ||
        isFluidTerrainHex(newBoardHexes?.[underHexId]?.terrain)
      ) {
        newBoardHexes[underHexId].isCap = true
      }
    }
    // remove the hexes
    // Remove all hexes from newBoardHexes that have the given pieceID
    for (const hexID of Object.keys(newBoardHexes)) {
      if (newBoardHexes[hexID]?.pieceID === pieceID) {
        delete newBoardHexes[hexID]
      }
    }
    // remove the piece
    delete newBoardPieces[pieceID]
  }
  return { newBoardHexes, newBoardPieces, error }
}
