/**
 * Port pillars and their add-ons, as data.
 *
 * A port pillar (a Laur pillar, a Void pylon) has ports: sockets on its sides
 * or vertices. A port add-on (a Laur wall, the Deflector Shield) clips into
 * ports. Placement, preview, smart hover rotation and support all read this
 * table, so a new pillar family and its add-ons only add rows here (plus
 * their models).
 *
 * Directions use the pen rotation convention: a whole number n faces the
 * side toward HEX_DIRECTIONS[n] (0 east, then clockwise), and n + 0.5 faces
 * the vertex between sides n and n + 1 (1.5 is south, 4.5 is north).
 */
import type { BoardPiece, CubeCoordinate } from '../types'
import { Pieces } from '../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import {
  type HexFeatureId,
  edgeIdFromHex,
  nodeIdFromHexRotation,
} from './hexGrid/edgesAndNodes'

/** Add-ons only clip into pillars of their own family. */
export type PortFamily = 'laur' | 'void'

export type PortPillar = {
  family: PortFamily
  /** Port directions at rotation 0; a rotation adds to each. */
  ports: readonly number[]
  /**
   * Pillar rotations allowed. A Laur triangle pillar also takes half steps
   * (its base takes it two ways); the others take whole steps.
   */
  rotations: 'whole-step' | 'whole-and-half-step'
}

/**
 * - short: from a side port, across one edge, into the neighbor's facing
 *   side port (Laur short wall). Whole rotations.
 * - long: from a vertex port, across the vertex line between two hexes, into
 *   the facing vertex port of the hex two steps away (Laur long wall and
 *   arch, Deflector Shield). Half rotations.
 * - anchor: one port only (Laur ruins). Any rotation.
 */
export type PortAddonSpan = 'short' | 'long' | 'anchor'

export type PortAddon = {
  family: PortFamily
  span: PortAddonSpan
}

const LAUR_SQUARE_PORTS = [0, 1.5, 3, 4.5] as const

export const portPillars: Readonly<Record<string, PortPillar>> = {
  [Pieces.laurWallSquarePillar]: {
    family: 'laur',
    ports: LAUR_SQUARE_PORTS,
    rotations: 'whole-step',
  },
  [Pieces.laurWallPillarStackable]: {
    family: 'laur',
    ports: LAUR_SQUARE_PORTS,
    rotations: 'whole-step',
  },
  [Pieces.laurWallTrianglePillar]: {
    family: 'laur',
    ports: [0, 2, 4],
    rotations: 'whole-and-half-step',
  },
  // Pylon ports face vertices only (the gray tabs in John's map symbols,
  // assets-src/void-and-pylons/map-pylon-*.svg, and the GLB tabs).
  [Pieces.twoWayPylon]: {
    family: 'void',
    ports: [1.5, 4.5], // south, north
    rotations: 'whole-step',
  },
  [Pieces.threeWayPylon]: {
    family: 'void',
    ports: [0.5, 2.5, 4.5], // south-east, south-west, north
    rotations: 'whole-step',
  },
}

export const portAddons: Readonly<Record<string, PortAddon>> = {
  [Pieces.laurWallShort]: { family: 'laur', span: 'short' },
  [Pieces.laurWallShortStackable]: { family: 'laur', span: 'short' },
  [Pieces.laurWallLong]: { family: 'laur', span: 'long' },
  [Pieces.laurWallLongStackable]: { family: 'laur', span: 'long' },
  [Pieces.laurWallArch]: { family: 'laur', span: 'long' },
  [Pieces.laurWallRuin1]: { family: 'laur', span: 'anchor' },
  [Pieces.laurWallRuin2]: { family: 'laur', span: 'anchor' },
  [Pieces.laurWallRuin3]: { family: 'laur', span: 'anchor' },
  [Pieces.deflectorShield]: { family: 'void', span: 'long' },
}

export const getPortPillar = (id: string): PortPillar | undefined =>
  portPillars[id]
