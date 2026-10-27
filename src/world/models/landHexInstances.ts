import { piecesSoFar } from '../../data/pieces'
import {
  type BoardHex,
  type BoardHexes,
  type BoardPiece,
  HexTerrain,
  Pieces,
} from '../../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../../utils/board-utils'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../../utils/hex-utils'
import { getBoardHex3DCoords, genBoardHexID } from '../../utils/map-utils'
import type { GenericTerrainColorSettings } from '../maphex/genericTerrainColors'
import { hexTerrainColor, terrainCapColors } from '../maphex/hexColors'

export const NON_INSTANCED_SUBTERRAIN_PIECES = new Set<string>([
  Pieces.glacier1,
  Pieces.outcrop1,
  Pieces.lavaRockOutcrop1,
  Pieces.glacier3,
  Pieces.lavaRockOutcrop3,
  Pieces.outcrop3,
  Pieces.glacier4,
  Pieces.glacier6,
  Pieces.hive,
])

export const LAND_HEX_SIDE_DIRECTIONS = [0, 1, 2, 3, 4, 5] as const

export type LandHexInstanceDatum = {
  hex: BoardHex
  uid: string
  terrain: string
  isFluid: boolean
  x: number
  y: number
  z: number
  levels: number
  capLayer: -1
  sideLayer: -1
  sideMask: number
  capVisible: boolean
  capColor: string
  sideColor: string
}

export function getLandHexColors(
  terrain: string,
  genericColors: GenericTerrainColorSettings,
) {
  const isFluid = isFluidTerrainHex(terrain)
  const isDirtSubterrain =
    terrain === HexTerrain.grass ||
    terrain === HexTerrain.sand ||
    terrain === HexTerrain.rock
  const genericCapColor =
    terrain === HexTerrain.generic
      ? genericColors.genericSolidCapColor
      : terrain === HexTerrain.genericFluid
        ? genericColors.genericFluidCapColor
        : undefined
  const genericSideColor =
    terrain === HexTerrain.generic
      ? genericColors.genericSolidSideColor
      : terrain === HexTerrain.genericFluid
        ? genericColors.genericFluidSideColor
        : undefined

  const terrainColors = hexTerrainColor as Record<string, string>
  return {
    cap: genericCapColor ?? terrainCapColors[terrain] ?? terrainColors[terrain],
    side:
      genericSideColor ??
      (isDirtSubterrain
        ? hexTerrainColor[HexTerrain.dirt]
        : terrainColors[terrain]),
    isFluid,
  }
}

export function getLandHexDisplayColors(
  datum: Pick<LandHexInstanceDatum, 'capColor' | 'sideColor'>,
  isHighlighted: boolean,
) {
  return isHighlighted
    ? { cap: 'yellow', side: 'yellow' }
    : { cap: datum.capColor, side: datum.sideColor }
}

export function getLandHexSideVisibilityMask(
  hex: BoardHex,
  boardHexes: BoardHexes,
) {
  const isFluid = isFluidTerrainHex(hex.terrain)
  let visibleMask = 0

  for (const direction of LAND_HEX_SIDE_DIRECTIONS) {
    const neighborCoords = hexUtilsAdd(
      { q: hex.q, r: hex.r, s: hex.s },
      HEX_DIRECTIONS[direction],
    )
    const neighbor =
      boardHexes[genBoardHexID({ ...neighborCoords, altitude: hex.altitude })]
    const coveredByLand =
      neighbor &&
      (isSolidTerrainHex(neighbor.terrain) ||
        (isFluid && isFluidTerrainHex(neighbor.terrain)))

    if (!coveredByLand) visibleMask |= 1 << direction
  }

  return visibleMask
}

export function buildLandHexInstanceData(
  boardHexes: BoardHexes,
  boardPieces: BoardPiece[],
  viewingLevel: number,
  genericColors: GenericTerrainColorSettings,
): LandHexInstanceDatum[] {
  const piecesByUID = new Map(boardPieces.map((piece) => [piece.uid, piece]))

  return Object.values(boardHexes)
    .filter(
      (hex) =>
        hex.altitude <= viewingLevel &&
        !hex.isVerticalClearanceHex &&
        Boolean(hex.boardPieceUID),
    )
    .flatMap((hex) => {
      const piece = piecesByUID.get(hex.boardPieceUID ?? '')
      if (!piece || NON_INSTANCED_SUBTERRAIN_PIECES.has(piece.inventoryID)) {
        return []
      }

      const definition = piecesSoFar[piece.inventoryID]
      if (
        !definition ||
        (!isSolidTerrainHex(definition.terrain) &&
          !isFluidTerrainHex(definition.terrain))
      ) {
        return []
      }

      const colors = getLandHexColors(hex.terrain, genericColors)
      const { x, z, yBaseCap } = getBoardHex3DCoords(hex)

      return [
        {
          hex,
          uid: piece.uid,
          terrain: hex.terrain,
          isFluid: colors.isFluid,
          x,
          y: yBaseCap,
          z,
          levels: hex.altitude,
          capLayer: -1 as const,
          sideLayer: -1 as const,
          sideMask: getLandHexSideVisibilityMask(hex, boardHexes),
          capVisible: !colors.isFluid || Boolean(hex.isCap),
          capColor: colors.cap,
          sideColor: colors.side,
        },
      ]
    })
    .sort(
      (a, b) =>
        a.hex.altitude - b.hex.altitude ||
        a.hex.q - b.hex.q ||
        a.hex.r - b.hex.r,
    )
}
