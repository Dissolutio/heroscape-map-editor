import { clone } from 'lodash'
import {
  type BoardHexes,
  type BoardPiece,
  type BoardPieces,
  type HexMap,
  type MapState,
  Pieces,
  type VirtualScapeTile,
} from '../types'
import { hexUtilsOddRToCube } from '../utils/hex-utils'
import { makeHexagonScenario, makeRectangleScenario } from '../utils/map-gen'
import { addPiece } from './addPiece'
import { pieceCodes } from './pieceCodes'
import { piecesSoFar } from './pieces'
import { getCodeForVSPersonalTile } from './readVirtualscapeMapFile'

export default function buildupVSFileMap(
  tiles: VirtualScapeTile[],
  mapName: string,
): MapState {
  const blankMap = getBlankHexoscapeMapForVSTiles(tiles, mapName)
  let { boardPieces } = blankMap
  const { boardHexes, hexMap } = blankMap
  const newBoardHexes = tiles.reduce((boardHexes: BoardHexes, tile) => {
    const tileCoords = hexUtilsOddRToCube(tile.posX, tile.posY)
    const id = pieceCodes?.[getCodeForVSPersonalTile(tile)] ?? ''
    const piece = piecesSoFar[id]
    if (!piece || !piece.terrain) {
      return boardHexes // Should probably handle this different, errors etc.
    }
    // get the new board hexes and new board pieces
    const { newBoardHexes, newBoardPieces } = addPiece({
      piece,
      boardHexes,
      boardPieces,
      pieceCoords: tileCoords,
      placementAltitude: tile.posZ, // z is altitude is virtualscape, y is altitude in our app
      rotation: tile.rotation,
      isVsTile: true,
    })
    boardPieces = newBoardPieces
    return newBoardHexes
  }, boardHexes)
  return {
    boardHexes: newBoardHexes,
    hexMap: hexMap,
    boardPieces,
  }
}
function sortLaurAddonsLaddersBattlementsToEndOfArray(arr: BoardPiece[]) {
  // adding the laur addons will only work if pillars are already down
  return arr.sort((a, b) => {
    const aPieceID = a.inventoryID
    const bPieceID = b.inventoryID
    if (
      aPieceID === Pieces.laurWallRuin1 ||
      aPieceID === Pieces.laurWallLong ||
      aPieceID === Pieces.laurWallShort ||
      aPieceID === Pieces.ladder ||
      aPieceID === Pieces.battlement
    ) {
      return 1 // Move 'targetValue' to the end
    }
    if (
      bPieceID === Pieces.laurWallRuin1 ||
      bPieceID === Pieces.laurWallLong ||
      bPieceID === Pieces.laurWallShort ||
      aPieceID === Pieces.ladder ||
      aPieceID === Pieces.battlement
    ) {
      return -1 // Move 'targetValue' to the end
    }
    return 0 // Maintain original order
  })
}
export function buildupJsonFileMap(
  boardPieces: BoardPiece[],
  hexMap: HexMap,
): MapState {
  // For JSON maps, the map dimensions are free, we do not have to compute them
  let initialBoardHexes: BoardHexes = {}
  const initialBoardPieces = clone(boardPieces)
  let finalBoardPieces: BoardPieces = []
  if (hexMap.shape === 'rectangle') {
    initialBoardHexes = makeRectangleScenario({
      length: hexMap.length,
      width: hexMap.width,
      mapName: hexMap.name,
    }).boardHexes
  } else {
    initialBoardHexes = makeHexagonScenario({
      size: hexMap.length,
      mapName: hexMap.name,
    }).boardHexes
  }
  const boardPiecesSortedByAltitude = initialBoardPieces.sort((a, b) => {
    if (a.altitude > b.altitude) {
      return 1 // Move 'targetValue' to the end
    }
    return -1 // Move 'targetValue' to the end
  })
  const piecesArray = sortLaurAddonsLaddersBattlementsToEndOfArray(
    boardPiecesSortedByAltitude,
  )
  const newBoardHexes = piecesArray.reduce(
    (prev: BoardHexes, curr): BoardHexes => {
      const piece = piecesSoFar[curr.inventoryID]
      if (!piece) {
        return prev // Should probably handle this different, errors etc.
      }

      // get the new board hexes and new board pieces
      const { newBoardHexes, newBoardPieces } = addPiece({
        piece,
        boardHexes: prev,
        boardPieces: finalBoardPieces,
        pieceCoords: curr.pieceCoords,
        placementAltitude: curr.altitude,
        rotation: curr.rotation,
        isVsTile: false,
        uid: curr.uid,
      })
      finalBoardPieces = newBoardPieces
      return newBoardHexes
    },
    initialBoardHexes,
  )

  return {
    boardHexes: newBoardHexes,
    hexMap: hexMap,
    boardPieces: finalBoardPieces,
  }
}
function getBlankHexoscapeMapForVSTiles(
  tiles: VirtualScapeTile[],
  mapName: string,
): MapState {
  // cushions have to be an even number because of the coordinate system used in virtualscape
  const cushionToPadY = 8 // 24-hexer's max Y displacement in vscape
  const cushionToPadX = 6 // 24-hexer's max X displacement in vscape
  const xMin = Math.min(...(tiles.map((t) => t.posX - cushionToPadX) ?? 0))
  const yMin = Math.min(...(tiles.map((t) => t.posY - cushionToPadY) ?? 0))
  // remove as many empty hexes as possible from the empty grid we are going to generate
  const xIncrementsWorthEmpty = Math.floor(xMin / 2)
  const yIncrementsWorthEmpty = Math.floor(yMin / 2)
  // MUTATE TILES TO MAKE MAP SMALL AS POSSIBLE
  if (xIncrementsWorthEmpty > 0) {
    for (const t of tiles) {
      t.posX -= xIncrementsWorthEmpty * 2
    }
  }
  if (yIncrementsWorthEmpty > 0) {
    for (const t of tiles) {
      t.posY -= yIncrementsWorthEmpty * 2
    }
  }
  // these are the dimensions of the empty map to generate
  const length = Math.max(...(tiles.map((t) => t.posY + cushionToPadY) ?? 0))
  const width = Math.max(...(tiles.map((t) => t.posX + cushionToPadX) ?? 0))

  return makeRectangleScenario({
    length,
    width,
    mapName,
  })
}
