import { Vector3 } from 'three'
import { Pieces } from '../../types'
import {
  HEXGRID_HEX_APOTHEM,
  HEXGRID_HEX_HEIGHT,
  HEXGRID_HEX_RADIUS,
} from '../../utils/constants'

export function getLaurWallAddonPositionByRotation(rotation: number) {
  const ruinPositionMap: { [key: string]: Vector3 } = {
    '0': new Vector3(HEXGRID_HEX_APOTHEM, 0, 0),
    '0.5': new Vector3(0.75, 0, HEXGRID_HEX_APOTHEM / 2),
    '1': new Vector3(
      HEXGRID_HEX_APOTHEM / 2 + 0.001,
      0,
      HEXGRID_HEX_APOTHEM - 0.114,
    ),
    '1.5': new Vector3(0.005, 0, HEXGRID_HEX_APOTHEM - 0.005),
    '2': new Vector3(
      -HEXGRID_HEX_APOTHEM / 2 - 0.001,
      0,
      HEXGRID_HEX_APOTHEM - 0.114,
    ),
    '2.5': new Vector3(-0.743, 0, HEXGRID_HEX_APOTHEM / 2 + 0.0018),
    '3': new Vector3(-HEXGRID_HEX_APOTHEM + 0.01, 0, 0),
    '3.5': new Vector3(-0.743, 0, -(HEXGRID_HEX_APOTHEM / 2) + 0.0018),
    '4': new Vector3(
      -HEXGRID_HEX_APOTHEM / 2 + 0.003,
      0,
      -HEXGRID_HEX_APOTHEM + 0.124,
    ),
    '4.5': new Vector3(0.005, 0, -HEXGRID_HEX_APOTHEM + 0.005),
    '5': new Vector3(
      HEXGRID_HEX_APOTHEM / 2 - 0.005,
      0,
      -HEXGRID_HEX_APOTHEM + 0.1235,
    ),
    '5.5': new Vector3(0.75, 0, -(HEXGRID_HEX_APOTHEM / 2 - 0.01)),
  }
  return ruinPositionMap?.[`${rotation}`] ?? new Vector3(0, 0, 0)
}

