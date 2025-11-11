import { addPieceToBoardHexes } from "../data/addPiece"
import { piecesSoFar } from "../data/pieces"
import type { BoardHexes, BoardPiece, BoardPieces, HexMap, MapState } from "../types"
import { sortLaurAddonsLaddersBattlementsToEndOfArray } from "../utils/board-utils"
import { makeHexagonMapEmptyHexes, makeRectangleMapEmptyHexes } from "../utils/hex-gen"
import { genPieceObjectUid } from "../utils/map-utils"

self.onmessage = (event: MessageEvent<MapState>) => {
  const hexMap = event?.data?.hexMap
  const boardPieces = event?.data?.boardPieces
  // let blankHexes: BoardHexes = {}
  // if (hexMap.shape === 'rectangle') {
  //   blankHexes = makeRectangleMapEmptyHexes(hexMap.width, hexMap.length)
  // } else {
  //   blankHexes = makeHexagonMapEmptyHexes(hexMap.length)
  // }
  const result = buildupBoardHexes(boardPieces, hexMap)
  self.postMessage(result)
}

function buildupBoardHexes(
  boardPieces: BoardPieces,
  hexMap: HexMap,
): BoardHexes {
  // For JSON maps, the map dimensions are free, we do not have to compute them
  let initialBoardHexes: BoardHexes = {}
  // 1st, create the base layer of empty hexes
  if (hexMap.shape === 'rectangle') {
    initialBoardHexes = makeRectangleMapEmptyHexes(hexMap.length, hexMap.width)
  } else {
    initialBoardHexes = makeHexagonMapEmptyHexes(hexMap.length)
  }
  const boardPiecesSortedByAltitude = boardPieces.sort((a, b) => {
    if (a.altitude > b.altitude) {
      return 1 // Move 'targetValue' to the end
    }
    return -1 // Move 'targetValue' to the end
  })
  const piecesArray = sortLaurAddonsLaddersBattlementsToEndOfArray(boardPiecesSortedByAltitude)
  const newBoardHexes = piecesArray.reduce(
    (prev: BoardHexes, curr): BoardHexes => {
      const {
        pieceCoords,
        altitude,
        rotation,
        inventoryID,
      } = curr
      const piece = piecesSoFar[inventoryID]
      if (!piece) {
        return prev // Should probably handle this different, errors etc.
      }
      const pieceObject: BoardPiece = {
        uid: genPieceObjectUid(), // new unique instance id (e.g., 'bp_abc123' or uuid/v4/nanoid)
        inventoryID,
        altitude,
        rotation,
        pieceCoords,
      }
      // get the new board hexes and new board pieces
      const newBoardHexes = addPieceToBoardHexes({
        boardPiece: pieceObject,
        pieceData: piece,
        boardHexes: prev,
        isVsTile: false,
      })
      return newBoardHexes
    },
    initialBoardHexes,
  )

  return newBoardHexes
}

