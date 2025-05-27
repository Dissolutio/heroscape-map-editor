import {
  type BoardHexes,
  type BoardPieces,
  type HexMap,
  type MapState,
  Pieces,
  type VirtualScapeTile,
} from '../types'
import { hexUtilsOddRToCube } from '../utils/hex-utils'
import { makeHexagonScenario, makeRectangleScenario } from '../utils/map-gen'
import { decodePieceID } from '../utils/map-utils'
import { addPiece } from './addPiece'
import { pieceCodes } from './pieceCodes'
import { piecesSoFar } from './pieces'

export default function buildupVSFileMap(
  tiles: VirtualScapeTile[],
  mapName: string,
): MapState {
  const blankMap = getBlankHexoscapeMapForVSTiles(tiles, mapName)
  let { boardPieces } = blankMap
  const { boardHexes, hexMap } = blankMap
  // console.log("🚀 ~ tiles:", tiles
  // .filter(t => t.type.toString().startsWith('14'))
  // .map(t => t.glyphLetter), tiles
  //   .filter(t => t.type.toString().startsWith('14'))
  //   .map(t => t.type)
  // )
  // const startZoneTiles = tiles.filter(t => t.type === 15001)
  const newBoardHexes = tiles.reduce((boardHexes: BoardHexes, tile) => {
    const tileCoords = hexUtilsOddRToCube(tile.posX, tile.posY)
    // if (tile.type === 16101 || tile.type === 16102 || tile.type === 16103) {
    //   console.log("Castle base found in virtualscape map!", tileCoords, tile.posZ)
    // }
    // if (tile.type === 16301) {
    //   console.log("Battlement found in virtualscape map!", tileCoords, tile.posZ)
    // }
    // if (tile.type === 16402) {
    //   console.log("Ladder found in virtualscape map! Coords, tile.posZ", tileCoords, tile.posZ)
    // }
    // if (tile.type === 15001) {
    //   console.log("Startzone found in virtualscape map!", tileCoords, tile.colorf)
    // }
    const id = pieceCodes?.[getCodeForVSPersonalTile(tile)] ?? ''
    const piece = piecesSoFar[id]
    if (!piece) {
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
function sortLaurAddonsLaddersBattlementsToEndOfArray(arr: string[]) {
  // adding the laur addons will only work if pillars are already down
  return arr.sort((a, b) => {
    const aPieceID = decodePieceID(a).inventoryID
    const bPieceID = decodePieceID(b).inventoryID
    if (
      aPieceID === Pieces.laurWallRuin ||
      aPieceID === Pieces.laurWallLong ||
      aPieceID === Pieces.laurWallShort ||
      aPieceID === Pieces.ladder ||
      aPieceID === Pieces.battlement
    ) {
      return 1 // Move 'targetValue' to the end
    }if (
      bPieceID === Pieces.laurWallRuin ||
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
  boardPieces: BoardPieces,
  hexMap: HexMap,
): MapState {
  // For JSON maps, the map dimensions are free, we do not have to compute them
  let initialBoardHexes: BoardHexes = {}
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
  const piecesArray = sortLaurAddonsLaddersBattlementsToEndOfArray(
    Object.keys(boardPieces),
  )
  const newBoardHexes = piecesArray.reduce(
    (boardHexes: BoardHexes, pieceAqrrID): BoardHexes => {
      const {
        pieceCoords,
        altitude: placementAltitude,
        rotation,
        inventoryID,
      } = decodePieceID(pieceAqrrID)
      const piece = piecesSoFar[inventoryID]
      if (!piece) {
        return boardHexes // Should probably handle this different, errors etc.
      }

      // get the new board hexes and new board pieces
      const nextBoardHexes = addPiece({
        piece,
        boardHexes,
        boardPieces,
        pieceCoords,
        placementAltitude: placementAltitude, // z is altitude is virtualscape, y is altitude in our app
        rotation: rotation,
        isVsTile: false,
      }).newBoardHexes
      return nextBoardHexes
    },
    initialBoardHexes,
  )

  return {
    boardHexes: newBoardHexes,
    hexMap: hexMap,
    boardPieces,
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
    tiles.forEach((t) => {
      t.posX -= xIncrementsWorthEmpty * 2
    })
  }
  if (yIncrementsWorthEmpty > 0) {
    tiles.forEach((t) => {
      t.posY -= yIncrementsWorthEmpty * 2
    })
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
function getCodeForVSPersonalTile(tile: VirtualScapeTile) {
  // this function is a monkeypatch
  // this function was created to simply transform personal tiles, created in Virtualscape, to be used in this app, quickly, or just return the original pieceCode
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('pillar')
  ) {
    return 17101 // is now the laurPillar code, never existed in virtualscape
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('wellspring')
  ) {
    return 17001
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('lavafield3')
  ) {
    return 7003
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('lavafield24')
  ) {
    return 7024
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('snow3')
  ) {
    return 9003
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('snow7')
  ) {
    return 9007
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('snow24')
  ) {
    return 9024
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('sand24')
  ) {
    return 3024
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('swampwater3')
  ) {
    return 19003
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().startsWith('water3')
  ) {
    return 4003
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('lava3')
  ) {
    return 6003
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('shadow3')
  ) {
    return 25003
  }
  if (
    tile.type === 17000 &&
    (tile?.personal?.name ?? '').toLowerCase().includes('ice3')
  ) {
    return 5003
  }
  return tile.type
}
