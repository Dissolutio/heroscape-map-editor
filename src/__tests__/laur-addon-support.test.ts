import { describe, expect, it } from 'vitest'
import {
  getUnsupportedLaurAddonUIDs,
  isLaurAddonSupported,
} from '../data/laurAddonSupport'
import { getPillarPorts } from '../data/laurPillarPorts'
import type { BoardPiece, CubeCoordinate } from '../types'
import { Pieces } from '../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'

const anchor = { q: 0, r: 0, s: 0 }
const halfStepRotations = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]
const squareRotations = [0, 1, 2, 3, 4, 5]

const makePiece = (
  uid: string,
  inventoryID: string,
  pieceCoords: CubeCoordinate,
  rotation: number,
  altitude = 0,
): BoardPiece => ({ uid, inventoryID, pieceCoords, rotation, altitude })

const mod6 = (rotation: number) => ((rotation % 6) + 6) % 6

function requiredPorts(inventoryID: string, rotation: number) {
  const normalized = mod6(rotation)
  if (
    inventoryID === Pieces.laurWallShort ||
    inventoryID === Pieces.laurWallShortStackable
  ) {
    const direction = normalized
    return [
      { coords: anchor, rotation: normalized },
      {
        coords: hexUtilsAdd(anchor, HEX_DIRECTIONS[direction]),
        rotation: mod6(direction + 3),
      },
    ]
  }
  if (
    inventoryID === Pieces.laurWallLong ||
    inventoryID === Pieces.laurWallLongStackable ||
    inventoryID === Pieces.laurWallArch
  ) {
    const direction = Math.floor(normalized)
    return [
      { coords: anchor, rotation: normalized },
      {
        coords: hexUtilsAdd(
          hexUtilsAdd(anchor, HEX_DIRECTIONS[direction]),
          HEX_DIRECTIONS[(direction + 1) % 6],
        ),
        rotation: mod6(normalized + 3),
      },
    ]
  }
  return [{ coords: anchor, rotation: normalized }]
}

function pillarRotations(inventoryID: string) {
  return inventoryID === Pieces.laurWallTrianglePillar
    ? halfStepRotations
    : squareRotations
}

function rotationForPort(pillarID: string, port: number, supported: boolean) {
  const rotation = pillarRotations(pillarID).find(
    (candidate) =>
      getPillarPorts(pillarID, candidate).includes(port) === supported,
  )
  if (rotation === undefined) {
    throw new Error(`No ${supported ? 'matching' : 'non-matching'} rotation`)
  }
  return rotation
}

const addonSpecs = [
  { inventoryID: Pieces.laurWallShort, rotations: squareRotations },
  { inventoryID: Pieces.laurWallShortStackable, rotations: squareRotations },
  {
    inventoryID: Pieces.laurWallLong,
    rotations: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5],
  },
  {
    inventoryID: Pieces.laurWallLongStackable,
    rotations: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5],
  },
  {
    inventoryID: Pieces.laurWallArch,
    rotations: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5],
  },
  { inventoryID: Pieces.laurWallRuin1, rotations: halfStepRotations },
  { inventoryID: Pieces.laurWallRuin2, rotations: halfStepRotations },
  { inventoryID: Pieces.laurWallRuin3, rotations: halfStepRotations },
]

describe('getPillarPorts', () => {
  const squarePortRows = [
    [0, 1.5, 3, 4.5],
    [1, 2.5, 4, 5.5],
    [2, 3.5, 5, 0.5],
    [3, 4.5, 0, 1.5],
    [4, 5.5, 1, 2.5],
    [5, 0.5, 2, 3.5],
  ]

  it.each([Pieces.laurWallSquarePillar, Pieces.laurWallPillarStackable])(
    'uses the square port table for %s, repeating every three rotations',
    (pillarID) => {
      for (const rotation of squareRotations) {
        expect(getPillarPorts(pillarID, rotation)).toEqual(
          squarePortRows[rotation],
        )
      }
      const orientations = new Set(
        squarePortRows.map((ports) =>
          [...ports].sort((a, b) => a - b).join(','),
        ),
      )
      expect(orientations).toHaveLength(3)
    },
  )

  it('uses the triangle port table and has four distinct orientations', () => {
    const expected = [
      [0, 2, 4],
      [0.5, 2.5, 4.5],
      [1, 3, 5],
      [1.5, 3.5, 5.5],
      [2, 4, 0],
      [2.5, 4.5, 0.5],
      [3, 5, 1],
      [3.5, 5.5, 1.5],
      [4, 0, 2],
      [4.5, 0.5, 2.5],
      [5, 1, 3],
      [5.5, 1.5, 3.5],
    ]
    for (const [index, rotation] of halfStepRotations.entries()) {
      expect(getPillarPorts(Pieces.laurWallTrianglePillar, rotation)).toEqual(
        expected[index],
      )
    }
    const orientations = new Set(
      halfStepRotations.map((rotation) =>
        getPillarPorts(Pieces.laurWallTrianglePillar, rotation)
          .sort((a, b) => a - b)
          .join(','),
      ),
    )
    expect(orientations).toHaveLength(4)
  })

  it('returns no ports for unsupported IDs or illegal rotations', () => {
    expect(getPillarPorts('not-a-pillar', 0)).toEqual([])
    expect(getPillarPorts(Pieces.laurWallSquarePillar, 0.5)).toEqual([])
    expect(getPillarPorts(Pieces.laurWallTrianglePillar, 0.25)).toEqual([])
  })
})

