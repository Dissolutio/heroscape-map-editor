// import { clone } from 'lodash'
import {
  type AddRemovePieceError,
  type AddRemovePieceReturn,
  type BoardHexes,
  type BoardPieces,
  HexTerrain,
  PiecePrefixes,
  Pieces,
} from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { genBoardHexID } from '../utils/map-utils'
import { addPiece } from './addPiece'
import { isEdgeNodePieceID } from './hexGrid/pieceCells'
import { piecesSoFar } from './pieces'

export type RemovePieceArgs = {
  uid: string
  boardHexes: BoardHexes
  boardPieces: BoardPieces
}

export function removePiece({
  // state to mutate and return
  boardHexes,
  boardPieces,
  // input
  uid,
}: RemovePieceArgs): AddRemovePieceReturn {
  let error: AddRemovePieceError
  const boardPiece = boardPieces.find((bp) => bp.uid === uid)
  if (!boardPiece) {
    error = { message: `Cannot remove piece ${uid}: it is not on the board` }
    return { newBoardHexes: boardHexes, newBoardPieces: boardPieces, error }
  }
  const { inventoryID } = boardPiece
  const piece = piecesSoFar[inventoryID]
  if (!piece) {
    // Unknown pieces are dropped on load, so this should not happen; never throw.
    error = {
      message: `Cannot remove piece ${uid}: unknown inventoryID "${inventoryID}"`,
    }
    return { newBoardHexes: boardHexes, newBoardPieces: boardPieces, error }
  }
  // Shallow copy boardHexes (if needed)
  const newBoardHexes = { ...boardHexes }
  // Remove only the first occurrence of uid from the array
  const idx = boardPieces.findIndex((bp) => bp.uid === uid)
  const newBoardPieces: BoardPieces =
    idx === -1
      ? [...boardPieces]
      : [...boardPieces.slice(0, idx), ...boardPieces.slice(idx + 1)]
  const isCastleBase = piece.id.includes(PiecePrefixes.castleBase)
  const isCastleWall = piece.id.includes(PiecePrefixes.castleWall)
  const isLadder = piece.id === Pieces.ladder
  const isCastleArch =
    piece.id === Pieces.castleArch || piece.id === Pieces.castleArchNoDoor
  const isLandTile =
    isFluidTerrainHex(piece.terrain) || isSolidTerrainHex(piece.terrain)
  const isObstacle = piece.isObstaclePiece

  // PIECEID RENDERED PIECES: laur wall addons, battlements, roadwalls
  // No object delete logic needed; already filtered above
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
    piece.terrain === HexTerrain.fortifiedWall ||
    isObstacle ||
    isLandTile ||
    isCastleArch ||
    isCastleWall ||
    isCastleBase ||
    isLadder
  ) {
    // restore caps to under hexes
    const pieceBoardHexes = Object.values(newBoardHexes).filter(
      (bh) => bh?.boardPieceUID === uid,
    )
    // Use the piece's own recorded support altitude (not surface altitude - 1), since a
    // half-level fluid-on-fluid piece is only 0.5 above its support, not a whole level.
    const underHexIds = pieceBoardHexes.map((cubeCoord) =>
      genBoardHexID({ ...cubeCoord, altitude: boardPiece.altitude }),
    )
    for (const underHexId of underHexIds) {
      if (
        newBoardHexes?.[underHexId]?.terrain === HexTerrain.empty ||
        isSolidTerrainHex(newBoardHexes?.[underHexId]?.terrain) ||
        isFluidTerrainHex(newBoardHexes?.[underHexId]?.terrain)
      ) {
        newBoardHexes[underHexId] = {
          ...newBoardHexes[underHexId],
          isCap: true,
        }
      }
    }
    // remove the hexes
    // Remove all hexes from newBoardHexes that have the given uid
    const freedHexIDs = new Set<string>()
    for (const hexID of Object.keys(newBoardHexes)) {
      if (newBoardHexes[hexID]?.boardPieceUID === uid) {
        delete newBoardHexes[hexID]
        freedHexIDs.add(hexID)
      }
    }
    restoreWallHexes(newBoardHexes, newBoardPieces, freedHexIDs)
    // remove the piece
    // Already filtered above
  }
  return { newBoardHexes, newBoardPieces, error }
}

/**
 * A wall (an edges-and-nodes piece) writes its hexes only where they are free,
 * and any other piece may write over them. When a piece is removed, give each
 * freed hex back to the first wall, in board order, that would have written
 * it, so the board matches a fresh replay of the remaining pieces.
 */
function restoreWallHexes(
  boardHexes: BoardHexes,
  boardPieces: BoardPieces,
  freedHexIDs: Set<string>,
) {
  if (freedHexIDs.size === 0) return
  for (const wall of boardPieces) {
    if (!isEdgeNodePieceID(wall.inventoryID)) continue
    const piece = piecesSoFar[wall.inventoryID]
    if (!piece) continue
    // The hexes this wall writes on an empty board: the same hexes, in the
    // same form, that it writes in a replay.
    const { newBoardHexes: wallHexes } = addPiece({
      piece,
      boardHexes: {},
      boardPieces: [],
      pieceCoords: wall.pieceCoords,
      placementAltitude: wall.altitude,
      rotation: wall.rotation,
      isVsTile: false,
      uid: wall.uid,
      permissive: true,
    })
    for (const [hexID, hex] of Object.entries(wallHexes)) {
      if (freedHexIDs.has(hexID) && !boardHexes[hexID]) {
        boardHexes[hexID] = hex
        freedHexIDs.delete(hexID)
      }
    }
    if (freedHexIDs.size === 0) return
  }
}