export function getRuinsOptions(rotation: number) {
  switch (Number(rotation)) {
    case 0:
      return { rotationY: 0, xAdd: -HEXGRID_HEX_APOTHEM + 0.04, zAdd: 0.7 }
    case 1:
      return {
        rotationY: -Math.PI / 3,
        xAdd: -HEXGRID_HEX_APOTHEM - 0.1,
        zAdd: -0.4,
      }
    case 2:
      return {
        rotationY: (-Math.PI * 2) / 3,
        xAdd: -0.1,
        zAdd: -HEXGRID_HEX_RADIUS - 0.03,
      }
    case 3:
      return {
        rotationY: Math.PI,
        xAdd: HEXGRID_HEX_APOTHEM - 0.04,
        zAdd: -0.7,
      }
    case 4:
      return {
        rotationY: (Math.PI * 2) / 3,
        xAdd: HEXGRID_HEX_APOTHEM + 0.1,
        zAdd: 0.4,
      }
    case 5:
      return {
        rotationY: Math.PI / 3,
        xAdd: 0.1,
        zAdd: HEXGRID_HEX_RADIUS + 0.03,
      }
    default:
      return { rotationY: 0, xAdd: 0, zAdd: 0 }
  }
}
export function getObstaclRotation(rotation: number) {
  switch (Number(rotation)) {
    case 0:
      return 0
    case 1:
      return -Math.PI / 3
    case 2:
      return (-2 * Math.PI) / 3
    case 3:
      return -Math.PI
    case 4:
      return (2 * Math.PI) / 3
    case 5:
      return Math.PI / 3
    default:
      return 0
  }
}
export function getLadderBattlementOptions(rotation: number) {
  switch (Number(rotation)) {
    case 0:
      return { xAdd: HEXGRID_HEX_APOTHEM, zAdd: 0 }
    case 1:
      return {
        xAdd: (HEXGRID_HEX_RADIUS * Math.sqrt(3)) / 4,
        zAdd: HEXGRID_HEX_RADIUS - HEXGRID_HEX_RADIUS / 4,
      }
    case 2:
      return {
        xAdd: -((HEXGRID_HEX_RADIUS * Math.sqrt(3)) / 4),
        zAdd: HEXGRID_HEX_RADIUS - HEXGRID_HEX_RADIUS / 4,
      }
    case 3:
      return { xAdd: -HEXGRID_HEX_APOTHEM, zAdd: 0 }
    case 4:
      return {
        xAdd: -((HEXGRID_HEX_RADIUS * Math.sqrt(3)) / 4),
        zAdd: -(HEXGRID_HEX_RADIUS - HEXGRID_HEX_RADIUS / 4),
      }
    case 5:
      return {
        xAdd: (HEXGRID_HEX_RADIUS * Math.sqrt(3)) / 4,
        zAdd: -(HEXGRID_HEX_RADIUS - HEXGRID_HEX_RADIUS / 4),
      }
    default:
      return { xAdd: HEXGRID_HEX_APOTHEM, zAdd: 0 }
  }
}
export function getRoadWallOptions(rotation: number) {
  // const wallBlenderModelThickness = 0.075
  switch (rotation) {
    case 0:
      return { xAdd: -HEXGRID_HEX_APOTHEM, zAdd: HEXGRID_HEX_RADIUS / 2 }
    case 1:
      // return { xAdd: 0, zAdd: 0 }
      return { xAdd: -HEXGRID_HEX_APOTHEM, zAdd: -HEXGRID_HEX_RADIUS / 2 }
    case 2:
      return { xAdd: 0, zAdd: -HEXGRID_HEX_RADIUS }
    case 3:
      return { xAdd: HEXGRID_HEX_APOTHEM, zAdd: -HEXGRID_HEX_RADIUS / 2 }
    case 4:
      return { xAdd: HEXGRID_HEX_APOTHEM, zAdd: HEXGRID_HEX_RADIUS / 2 }
    case 5:
      return { xAdd: 0, zAdd: HEXGRID_HEX_RADIUS }
    default:
      return { xAdd: 0, zAdd: 0 }
  }
}
export function getOptionsForBigTree(rotation: number) {
  const xLength = Math.cos(Math.PI / 6) * 1.5
  const zLength = Math.sin(Math.PI / 6) * 1.5
  switch (Number(rotation)) {
    case 0:
      return { rotationY: Math.PI / 3, xAdd: xLength, zAdd: zLength }
    case 1:
      return { rotationY: 0, xAdd: 0, zAdd: 1.5 * HEXGRID_HEX_RADIUS }
    case 2:
      return { rotationY: -Math.PI / 3, xAdd: -xLength, zAdd: zLength }
    case 3:
      return { rotationY: Math.PI / 3, xAdd: -xLength, zAdd: -zLength }
    case 4:
      return { rotationY: 0, xAdd: 0, zAdd: -1.5 * HEXGRID_HEX_RADIUS }
    case 5:
      return { rotationY: -Math.PI / 3, xAdd: xLength, zAdd: -zLength }
    default:
      return { rotationY: 0, xAdd: 0, zAdd: 0 }
  }
}
export function getOptionsForPalmHeight(pieceID: string) {
  const treeHeight = pieceID.includes(Pieces.palm16)
    ? 16
    : pieceID.includes(Pieces.palm15) || pieceID.includes(Pieces.laurPalm15)
      ? 15
      : pieceID.includes(Pieces.palm14) || pieceID.includes(Pieces.laurPalm14)
        ? 14
        : 13 // laurPalm13
  // We use the same model and just stretch it a little for the taller trees
  switch (treeHeight) {
    case 13:
      return { scaleY: 0.97 }
    case 14:
      return { scaleY: 1 }
    case 15:
      return { scaleY: 1.04 }
    case 16:
      return { scaleY: 1.08 }
    default:
      return { scaleY: 1.08 }
  }
}
export function getOptionsForTreeHeight(pieceID: string) {
  const treeHeight = pieceID.includes(Pieces.tree10)
    ? 10
    : pieceID.includes(Pieces.tree11)
      ? 11
      : 12 // tree12
  // We use the same model and just stretch it a little for the taller trees
  switch (treeHeight) {
    case 11:
      return { scaleX: 0.039, scaleY: 0.04, y: 0 }
    case 12:
      return {
        scaleX: 0.04,
        scaleY: 0.044,
        y: HEXGRID_HEX_HEIGHT / 10,
      }
    case 10:
      return { scaleX: 0.038, scaleY: 0.038, y: 0 }
    default:
      return { scaleX: 0.038, scaleY: 0.038, y: 0 }
  }
}
