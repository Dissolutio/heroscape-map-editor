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
import { HEXGRID_HEX_RADIUS } from '../../utils/constants'
import type { GraphicsTier } from '../../local-storage/settings'
import type { GenericTerrainColorSettings } from '../maphex/genericTerrainColors'
import { hexTerrainColor, terrainCapColors } from '../maphex/hexColors'
import type { TerrainTextureManifest } from '../textures/terrainTextureManifest'

export const NON_INSTANCED_SUBTERRAIN_PIECES = new Set<string>([
  Pieces.glacier1,
  Pieces.outcrop1,
  Pieces.lavaRockOutcrop1,
  Pieces.toxicOutcrop1,
  Pieces.glacier3,
  Pieces.lavaRockOutcrop3,
  Pieces.outcrop3,
  Pieces.toxicOutcrop3,
  Pieces.glacier4,
  Pieces.glacier6,
  Pieces.hive,
])

export const LAND_HEX_SIDE_DIRECTIONS = [0, 1, 2, 3, 4, 5] as const

export function packLandHexPbrTextureLayers(
  capNormalLayer: number,
  capOrmLayer: number,
  sideNormalLayer: number,
  sideOrmLayer: number,
) {
  return (
    (((capNormalLayer + 1) * 7 + capOrmLayer + 1) * 3 + sideNormalLayer + 1) *
      4 +
    sideOrmLayer +
    1
  )
}

export type LandHexInstanceDatum = {
  hex: BoardHex
  uid: string
  terrain: string
  isFluid: boolean
  x: number
  y: number
  z: number
  levels: number
  capLayer: number
  sideLayer: number
  capNormalLayer: number
  capOrmLayer: number
  sideNormalLayer: number
  sideOrmLayer: number
  rotationSteps: number
  sideMask: number
  capVisible: boolean
  capColor: string
  sideColor: string
}

export type LandHexHoverTarget = {
  uid: string
  hexID: string
  isCap: boolean
} | null

export type LandHexInstanceIndex = {
  indicesByUID: Map<string, number[]>
  indexByHexID: Map<string, number>
}

type LandHexInstanceKey = {
  uid: string
  hex: Pick<BoardHex, 'id'>
}

export type LandHexHoverTransition = {
  sideUpdates: { index: number; isHighlighted: boolean }[]
  capUpdates: { index: number; isHighlighted: boolean }[]
}

const LAND_CAP_HIGHLIGHT = 1
const LAND_SIDE_HIGHLIGHT = 2

export const LAND_HEX_TEXTURE_TERRAIN_NAMES: Partial<
  Record<HexTerrain, string>
> = {
  [HexTerrain.ancientTerrain]: 'Ancient',
  [HexTerrain.asphalt]: 'Asphalt',
  [HexTerrain.concrete]: 'Concrete',
  [HexTerrain.dungeon]: 'Dungeon',
  [HexTerrain.grass]: 'Grass',
  [HexTerrain.ice]: 'Ice',
  [HexTerrain.lava]: 'Lava',
  [HexTerrain.lavaField]: 'LavaField',
  [HexTerrain.rock]: 'Rock',
  [HexTerrain.road]: 'Road',
  [HexTerrain.sand]: 'Sand',
  [HexTerrain.snow]: 'Snow',
  [HexTerrain.swamp]: 'Swamp',
  [HexTerrain.toxic]: 'ToxicLand',
  [HexTerrain.toxicWater]: 'ToxicWater',
  [HexTerrain.wallWalk]: 'WallWalk',
  [HexTerrain.water]: 'Water',
  [HexTerrain.wellspringWater]: 'WellspringWater',
  [HexTerrain.wood]: 'Wood',
}

export const LAND_HEX_UNTEXTURED_TERRAINS = [
  HexTerrain.generic,
  HexTerrain.genericFluid,
  HexTerrain.shadow,
  HexTerrain.swampWater,
] as const

export function getLandHexManifestTerrainName(terrain: string) {
  return LAND_HEX_TEXTURE_TERRAIN_NAMES[terrain as HexTerrain] ?? null
}

export function getLandHexTextureLayers(
  terrain: string,
  hexID: string,
  manifest: TerrainTextureManifest | undefined,
  tier: GraphicsTier,
) {
  const manifestTerrainName = getLandHexManifestTerrainName(terrain)
  const layers = manifestTerrainName
    ? manifest?.terrains[manifestTerrainName]
    : undefined
  const enabled = tier !== 'low' && Boolean(manifest && layers)
  const allowRandomRotation =
    terrain === HexTerrain.ice || terrain === HexTerrain.toxicWater
  return {
    capLayer: enabled
      ? tier === 'high'
        ? (layers?.capDiffusePbrLayer ?? -1)
        : (layers?.capDiffuseLayer ?? -1)
      : -1,
    sideLayer: enabled ? (layers?.sideDiffuseLayer ?? -1) : -1,
    capNormalLayer:
      enabled && tier === 'high' ? (layers?.capNormalLayer ?? -1) : -1,
    capOrmLayer: enabled && tier === 'high' ? (layers?.capOrmLayer ?? -1) : -1,
    sideNormalLayer:
      enabled && tier === 'high' ? (layers?.sideNormalLayer ?? -1) : -1,
    sideOrmLayer:
      enabled && tier === 'high' ? (layers?.sideOrmLayer ?? -1) : -1,
    rotationSteps:
      enabled && allowRandomRotation ? getStableRotationStep(hexID) : 0,
  }
}

