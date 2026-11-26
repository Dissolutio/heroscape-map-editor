/**
 * Community custom (VC) content: terrain the community released, such as
 * Void and Pylons. It is offered only with the Include VC unit/terrain data
 * setting (`includeVCContent`).
 *
 * The `isVC` flag on a terrain set identifies its pieces. The uninventoried
 * Void Marker is also VC, but is not part of the set's inventory.
 */
import type { BoardPieces } from '../types'
import { Pieces } from '../types'
import { terrainSetsByShortID } from './terrainSets'

type TerrainSetRecord =
  (typeof terrainSetsByShortID)[keyof typeof terrainSetsByShortID]

export const isVCTerrainSet = (set: TerrainSetRecord) =>
  'isVC' in set && set.isVC === true

export const isVCTerrainSetID = (setID: string) => {
  const set = terrainSetsByShortID[setID as keyof typeof terrainSetsByShortID]
  return Boolean(set && isVCTerrainSet(set))
}

const vcPieceIDs: ReadonlySet<string> = new Set(
  Object.values(terrainSetsByShortID)
    .filter(isVCTerrainSet)
    .flatMap((set) => Object.keys(set.inventory)),
)

export const isVCPieceID = (inventoryID: string) =>
  vcPieceIDs.has(inventoryID) || inventoryID === Pieces.voidMarker

/** Whether a piece may be offered, given the Include VC setting. */
export const isPieceOfferedForVC = (
  inventoryID: string,
  includeVCContent: boolean,
) => includeVCContent || !isVCPieceID(inventoryID)

/** Whether a set may be offered, given the Include VC setting. */
export const isSetOfferedForVC = (
  set: TerrainSetRecord,
  includeVCContent: boolean,
) => includeVCContent || !isVCTerrainSet(set)

export const boardPiecesUseVC = (boardPieces: BoardPieces) =>
  boardPieces.some((piece) => isVCPieceID(piece.inventoryID))

export const VC_MAP_LOADED_MESSAGE =
  'This map uses community custom (VC) terrain, so Include VC unit/terrain data is now on.'
