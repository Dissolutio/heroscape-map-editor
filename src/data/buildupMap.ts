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
import {
  HEX_DIRECTIONS,
  hexUtilsAdd,
  hexUtilsOddRToCube,
} from '../utils/hex-utils'
import { makeHexagonScenario, makeRectangleScenario } from '../utils/map-gen'
import {
  type DroppedBoardPiece,
  dropUnknownBoardPieces,
} from '../utils/map-utils'
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
// Placed after everything else on load: Laur add-ons need their pillars down
// first, and ladders/battlements sit on what is below them.
const PLACED_AFTER_SUPPORTS = new Set<string>([
  Pieces.laurWallRuin1,
  Pieces.laurWallLong,
  Pieces.laurWallShort,
  Pieces.ladder,
  Pieces.battlement,
])
const isPlacedAfterSupports = (bp: BoardPiece) =>
  PLACED_AFTER_SUPPORTS.has(bp.inventoryID)
/**
 * Load order: pieces that need supports go last, everything sorted by
 * altitude. Array.prototype.sort is stable, so pieces that tie keep their
 * saved order, which matters because a later piece wins a contested hex.
 */
function sortBoardPiecesForLoad(arr: BoardPiece[]) {
  return arr.sort(
    (a, b) =>
      Number(isPlacedAfterSupports(a)) - Number(isPlacedAfterSupports(b)) ||
      a.altitude - b.altitude,
  )
}
export type JsonMapLoadResult = MapState & {
  /** Pieces left out because this app version does not know their inventoryID. */
  droppedPieces: DroppedBoardPiece[]
}
export function buildupJsonFileMap(
  boardPieces: BoardPiece[],
  hexMap: HexMap,
): JsonMapLoadResult {
  const shouldMigrateLegacyHexagonMap =
    hexMap.shape === 'hexagon' && (hexMap?.version ?? 0) < 1
  const migratedHexMap: HexMap = shouldMigrateLegacyHexagonMap
    ? {
        ...hexMap,
        version: 1,
        length: hexMap.length + 1,
        width: hexMap.width + 1,
      }
    : {
        ...hexMap,
        version: hexMap.version ?? 1,
      }

  // For JSON maps, the map dimensions are free, we do not have to compute them
  let initialBoardHexes: BoardHexes = {}
  const { boardPieces: knownBoardPieces, droppedPieces } =
    dropUnknownBoardPieces(boardPieces)
  const initialBoardPieces = clone(knownBoardPieces)
  let finalBoardPieces: BoardPieces = []
  if (migratedHexMap.shape === 'rectangle') {
    initialBoardHexes = makeRectangleScenario({
      length: migratedHexMap.length,
      width: migratedHexMap.width,
      mapName: migratedHexMap.name,
    }).boardHexes
  } else {
    initialBoardHexes = makeHexagonScenario({
      size: migratedHexMap.length,
      mapName: migratedHexMap.name,
    }).boardHexes
  }
  const piecesArray = sortBoardPiecesForLoad(initialBoardPieces)
  const newBoardHexes = piecesArray.reduce(
    (prev: BoardHexes, curr): BoardHexes => {
      const piece = piecesSoFar[curr.inventoryID]
      if (!piece) {
        return prev // unreachable: unknown pieces were dropped above
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
        permissive: true,
      })
      finalBoardPieces = newBoardPieces
      return newBoardHexes
    },
    initialBoardHexes,
  )

  return {
    boardHexes: newBoardHexes,
    hexMap: migratedHexMap,
    boardPieces: finalBoardPieces,
    droppedPieces,
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
