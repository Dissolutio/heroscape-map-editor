import type { ComponentType } from 'react'
import { Battlement } from './models/Battlement'
import { RoadWall } from './models/RoadWall'
import { LaurWallAddon } from './models/LaurAddon'
import { LaurWallPillar } from './models/LaurPillar'
import { LaurWallTrianglePillar } from './models/LaurTrianglePillar'
import { Ruins2 } from './models/Ruins2'
import { Ruins3 } from './models/Ruins3'

type RegistryEntry = {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  component: ComponentType<any>
  // optional default color key or other metadata can be added later
}

export const modelRegistry: Record<string, RegistryEntry> = {
  // simple direct mappings for common pieces
  battlement: { component: Battlement },
  roadWall: { component: RoadWall },
  laurWallShort: { component: LaurWallAddon },
  laurWallRuin1: { component: LaurWallAddon },
  laurWallArch: { component: LaurWallAddon },
  laurWallLong: { component: LaurWallAddon },
  laurWallSquarePillar: { component: LaurWallPillar },
  laurWallPillarStackable: { component: LaurWallPillar },
  laurWallTrianglePillar: { component: LaurWallTrianglePillar },
  ruins2: { component: Ruins2 },
  ruins3: { component: Ruins3 },
}

export function lookupModelComponent(inventoryID: string) {
  if (modelRegistry[inventoryID]) return modelRegistry[inventoryID].component
  return null
}
