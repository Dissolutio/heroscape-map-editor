import { Pieces } from '../../types'

export type MarvelRuinMeshName =
  | 'MarvelRuinLeft'
  | 'MarvelRuinFront'
  | 'MarvelRuinBack'
  | 'MarvelRuinFrontBroken'
  | 'MarvelRuinBackBroken'
  | 'MarvelRuinUpperFloor'

export function getMarvelRuinMeshNames(
  isUpperFloor: boolean,
  isWallIntact: boolean,
): MarvelRuinMeshName[] {
  return [
    'MarvelRuinLeft',
    isWallIntact ? 'MarvelRuinFront' : 'MarvelRuinFrontBroken',
    isWallIntact ? 'MarvelRuinBack' : 'MarvelRuinBackBroken',
    ...(isUpperFloor ? (['MarvelRuinUpperFloor'] as const) : []),
  ]
}

export function getMarvelRuinParts(inventoryID: string) {
  const isUpperFloor =
    inventoryID === Pieces.marvel || inventoryID === Pieces.marvelBroken
  const isWallIntact =
    inventoryID === Pieces.marvel || inventoryID === Pieces.marvelNoUpper
  return {
    isUpperFloor,
    isWallIntact,
    meshNames: getMarvelRuinMeshNames(isUpperFloor, isWallIntact),
  }
}