export function getStableRotationStep(id: string) {
  let hash = 2166136261
  for (let index = 0; index < id.length; index += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619)
  }
  return (hash >>> 0) % 6
}

/**
 * UV bounds follow the pointy-top cap vertices in LandHexInstanced.tsx:
 * x spans ±sqrt(3)R/2 and z spans ±R. Keep the shader formula in sync.
 */
export function getLandHexCapUV(
  x: number,
  z: number,
  rotationSteps = 0,
  radius = HEXGRID_HEX_RADIUS,
) {
  const angle = (((rotationSteps % 6) + 6) % 6) * (Math.PI / 3)
  const rotatedX = x * Math.cos(angle) + z * Math.sin(angle)
  const rotatedZ = -x * Math.sin(angle) + z * Math.cos(angle)
  return {
    u: rotatedX / (Math.sqrt(3) * radius) + 0.5,
    v: rotatedZ / (2 * radius) + 0.5,
  }
}

export function getLandHexSideUV(u: number, y: number, height: number) {
  return [u, 1 - y / height] as const
}

export function buildLandHexInstanceIndex(
  items: LandHexInstanceKey[],
): LandHexInstanceIndex {
  const indicesByUID = new Map<string, number[]>()
  const indexByHexID = new Map<string, number>()

  items.forEach((item, index) => {
    const indices = indicesByUID.get(item.uid)
    if (indices) {
      indices.push(index)
    } else {
      indicesByUID.set(item.uid, [index])
    }
    indexByHexID.set(item.hex.id, index)
  })

  return { indicesByUID, indexByHexID }
}

export function getLandHexHoverTransition(
  previous: LandHexHoverTarget,
  next: LandHexHoverTarget,
  index: LandHexInstanceIndex,
): LandHexHoverTransition {
  const sideUpdates: LandHexHoverTransition['sideUpdates'] = []
  const capUpdates: LandHexHoverTransition['capUpdates'] = []

  if (previous?.uid !== next?.uid) {
    for (const instanceIndex of index.indicesByUID.get(previous?.uid ?? '') ??
      []) {
      sideUpdates.push({ index: instanceIndex, isHighlighted: false })
    }
    for (const instanceIndex of index.indicesByUID.get(next?.uid ?? '') ?? []) {
      sideUpdates.push({ index: instanceIndex, isHighlighted: true })
    }
  }

  const previousCapHexID = previous?.isCap ? previous.hexID : undefined
  const nextCapHexID = next?.isCap ? next.hexID : undefined
  if (previousCapHexID !== nextCapHexID) {
    const previousIndex = previousCapHexID
      ? index.indexByHexID.get(previousCapHexID)
      : undefined
    const nextIndex = nextCapHexID
      ? index.indexByHexID.get(nextCapHexID)
      : undefined
    if (previousIndex !== undefined) {
      capUpdates.push({ index: previousIndex, isHighlighted: false })
    }
    if (nextIndex !== undefined) {
      capUpdates.push({ index: nextIndex, isHighlighted: true })
    }
  }

  return { sideUpdates, capUpdates }
}

export function getLandHexHighlightValue(
  item: LandHexInstanceKey,
  hovered: LandHexHoverTarget,
  selectedIDs: ReadonlySet<string>,
  surface: 'cap' | 'side' | 'both' = 'both',
) {
  const capHighlighted = hovered?.isCap && hovered.hexID === item.hex.id
  const sideHighlighted = selectedIDs.has(item.uid) || hovered?.uid === item.uid
  if (surface === 'cap') return Number(capHighlighted)
  if (surface === 'side') {
    return sideHighlighted ? LAND_SIDE_HIGHLIGHT : 0
  }
  return (
    (capHighlighted ? LAND_CAP_HIGHLIGHT : 0) +
    (sideHighlighted ? LAND_SIDE_HIGHLIGHT : 0)
  )
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
  capHighlighted: boolean,
  sideHighlighted = capHighlighted,
) {
  return {
    cap: capHighlighted ? 'yellow' : datum.capColor,
    side: sideHighlighted ? 'yellow' : datum.sideColor,
  }
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

export function getLandHexInstanceIDs(
  boardHexes: BoardHexes,
  boardPieces: BoardPiece[],
  viewingLevel: number,
): string[] {
  const piecesByUID = new Map(boardPieces.map((piece) => [piece.uid, piece]))

  return Object.values(boardHexes).flatMap((hex) => {
    if (
      hex.altitude > viewingLevel ||
      hex.isVerticalClearanceHex ||
      !hex.boardPieceUID
    ) {
      return []
    }

    const piece = piecesByUID.get(hex.boardPieceUID)
    if (!piece || NON_INSTANCED_SUBTERRAIN_PIECES.has(piece.inventoryID)) {
      return []
    }
    const terrain = piecesSoFar[piece.inventoryID]?.terrain
    if (
      !terrain ||
      (!isSolidTerrainHex(terrain) && !isFluidTerrainHex(terrain))
    ) {
      return []
    }
    return [hex.id]
  })
}

export function buildLandHexInstanceData(
  boardHexes: BoardHexes,
  boardPieces: BoardPiece[],
  viewingLevel: number,
  genericColors: GenericTerrainColorSettings,
  manifest?: TerrainTextureManifest,
  tier: GraphicsTier = 'low',
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
      const textureLayers = getLandHexTextureLayers(
        hex.terrain,
        hex.id,
        manifest,
        tier,
      )

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
          ...textureLayers,
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
