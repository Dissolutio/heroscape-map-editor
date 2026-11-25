import { Pieces } from '../types'

type PylonColor = 'black' | 'gray' | 'lightGray'

type PylonExportShape =
  | {
      type: 'path'
      d: string
      fill: PylonColor
      stroke?: PylonColor
      strokeWidth?: number
    }
  | {
      type: 'ellipse'
      cx: number
      cy: number
      rx: number
      ry: number
      fill: PylonColor
    }

const outerHex: PylonExportShape = {
  type: 'path',
  d:
    'm 104.22331,67.963803 67.9638,39.174847 v 78.1751 l ' +
    '-67.9638,39.16723 -67.781592,-39.17485 V 107.6602 Z',
  fill: 'black',
}

const twoWayPylon: readonly PylonExportShape[] = [
  outerHex,
  {
    type: 'path',
    d: 'M 90,120 V 81 l 14.4,-8.5 14.4,8.5 v 39.07974',
    fill: 'lightGray',
    stroke: 'black',
    strokeWidth: 0.264583,
  },
  {
    type: 'path',
    d: 'm 118.8,172.43909 v 39.00016 l -14.4,8.5 -14.4,-8.5 v -39.0799',
    fill: 'gray',
    stroke: 'black',
    strokeWidth: 0.264583,
  },
  {
    type: 'ellipse',
    cx: 104.52219,
    cy: 146.26666,
    rx: 30.245409,
    ry: 30.180988,
    fill: 'lightGray',
  },
  {
    type: 'ellipse',
    cx: 104.32894,
    cy: 146.26666,
    rx: 18.00552,
    ry: 18.069941,
    fill: 'black',
  },
]

const threeWayPylon: readonly PylonExportShape[] = [
  outerHex,
  {
    type: 'path',
    d:
      'm 134.36556,146.91876 33.77499,19.5 0.16121,16.72077 ' +
      '-14.56121,8.22077 -33.84405,-19.53987',
    fill: 'gray',
    stroke: 'black',
    strokeWidth: 0.264583,
  },
  {
    type: 'path',
    d:
      'm 88.806082,172.01807 -33.774991,19.5 -14.561219,-8.22077 ' +
      '0.161212,-16.72077 33.844048,-19.53987',
    fill: 'gray',
    stroke: 'black',
    strokeWidth: 0.264583,
  },
  {
    type: 'path',
    d: 'M 90,120 V 81 l 14.4,-8.5 14.4,8.5 v 39.07974',
    fill: 'gray',
    stroke: 'black',
    strokeWidth: 0.264583,
  },
  {
    type: 'ellipse',
    cx: 104.52219,
    cy: 146.26666,
    rx: 30.245409,
    ry: 30.180988,
    fill: 'gray',
  },
  {
    type: 'ellipse',
    cx: 104.32894,
    cy: 146.26666,
    rx: 18.00552,
    ry: 18.069941,
    fill: 'black',
  },
]

export function getVoidPylonExportShapes(
  inventoryID: string,
): readonly PylonExportShape[] | undefined {
  if (inventoryID === Pieces.twoWayPylon) return twoWayPylon
  if (inventoryID === Pieces.threeWayPylon) return threeWayPylon
  return undefined
}

export const getVoidPylonExportTransform = (radius: number) =>
  `scale(${radius / 78.41146}) translate(-104.32894 -146.26666)`

export type { PylonColor, PylonExportShape }