export const getPortAddon = (id: string): PortAddon | undefined =>
  portAddons[id]
export const isPortPillarID = (id: string) => id in portPillars
export const isPortAddonPieceID = (id: string) => id in portAddons

const WHOLE_ROTATIONS = [0, 1, 2, 3, 4, 5] as const
const HALF_ROTATIONS = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5] as const
const ALL_ROTATIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5] as const

/** The pen rotations a port pillar or add-on takes, or undefined. */
export function getPortPieceRotations(
  id: string,
): readonly number[] | undefined {
  const pillar = portPillars[id]
  if (pillar) {
    return pillar.rotations === 'whole-step' ? WHOLE_ROTATIONS : ALL_ROTATIONS
  }
  const addon = portAddons[id]
  if (!addon) return undefined
  if (addon.span === 'short') return WHOLE_ROTATIONS
  if (addon.span === 'long') return HALF_ROTATIONS
  return ALL_ROTATIONS
}

const mod6 = (rotation: number) => ((rotation % 6) + 6) % 6

export const portFeatureId = (coords: CubeCoordinate, rotation: number) =>
  Number.isInteger(rotation)
    ? edgeIdFromHex(coords, rotation)
    : nodeIdFromHexRotation(coords, rotation)

/** The port directions of a pillar at a rotation; [] for a bad rotation. */
export function getPillarPorts(
  pillarInventoryID: string,
  rotation: number,
): number[] {
  if (!Number.isFinite(rotation) || !Number.isInteger(rotation * 2)) return []
  const pillar = portPillars[pillarInventoryID]
  if (!pillar) return []
  if (pillar.rotations === 'whole-step' && !Number.isInteger(rotation)) {
    return []
  }
  return pillar.ports.map((offset) => mod6(rotation + offset))
}

export type PortAddonEnd = {
  /** The pillar hex this end clips into. */
  coords: CubeCoordinate
  /** The port direction, seen from that pillar. */
  rotation: number
  featureId: HexFeatureId
}

/**
 * The ports an add-on clips into: its anchor's port, and for a short or long
 * span the facing port of the far pillar. Null for a bad rotation.
 */
export function getPortAddonEnds(
  addon: Pick<BoardPiece, 'inventoryID' | 'pieceCoords' | 'rotation'>,
): PortAddonEnd[] | null {
  const spec = portAddons[addon.inventoryID]
  if (!spec) return null
  const rotation = mod6(addon.rotation)
  if (!Number.isFinite(rotation) || !Number.isInteger(rotation * 2)) {
    return null
  }
  const anchorEnd: PortAddonEnd = {
    coords: addon.pieceCoords,
    rotation,
    featureId: portFeatureId(addon.pieceCoords, rotation),
  }
  if (spec.span === 'anchor') return [anchorEnd]

  if (spec.span === 'short') {
    if (!Number.isInteger(rotation)) return null
    const farCoords = hexUtilsAdd(addon.pieceCoords, HEX_DIRECTIONS[rotation])
    const farRotation = mod6(rotation + 3)
    return [
      anchorEnd,
      {
        coords: farCoords,
        rotation: farRotation,
        featureId: portFeatureId(farCoords, farRotation),
      },
    ]
  }

  if (Number.isInteger(rotation)) return null
  const direction = Math.floor(rotation)
  const farCoords = hexUtilsAdd(
    hexUtilsAdd(addon.pieceCoords, HEX_DIRECTIONS[direction]),
    HEX_DIRECTIONS[(direction + 1) % 6],
  )
  const farRotation = mod6(rotation + 3)
  return [
    anchorEnd,
    {
      coords: farCoords,
      rotation: farRotation,
      featureId: portFeatureId(farCoords, farRotation),
    },
  ]
}

/** Whether an add-on clips into this pillar kind at all. */
export const isSamePortFamily = (addonID: string, pillarID: string) => {
  const addon = portAddons[addonID]
  const pillar = portPillars[pillarID]
  return Boolean(addon && pillar && addon.family === pillar.family)
}
