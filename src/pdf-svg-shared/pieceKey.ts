import { addPiece } from '../data/addPiece'
import { piecesSoFar } from '../data/pieces'
import type { BoardHex, BoardPiece, Piece } from '../types'
import { HexTerrain, Pieces } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'

export type PieceKeyEntry = {
  inventoryID: string
  title: string
  terrain: string
  count: number
  piece: BoardPiece
  hexes: BoardHex[]
}

export type PieceKeyLandCell = {
  size: number
  entry: PieceKeyEntry
}

export type PieceKeyLandColumn = {
  terrain: string
  title: string
  description: string
  cells: PieceKeyLandCell[]
}

export type PieceKeyLandRow = {
  size: number
  title: string
  description: string
}

export const getPieceKeyRowsForColumns = (
  columns: PieceKeyLandColumn[],
  rows: PieceKeyLandRow[],
) =>
  rows.filter((row) =>
    columns.some((column) =>
      column.cells.some((cell) => cell.size === row.size),
    ),
  )

export type PieceKeySpecialGroup = {
  id: string
  title: string
  description: string
  descriptionWithoutColorBorders?: string
  entries: PieceKeyEntry[]
}

export type PieceKeyModel = {
  landColumns: PieceKeyLandColumn[]
  landRows: PieceKeyLandRow[]
  fluidColumns: PieceKeyLandColumn[]
  fluidRows: PieceKeyLandRow[]
  specialGroups: PieceKeySpecialGroup[]
}

type PieceKeyGroupMetadata = {
  id: string
  title: string
  description: string
  captions?: Record<string, string>
  terrains?: string[]
  inventoryIDs?: string[]
  fallback?: boolean
}

