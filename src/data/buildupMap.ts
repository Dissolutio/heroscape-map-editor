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
import {
  normalizeLegacyMapOrigin,
  trimAndNormalizeMap,
} from './convertMapShape'
import { fitMapToPieces } from './fitMapToPieces'
import { getBuiltInSeatedBaseMerges } from './seatedObstacles'
import {
  generateObjectiveMarkerUID,
  normalizeObjectiveMarkers,
} from './objectiveMarkers'
import {
  normalizeSavedSelections,
  pruneSavedSelections,
} from './selectionUnits'
import { pieceCodes } from './pieceCodes'
import { piecesSoFar } from './pieces'
import {
  getCodeForVSPersonalTile,
  getHexoscapeLaurRotation,
  getHexoscapeRopeLadderAltitude,
} from './readVirtualscapeMapFile'
import { isLaurPillarID } from './laurPillarStacking'
import { isPortAddonPieceID } from './portPieces'
import { virtualscapeLaurPillarBaseName } from './pieceCodes'

function addMissingMarvelBases(tiles: VirtualScapeTile[]) {
  const hasConcreteBase = (marvel: VirtualScapeTile) =>
    tiles.some((tile) => {
      if (tile.posX !== marvel.posX || tile.posY !== marvel.posY) return false
      if (tile.posZ !== marvel.posZ - 1 || tile.rotation !== marvel.rotation) {
        return false
      }
      const code = getCodeForVSPersonalTile(tile)
      const inventoryID = pieceCodes[code] ?? String(code ?? tile.type)
      return inventoryID === Pieces.concrete6
    })

  return tiles.flatMap((tile) => {
    const code = getCodeForVSPersonalTile(tile)
    const inventoryID = pieceCodes[code] ?? String(code ?? tile.type)
    if (
      (inventoryID !== Pieces.marvel &&
        inventoryID !== Pieces.marvelBroken &&
        inventoryID !== Pieces.marvelNoUpper &&
        inventoryID !== Pieces.marvelNoUpperBroken) ||
      hasConcreteBase(tile)
    ) {
      return [tile]
    }
    return [
      { ...tile, type: 21006, virtualscapeName: '', posZ: tile.posZ - 1 },
      tile,
    ]
  })
}

