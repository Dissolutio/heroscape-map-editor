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
import { generateHexagon, generateRectangle } from '../utils/hex-gen'
import {
  HEX_DIRECTIONS,
  hexUtilsAdd,
  hexUtilsOddRToCube,
} from '../utils/hex-utils'
import { makeRectangleScenario } from '../utils/map-gen'
import {
  type DroppedBoardPiece,
  dropUnknownBoardPieces,
} from '../utils/map-utils'
import { addPiece } from './addPiece'
import { fitMapToPieces } from './fitMapToPieces'
import { pieceCodes } from './pieceCodes'
import { piecesSoFar } from './pieces'
import { getCodeForVSPersonalTile } from './readVirtualscapeMapFile'

export default function buildupVSFileMap(
  tiles: VirtualScapeTile[],
  mapName: string,
): VirtualScapeMapLoadResult {
  const blankMap = getBlankHexoscapeMapForVSTiles(tiles, mapName)
  let { boardPieces } = blankMap
  const { boardHexes, hexMap } = blankMap
  const mappedTiles = tiles.map((tile) => {
    const code = getCodeForVSPersonalTile(tile)
    return {
      tile,
      inventoryID: pieceCodes?.[code] ?? String(code ?? tile.type),
    }
  })
  const { boardPieces: knownTiles, droppedPieces } =
    dropUnknownBoardPieces(mappedTiles)
  const newBoardHexes = knownTiles.reduce(
    (boardHexes: BoardHexes, { tile, inventoryID }) => {
      const tileCoords = hexUtilsOddRToCube(tile.posX, tile.posY)
      const piece = piecesSoFar[inventoryID]
      if (!piece?.terrain) {
        return boardHexes
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
    },
    boardHexes,
  )
  return {
    boardHexes: newBoardHexes,
    hexMap: hexMap,
    boardPieces,
    droppedPieces,
  }
}
// Replay support-dependent placements last. Ladders write boardHexes and need
// their supporting surface first; the boardPieces-only add-ons still need a
// stable supports-first order in the saved piece list.
const PLACED_AFTER_SUPPORTS = new Set<string>([
  Pieces.laurWallRuin1,
  Pieces.laurWallLong,
  Pieces.laurWallShort,
  Pieces.laurWallShortStackable,
  Pieces.laurWallLongStackable,
  Pieces.laurWallArch,
  Pieces.laurWallRuin2,
  Pieces.laurWallRuin3,
  Pieces.ladder,
  Pieces.battlement,
  Pieces.roadWall,
  Pieces.ropeLadder,
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
  /** Pieces omitted because they are malformed, unknown, or too far away. */
  droppedPieces: DroppedBoardPiece[]
  dimensionsAdjusted?: boolean
}
export type VirtualScapeMapLoadResult = MapState & {
  /** Tiles omitted because their Virtualscape code is not recognized. */
  droppedPieces: DroppedBoardPiece[]
}
export function buildupJsonFileMap(
  boardPieces: BoardPiece[],
  hexMap: HexMap,
  droppedMalformedPieces: DroppedBoardPiece[] = [],
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
  const { boardPieces: knownBoardPieces, droppedPieces: unknownPieces } =
    dropUnknownBoardPieces(boardPieces)
  const droppedPieces = [...droppedMalformedPieces, ...unknownPieces]
  const fitted = fitMapToPieces(migratedHexMap, knownBoardPieces)
  const fittedHexMap = fitted.hexMap
  const droppedForFit = new Set(fitted.droppedPieces ?? [])
  const initialBoardPieces = clone(
    knownBoardPieces.filter((boardPiece) => !droppedForFit.has(boardPiece)),
  )
  droppedPieces.push(
    ...(fitted.droppedPieces ?? []).map(({ uid, inventoryID }) => ({
      uid,
      inventoryID,
      reason: 'too-far' as const,
    })),
  )
  let finalBoardPieces: BoardPieces = []
  if (fittedHexMap.shape === 'rectangle') {
    initialBoardHexes = generateRectangle(
      fittedHexMap.length,
      fittedHexMap.width,
      fittedHexMap.originQ ?? 0,
      fittedHexMap.originR ?? 0,
    )
  } else {
    initialBoardHexes = generateHexagon(
      Math.max(fittedHexMap.length, fittedHexMap.width) - 1,
      fittedHexMap.originQ ?? 0,
      fittedHexMap.originR ?? 0,
    )
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
    hexMap: fittedHexMap,
    boardPieces: finalBoardPieces,
    droppedPieces,
    dimensionsAdjusted: fitted.changed,
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
