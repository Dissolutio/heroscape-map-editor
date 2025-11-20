import type { ComponentType } from 'react'
import { Battlement } from './models/Battlement'
import { RoadWall } from './models/RoadWall'
import { LaurWallAddon } from './models/LaurAddon'
import { LaurWallPillar } from './models/LaurPillar'
import { LaurWallTrianglePillar } from './models/LaurTrianglePillar'
import { Ruins2 } from './models/Ruins2'
import { Ruins3 } from './models/Ruins3'
import type { ModelComponentProps } from './models/ModelComponentProps'
import { StartZone3D } from './models/StartZone3D'
import { Outcrop1 } from './models/Outcrop1'
import { Outcrop3 } from './models/Outcrop3'
import { Outcrop4 } from './models/Outcrop4'
import { Outcrop6 } from './models/Outcrop6'
import { Ladder } from './models/Ladder'
import { MarroHive6 } from './models/MarroHive6'
import { ForestTree } from './models/ForestTree'
import { BigTree415 } from './models/BigTree415'
import { LaurBrush, TicallaBrush } from './models/JungleBrush'
import { LaurPalm, TicallaPalm } from './models/JunglePalm'
import { MarvelRuin } from './models/MarvelRuin'

type RegistryEntry = {
  component: ComponentType<ModelComponentProps>
  // optional default color key or other metadata can be added later
}

export const modelRegistry: Record<string, RegistryEntry> = {
  // simple direct mappings for common pieces
  battlement: { component: Battlement },
  ladder: { component: Ladder },
  roadWall: { component: RoadWall },
  laurWallAddon: { component: LaurWallAddon },
  laurWallSquarePillar: { component: LaurWallPillar },
  laurWallPillarStackable: { component: LaurWallPillar },
  laurWallTrianglePillar: { component: LaurWallTrianglePillar },
  ruins2: { component: Ruins2 },
  ruins3: { component: Ruins3 },
  marvelRuin: { component: MarvelRuin },
  startZone: { component: StartZone3D },
  outcrop1: { component: Outcrop1 },
  outcrop3: { component: Outcrop3 },
  outcrop4: { component: Outcrop4 },
  outcrop6: { component: Outcrop6 },
  hive: { component: MarroHive6 },
  forestTree: { component: ForestTree },
  bigForestTree: { component: BigTree415 },
  ticallaBrush: { component: TicallaBrush },
  laurBrush: { component: LaurBrush },
  swampBrush: { component: LaurBrush },
  ticallaPalm: { component: TicallaPalm },
  laurPalm: { component: LaurPalm },
}

export function lookupModelComponent(inventoryID: string) {
  if (modelRegistry[inventoryID]) return modelRegistry[inventoryID].component
  return null
}
