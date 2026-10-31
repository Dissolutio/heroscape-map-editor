import type { BoardPiece, BoardPieces, HexMap } from '../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { genBoardHexID } from '../utils/map-utils'
import { mapTableHexes } from './fitMapToPieces'
import {
  type ObjectiveMarker,
  getObjectiveMarkerFootprint,
} from './objectiveMarkers'
import { piecesSoFar } from './pieces'
import getPieceTemplateCoords from './rotationTransforms'

export type MapDimension = 'length' | 'width'

export function resizeMap(
  hexMap: HexMap,
  boardPieces: BoardPieces,
  dimension: MapDimension,
  delta: 1 | -1,
): {
  hexMap: HexMap
  boardPieces: BoardPieces
} {
  const resizedHexMap = {
    ...hexMap,
    [dimension]: hexMap[dimension] + delta,
    ...(hexMap.shape === 'hexagon'
      ? {
          length: hexMap.length + delta,
          width: hexMap.width + delta,
        }
      : {}),
  }

  if (hexMap.shape !== 'hexagon') {
    return { hexMap: resizedHexMap, boardPieces }
  }

  const firstDirection = delta === 1 ? 0 : 3
  const secondDirection = delta === 1 ? 1 : 4
  const shift = HEX_DIRECTIONS[firstDirection]
  const secondShift = HEX_DIRECTIONS[secondDirection]
  const shiftedPieces: BoardPieces = boardPieces.map(
    (boardPiece: BoardPiece) => {
      const firstCoords = hexUtilsAdd(boardPiece.pieceCoords, shift)
      return {
        ...boardPiece,
        pieceCoords: hexUtilsAdd(firstCoords, secondShift),
      }
    },
  )
  const shiftedObjectiveMarkers = hexMap.objectiveMarkers?.map((marker) => ({
    ...marker,
    anchor: {
      ...hexUtilsAdd(hexUtilsAdd(marker.anchor, shift), secondShift),
      altitude: marker.anchor.altitude,
    },
  }))

  return {
    hexMap: {
      ...resizedHexMap,
      ...(shiftedObjectiveMarkers
        ? { objectiveMarkers: shiftedObjectiveMarkers }
        : {}),
    },
    boardPieces: shiftedPieces,
  }
}

export function canShrinkMapWithoutDroppingPieces(
  hexMap: HexMap,
  boardPieces: BoardPieces,
  dimension: MapDimension,
) {
  if (hexMap[dimension] <= 1) return false

  const resized = resizeMap(hexMap, boardPieces, dimension, -1)
  const tableHexes = mapTableHexes(resized.hexMap)
  const piecesFit = resized.boardPieces.every((boardPiece) => {
    const piece = piecesSoFar[boardPiece.inventoryID]
    if (!piece) return true

    return getPieceTemplateCoords({
      clickedHex: boardPiece.pieceCoords,
      rotation: boardPiece.rotation,
      template: piece.template,
      isVsTile: false,
    }).every((coords) =>
      tableHexes.has(genBoardHexID({ ...coords, altitude: 0 })),
    )
  })
  if (!piecesFit) return false

  return (resized.hexMap.objectiveMarkers ?? []).every((marker) =>
    objectiveMarkerFitsOnMap(marker, tableHexes),
  )
}

function objectiveMarkerFitsOnMap(
  marker: ObjectiveMarker,
  tableHexes: Set<string>,
) {
  return getObjectiveMarkerFootprint(marker).every((coords) =>
    tableHexes.has(genBoardHexID({ ...coords, altitude: 0 })),
  )
}
