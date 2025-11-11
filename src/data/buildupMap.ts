import { clone } from 'lodash'
import {
  type BoardHexes,
  type BoardPieces,
  type BoardPiecesEncodedArr,
  type HexMap,
  type MapState,
  Pieces,
  type VirtualScapeTile,
} from '../types'
import { hexUtilsOddRToCube } from '../utils/hex-utils'
import { decodePieceID, generateMapID, genPieceObjectUid } from '../utils/map-utils'
import { addPiece } from './addPiece'
import { pieceCodes } from './pieceCodes'
import { piecesSoFar } from './pieces'
import { getCodeForVSPersonalTile } from './readVirtualscapeMapFile'
import { genRandomMapName } from '../utils/genRandomMapName'
import { getVSTileOriginCoords } from './rotationTransforms'

export function buildupVSFileMap(
  tiles: VirtualScapeTile[],
  mapName: string,
): MapState {
  const hexMap = getHexMapForVSTiles(tiles, mapName)
  // let { boardPieces } = blankMap
  // const { boardHexes, hexMap } = blankMap
  const vsTilesAsBoardPieces: BoardPieces = tiles.map(tile => {
    const tileCoords = hexUtilsOddRToCube(tile.posX, tile.posY)
    const inventoryID = pieceCodes?.[getCodeForVSPersonalTile(tile)] ?? ''
    // For VS Marvel ruin, should add a Concrete-6 and move ruin up one altitude
    // Adjust rotation for ladders/battlements (VS starts them at rotation-5, instead of our rotation-0)

    // Adjust tile origin, since VS moves it per rotation for some pieces (our app rotates pieces around their one unmoving origin hex)
    const originHexCoords = getVSTileOriginCoords({
      pieceCoords: tileCoords,
      rotation: tile.rotation,
      template: piecesSoFar[inventoryID].template,
    })

    return {
      uid: genPieceObjectUid(),
      inventoryID,
      pieceCoords: originHexCoords,
      altitude: tile.posZ,
      rotation: tile.rotation,
    }
  })
  return {
    boardPieces: vsTilesAsBoardPieces,
    hexMap
  }
}
function sortLaurAddonsLaddersBattlementsToEndOfArray(arr: BoardPieces) {
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
  boardPieces: BoardPieces,
  hexMap: HexMap,
): MapState {
  // For JSON maps, the map dimensions are free, we do not have to compute them
  const initialBoardPieces = clone(boardPieces)
  const boardPiecesSortedByAltitude = initialBoardPieces.sort((a, b) => {
    if (decodePieceID(a).altitude > decodePieceID(b).altitude) {
      return 1 // Move 'targetValue' to the end
    }
    return -1 // Move 'targetValue' to the end
  })
  const piecesArray = sortLaurAddonsLaddersBattlementsToEndOfArray(
    boardPiecesSortedByAltitude,
  )
  const finalBoardPieces = piecesArray.map(
    (bp) => {
      const piece = piecesSoFar[bp.inventoryID]
      if (!piece) {
        return // Should probably handle this different, errors etc.
      }
      return {

      }
      // get the new board hexes and new board pieces
      // const { newBoardHexes, newBoardPieces } = addPiece({
      //   piece,
      //   boardHexes: prev,
      //   boardPieces: finalBoardPieces,
      //   pieceCoords,
      //   placementAltitude: placementAltitude, // z is altitude is virtualscape, y is altitude in our app
      //   rotation: rotation,
      //   isVsTile: false,
      // })
    }
  )

  return {
    hexMap: hexMap,
    boardPieces: finalBoardPieces,
  }
}
function getHexMapForVSTiles(
  tiles: VirtualScapeTile[],
  mapName: string,
): HexMap {
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
  return {
    id: generateMapID(),
    name: mapName ?? genRandomMapName(),
    author: '',
    shape: 'rectangle',
    width,
    length,
  }
}
