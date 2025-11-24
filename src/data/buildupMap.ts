import type { BoardPieces, HexMap, MapState, VirtualScapeTile } from '../types'
import { hexUtilsOddRToCube } from '../utils/hex-utils'
import { generateMapID, genPieceObjectUid } from '../utils/map-utils'
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
  const vsTilesAsBoardPieces: BoardPieces = tiles.flatMap((tile) => {
    const tileCoords = hexUtilsOddRToCube(tile.posX, tile.posY)
    const inventoryID = pieceCodes?.[getCodeForVSPersonalTile(tile)] ?? ''

    // Adjust tile origin, since VS moves it per rotation for some pieces (our app rotates pieces around their one unmoving origin hex)
    const originHexCoords = getVSTileOriginCoords({
      pieceCoords: tileCoords,
      rotation: tile.rotation,
      template: piecesSoFar[inventoryID].template,
    })
    // TODO: Adjust rotation for ladders/battlements (VS starts them at rotation-5, instead of our rotation-0)

    // Marvel ruin, place base and obstacle
    if (tile.type === 11006 || tile.type === 11007) {
      return [
        {
          uid: genPieceObjectUid(),
          inventoryID: 'c6',
          pieceCoords: originHexCoords,
          altitude: tile.posZ,
          rotation: tile.rotation,
        },
        {
          uid: genPieceObjectUid(),
          inventoryID: tile.type === 11007 ? 'rmb' : 'rm',
          pieceCoords: originHexCoords,
          altitude: tile.posZ + 1,
          rotation: tile.rotation,
        },
      ]
    }
    // Or just return 1 piece
    return [
      {
        uid: genPieceObjectUid(),
        inventoryID,
        pieceCoords: originHexCoords,
        altitude: tile.posZ,
        rotation: tile.rotation,
      },
    ]
  })
  return {
    boardPieces: vsTilesAsBoardPieces,
    hexMap,
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