/** Captions and family membership for the exported piece key. */
const PIECE_KEY_METADATA: {
  terrainOrder: string[]
  fluidTerrainOrder: string[]
  terrains: Record<string, { title: string; description: string }>
  sizes: Record<number, string>
  groups: PieceKeyGroupMetadata[]
} = {
  terrainOrder: [
    HexTerrain.grass,
    HexTerrain.sand,
    HexTerrain.rock,
    HexTerrain.swamp,
    HexTerrain.dungeon,
    HexTerrain.concrete,
    HexTerrain.asphalt,
    HexTerrain.lavaField,
    HexTerrain.snow,
    HexTerrain.road,
    HexTerrain.wallWalk,
    HexTerrain.toxic,
    HexTerrain.ancientTerrain,
    HexTerrain.generic,
  ],
  fluidTerrainOrder: [
    HexTerrain.water,
    HexTerrain.wellspringWater,
    HexTerrain.swampWater,
    HexTerrain.lava,
    HexTerrain.ice,
    HexTerrain.shadow,
    HexTerrain.toxicWater,
    HexTerrain.genericFluid,
  ],
  terrains: {
    [HexTerrain.grass]: { title: 'Grass', description: 'green centers' },
    [HexTerrain.sand]: { title: 'Sand', description: 'tan centers' },
    [HexTerrain.rock]: { title: 'Rock', description: 'gray centers' },
    [HexTerrain.swamp]: { title: 'Swamp', description: 'green centers' },
    [HexTerrain.swampWater]: {
      title: 'Swamp Water',
      description: 'blue-green centers',
    },
    [HexTerrain.water]: { title: 'Water', description: 'blue centers' },
    [HexTerrain.wellspringWater]: {
      title: 'Wellspring Water',
      description: 'white centers',
    },
    [HexTerrain.lava]: { title: 'Molten Lava', description: 'red centers' },
    [HexTerrain.ice]: { title: 'Ice', description: 'white centers' },
    [HexTerrain.shadow]: { title: 'Shadow', description: 'black centers' },
    [HexTerrain.toxicWater]: {
      title: 'Toxic Water',
      description: 'bright green centers',
    },
    [HexTerrain.genericFluid]: {
      title: 'Generic Fluid',
      description: 'user-selected centers',
    },
    [HexTerrain.dungeon]: { title: 'Dungeon', description: 'gray centers' },
    [HexTerrain.concrete]: { title: 'Concrete', description: 'gray centers' },
    [HexTerrain.asphalt]: { title: 'Asphalt', description: 'black centers' },
    [HexTerrain.lavaField]: {
      title: 'Lava Field',
      description: 'red centers',
    },
    [HexTerrain.snow]: { title: 'Snow', description: 'white centers' },
    [HexTerrain.road]: { title: 'Road', description: 'gray centers' },
    [HexTerrain.wallWalk]: { title: 'Wall Walk', description: 'gray centers' },
    [HexTerrain.toxic]: { title: 'Toxic Land', description: 'black centers' },
    [HexTerrain.ancientTerrain]: {
      title: 'Ancient Terrain',
      description: 'brown centers',
    },
    [HexTerrain.generic]: {
      title: 'Generic',
      description: 'user-selected centers',
    },
  },
  sizes: {
    24: 'gray borders',
    7: 'purple borders',
    3: 'black borders',
    2: 'orange borders',
    1: 'red borders',
  },
  groups: [
    {
      id: 'roads-and-wall-walks',
      title: 'Roads and Wall Walks',
      description: 'gray centers',
      terrains: [HexTerrain.road, HexTerrain.wallWalk],
    },
    {
      id: 'evergreen',
      title: 'Evergreen Trees',
      description: 'green borders and centers; number indicates tree height',
      terrains: [HexTerrain.tree, HexTerrain.snowTree],
    },
    {
      id: 'jungle',
      title: 'Jungle Trees',
      description: 'brown borders, yellow centers',
      terrains: [HexTerrain.palm, HexTerrain.brush],
    },
    {
      id: 'wood',
      title: 'Wood Tiles',
      description: 'orange borders, brown wood-grain centers',
      descriptionWithoutColorBorders: 'dark borders, brown wood-grain centers',
      terrains: [HexTerrain.wood],
    },
    {
      id: 'laur',
      title: 'Pillars and Walls (Laur)',
      description:
        'pillars have pink borders and purple centers; wall add-ons are pink',
      terrains: [HexTerrain.laurWall, HexTerrain.laurWallAddon],
      inventoryIDs: [
        Pieces.laurWallSquarePillar,
        Pieces.laurWallPillarStackable,
        Pieces.laurWallTrianglePillar,
        Pieces.laurWallShort,
        Pieces.laurWallShortStackable,
        Pieces.laurWallLong,
        Pieces.laurWallLongStackable,
        Pieces.laurWallArch,
        Pieces.laurWallRuin1,
        Pieces.laurWallRuin2,
        Pieces.laurWallRuin3,
      ],
      captions: {
        [Pieces.laurWallSquarePillar]: 'square pillar',
        [Pieces.laurWallShort]: 'short wall',
        [Pieces.laurWallLong]: 'long wall',
      },
    },
    {
      id: 'ladder',
      title: 'Ladders',
      description: 'black borders',
      terrains: [HexTerrain.ladder],
    },
    {
      id: 'rope-ladder',
      title: 'Rope Ladders',
      description: 'pink with arrows; connects to terrain from above',
      terrains: [HexTerrain.ropeLadder],
      inventoryIDs: [Pieces.ropeLadder],
    },
    {
      id: 'cannon',
      title: 'Cannons',
      description:
        'black circle with white arrow; barrel points in arrow direction',
      terrains: [HexTerrain.cannon],
    },
    {
      id: 'ship',
      title: 'Ship Pieces',
      description:
        'brown; connect to terrain on the lower level, upper level may connect to terrain',
      terrains: [HexTerrain.shipBow, HexTerrain.shipWall],
    },
    {
      id: 'glyph',
      title: 'Glyphs',
      description: 'glyphs used on this map',
      terrains: [HexTerrain.glyphPower, HexTerrain.glyphTreasure],
    },
    {
      id: 'start-zone',
      title: 'Start Zones',
      description: 'start zones used on this map',
      terrains: [HexTerrain.startZone],
    },
    {
      id: 'other',
      title: 'Other Special Tiles',
      description: 'special pieces used on this map',
      fallback: true,
      captions: {
        [Pieces.concrete6]: 'Concrete (6)',
      },
    },
  ],
}

const specialGroupID = (inventoryID: string, piece: Piece): string =>
  PIECE_KEY_METADATA.groups.find(
    (group) =>
      !group.fallback &&
      (group.terrains?.includes(piece.terrain) ||
        group.inventoryIDs?.includes(inventoryID)),
  )?.id ?? 'other'

export const getPieceKeyTerrainDescription = (
  terrain: string,
  fallbackTitle: string,
) => PIECE_KEY_METADATA.terrains[terrain]?.description ?? fallbackTitle