export default function buildupVSFileMap(
  tiles: VirtualScapeTile[],
  mapName: string,
  mapAuthor = '',
  mapNotes = '',
): VirtualScapeMapLoadResult {
  const blankMap = getBlankHexoscapeMapForVSTiles(tiles, mapName)
  let { boardPieces } = blankMap
  const { boardHexes, hexMap } = blankMap
  hexMap.author = mapAuthor
  hexMap.mapNotes = mapNotes
  const isPillarTile = (tile: VirtualScapeTile) =>
    isLaurPillarID(
      pieceCodes?.[getCodeForVSPersonalTile(tile)] ??
        String(getCodeForVSPersonalTile(tile) ?? tile.type),
    )
  const pairedPillarBases = new Set<VirtualScapeTile>()
  const pairedPillars = new Set<VirtualScapeTile>()
  for (const base of tiles.filter(
    (tile) => tile.virtualscapeName === virtualscapeLaurPillarBaseName,
  )) {
    const pillar = tiles.find(
      (tile) =>
        tile.posX === base.posX &&
        tile.posY === base.posY &&
        tile.posZ === base.posZ + 1 &&
        isPillarTile(tile),
    )
    if (pillar) {
      pairedPillarBases.add(base)
      pairedPillars.add(pillar)
    }
  }
  const objectiveMarkers = normalizeObjectiveMarkers(
    tiles
      .filter((tile) => tile.type >= 15101 && tile.type <= 15106)
      .map((tile) => ({
        uid: generateObjectiveMarkerUID(),
        anchor: {
          ...hexUtilsOddRToCube(tile.posX, tile.posY),
          altitude: tile.posZ,
        },
        size: 1,
        rotation: tile.rotation,
        style: 'black',
        content: { kind: 'number', value: tile.type - 15100 },
        name: tile.startName,
      })),
  )
  if (objectiveMarkers.length) {
    hexMap.objectiveMarkers = objectiveMarkers
  }
  const tilesWithMarvelBases = addMissingMarvelBases(tiles)
  const mappedTiles = tilesWithMarvelBases.flatMap((tile) => {
    if (tile.type >= 15101 && tile.type <= 15106) return []
    if (tile.virtualscapeName === virtualscapeLaurPillarBaseName) {
      return pairedPillarBases.has(tile)
        ? []
        : [{ tile, inventoryID: virtualscapeLaurPillarBaseName }]
    }
    const code = getCodeForVSPersonalTile(tile)
    const inventoryID =
      code === 4002
        ? Pieces.water1
        : (pieceCodes?.[code] ?? String(code ?? tile.type))
    let altitude = tile.posZ
    if (code === 4002) {
      return [
        { tile: { ...tile, posZ: altitude }, inventoryID: Pieces.water1 },
        { tile: { ...tile, posZ: altitude + 1 }, inventoryID: Pieces.water1 },
      ]
    }
    if (inventoryID === Pieces.ropeLadder) {
      altitude = getHexoscapeRopeLadderAltitude(altitude)
    } else if (isLaurPillarID(inventoryID) && pairedPillars.has(tile)) {
      altitude -= 1
    } else if (
      isPortAddonPieceID(inventoryID) &&
      [...pairedPillars].some(
        (pillar) =>
          tile.posX === pillar.posX &&
          tile.posY === pillar.posY &&
          tile.posZ === pillar.posZ,
      )
    ) {
      altitude -= 1
    }
    return [{ tile: { ...tile, posZ: altitude }, inventoryID }]
  })
  const { boardPieces: knownTiles, droppedPieces } =
    dropUnknownBoardPieces(mappedTiles)
  let newBoardHexes = knownTiles.reduce(
    (boardHexes: BoardHexes, { tile, inventoryID }) => {
      const tileCoords = hexUtilsOddRToCube(tile.posX, tile.posY)
      const piece = piecesSoFar[inventoryID]
      if (!piece?.terrain) {
        return boardHexes
      }
      // get the new board hexes and new board pieces
      let result = addPiece({
        piece,
        boardHexes,
        boardPieces,
        pieceCoords: tileCoords,
        placementAltitude: tile.posZ, // z is altitude is virtualscape, y is altitude in our app
        rotation:
          inventoryID === Pieces.deflectorShield
            ? (tile.rotation + 4.5) % 6 // Virtualscape zero faces Hexoscape 4.5.
            : getHexoscapeLaurRotation(inventoryID, tile.rotation),
        isVsTile: true,
      })
      if (result.error) {
        result = addPiece({
          piece,
          boardHexes,
          boardPieces,
          pieceCoords: tileCoords,
          placementAltitude: tile.posZ,
          rotation:
            inventoryID === Pieces.deflectorShield
              ? (tile.rotation + 4.5) % 6
              : getHexoscapeLaurRotation(inventoryID, tile.rotation),
          isVsTile: true,
          permissive: true,
        })
      }
      boardPieces = result.newBoardPieces
      return result.newBoardHexes
    },
    boardHexes,
  )
  const merges = getBuiltInSeatedBaseMerges(
    newBoardHexes,
    boardPieces,
    hexMap.setsUsed,
  )
  const mergedSeatedBaseCount = merges.removedBaseUIDs.size
  if (mergedSeatedBaseCount) {
    const adjustedPieces = boardPieces
      .filter((piece) => !merges.removedBaseUIDs.has(piece.uid))
      .map((piece) =>
        merges.loweredObstacleUIDs.has(piece.uid)
          ? { ...piece, altitude: piece.altitude - 1 }
          : piece,
      )
    const replayed = replayBoardPieces(adjustedPieces, boardHexes)
    newBoardHexes = replayed.newBoardHexes
    boardPieces = replayed.finalBoardPieces
  }
  return {
    boardHexes: newBoardHexes,
    hexMap: hexMap,
    boardPieces,
    savedSelections: [],
    droppedPieces,
    mergedSeatedBaseCount,
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

function replayBoardPieces(
  boardPieces: BoardPiece[],
  initialBoardHexes: BoardHexes,
) {
  let finalBoardPieces: BoardPieces = []
  const newBoardHexes = boardPieces.reduce(
    (prev: BoardHexes, curr): BoardHexes => {
      const piece = piecesSoFar[curr.inventoryID]
      if (!piece) return prev
      const result = addPiece({
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
      finalBoardPieces = result.newBoardPieces
      return result.newBoardHexes
    },
    initialBoardHexes,
  )

  return { newBoardHexes, finalBoardPieces }
}

export type JsonMapLoadResult = MapState & {
  /** Pieces omitted because they are malformed, unknown, or too far away. */
  droppedPieces: DroppedBoardPiece[]
  droppedObjectiveMarkers?: NonNullable<HexMap['objectiveMarkers']>
  dimensionsAdjusted?: boolean
  mergedSeatedBaseCount: number
}
export type VirtualScapeMapLoadResult = MapState & {
  /** Tiles omitted because their Virtualscape code is not recognized. */
  droppedPieces: DroppedBoardPiece[]
  mergedSeatedBaseCount: number
}
export function buildupJsonFileMap(
  boardPieces: BoardPiece[],
  hexMap: HexMap,
  droppedMalformedPieces: DroppedBoardPiece[] = [],
  savedSelections?: unknown,
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

  const mapWithNormalizedMarkers: HexMap =
    'objectiveMarkers' in migratedHexMap
      ? {
          ...migratedHexMap,
          objectiveMarkers: normalizeObjectiveMarkers(
            migratedHexMap.objectiveMarkers,
          ),
        }
      : migratedHexMap

  const originNormalized = normalizeLegacyMapOrigin(
    mapWithNormalizedMarkers,
    boardPieces,
  )

  // For JSON maps, the map dimensions are free, we do not have to compute them
  let initialBoardHexes: BoardHexes = {}
  const { boardPieces: knownBoardPieces, droppedPieces: unknownPieces } =
    dropUnknownBoardPieces(originNormalized.boardPieces)
  const droppedPieces = [...droppedMalformedPieces, ...unknownPieces]
  const fitted = fitMapToPieces(originNormalized.hexMap, knownBoardPieces)
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
  let { newBoardHexes, finalBoardPieces } = replayBoardPieces(
    sortBoardPiecesForLoad(initialBoardPieces),
    initialBoardHexes,
  )
  const merges = getBuiltInSeatedBaseMerges(
    newBoardHexes,
    finalBoardPieces,
    fittedHexMap.setsUsed,
  )
  const mergedSeatedBaseCount = merges.removedBaseUIDs.size
  if (mergedSeatedBaseCount) {
    const adjustedPieces = finalBoardPieces
      .filter((piece) => !merges.removedBaseUIDs.has(piece.uid))
      .map((piece) =>
        merges.loweredObstacleUIDs.has(piece.uid)
          ? { ...piece, altitude: piece.altitude - 1 }
          : piece,
      )
    ;({ newBoardHexes, finalBoardPieces } = replayBoardPieces(
      sortBoardPiecesForLoad(adjustedPieces),
      initialBoardHexes,
    ))
  }

  return {
    boardHexes: newBoardHexes,
    hexMap: fittedHexMap,
    boardPieces: finalBoardPieces,
    savedSelections: pruneSavedSelections(
      normalizeSavedSelections(savedSelections),
      new Set(finalBoardPieces.map((piece) => piece.uid)),
      new Set(
        (fittedHexMap.objectiveMarkers ?? []).map((marker) => marker.uid),
      ),
    ),
    droppedPieces,
    mergedSeatedBaseCount,
    ...(fitted.droppedObjectiveMarkers
      ? { droppedObjectiveMarkers: fitted.droppedObjectiveMarkers }
      : {}),
    dimensionsAdjusted: fitted.changed,
  }
}

export function trimVirtualscapeMap(
  loadedMap: VirtualScapeMapLoadResult,
): JsonMapLoadResult {
  const trimmed = trimAndNormalizeMap(loadedMap.hexMap, loadedMap.boardPieces)
  if (!trimmed.ok) return loadedMap

  const rebuilt = buildupJsonFileMap(
    trimmed.boardPieces,
    trimmed.hexMap,
    loadedMap.droppedPieces,
  )
  return {
    ...rebuilt,
    mergedSeatedBaseCount: loadedMap.mergedSeatedBaseCount,
  }
}

function getBlankHexoscapeMapForVSTiles(
  tiles: VirtualScapeTile[],
  mapName: string,
): MapState {
  if (!tiles.length) return makeRectangleScenario({ mapName })

  const cushionToPadY = 8
  const cushionToPadX = 6
  const minX = Math.min(...tiles.map((tile) => tile.posX))
  const maxX = Math.max(...tiles.map((tile) => tile.posX))
  const minY = Math.min(...tiles.map((tile) => tile.posY))
  const maxY = Math.max(...tiles.map((tile) => tile.posY))
  const originQ = minX - cushionToPadX
  const originR = minY - cushionToPadY
  const length = maxY - minY + cushionToPadY * 2 + 1
  const width = maxX - minX + cushionToPadX * 2 + 1

  return makeRectangleScenario({
    length,
    width,
    originQ,
    originR,
    mapName,
  })
}
