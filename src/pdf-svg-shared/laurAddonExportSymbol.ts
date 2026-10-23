import { Pieces } from '../types'

export type LaurAddonExportSymbol = 'long' | 'arch' | 'short' | 'ruin'

export const getLaurAddonExportSymbol = (
  inventoryID: string,
): LaurAddonExportSymbol | undefined => {
  switch (inventoryID) {
    case Pieces.laurWallLong:
    case Pieces.laurWallLongStackable:
      return 'long'
    case Pieces.laurWallArch:
      return 'arch'
    case Pieces.laurWallShort:
    case Pieces.laurWallShortStackable:
      return 'short'
    case Pieces.laurWallRuin1:
    case Pieces.laurWallRuin2:
    case Pieces.laurWallRuin3:
      return 'ruin'
    default:
      return undefined
  }
}