export const getPieceKeyDescriptionGaps = (terrains: string[]) =>
  terrains.filter((terrain) => !PIECE_KEY_METADATA.terrains[terrain])

export const shouldUseTerrainBorderColorForPieceKeyEntry = (
  entry: PieceKeyEntry,
  useTerrainBorderColor: boolean,
) =>
  !(
    piecesSoFar[entry.inventoryID]?.landPrefix &&
    isSolidTerrainHex(entry.terrain)
  ) || useTerrainBorderColor

const getCanonicalPieceKeyShape = (piece: Piece) => {
  const uid = `piece-key-${piece.id}`
  const origin = { q: 0, r: 0, s: 0 }
  const placed = addPiece({
    piece,
    boardHexes: {},
    boardPieces: [],
    pieceCoords: origin,
    placementAltitude: 0,
    rotation: 0,
    isVsTile: false,
    uid,
    permissive: true,
  })
  const canonicalPiece = placed.newBoardPieces.find(
    (boardPiece) => boardPiece.uid === uid,
  ) ?? {
    uid,
    inventoryID: piece.id,
    altitude: 0,
    rotation: 0,
    pieceCoords: origin,
  }
  const hexes = Object.values(placed.newBoardHexes)
    .filter((hex) => hex.boardPieceUID === uid)
    .map((hex) => ({ ...hex, altitude: 0, pieceRotation: 0 }))

  return { piece: canonicalPiece, hexes }
}