describe('isLaurAddonSupported', () => {
  const pillarIDs = [
    Pieces.laurWallSquarePillar,
    Pieces.laurWallPillarStackable,
    Pieces.laurWallTrianglePillar,
  ]

  it.each(addonSpecs)(
    'checks supported and unsupported ports for every %s rotation',
    ({ inventoryID, rotations }) => {
      for (const rotation of rotations) {
        const addon = makePiece('addon', inventoryID, anchor, rotation)
        const requirements = requiredPorts(inventoryID, rotation)
        for (const pillarID of pillarIDs) {
          const supportedPillars = requirements.map(
            ({ coords, rotation: port }, index) =>
              makePiece(
                `support-${index}`,
                pillarID,
                coords,
                rotationForPort(pillarID, port, true),
              ),
          )
          expect(
            isLaurAddonSupported({ boardPieces: supportedPillars }, addon),
            `${inventoryID}@${rotation} with ${pillarID}`,
          ).toBe('supported')

          const unsupportedPillars = supportedPillars.map((pillar, index) =>
            index === 0
              ? {
                  ...pillar,
                  rotation: rotationForPort(
                    pillarID,
                    requirements[0].rotation,
                    false,
                  ),
                }
              : pillar,
          )
          expect(
            isLaurAddonSupported({ boardPieces: unsupportedPillars }, addon),
            `${inventoryID}@${rotation} without its anchor port`,
          ).toBe('unsupported')
        }
      }
    },
  )

  it.each([
    Pieces.laurWallShort,
    Pieces.laurWallShortStackable,
    Pieces.laurWallLong,
    Pieces.laurWallLongStackable,
    Pieces.laurWallArch,
  ])('%s is unsupported when its far pillar is missing', (inventoryID) => {
    const rotations =
      inventoryID === Pieces.laurWallShort ||
      inventoryID === Pieces.laurWallShortStackable
        ? squareRotations
        : [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]
    for (const rotation of rotations) {
      const addon = makePiece('bridge', inventoryID, anchor, rotation)
      const [anchorPort] = requiredPorts(inventoryID, rotation)
      const boardPieces = [
        makePiece(
          'anchor-pillar',
          Pieces.laurWallSquarePillar,
          anchorPort.coords,
          rotationForPort(
            Pieces.laurWallSquarePillar,
            anchorPort.rotation,
            true,
          ),
        ),
      ]
      expect(isLaurAddonSupported({ boardPieces }, addon)).toBe('unsupported')
    }
  })

  it.each([Pieces.laurWallRuin1, Pieces.laurWallRuin2, Pieces.laurWallRuin3])(
    '%s requires only one port on its anchor pillar',
    (inventoryID) => {
      for (const rotation of halfStepRotations) {
        const addon = makePiece('ruin', inventoryID, anchor, rotation)
        const boardPieces = [
          makePiece(
            'anchor-pillar',
            Pieces.laurWallTrianglePillar,
            anchor,
            rotationForPort(Pieces.laurWallTrianglePillar, rotation, true),
          ),
        ]
        expect(isLaurAddonSupported({ boardPieces }, addon)).toBe('supported')
      }
    },
  )

  it('matches stacked pillar tops by their current BoardPiece altitude', () => {
    const addon = makePiece('stacked-wall', Pieces.laurWallShort, anchor, 0, 9)
    const boardPieces = [
      makePiece('stacked-anchor', Pieces.laurWallPillarStackable, anchor, 0, 9),
      makePiece(
        'stacked-far',
        Pieces.laurWallSquarePillar,
        HEX_DIRECTIONS[0],
        0,
        9,
      ),
    ]
    expect(isLaurAddonSupported({ boardPieces }, addon)).toBe('supported')
    expect(
      isLaurAddonSupported({ boardPieces }, { ...addon, altitude: 8 }),
    ).toBe('unsupported')
  })

  it.todo(
    'verify the add-on hit altitude matches a stacked pillar top after the +8 stacking correction',
  )

  it('does not mutate board inputs and returns only unsupported add-on UIDs', () => {
    const boardPieces = [
      makePiece('supported-addon', Pieces.laurWallRuin1, anchor, 0),
      makePiece('supported-pillar', Pieces.laurWallSquarePillar, anchor, 0),
      makePiece('unsupported-addon', Pieces.laurWallShort, anchor, 0),
    ]
    const before = structuredClone(boardPieces)
    expect(getUnsupportedLaurAddonUIDs({ boardPieces })).toEqual([
      'unsupported-addon',
    ])
    expect(isLaurAddonSupported({ boardPieces }, boardPieces[0])).toBe(
      'supported',
    )
    expect(boardPieces).toEqual(before)
  })
})