export const getPieceKeyModel = (
  boardPieces: BoardPiece[],
  _boardHexes: Record<string, BoardHex>,
  useTerrainBorderColor: boolean,
): PieceKeyModel => {
  const entries = new Map<string, PieceKeyEntry>()
  for (const pieceOnBoard of boardPieces) {
    const piece = piecesSoFar[pieceOnBoard.inventoryID]
    if (!piece) continue

    const existing = entries.get(pieceOnBoard.inventoryID)
    if (existing) {
      existing.count += 1
      continue
    }

    entries.set(pieceOnBoard.inventoryID, {
      inventoryID: pieceOnBoard.inventoryID,
      title: piece.title || pieceOnBoard.inventoryID,
      terrain: piece.terrain,
      count: 1,
      ...getCanonicalPieceKeyShape(piece),
    })
  }

  const allEntries = [...entries.values()]
  const isLandEntry = (entry: PieceKeyEntry) =>
    piecesSoFar[entry.inventoryID]?.landPrefix &&
    entry.terrain !== HexTerrain.wood &&
    entry.inventoryID !== Pieces.concrete6
  const roadsAndWallWalks = allEntries.filter(
    (entry) =>
      isLandEntry(entry) &&
      [HexTerrain.road, HexTerrain.wallWalk].includes(
        entry.terrain as HexTerrain,
      ),
  )
  const landEntries = allEntries.filter(
    (entry) =>
      isLandEntry(entry) &&
      isSolidTerrainHex(entry.terrain) &&
      !roadsAndWallWalks.includes(entry) &&
      [24, 7, 3, 2, 1].includes(piecesSoFar[entry.inventoryID].size),
  )
  const nonstandardLandEntries = allEntries.filter(
    (entry) =>
      isLandEntry(entry) &&
      isSolidTerrainHex(entry.terrain) &&
      !roadsAndWallWalks.includes(entry) &&
      ![24, 7, 3, 2, 1].includes(piecesSoFar[entry.inventoryID].size),
  )
  const fluidEntries = allEntries.filter((entry) =>
    isFluidTerrainHex(entry.terrain),
  )
  const availableTerrains = new Set(landEntries.map((entry) => entry.terrain))
  const terrains = [
    ...PIECE_KEY_METADATA.terrainOrder.filter((terrain) =>
      availableTerrains.has(terrain),
    ),
    ...[...availableTerrains]
      .filter(
        (terrain) =>
          !PIECE_KEY_METADATA.terrainOrder.some(
            (ordered) => ordered === terrain,
          ),
      )
      .sort(),
  ]
  const sizes = [24, 7, 3, 2, 1].filter((size) =>
    landEntries.some((entry) => piecesSoFar[entry.inventoryID].size === size),
  )
  const landRows = sizes.map((size) => ({
    size,
    title: `${size} space`,
    description: useTerrainBorderColor
      ? (PIECE_KEY_METADATA.sizes[size] ?? 'size-based borders')
      : 'dark borders',
  }))
  const landColumns = terrains.map((terrain) => {
    const terrainEntries = landEntries.filter(
      (entry) => entry.terrain === terrain,
    )
    const firstTitle = terrainEntries[0]?.title ?? terrain
    return {
      terrain,
      title: PIECE_KEY_METADATA.terrains[terrain]?.title ?? firstTitle,
      description: getPieceKeyTerrainDescription(terrain, firstTitle),
      cells: landRows.flatMap((row) => {
        const entry = terrainEntries.find(
          (candidate) => piecesSoFar[candidate.inventoryID].size === row.size,
        )
        return entry ? [{ size: row.size, entry }] : []
      }),
    }
  })

  const fluidTerrains = new Set(fluidEntries.map((entry) => entry.terrain))
  const orderedFluidTerrains = [
    ...PIECE_KEY_METADATA.fluidTerrainOrder.filter((terrain) =>
      fluidTerrains.has(terrain),
    ),
    ...[...fluidTerrains]
      .filter(
        (terrain) => !PIECE_KEY_METADATA.fluidTerrainOrder.includes(terrain),
      )
      .sort(),
  ]
  const fluidSizes = [
    ...new Set(
      fluidEntries.map((entry) => piecesSoFar[entry.inventoryID].size),
    ),
  ].sort((a, b) => b - a)
  const fluidRows = fluidSizes.map((size) => ({
    size,
    title: `${size} space`,
    description: 'blue borders',
  }))
  const fluidColumns = orderedFluidTerrains.map((terrain) => {
    const terrainEntries = fluidEntries.filter(
      (entry) => entry.terrain === terrain,
    )
    const firstTitle = terrainEntries[0]?.title ?? terrain
    return {
      terrain,
      title: PIECE_KEY_METADATA.terrains[terrain]?.title ?? firstTitle,
      description: getPieceKeyTerrainDescription(terrain, firstTitle),
      cells: fluidRows.flatMap((row) => {
        const entry = terrainEntries.find(
          (candidate) => piecesSoFar[candidate.inventoryID].size === row.size,
        )
        return entry ? [{ size: row.size, entry }] : []
      }),
    }
  })

  const landIDs = new Set(landEntries.map((entry) => entry.inventoryID))
  const fluidIDs = new Set(fluidEntries.map((entry) => entry.inventoryID))
  const specialLandGroups = new Map<string, PieceKeyGroupMetadata>()
  for (const entry of nonstandardLandEntries) {
    const terrain = entry.terrain
    const metadata = PIECE_KEY_METADATA.terrains[terrain]
    const id = `special-land-${terrain}`
    specialLandGroups.set(id, {
      id,
      title: metadata?.title ?? entry.title,
      description: `${metadata?.description ?? entry.title}; special tile`,
      terrains: [terrain],
    })
  }
  const roadsAndWallWalkIDs = new Set(
    roadsAndWallWalks.map((entry) => entry.inventoryID),
  )
  const grouped = new Map<string, PieceKeyEntry[]>()
  for (const entry of nonstandardLandEntries) {
    const id = `special-land-${entry.terrain}`
    grouped.set(id, [...(grouped.get(id) ?? []), entry])
  }
  for (const entry of allEntries) {
    if (
      landIDs.has(entry.inventoryID) ||
      fluidIDs.has(entry.inventoryID) ||
      nonstandardLandEntries.includes(entry)
    ) {
      continue
    }
    const id = roadsAndWallWalkIDs.has(entry.inventoryID)
      ? 'roads-and-wall-walks'
      : specialGroupID(entry.inventoryID, piecesSoFar[entry.inventoryID])
    const members = grouped.get(id) ?? []
    members.push(entry)
    grouped.set(id, members)
  }
  const specialGroups = [
    ...PIECE_KEY_METADATA.groups,
    ...specialLandGroups.values(),
  ].flatMap((group) => {
    const members = grouped.get(group.id)
    return members?.length
      ? [
          {
            ...group,
            description:
              useTerrainBorderColor || !group.descriptionWithoutColorBorders
                ? group.description
                : group.descriptionWithoutColorBorders,
            entries: members
              .map((entry) => ({
                ...entry,
                title: group.captions?.[entry.inventoryID] ?? entry.title,
              }))
              .sort((a, b) => a.title.localeCompare(b.title)),
          },
        ]
      : []
  })

  return { landColumns, landRows, fluidColumns, fluidRows, specialGroups }
}
